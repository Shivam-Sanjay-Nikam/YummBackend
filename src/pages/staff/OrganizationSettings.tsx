import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, MapPin, Hash, Save, Navigation } from 'lucide-react';
import { Organization } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useRealtimeOrganizations } from '../../hooks/useRealtimeData';
import toast from 'react-hot-toast';

export const OrganizationSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    special_number: '',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrganization();
    }
  }, [user]);

  // Set up real-time subscription for organizations
  useRealtimeOrganizations(() => {
    if (user) {
      loadOrganization();
    }
  });

  const loadOrganization = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getOrganization(user.email);
      if (error) throw error;
      
      console.log('Loaded organization data:', data); // Debug log
      
      setOrganization(data);
      if (data) {
        const newFormData = {
          name: data.name || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          special_number: data.special_number || '',
        };
        
        console.log('Setting form data to:', newFormData); // Debug log
        
        setFormData(newFormData);
      }
    } catch (error: any) {
      toast.error('Failed to load organization details');
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check if there are unsaved changes
    if (organization) {
      const hasChanges = 
        (field === 'name' && value !== organization.name) ||
        (field === 'special_number' && value !== organization.special_number) ||
        (field === 'latitude' && value !== (organization.latitude?.toString() || '')) ||
        (field === 'longitude' && value !== (organization.longitude?.toString() || ''));
      
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        special_number: formData.special_number,
      };

      console.log('Sending update data:', updateData); // Debug log
      console.log('Current organization before update:', organization); // Debug log

      const { data: result, error } = await api.staff.updateOrganization(updateData);
      
      console.log('Update result:', result); // Debug log
      console.log('Update error:', error); // Debug log
      
      if (error) throw error;

      toast.success('Organization settings updated successfully');
      setHasUnsavedChanges(false);
      
      // Dispatch custom event to notify navbar of organization update
      window.dispatchEvent(new CustomEvent('organizationUpdated'));
      
      // Wait a moment before reloading to ensure the update is processed
      setTimeout(() => {
        loadOrganization(); // Reload to get updated data
      }, 500);
    } catch (error: any) {
      console.error('Save error details:', error); // Debug log
      toast.error(error.message || 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (organization) {
      const resetData = {
        name: organization.name || '',
        latitude: organization.latitude?.toString() || '',
        longitude: organization.longitude?.toString() || '',
        special_number: organization.special_number || '',
      };
      
      console.log('Resetting form to:', resetData); // Debug log
      setFormData(resetData);
      setHasUnsavedChanges(false);
      toast.success('Form reset to current values');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.loading('Getting your current location...', { id: 'location' });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));
        setHasUnsavedChanges(true);
        toast.success('Location detected successfully!', { id: 'location' });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        toast.error(errorMessage, { id: 'location' });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Organization Settings</h1>
            {hasUnsavedChanges && (
              <span className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">Manage your organization's basic information</p>
        </div>
        {organization && (
          <div className="text-xs text-gray-500 flex items-center">
            <span className="mr-2">Current:</span>
            <span className="font-medium">{organization.name}</span>
            <span className="mx-1">•</span>
            <span className="font-mono">{organization.special_number}</span>
          </div>
        )}
      </div>

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
              <p className="text-sm text-gray-600">Basic details and location for your organization</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Organization Name <span className="text-red-500">*</span>
                {organization && organization.name !== formData.name && (
                  <span className="text-orange-500 text-xs ml-2">(Changed from: {organization.name})</span>
                )}
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your Organization Name"
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Special Number <span className="text-red-500">*</span>
                {organization && organization.special_number !== formData.special_number && (
                  <span className="text-orange-500 text-xs ml-2">(Changed from: {organization.special_number})</span>
                )}
              </label>
              <Input
                type="text"
                value={formData.special_number}
                onChange={(e) => handleInputChange('special_number', e.target.value)}
                placeholder="6-digit special number"
                required
                maxLength={6}
                className="h-12 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is a unique identifier for your organization (6 digits)
              </p>
            </div>

            {/* Location Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h3 className="text-md font-medium text-gray-900">Location Coordinates</h3>
                </div>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Auto-detect
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    placeholder="40.7128"
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Decimal degrees (e.g., 40.7128)
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    placeholder="-74.0060"
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Decimal degrees (e.g., -74.0060)
                  </p>
                </div>
              </div>


              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Special number must be unique across all organizations</li>
                  <li>• Location coordinates are optional but recommended</li>
                  <li>• Changes will be applied immediately after saving</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="w-full sm:flex-1 h-12 text-base font-medium"
              >
                Reset Form
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
                className="w-full sm:flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>


      {/* Organization Timeline */}
      {organization && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Hash className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Organization Timeline</h2>
                <p className="text-sm text-gray-600">Track your organization's history</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Created Date */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Organization Created</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(organization.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Your organization was established on this date
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(organization.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Last Updated</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(organization.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Most recent changes to your organization settings
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(organization.updated_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>

              {/* Timeline separator */}
              <div className="border-l-2 border-gray-200 ml-1.5 h-4"></div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
