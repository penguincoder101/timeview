import React from 'react';
import { FileText, Plus, Edit, Eye, Clock, Globe, Lock, Sparkles } from 'lucide-react';
import { Organization, Topic, TopicId } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface OrgDashboardTopicsProps {
  organization: Organization | null;
  topics: Topic[];
  loading: boolean;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onViewTopic: (topicId: TopicId) => void;
  onRefresh: () => void;
}

const OrgDashboardTopics: React.FC<OrgDashboardTopicsProps> = ({
  organization,
  topics,
  loading,
  onAddTopic,
  onEditTopic,
  onViewTopic,
  onRefresh
}) => {
  const { canEditTopic, isOrgAdmin } = useAuth();

  const canCreateTopics = isOrgAdmin(organization?.id);

  const getTopicIcon = (topicId: string) => {
    // You can customize this based on topic type or use a default
    return FileText;
  };

  const getTopicGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-blue-500'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Timeline Topics</h1>
            <p className="text-gray-400">
              Manage your organization's historical timeline content
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700/70 disabled:bg-gray-700/30 border border-gray-600/50 hover:border-gray-500/50 disabled:border-gray-600/30 rounded-lg text-gray-300 hover:text-white disabled:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Refresh</span>
          </button>

          {canCreateTopics && (
            <button
              onClick={onAddTopic}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <Plus className="w-5 h-5" />
              Create New Timeline
            </button>
          )}
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-800/20 border border-gray-700/30 rounded-2xl p-8">
                <div className="w-16 h-16 bg-gray-700/50 rounded-xl mb-6" />
                <div className="h-6 bg-gray-700/50 rounded mb-4" />
                <div className="h-4 bg-gray-700/30 rounded mb-2" />
                <div className="h-4 bg-gray-700/30 rounded w-2/3 mb-6" />
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-700/30 rounded w-20" />
                  <div className="flex gap-2">
                    <div className="h-6 w-12 bg-gray-700/30 rounded" />
                    <div className="h-6 w-12 bg-gray-700/30 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-700/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Timeline Topics Yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Create your first timeline topic to start building your organization's historical content library.
          </p>
          {canCreateTopics && (
            <button
              onClick={onAddTopic}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Your First Timeline
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topics.map((topic, index) => {
            const IconComponent = getTopicIcon(topic.id);
            const gradient = getTopicGradient(index);
            const canEdit = canEditTopic(topic);
            
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
                    onClick={() => onViewTopic(topic.id as TopicId)}
                    className="p-2 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    title="View Timeline"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => onEditTopic(topic)}
                      className="p-2 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      title="Edit Timeline"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
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
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mt-8`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <div className="text-left relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors duration-300">
                    {topic.name}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors duration-300">
                    Explore {topic.events.length} historical events in this timeline, covering significant moments and developments.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{topic.events.length} events</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewTopic(topic.id as TopicId)}
                        className="px-3 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        View
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => onEditTopic(topic)}
                          className="px-3 py-1 text-xs bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 hover:border-gray-500/50 rounded-lg text-gray-400 hover:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                          Edit
                        </button>
                      )}
                    </div>
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