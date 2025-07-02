import React from 'react';
import { Building, BarChart3, FileText, Users, ChevronDown, Settings, LogOut } from 'lucide-react';
import { Organization, OrgDashboardSection } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface OrgDashboardSidebarProps {
  currentOrganization: Organization;
  organizations: Organization[];
  activeSection: OrgDashboardSection;
  onSectionChange: (section: OrgDashboardSection) => void;
  onOrganizationChange: (org: Organization) => void;
  onBackToTopicSelection: () => void;
  onSignOut: () => void;
}

const OrgDashboardSidebar: React.FC<OrgDashboardSidebarProps> = ({
  currentOrganization,
  organizations,
  activeSection,
  onSectionChange,
  onOrganizationChange,
  onBackToTopicSelection,
  onSignOut
}) => {
  const { user, getOrgRole } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = React.useState(false);
  
  const userRole = getOrgRole(currentOrganization.id);
  const canManageMembers = userRole === 'org_admin';

  const navigationItems = [
    {
      id: 'overview' as OrgDashboardSection,
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard overview'
    },
    {
      id: 'topics' as OrgDashboardSection,
      label: 'Topics',
      icon: FileText,
      description: 'Manage timelines'
    },
    ...(canManageMembers ? [{
      id: 'members' as OrgDashboardSection,
      label: 'Members',
      icon: Users,
      description: 'Manage team'
    }] : [])
  ];

  return (
    <div className="w-80 bg-gray-800/20 backdrop-blur-sm border-r border-gray-700/30 flex flex-col h-full">
      {/* Organization Header */}
      <div className="p-6 border-b border-gray-700/30">
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="w-full flex items-center gap-3 p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-600/50 hover:border-gray-500/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-white font-semibold truncate">{currentOrganization.name}</h2>
              <p className="text-gray-400 text-sm">@{currentOrganization.slug}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showOrgDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Organization Dropdown */}
          {showOrgDropdown && organizations.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-xl py-2 z-50 shadow-xl">
              {organizations.filter(org => org.id !== currentOrganization.id).map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    onOrganizationChange(org);
                    setShowOrgDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{org.name}</p>
                      <p className="text-gray-400 text-sm">@{org.slug}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Role Badge */}
        <div className="mt-4 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm font-medium capitalize">
            {userRole.replace('org_', '').replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isActive
                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent hover:border-gray-600/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-700/30 space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/20 rounded-lg">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Settings className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.email}
            </p>
            <p className="text-gray-400 text-xs">Organization Member</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onBackToTopicSelection}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800/30 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Back to Timeline Explorer</span>
          </button>
          
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrgDashboardSidebar;