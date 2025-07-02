import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Mail, Crown, Shield, Eye, Search } from 'lucide-react';
import { Organization, OrganizationMembership, UserProfile } from '../types';
import { fetchOrganizationMemberships, updateOrganizationMemberRole, removeOrganizationMember } from '../services/supabaseData';
import { useAuth } from '../contexts/AuthContext';

interface OrgDashboardMembersProps {
  organization: Organization;
}

const OrgDashboardMembers: React.FC<OrgDashboardMembersProps> = ({
  organization
}) => {
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'org_admin' | 'org_editor' | 'org_viewer'>('org_viewer');
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);
  
  const { user, getOrgRole } = useAuth();
  const userRole = getOrgRole(organization.id);
  const canManageMembers = userRole === 'org_admin';

  // Load organization memberships
  useEffect(() => {
    const loadMemberships = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await fetchOrganizationMemberships(organization.id);
        
        if (error) {
          console.error('Failed to load memberships:', error);
          setError('Failed to load team members. Please try again.');
        } else if (data) {
          setMemberships(data);
        }
      } catch (err) {
        console.error('Unexpected error loading memberships:', err);
        setError('An unexpected error occurred while loading team members.');
      } finally {
        setLoading(false);
      }
    };

    loadMemberships();
  }, [organization.id]);

  // Filter memberships based on search
  const filteredMemberships = memberships.filter(membership => {
    const user = membership.user;
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
      membership.role.toLowerCase().includes(searchLower)
    );
  });

  const handleUpdateRole = async (membershipId: string, role: 'org_admin' | 'org_editor' | 'org_viewer') => {
    setProcessingMemberId(membershipId);
    
    try {
      const { error } = await updateOrganizationMemberRole(membershipId, role);
      
      if (error) {
        console.error('Failed to update member role:', error);
        alert('Failed to update member role. Please try again.');
      } else {
        // Update local state
        setMemberships(prev => prev.map(m => 
          m.id === membershipId ? { ...m, role } : m
        ));
        setEditingMemberId(null);
      }
    } catch (err) {
      console.error('Unexpected error updating member role:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingMemberId(null);
    }
  };

  const handleRemoveMember = async (membershipId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) {
      return;
    }

    setProcessingMemberId(membershipId);
    
    try {
      const { error } = await removeOrganizationMember(membershipId);
      
      if (error) {
        console.error('Failed to remove member:', error);
        alert('Failed to remove member. Please try again.');
      } else {
        // Remove from local state
        setMemberships(prev => prev.filter(m => m.id !== membershipId));
      }
    } catch (err) {
      console.error('Unexpected error removing member:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingMemberId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'org_admin':
        return Crown;
      case 'org_editor':
        return Shield;
      case 'org_viewer':
        return Eye;
      default:
        return Users;
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

  const formatRoleName = (role: string) => {
    return role.replace('org_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Members</h3>
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
          <h1 className="text-2xl font-bold text-white mb-2">Team Members</h1>
          <p className="text-gray-400">
            Manage your organization's team members and their permissions
          </p>
        </div>
        
        {canManageMembers && (
          <button
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            disabled
            title="Member invitation feature coming soon"
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        />
      </div>

      {/* Members List */}
      {filteredMemberships.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            {searchTerm ? 'No Members Found' : 'No Team Members'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search criteria.'
              : 'Invite team members to collaborate on your organization\'s timeline content.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-700/30">
            {filteredMemberships.map((membership) => {
              const member = membership.user;
              if (!member) return null;
              
              const RoleIcon = getRoleIcon(membership.role);
              const roleColor = getRoleColor(membership.role);
              const isCurrentUser = member.id === user?.id;
              const isProcessing = processingMemberId === membership.id;
              const isEditing = editingMemberId === membership.id;
              
              return (
                <div key={membership.id} className="p-6 hover:bg-gray-800/30 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Member Info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-semibold">
                            {member.fullName || member.email}
                          </h3>
                          {isCurrentUser && (
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-400 text-sm">{member.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Role and Actions */}
                    <div className="flex items-center gap-4">
                      {/* Role Display/Edit */}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as 'org_admin' | 'org_editor' | 'org_viewer')}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isProcessing}
                          >
                            <option value="org_viewer">Viewer</option>
                            <option value="org_editor">Editor</option>
                            <option value="org_admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleUpdateRole(membership.id, newRole)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white text-sm transition-colors duration-200 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingMemberId(null);
                              setNewRole('org_viewer');
                            }}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 rounded-lg text-white text-sm transition-colors duration-200 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${roleColor}`}>
                          <RoleIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {formatRoleName(membership.role)}
                          </span>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      {canManageMembers && !isCurrentUser && !isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingMemberId(membership.id);
                              setNewRole(membership.role);
                            }}
                            disabled={isProcessing}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Edit role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleRemoveMember(membership.id, member.email)}
                            disabled={isProcessing}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Remove member"
                          >
                            {isProcessing ? (
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Descriptions */}
      <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h4 className="font-semibold text-yellow-400">Admin</h4>
            </div>
            <p className="text-gray-300 text-sm">
              Full access to manage topics, members, and organization settings.
            </p>
          </div>
          
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-blue-400">Editor</h4>
            </div>
            <p className="text-gray-300 text-sm">
              Can create, edit, and delete timeline topics and events.
            </p>
          </div>
          
          <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-gray-400" />
              <h4 className="font-semibold text-gray-400">Viewer</h4>
            </div>
            <p className="text-gray-300 text-sm">
              Can view and explore timeline topics but cannot make changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgDashboardMembers;