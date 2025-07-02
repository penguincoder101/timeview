import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, Organization, OrganizationMembership, RegisterFormData, AuthResponse } from '../types';

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
  checkIfAdminEmail: (email: string) => Promise<boolean>;
  setCurrentOrganization: (org: Organization | null) => void;
  refreshUserData: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isOrgAdmin: (orgId?: string) => boolean;
  canEditTopic: (topicOrgId?: string) => boolean;
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

      // Fetch organization memberships with organization details
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('organization_memberships')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError);
        return;
      }

      const transformedMemberships: OrganizationMembership[] = membershipsData.map(m => ({
        id: m.id,
        userId: m.user_id,
        organizationId: m.organization_id,
        role: m.role,
        permissions: m.permissions,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        organization: m.organization ? {
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          description: m.organization.description,
          createdBy: m.organization.created_by,
          createdAt: m.organization.created_at,
          updatedAt: m.organization.updated_at,
          status: m.organization.status,
        } : undefined,
      }));

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
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
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

  const checkIfAdminEmail = async (email: string): Promise<boolean> => {
    try {
      // Check if this email belongs to a super admin
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('email', email)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking admin email:', error);
      return false;
    }
  };

  const signInWithMagicLink = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });
    setLoading(false);
    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { error };
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
          setLoading(false);
          return { 
            error: null, 
            userExists: true, 
            existingUserEmail: data.email 
          };
        }
        
        setLoading(false);
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

      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
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

  const canEditTopic = (topicOrgId?: string) => {
    if (isSuperAdmin()) return true;
    
    // If topic has no organization (legacy), allow editing for authenticated users
    if (!topicOrgId) return !!user;
    
    const membership = memberships.find(m => m.organizationId === topicOrgId);
    return membership?.role === 'org_admin' || membership?.role === 'org_editor';
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
    checkIfAdminEmail,
    setCurrentOrganization,
    refreshUserData,
    isSuperAdmin,
    isOrgAdmin,
    canEditTopic,
    getOrgRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};