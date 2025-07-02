import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Crown, Edit, Shield, Eye, Mail, Calendar, MoreVertical } from 'lucide-react';
import { Organization, OrganizationMembership, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchOrganizationMemberships } from '../services/supabaseData';

interface OrgDashboardMembersProps {
  organization: Organization | null;
}

const OrgDashboardMembers: React.FC<OrgDashboardMembersProps> = ({
  organization
}) => {
  const { isOrgAdmin } = useAuth();
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(false);

  const canManageMembers = isOrgAdmin(organization?.id);

  // Load organization members
  useEffect(() => {
    const loadMembers = async () => {
      if (!organization) return;
      
      setLoading(true);
      try {
        const { data, error } = await fetchOrganizationMemberships(organization.id);
        if (error) {
          console.error('Failed to load members:', error);
        } else if (data) {
          setMembers(data);
        }
      } catch (error) {
        console.error('Error loading members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [organization]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'org_admin':
        return Crown;
      case 'org_editor':
        return Edit;
      case 'org_viewer':
        return Eye;
      default:
        return Shield;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'org_admin':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'org_editor':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'org_viewer':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'org_admin':
        return 'Admin';
      case 'org_editor':
        return 'Editor';
      case 'org_viewer':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Team Members</h1>
            <p className="text-gray-400">
              Manage your organization's team and permissions
            </p>
          </div>
        </div>

        {canManageMembers && (
          <button
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-700/50 rounded mb-2" />
                    <div className="h-4 bg-gray-700/30 rounded w-2/3" />
                  </div>
                  <div className="w-20 h-6 bg-gray-700/30 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-700/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Team Members</h3>
            <p className="text-gray-400 mb-6">
              Invite team members to collaborate on timeline content.
            </p>
            {canManageMembers && (
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200 mx-auto">
                <UserPlus className="w-5 h-5" />
                Invite Your First Member
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {members.map((membership) => {
              const RoleIcon = getRoleIcon(membership.role);
              const roleColor = getRoleColor(membership.role);
              const roleLabel = getRoleLabel(membership.role);
              
              return (
                <div
                  key={membership.id}
                  className="p-6 hover:bg-gray-800/10 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {membership.user?.fullName?.charAt(0) || membership.user?.email?.charAt(0) || '?'}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {membership.user?.fullName || 'Unknown User'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{membership.user?.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Joined {new Date(membership.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Role Badge */}
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${roleColor}`}>
                        <RoleIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{roleLabel}</span>
                      </div>

                      {/* Actions */}
                      {canManageMembers && (
                        <button className="p-2 hover:bg-gray-700/30 rounded-lg text-gray-400 hover:text-white transition-colors duration-200">
                          <MoreVertical className="w-4 h-4" />
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

      {/* Role Descriptions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-400">Admin</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Full access to manage organization settings, members, and all timeline content.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Edit className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-400">Editor</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Can create, edit, and manage timeline topics and events within the organization.
          </p>
        </div>

        <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-400">Viewer</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Read-only access to view organization's timeline content and participate in discussions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrgDashboardMembers;