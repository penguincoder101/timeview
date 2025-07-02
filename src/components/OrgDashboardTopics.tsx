import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Eye, Trash2, Clock, Globe, Lock, Search, Filter } from 'lucide-react';
import { Topic, TopicId, Organization } from '../types';
import { fetchTopics, deleteTopic } from '../services/supabaseData';
import { useAuth } from '../contexts/AuthContext';

interface OrgDashboardTopicsProps {
  organization: Organization;
  onTopicSelectForView: (topicId: TopicId) => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
}

const OrgDashboardTopics: React.FC<OrgDashboardTopicsProps> = ({
  organization,
  onTopicSelectForView,
  onAddTopic,
  onEditTopic
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  
  const { canEditTopic, canCreateTopic, getOrgRole } = useAuth();
  const userRole = getOrgRole(organization.id);
  const canEdit = userRole === 'org_admin' || userRole === 'org_editor';

  // Load organization topics
  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await fetchTopics(organization.id);
        
        if (error) {
          console.error('Failed to load topics:', error);
          setError('Failed to load timeline topics. Please try again.');
        } else if (data) {
          setTopics(data);
        }
      } catch (err) {
        console.error('Unexpected error loading topics:', err);
        setError('An unexpected error occurred while loading topics.');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [organization.id]);

  // Filter topics based on search and filter criteria
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterBy === 'all' || 
      (filterBy === 'public' && topic.isPublic) ||
      (filterBy === 'private' && !topic.isPublic);
    
    return matchesSearch && matchesFilter;
  });

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }

    setDeletingTopicId(topicId);
    
    try {
      const { error } = await deleteTopic(topicId);
      
      if (error) {
        console.error('Failed to delete topic:', error);
        alert('Failed to delete topic. Please try again.');
      } else {
        // Remove topic from local state
        setTopics(prev => prev.filter(t => t.id !== topicId));
      }
    } catch (err) {
      console.error('Unexpected error deleting topic:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setDeletingTopicId(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    onEditTopic(topic);
  };

  const handleViewClick = (topicId: TopicId) => {
    onTopicSelectForView(topicId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading topics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Topics</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Timeline Topics</h1>
          <p className="text-gray-400">
            Manage your organization's timeline topics and historical content
          </p>
        </div>
        
        {canCreateTopic() && canEdit && (
          <button
            onClick={onAddTopic}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Plus className="w-5 h-5" />
            Create New Topic
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as 'all' | 'public' | 'private')}
            className="pl-10 pr-8 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none"
          >
            <option value="all">All Topics</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            {searchTerm || filterBy !== 'all' ? 'No Topics Found' : 'No Topics Yet'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first timeline topic to get started with your organization\'s historical content.'
            }
          </p>
          {canCreateTopic() && canEdit && !searchTerm && filterBy === 'all' && (
            <button
              onClick={onAddTopic}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <Plus className="w-5 h-5" />
              Create Your First Topic
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => {
            const canEditThis = canEditTopic(topic);
            
            return (
              <div
                key={topic.id}
                className="group relative bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleViewClick(topic.id as TopicId)}
                    className="p-2 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    title="View Timeline"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {canEditThis && (
                    <>
                      <button
                        onClick={(e) => handleEditClick(e, topic)}
                        className="p-2 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        title="Edit Timeline"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        disabled={deletingTopicId === topic.id}
                        className="p-2 bg-red-600/80 hover:bg-red-700/90 disabled:bg-gray-600/50 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed"
                        title="Delete Timeline"
                      >
                        {deletingTopicId === topic.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Visibility indicator */}
                <div className="absolute top-4 left-4">
                  {topic.isPublic ? (
                    <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full flex items-center gap-1">
                      <Globe className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Public</span>
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">Private</span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="relative z-10 mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300 flex-1">
                      {topic.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{topic.events.length} events</span>
                    </div>
                    
                    <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                      <span className="text-xs text-blue-400 font-medium">
                        {topic.defaultDisplayMode || 'years'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewClick(topic.id as TopicId)}
                      className="flex-1 px-3 py-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      View Timeline
                    </button>
                    
                    {canEditThis && (
                      <button
                        onClick={(e) => handleEditClick(e, topic)}
                        className="px-3 py-2 text-xs bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 hover:border-gray-500/50 rounded-lg text-gray-400 hover:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrgDashboardTopics;