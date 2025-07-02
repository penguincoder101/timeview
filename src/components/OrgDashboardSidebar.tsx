import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  ChevronDown, 
  Building, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { Organization, OrgDashboardSection } from '../types';

interface OrgDashboardSidebarProps {
  activeSection: OrgDashboardSection;
  onSectionChange: (section: OrgDashboardSection) => void;
  currentOrganization: Organization | null;
  organizations: Organization[];
  onOrganizationChange: (org: Organization) => void;
  onSignOut: () => void;
  signingOut: boolean;
  loading: boolean;
}

const OrgDashboardSidebar: React.FC<OrgDashboardSidebarProps> = ({
  activeSection,
  onSectionChange,
  currentOrganization,
  organizations,
  onOrganizationChange,
  onSignOut,
  signingOut,
  loading
}) => {
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const navigationItems = [
    {
      id: 'overview' as OrgDashboardSection,
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard overview'
    },
    {
      id: 'topics' as OrgDashboardSection,
      label: 'Timeline Topics',
      icon: FileText,
      description: 'Manage timelines'
    },
    {
      id: 'members' as OrgDashboardSection,
      label: 'Members',
      icon: Users,
      description: 'Team management'
    },
    {
      id: 'settings' as OrgDashboardSection,
      label: 'Settings',
      icon: Settings,
      description: 'Organization settings'
    }
  ];

  return (
    <aside className="w-80 bg-gray-800/10 backdrop-blur-sm border-r border-gray-700/30 flex flex-col">
      {/* Organization Selector */}
      <div className="p-6 border-b border-gray-700/30">
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            disabled={loading || organizations.length <= 1}
            className="w-full flex items-center justify-between p-4 bg-gray-800/20 hover:bg-gray-800/30 border border-gray-700/30 hover:border-gray-600/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold truncate max-w-40">
                  {currentOrganization?.name || 'No Organization'}
                </p>
                <p className="text-xs text-gray-400">
                  {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {organizations.length > 1 && (
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  showOrgDropdown ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Organization Dropdown */}
          {showOrgDropdown && organizations.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-xl py-2 z-50 shadow-2xl">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    onOrganizationChange(org);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700/30 transition-colors duration-200 focus:outline-none focus:bg-gray-700/30 ${
                    org.id === currentOrganization?.id 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-300'
                  }`}
                >
                  <p className="font-medium truncate">{org.name}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {org.description || 'No description'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/20 border border-transparent hover:border-gray-700/30'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-purple-500/20' 
                    : 'bg-gray-700/20 group-hover:bg-gray-600/30'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-6 border-t border-gray-700/30">
        <button
          onClick={onSignOut}
          disabled={signingOut || loading}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-600/20 border border-red-500/30 hover:border-red-500/50 disabled:border-gray-500/30 rounded-xl text-red-400 hover:text-red-300 disabled:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed"
        >
          {signingOut || loading ? (
            <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span className="font-medium">
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default OrgDashboardSidebar;