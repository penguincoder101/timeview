import React, { useState } from 'react';
import { Settings, Building, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Organization } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface OrgDashboardSettingsProps {
  organization: Organization | null;
}

const OrgDashboardSettings: React.FC<OrgDashboardSettingsProps> = ({
  organization
}) => {
  const { isOrgAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    slug: organization?.slug || ''
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canManageSettings = isOrgAdmin(organization?.id);

  const handleSave = async () => {
    if (!canManageSettings) return;
    
    setSaving(true);
    try {
      // TODO: Implement organization update API call
      console.log('Saving organization settings:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canManageSettings) return;
    
    try {
      // TODO: Implement organization deletion API call
      console.log('Deleting organization:', organization?.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Organization Settings</h1>
          <p className="text-gray-400">
            Manage your organization's profile and preferences
          </p>
        </div>
      </div>

      {!canManageSettings ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-1">Access Restricted</h3>
              <p className="text-gray-300">
                You need admin permissions to modify organization settings.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Basic Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                id="org-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!canManageSettings}
                className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label htmlFor="org-slug" className="block text-sm font-medium text-gray-300 mb-2">
                Organization Slug
              </label>
              <input
                type="text"
                id="org-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                disabled={!canManageSettings}
                className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="organization-slug"
              />
              <p className="mt-2 text-sm text-gray-500">
                Used in URLs and must be unique across the platform
              </p>
            </div>

            <div>
              <label htmlFor="org-description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="org-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={!canManageSettings}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Brief description of your organization"
              />
            </div>

            {canManageSettings && (
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        {canManageSettings && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-red-400">Danger Zone</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Organization</h3>
                <p className="text-gray-400 mb-4">
                  Permanently delete this organization and all associated data. This action cannot be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Organization
                  </button>
                ) : (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-300 mb-4 font-medium">
                      Are you absolutely sure? This will permanently delete the organization and all its data.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        <Trash2 className="w-4 h-4" />
                        Yes, Delete Forever
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDashboardSettings;