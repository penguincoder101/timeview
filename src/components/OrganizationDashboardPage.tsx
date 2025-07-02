import React, { useState, useCallback, useEffect } from 'react';
import { History } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import OrgDashboardSidebar from './OrgDashboardSidebar';
import OrgDashboardOverview from './OrgDashboardOverview';
import OrgDashboardTopics from './OrgDashboardTopics';
import OrgDashboardMembers from './OrgDashboardMembers';
import { Topic, TopicId, PageType, OrgDashboardSection, Organization, OrganizationMembership } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchOrganizationMemberships } from '../services/supabaseData';

interface OrganizationDashboardPageProps {
  topics: Topic[];
  onTopicSelectForView: (topicId: TopicId) => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onBackToTopicSelection: () => void;
}

const OrganizationDashboardPage: React.FC<OrganizationDashboardPageProps> = ({
  topics,
  onTopicSelectForView,
  onAddTopic,
  onEditTopic,
  onBackToTopicSelection
}) => {
  const [activeSection, setActiveSection] = useState<OrgDashboardSection>('overview');
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  
  const { 
    currentOrganization, 
    organizations, 
    setCurrentOrganization, 
    signOut,
    loading: authLoading 
  } = useAuth();

  // Load memberships for the current organization
  useEffect(() => {
    const loadMemberships = async () => {
      if (!currentOrganization) return;
      
      setMembershipsLoading(true);
      try {
        const { data, error } = await fetchOrganizationMemberships(currentOrganization.id);
        if (error) {
          console.error('Failed to load memberships:', error);
        } else if (data) {
          setMemberships(data);
        }
      } catch (err) {
        console.error('Unexpected error loading memberships:', err);
      } finally {
        setMembershipsLoading(false);
      }
    };

    loadMemberships();
  }, [currentOrganization]);

  const handleSectionChange = useCallback((section: OrgDashboardSection) => {
    setActiveSection(section);
  }, []);

  const handleOrganizationChange = useCallback((org: Organization) => {
    setCurrentOrganization(org);
    setActiveSection('overview'); // Reset to overview when switching organizations
  }, [setCurrentOrganization]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
      }
      // Note: Don't set signingOut to false here - the auth state change will handle navigation
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      alert('An unexpected error occurred. Please try again.');
      setSigningOut(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard</h2>
          <p className="text-gray-400">Setting up your organization dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no current organization
  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">No Organization Selected</h2>
          <p className="text-gray-400 mb-6">
            You need to be a member of an organization to access this dashboard.
          </p>
          <button
            onClick={onBackToTopicSelection}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
          >
            Back to Timeline Explorer
          </button>
        </div>
      </div>
    );
  }

  // Filter topics for current organization
  const organizationTopics = topics.filter(topic => topic.organizationId === currentOrganization.id);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OrgDashboardOverview
            organization={currentOrganization}
            topics={organizationTopics}
            memberships={memberships}
            loading={membershipsLoading}
          />
        );
      case 'topics':
        return (
          <OrgDashboardTopics
            organization={currentOrganization}
            onTopicSelectForView={onTopicSelectForView}
            onAddTopic={onAddTopic}
            onEditTopic={onEditTopic}
          />
        );
      case 'members':
        return (
          <OrgDashboardMembers
            organization={currentOrganization}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <OrgDashboardSidebar
          currentOrganization={currentOrganization}
          organizations={organizations}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onOrganizationChange={handleOrganizationChange}
          onBackToTopicSelection={onBackToTopicSelection}
          onSignOut={handleSignOut}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrganizationDashboardPage;