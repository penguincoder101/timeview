import React, { useState, useEffect } from 'react';
import { History, ChevronLeft, Clock, Globe, Sword, Building, Edit, Plus, Settings, Mountain, Crown, LogOut, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Topic, TopicId, Organization } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AdminPageProps {
  topics: Topic[];
  onTopicSelectForView: (topicId: TopicId) => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onBackToTopicSelection: () => void;
}

interface PendingOrganization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_by: string;
  created_at: string;
  creator_email: string;
  creator_name?: string;
}

// Helper functions for consistent styling
export const getTopicIcon = (topicId: string) => {
  switch (topicId) {
    case 'seven-wonders':
      return Building;
    case 'wwii':
      return Sword;
    case 'ancient-civilizations':
      return Globe;
    case 'ancient-rwanda':
      return Mountain;
    case 'rwandan-kingdoms':
      return Crown;
    default:
      return Clock;
  }
};

export const getTopicGradient = (topicId: string) => {
  switch (topicId) {
    case 'seven-wonders':
      return 'from-amber-500 to-orange-600';
    case 'wwii':
      return 'from-red-500 to-red-700';
    case 'ancient-civilizations':
      return 'from-emerald-500 to-teal-600';
    case 'ancient-rwanda':
      return 'from-green-500 to-emerald-600';
    case 'rwandan-kingdoms':
      return 'from-yellow-500 to-amber-600';
    default:
      return 'from-blue-500 to-purple-600';
  }
};

export const getTopicDescription = (topicId: string) => {
  switch (topicId) {
    case 'seven-wonders':
      return 'Explore the magnificent architectural marvels of the ancient world, from the Great Pyramid of Giza to the Lighthouse of Alexandria.';
    case 'wwii':
      return 'Journey through the pivotal moments of World War II, from the invasion of Poland to Victory in Europe Day.';
    case 'ancient-civilizations':
      return 'Discover the rise of humanity\'s greatest civilizations, from Mesopotamia to the Roman Empire.';
    case 'ancient-rwanda':
      return 'Explore the rich ancient history of Rwanda, from early settlements to the rise of the Kingdom of Rwanda.';
    case 'rwandan-kingdoms':
      return 'Discover the detailed history of Rwandan kingdoms, from legendary origins through colonial encounters to the monarchy\'s end.';
    default:
      return 'Explore historical events and their significance.';
  }
};

const AdminPage: React.FC<AdminPageProps> = ({
  topics,
  onTopicSelectForView,
  onAddTopic,
  onEditTopic,
  onBackToTopicSelection
}) => {
  const { user, signOut, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'topics' | 'organizations'>('topics');
  const [pendingOrganizations, setPendingOrganizations] = useState<PendingOrganization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [processingOrgId, setProcessingOrgId] = useState<string | null>(null);

  // Fetch pending organizations if user is super admin
  useEffect(() => {
    if (isSuperAdmin() && activeTab === 'organizations') {
      fetchPendingOrganizations();
    }
  }, [activeTab, isSuperAdmin]);

  const fetchPendingOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_organizations');
      
      if (error) {
        console.error('Error fetching pending organizations:', error);
      } else {
        setPendingOrganizations(data || []);
      }
    } catch (error) {
      console.error('Error fetching pending organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleApproveOrganization = async (orgId: string) => {
    setProcessingOrgId(orgId);
    try {
      const { error } = await supabase.rpc('approve_organization', { org_id: orgId });
      
      if (error) {
        console.error('Error approving organization:', error);
        alert('Failed to approve organization. Please try again.');
      } else {
        // Remove from pending list
        setPendingOrganizations(prev => prev.filter(org => org.id !== orgId));
        alert('Organization approved successfully!');
      }
    } catch (error) {
      console.error('Error approving organization:', error);
      alert('Failed to approve organization. Please try again.');
    } finally {
      setProcessingOrgId(null);
    }
  };

  const handleRejectOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to reject this organization? This action cannot be undone.')) {
      return;
    }

    setProcessingOrgId(orgId);
    try {
      const { error } = await supabase.rpc('reject_organization', { org_id: orgId });
      
      if (error) {
        console.error('Error rejecting organization:', error);
        alert('Failed to reject organization. Please try again.');
      } else {
        // Remove from pending list
        setPendingOrganizations(prev => prev.filter(org => org.id !== orgId));
        alert('Organization rejected successfully.');
      }
    } catch (error) {
      console.error('Error rejecting organization:', error);
      alert('Failed to reject organization. Please try again.');
    } finally {
      setProcessingOrgId(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    onEditTopic(topic);
  };

  const handleViewClick = (topicId: TopicId) => {
    onTopicSelectForView(topicId);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Header */}
      <header className="relative z-30 border-b border-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToTopicSelection}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-blue-400" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Manage your timeline topics and organizations
                  </p>
                </div>
              </div>
            </button>

            {/* User info and sign out */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-800/20 border border-gray-700/30 rounded-xl">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Signed in as</p>
                  <p className="text-white font-medium truncate max-w-32">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Page title and description */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                Admin Dashboard
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Manage timeline topics, approve organization registrations, and oversee platform content.
              </p>
            </div>

            {/* Tabs (only show if super admin) */}
            {isSuperAdmin() && (
              <div className="flex items-center gap-2 bg-gray-800/30 border border-gray-600/50 rounded-xl p-1 mb-8 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('topics')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'topics'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  Timeline Topics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('organizations')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'organizations'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  Organizations
                  {pendingOrganizations.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {pendingOrganizations.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Topics Tab */}
            {activeTab === 'topics' && (
              <>
                {/* Action buttons */}
                <div className="flex justify-center mb-12">
                  <button
                    onClick={onAddTopic}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Timeline
                  </button>
                </div>

                {/* Topics grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {topics.map((topic) => {
                    const IconComponent = getTopicIcon(topic.id);
                    const gradient = getTopicGradient(topic.id);
                    const description = getTopicDescription(topic.id);
                    
                    return (
                      <div
                        key={topic.id}
                        className="group relative bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
                      >
                        {/* Background gradient on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />
                        
                        {/* Action buttons */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleViewClick(topic.id as TopicId)}
                            className="p-2 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            title="View Timeline"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleEditClick(e, topic)}
                            className="p-2 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            title="Edit Timeline"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Icon */}
                        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="text-left relative z-10">
                          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors duration-300">
                            {topic.name}
                          </h3>
                          
                          <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors duration-300">
                            {description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{topic.events.length} events</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewClick(topic.id as TopicId)}
                                className="px-3 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                              >
                                View
                              </button>
                              <button
                                onClick={(e) => handleEditClick(e, topic)}
                                className="px-3 py-1 text-xs bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 hover:border-gray-500/50 rounded-lg text-gray-400 hover:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover effect border */}
                        <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-br group-hover:${gradient.replace('from-', 'border-').replace('to-', 'border-')} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Organizations Tab */}
            {activeTab === 'organizations' && isSuperAdmin() && (
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Organization Approvals
                  </h3>
                  <p className="text-gray-400">
                    Review and approve organization registration requests
                  </p>
                </div>

                {loadingOrgs ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading pending organizations...</p>
                  </div>
                ) : pendingOrganizations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">All Caught Up!</h4>
                    <p className="text-gray-400">No pending organization approvals at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingOrganizations.map((org) => (
                      <div
                        key={org.id}
                        className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Building className="w-5 h-5 text-orange-400" />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-white">{org.name}</h4>
                                <p className="text-sm text-gray-400">@{org.slug}</p>
                              </div>
                              <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3 text-orange-400" />
                                  <span className="text-xs text-orange-400 font-medium">Pending</span>
                                </div>
                              </div>
                            </div>

                            {org.description && (
                              <p className="text-gray-300 mb-4 leading-relaxed">
                                {org.description}
                              </p>
                            )}

                            <div className="flex items-center gap-6 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>
                                  {org.creator_name || 'Unknown'} ({org.creator_email})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(org.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-6">
                            <button
                              onClick={() => handleApproveOrganization(org.id)}
                              disabled={processingOrgId === org.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-700/90 disabled:bg-gray-600/50 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed"
                            >
                              {processingOrgId === org.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">Approve</span>
                            </button>

                            <button
                              onClick={() => handleRejectOrganization(org.id)}
                              disabled={processingOrgId === org.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700/90 disabled:bg-gray-600/50 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Footer text */}
            <div className="text-center mt-16">
              <p className="text-gray-500 text-sm">
                {activeTab === 'topics' 
                  ? 'Manage your timeline topics - create new ones, edit existing content, or view them in action'
                  : 'Review and approve organization registration requests to grant access to the platform'
                }
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;