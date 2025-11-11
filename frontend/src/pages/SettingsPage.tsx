import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  MapPin,
  Image,
  ClipboardList,
  FileCheck,
  Award,
  Bell,
  Monitor,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_public: boolean;
}

interface SettingsByCategory {
  [category: string]: SystemSetting[];
}

const categoryIcons: { [key: string]: LucideIcon } = {
  geofencing: MapPin,
  photos: Image,
  tasks: ClipboardList,
  submissions: FileCheck,
  quality: Award,
  notifications: Bell,
  system: Monitor,
};

const categoryLabels: { [key: string]: string } = {
  geofencing: 'Geofencing',
  photos: 'Photos',
  tasks: 'Tasks',
  submissions: 'Submissions',
  quality: 'Quality Control',
  notifications: 'Notifications',
  system: 'System',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geofencing');
  const [editedValues, setEditedValues] = useState<{ [key: string]: string }>({});

  // Fetch all settings
  const { data: settings, isLoading, error } = useQuery<SettingsByCategory>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Array<{ category: string; key: string; value: string }>) => {
      const response = await api.put('/settings/bulk', { settings: updates });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditedValues({});
    },
  });

  const handleInputChange = (category: string, key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [`${category}:${key}`]: value,
    }));
  };

  const handleSaveCategory = (category: string) => {
    const categorySettings = settings?.[category] || [];
    const updates = categorySettings
      .filter(setting => editedValues[`${setting.category}:${setting.key}`] !== undefined)
      .map(setting => ({
        category: setting.category,
        key: setting.key,
        value: editedValues[`${setting.category}:${setting.key}`],
      }));

    if (updates.length > 0) {
      updateSettingsMutation.mutate(updates);
    }
  };

  const getValue = (setting: SystemSetting): string => {
    const editedValue = editedValues[`${setting.category}:${setting.key}`];
    return editedValue !== undefined ? editedValue : setting.value;
  };

  const renderInput = (setting: SystemSetting) => {
    const value = getValue(setting);

    switch (setting.data_type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(setting.category, setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(setting.category, setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        );

      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(setting.category, setting.key, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(setting.category, setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        );
    }
  };

  const hasUnsavedChanges = (category: string) => {
    return Object.keys(editedValues).some(key => key.startsWith(`${category}:`));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load settings</p>
        </div>
      </div>
    );
  }

  const categories = Object.keys(settings || {});

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        </div>
        <p className="text-gray-600">Configure platform-wide settings and defaults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wider">Categories</h3>
            <nav className="space-y-1">
              {categories.map((category) => {
                const Icon = categoryIcons[category] || SettingsIcon;
                const isActive = activeTab === category;
                const unsaved = hasUnsavedChanges(category);

                return (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{categoryLabels[category] || category}</span>
                    </div>
                    {unsaved && (
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Tab Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = categoryIcons[activeTab];
                    return Icon ? <Icon className="h-6 w-6 text-blue-600" /> : null;
                  })()}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {categoryLabels[activeTab] || activeTab}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {settings?.[activeTab]?.length || 0} settings
                    </p>
                  </div>
                </div>
                {hasUnsavedChanges(activeTab) && (
                  <button
                    onClick={() => handleSaveCategory(activeTab)}
                    disabled={updateSettingsMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Settings List */}
            <div className="p-6 space-y-6">
              {settings?.[activeTab]?.map((setting) => (
                <div key={setting.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {setting.key.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </label>
                      {setting.description && (
                        <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {setting.data_type}
                        </span>
                        {setting.is_public && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      {renderInput(setting)}
                    </div>
                  </div>
                </div>
              ))}

              {(!settings?.[activeTab] || settings[activeTab].length === 0) && (
                <div className="text-center py-12">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No settings in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
