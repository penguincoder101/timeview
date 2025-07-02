import React, { useState, useCallback, useEffect } from 'react';
import { History, ChevronLeft } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import OrgDashboardSidebar from './OrgDashboardSidebar';
import OrgDashboardOverview from './OrgDashboardOverview';
import OrgDashboardTopics from './OrgDashboardTopics';
import OrgDashboardMembers from './OrgDashboardMembers';
import OrgDashboardSettings from './OrgDashboardSettings';
import { useAuth } from '../contexts/AuthContext';
import { Topic, TopicId, PageType, OrgDashboardSection } from '../types';
import { fetchTopics } from '../services/supabaseData';

interface OrganizationDashboardPageProps {
  onBackToTopicSelection: () => void;
  onTopicSelectForView: (topicId: TopicId) => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  generateId: () => string;
}

const OrganizationDashboardPage: React.FC<OrganizationDashboardPageProps> = ({
  onBackToTopicSelection,
  onTopicSelectForView,
  onAddTopic,
  onEditTopic,
  generateId
}) => {
  const { user, userProfile, currentOrganization, organizations, setCurrentOrganization, signOut, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<OrgDashboardSection>('overview');
  const [orgTopics, setOrgTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load organization-specific topics
  const loadOrgTopics = useCallback(async () => {
    if (!currentOrganization) return;
    
    setTopicsLoading(true);
    try {
      const { data, error } = await fetchTopics(currentOrganization.id);
      if (error) {
        console.error('Failed to load organization topics:', error);
      } else if (data) {
        setOrgTopics(data);
      }
    } catch (error) {
      console.error('Error loading organization topics:', error);
    } finally {
      setTopicsLoading(false);
    }
  }, [currentOrganization]);

  // Load topics when organization changes
  useEffect(() => {
    loadOrgTopics();
  }, [loadOrgTopics]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleRefreshTopics = useCallback(() => {
    loadOrgTopics();
  }, [loadOrgTopics]);

  // If no current organization, redirect back
  if (!currentOrganization && !loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">No Organization Selected</h2>
          <p className="text-gray-400 mb-6">
            You need to be part of an organization to access the dashboard.
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

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-30 border-b border-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToTopicSelection}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
              aria-label="Go back to topic selection"
            >
              <ChevronLeft className="w-5 h-5 text-blue-400" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {currentOrganization?.name || 'Organization Dashboard'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Manage your organization's timelines
                  </p>
                </div>
              </div>
            </button>

            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-800/20 border border-gray-700/30 rounded-xl">
                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                  <History className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Signed in as</p>
                  <p className="text-white font-medium truncate max-w-32">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative z-10 flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <OrgDashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          currentOrganization={currentOrganization}
          organizations={organizations}
          onOrganizationChange={setCurrentOrganization}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          loading={loading}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {activeSection === 'overview' && (
            <OrgDashboardOverview
              organization={currentOrganization}
              topics={orgTopics}
              loading={topicsLoading}
              onViewTopic={onTopicSelectForView}
            />
          )}
          
          {activeSection === 'topics' && (
            <OrgDashboardTopics
              organization={currentOrganization}
              topics={orgTopics}
              loading={topicsLoading}
              onAddTopic={onAddTopic}
              onEditTopic={onEditTopic}
              onViewTopic={onTopicSelectForView}
              onRefresh={handleRefreshTopics}
            />
          )}
          
          {activeSection === 'members' && (
            <OrgDashboardMembers
              organization={currentOrganization}
            />
          )}
          
          {activeSection === 'settings' && (
            <OrgDashboardSettings
              organization={currentOrganization}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default OrganizationDashboardPage;