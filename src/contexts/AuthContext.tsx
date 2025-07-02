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

  // Fetch user profile and related data - useCallback to memoize function
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      // If no profile exists, set userProfile to null
      if (!profileData) {
        console.warn('No user profile found for user:', userId);
        setUserProfile(null);
        setOrganizations([]);
        setMemberships([]);
        setCurrentOrganization(null);
        return;
      }

      setUserProfile({
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        avatarUrl: profileData.avatar_url,
        role: profileData.role,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      });

      // Fetch organization memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError);
        return;
      }

      const validMembershipsData = membershipsData || [];

      // Fetch organizations
      const organizationIds = validMembershipsData.map(m => m.organization_id);
      
      let organizationsData: any[] = [];
      if (organizationIds.length > 0) {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', organizationIds);

        if (orgsError) {
          console.error('Error fetching organizations:', orgsError);
          return;
        }

        organizationsData = orgsData || [];
      }

      // Transform memberships data
      const transformedMemberships: OrganizationMembership[] = validMembershipsData.map(m => {
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

      setMemberships(transformedMemberships);

      // Extract unique organizations
      const uniqueOrgs = transformedMemberships
        .map(m => m.organization)
        .filter((org): org is Organization => org !== undefined);
      
      setOrganizations(uniqueOrgs);

      // FIX: Use functional update to access latest state
      setCurrentOrganization(current => {
        // Keep current organization if already set
        if (current) return current;
        // Otherwise set to first organization if available
        return uniqueOrgs.length > 0 ? uniqueOrgs[0] : null;
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // FIX: Wrap in try/catch to ensure loading always completes
    const handleAuthChange = async (event: any, session: Session | null) => {
      console.log('Auth state changed:', event, session);
      setLoading(true);
      
      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          // Clear user data on sign out
          setUserProfile(null);
          setOrganizations([]);
          setMemberships([]);
          setCurrentOrganization(null);
        }
      } catch (error) {
        console.error('Error during auth state change:', error);
      } finally {
        setLoading(false); // Always reset loading
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => subscription.unsubscribe();
  }, [fetchUserData]); // Add fetchUserData as dependency

  const signInWithMagicLink = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
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
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('user already registered') || 
            authError.message?.toLowerCase().includes('email already registered') ||
            authError.message?.toLowerCase().includes('already been registered')) {
          return { 
            error: null, 
            userExists: true, 
            existingUserEmail: data.email 
          };
        }
        
        return { error: authError };
      }

      if (authData.user && data.isOrganization && data.organizationName && data.organizationSlug) {
        const { error: orgError } = await supabase
          .from('organizations')
          .insert([{
            name: data.organizationName,
            slug: data.organizationSlug,
            description: data.organizationDescription || null,
            created_by: authData.user.id,
            status: 'pending'
          }]);

        if (orgError) {
          console.error('Error creating organization:', orgError);
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
      console.error('Error during sign out:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role checking
  const isSuperAdmin = () => {
    return userProfile?.role === 'super_admin';
  };

  const isOrgAdmin = (orgId?: string) => {
    if (isSuperAdmin()) return true;
    
    const targetOrgId = orgId || currentOrganization?.id;
    if (!targetOrgId) return false;
    
    const membership = memberships.find(m => m.organizationId === targetOrgId);
    return membership?.role === 'org_admin';
  };

  const canEditTopic = (topic: Topic) => {
    if (isSuperAdmin()) return true;
    
    if (topic.organizationId) {
      const membership = memberships.find(m => m.organizationId === topic.organizationId);
      return membership?.role === 'org_admin' || membership?.role === 'org_editor';
    }
    
    if (!topic.organizationId) {
      if (topic.isPublic) {
        return false;
      }
      
      if (!topic.isPublic && topic.createdBy === user?.id) {
        return true;
      }
    }
    
    return false;
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};