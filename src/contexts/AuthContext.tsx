import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Fetch user profile and related data
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile - use maybeSingle() to handle cases where profile doesn't exist
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

      // Fetch organization memberships first
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError);
        return;
      }

      // Then fetch organizations separately to avoid ambiguous column references
      const organizationIds = membershipsData.map(m => m.organization_id);
      
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

      setMemberships(transformedMemberships);

      // Extract unique organizations
      const uniqueOrgs = transformedMemberships
        .map(m => m.organization)
        .filter((org): org is Organization => org !== undefined);
      
      setOrganizations(uniqueOrgs);

      // Set current organization to first one if not set
      if (!currentOrganization && uniqueOrgs.length > 0) {
        setCurrentOrganization(uniqueOrgs[0]);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Clear any stale session data on initialization
    const clearStaleSession = async () => {
      try {
        // Check if there's a session and if it's valid
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && error.message.includes('refresh_token_not_found')) {
          // Clear the session if refresh token is invalid
          console.warn('Clearing stale session due to invalid refresh token');
          await supabase.auth.signOut();
          return null;
        }
        
        return session;
      } catch (error) {
        console.error('Error checking session:', error);
        return null;
      }
    };

    // Get initial session
    const getInitialSession = async () => {
      const session = await clearStaleSession();
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
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
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      // First, sign up the user
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
        // Check if the error is specifically about user already existing
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

      // If user registration is successful and it's an organization
      if (authData.user && data.isOrganization && data.organizationName && data.organizationSlug) {
        // Create the organization with pending status
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
          // Don't return error here as user is already created
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
      // Always reset loading state, regardless of success or failure
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
    // Super admins can edit any topic
    if (isSuperAdmin()) return true;
    
    // If topic belongs to an organization
    if (topic.organizationId) {
      const membership = memberships.find(m => m.organizationId === topic.organizationId);
      return membership?.role === 'org_admin' || membership?.role === 'org_editor';
    }
    
    // For topics without organization (legacy topics)
    if (!topic.organizationId) {
      // If topic is public, only super admins can edit
      if (topic.isPublic) {
        return false; // Already checked super admin above
      }
      
      // If topic is private and user created it, they can edit
      if (!topic.isPublic && topic.createdBy === user?.id) {
        return true;
      }
    }
    
    return false;
  };

  const canCreateTopic = () => {
    // Any authenticated user can create topics
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