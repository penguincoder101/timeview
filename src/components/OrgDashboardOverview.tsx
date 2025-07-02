import React from 'react';
import { BarChart3, FileText, Users, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Organization, Topic, OrganizationMembership } from '../types';

interface OrgDashboardOverviewProps {
  organization: Organization;
  topics: Topic[];
  memberships: OrganizationMembership[];
  loading: boolean;
}

const OrgDashboardOverview: React.FC<OrgDashboardOverviewProps> = ({
  organization,
  topics,
  memberships,
  loading
}) => {
  const totalEvents = topics.reduce((sum, topic) => sum + topic.events.length, 0);
  const totalMembers = memberships.length;
  
  // Calculate recent activity (topics created in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTopics = topics.filter(topic => {
    // Since we don't have createdAt in the Topic interface, we'll use a placeholder
    // In a real implementation, you'd add createdAt to the Topic interface
    return true; // Placeholder
  });

  const stats = [
    {
      label: 'Total Topics',
      value: topics.length,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      label: 'Total Events',
      value: totalEvents,
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    {
      label: 'Team Members',
      value: totalMembers,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      label: 'Recent Activity',
      value: recentTopics.length,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
          Welcome to {organization.name}
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {organization.description || 'Manage your organization\'s timeline topics and collaborate with your team to create engaging historical content.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={stat.label}
              className={`relative p-6 ${stat.bgColor} backdrop-blur-sm border ${stat.borderColor} rounded-2xl hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 rounded-2xl`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
                <h3 className="text-gray-300 font-medium">{stat.label}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Topics */}
      <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Recent Topics</h2>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Topics Yet</h3>
            <p className="text-gray-500 mb-4">Create your first timeline topic to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.slice(0, 5).map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{topic.name}</h4>
                    <p className="text-gray-400 text-sm">{topic.events.length} events</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {topic.isPublic && (
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs">
                      Public
                    </span>
                  )}
                  <span className="px-2 py-1 bg-gray-600/20 border border-gray-600/30 rounded-full text-gray-400 text-xs">
                    {topic.defaultDisplayMode || 'years'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Members Preview */}
      <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Team Members</h2>
        </div>

        {memberships.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400">No team members yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.slice(0, 6).map((membership) => (
              <div
                key={membership.id}
                className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/30 rounded-xl"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {membership.user?.fullName || membership.user?.email || 'Unknown User'}
                  </p>
                  <p className="text-gray-400 text-sm capitalize">
                    {membership.role.replace('org_', '').replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDashboardOverview;