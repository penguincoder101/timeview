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

const fetchUserData = useCallback(async (userId: string) => {
  console.log('[fetchUserData] Fetching data for user ID:', userId);
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[fetchUserData] Error fetching user profile:', profileError);
      return;
    }

    if (!profileData) {
      console.warn('[fetchUserData] No user profile found for user:', userId);
      setUserProfile(null);
      setOrganizations([]);
      setMemberships([]);
      setCurrentOrganization(null);
      return;
    }

    console.log('[fetchUserData] User profile found:', profileData);

    setUserProfile({
      id: profileData.id,
      email: profileData.email,
      fullName: profileData.full_name,
      avatarUrl: profileData.avatar_url,
      role: profileData.role,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    });

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

      console.log('[fetchUserData] Organizations found:', orgsData);
      organizationsData = orgsData || [];
    } else {
      console.log('[fetchUserData] No organizations to fetch.');
    }

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
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              description: organization.description,
              createdBy: organization.created_by,
              createdAt: organization.created_at,
              updatedAt: organization.updated_at,
              status: organization.status,
            }
          : undefined,
      };
    });

    console.log('[fetchUserData] Transformed memberships:', transformedMemberships);

    setMemberships(transformedMemberships);

    const uniqueOrgs = transformedMemberships
      .map(m => m.organization)
      .filter((org): org is Organization => org !== undefined);

    console.log('[fetchUserData] Unique organizations:', uniqueOrgs);

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

      if (authData.user && data.isOrganization && data.organizationName && data.organizationSlug) {
        const { error: orgError } = await supabase.from('organizations').insert([{
          name: data.organizationName,
          slug: data.organizationSlug,
          description: data.organizationDescription || null,
          created_by: authData.user.id,
          status: 'pending',
        }]);

        if (orgError) {
          console.error('[signUpWithPassword] Error creating organization:', orgError);
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
    const result = userProfile?.role === 'super_admin';
    console.log('[isSuperAdmin]', result);
    return result;
  };

  const isOrgAdmin = (orgId?: string) => {
    const targetOrgId = orgId || currentOrganization?.id;
    const membership = memberships.find(m => m.organizationId === targetOrgId);
    const result = isSuperAdmin() || membership?.role === 'org_admin';
    console.log('[isOrgAdmin]', { targetOrgId, result });
    return result;
  };

  const canEditTopic = (topic: Topic) => {
    const result =
      isSuperAdmin() ||
      (topic.organizationId &&
        ['org_admin', 'org_editor'].includes(
          memberships.find(m => m.organizationId === topic.organizationId)?.role || ''
        )) ||
      (!topic.organizationId && !topic.isPublic && topic.createdBy === user?.id);

    console.log('[canEditTopic]', { topic, result });
    return result;
  };

  const canCreateTopic = () => {
    const result = !!user;
    console.log('[canCreateTopic]', result);
    return result;
  };

  const getOrgRole = (orgId: string) => {
    if (isSuperAdmin()) return 'super_admin';
    const membership = memberships.find(m => m.organizationId === orgId);
    const role = membership?.role || 'none';
    console.log('[getOrgRole]', { orgId, role });
    return role;
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
