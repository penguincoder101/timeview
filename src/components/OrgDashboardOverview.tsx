import React from 'react';
import { BarChart3, FileText, Users, TrendingUp, Clock, Eye } from 'lucide-react';
import { Organization, Topic, TopicId } from '../types';

interface OrgDashboardOverviewProps {
  organization: Organization | null;
  topics: Topic[];
  loading: boolean;
  onViewTopic: (topicId: TopicId) => void;
}

const OrgDashboardOverview: React.FC<OrgDashboardOverviewProps> = ({
  organization,
  topics,
  loading,
  onViewTopic
}) => {
  const totalEvents = topics.reduce((sum, topic) => sum + topic.events.length, 0);
  const publicTopics = topics.filter(topic => topic.isPublic).length;
  const recentTopics = topics
    .sort((a, b) => new Date(b.events[0]?.date || '').getTime() - new Date(a.events[0]?.date || '').getTime())
    .slice(0, 3);

  const stats = [
    {
      label: 'Timeline Topics',
      value: topics.length,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Total Events',
      value: totalEvents,
      icon: Clock,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Public Topics',
      value: publicTopics,
      icon: Eye,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Growth Rate',
      value: '+12%',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to {organization?.name}
            </h1>
            <p className="text-gray-400 text-lg">
              {organization?.description || 'Manage your organization\'s timeline content and team members.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border backdrop-blur-sm rounded-2xl p-6 hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                {loading && (
                  <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Topics */}
      <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Recent Timeline Topics</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4 p-4 bg-gray-800/20 rounded-xl">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-700/50 rounded mb-2" />
                    <div className="h-4 bg-gray-700/30 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Timeline Topics Yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first timeline topic to get started with your organization's historical content.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onViewTopic(topic.id as TopicId)}
                className="w-full flex items-center gap-4 p-4 bg-gray-800/10 hover:bg-gray-800/20 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-white mb-1">{topic.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{topic.events.length} events</span>
                    <span>•</span>
                    <span>{topic.isPublic ? 'Public' : 'Private'}</span>
                    <span>•</span>
                    <span>Updated recently</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="text-sm font-medium">View</span>
                  <Eye className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDashboardOverview;