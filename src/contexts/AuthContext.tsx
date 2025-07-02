import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, Organization, OrganizationMembership, RegisterFormData, AuthResponse, Topic } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  organizations: Organization[];
  memberships: OrganizationMembership[];
  currentOrganization: Organization | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (data: RegisterFormData) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  setCurrentOrganization: (org: Organization | null) => void;
  refreshUserData: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isOrgAdmin: (orgId?: string) => boolean;
  canEditTopic: (topic: Topic) => boolean;
  canCreateTopic: () => boolean;
  getOrgRole: (orgId: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to safely fetch user profile without RLS recursion
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Use a stored procedure to bypass RLS for profile lookup
      const { data, error } = await supabase.rpc('get_user_profile', { user_id: userId });
      
      if (error) {
        console.error('[fetchUserProfile] RPC error:', error);
        return null;
      }
      
      if (data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          role: data.role,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
      return null;
    } catch (error) {
      console.error('[fetchUserProfile] Unexpected error:', error);
      return null;
    }
  };

  const fetchUserData = useCallback(async (userId: string) => {
    console.log('[fetchUserData] Fetching data for user ID:', userId);
    try {
      // 1. Fetch user profile using safe RPC method
      console.log('[fetchUserData] Fetching user profile via RPC');
      const profile = await fetchUserProfile(userId);

      if (!profile) {
        console.log('[fetchUserData] No user profile found');
        setUserProfile(null);
        setOrganizations([]);
        setMemberships([]);
        setCurrentOrganization(null);
        return;
      }

      console.log('[fetchUserData] User profile found:', profile);
      setUserProfile(profile);

      // 2. Fetch memberships (no recursion risk)
      console.log('[fetchUserData] Fetching memberships...');
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('[fetchUserData] Error fetching memberships:', membershipsError);
        return;
      }

      console.log('[fetchUserData] Memberships found:', membershipsData);
      const organizationIds = membershipsData.map(m => m.organization_id);

      // 3. Fetch organizations
      let organizationsData: any[] = [];
      if (organizationIds.length > 0) {
        console.log('[fetchUserData] Fetching organizations for IDs:', organizationIds);
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', organizationIds);

        if (orgsError) {
          console.error('[fetchUserData] Error fetching organizations:', orgsError);
          return;
        }
        organizationsData = orgsData || [];
      }

      // 4. Transform memberships
      const transformedMemberships: OrganizationMembership[] = membershipsData.map(m => {
        const organization = organizationsData.find(org => org.id === m.organization_id);
        return {
          id: m.id,
          userId: m.user_id,
          organizationId: m.organization_id,
          role: m.role,
          permissions: m.permissions,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          organization: organization ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            description: organization.description,
            createdBy: organization.created_by,
            createdAt: organization.created_at,
            updatedAt: organization.updated_at,
            status: organization.status,
          } : undefined,
        };
      });

      // 5. Update state
      setMemberships(transformedMemberships);
      
      const uniqueOrgs = transformedMemberships
        .map(m => m.organization)
        .filter((org): org is Organization => org !== undefined);
      
      setOrganizations(uniqueOrgs);
      setCurrentOrganization(uniqueOrgs.length > 0 ? uniqueOrgs[0] : null);
    } catch (error) {
      console.error('[fetchUserData] Unexpected error:', error);
    }
  }, []);

  const refreshUserData = async () => {
    if (user) {
      console.log('[refreshUserData] Refreshing data for user:', user.id);
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    const handleAuthChange = async (event: any, session: Session | null) => {
      console.log('[handleAuthChange] Auth state changed:', event, session);
      setLoading(true);
      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserProfile(null);
          setOrganizations([]);
          setMemberships([]);
          setCurrentOrganization(null);
        }
      } catch (error) {
        console.error('[handleAuthChange] Error handling auth state change:', error);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signInWithMagicLink = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}` },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (data: RegisterFormData): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
        },
      });

      if (authError) {
        if (
          authError.message?.toLowerCase().includes('already') ||
          authError.message?.toLowerCase().includes('registered')
        ) {
          return {
            error: null,
            userExists: true,
            existingUserEmail: data.email,
          };
        }
        return { error: authError };
      }

      // Create user profile after signup
      if (authData.user) {
        await supabase.from('user_profiles').insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          role: 'user', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (data.isOrganization && data.organizationName && data.organizationSlug) {
          await supabase.from('organizations').insert([{
            name: data.organizationName,
            slug: data.organizationSlug,
            description: data.organizationDescription || null,
            created_by: authData.user.id,
            status: 'pending',
          }]);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('[signOut] Error during sign out:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = () => {
    return userProfile?.role === 'super_admin';
  };

  const isOrgAdmin = (orgId?: string) => {
    const targetOrgId = orgId || currentOrganization?.id;
    const membership = memberships.find(m => m.organizationId === targetOrgId);
    return isSuperAdmin() || membership?.role === 'org_admin';
  };

  const canEditTopic = (topic: Topic) => {
    return (
      isSuperAdmin() ||
      (topic.organizationId &&
        ['org_admin', 'org_editor'].includes(
          memberships.find(m => m.organizationId === topic.organizationId)?.role || ''
        )) ||
      (!topic.organizationId && !topic.isPublic && topic.createdBy === user?.id)
    );
  };

  const canCreateTopic = () => {
    return !!user;
  };

  const getOrgRole = (orgId: string) => {
    if (isSuperAdmin()) return 'super_admin';
    const membership = memberships.find(m => m.organizationId === orgId);
    return membership?.role || 'none';
  };

  const value = {
    user,
    session,
    userProfile,
    organizations,
    memberships,
    currentOrganization,
    loading,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    setCurrentOrganization,
    refreshUserData,
    isSuperAdmin,
    isOrgAdmin,
    canEditTopic,
    canCreateTopic,
    getOrgRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};