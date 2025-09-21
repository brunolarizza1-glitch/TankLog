'use client';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card } from '@/components/design-system';
import { Button } from '@/components/design-system';
import { Input } from '@/components/design-system';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  organizationName: string;
  organizationId: string;
  complianceMode: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (profile) {
      fetchProfileData();
    }
  }, [profile]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setEditing(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {profileData?.name || 'User'}
              </h2>
              <p className="text-gray-600">{profileData?.email}</p>
              <p className="text-sm text-gray-500 capitalize">
                {profileData?.role} • {profileData?.organizationName}
              </p>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                size="sm"
              >
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="text-gray-900">
                  {profileData?.name || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="text-gray-900">{profileData?.email}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Organization Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Organization Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <p className="text-gray-900">{profileData?.organizationName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization ID
              </label>
              <p className="text-gray-500 font-mono text-sm">
                {profileData?.organizationId}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compliance Mode
              </label>
              <p className="text-gray-900 capitalize">
                {profileData?.complianceMode?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Member Since
              </label>
              <p className="text-gray-900">
                {profileData?.createdAt
                  ? new Date(profileData.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Account Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Change Password</div>
              <div className="text-sm text-gray-600">
                Update your account password
              </div>
            </button>
            <button className="w-full text-left py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Download Data</div>
              <div className="text-sm text-gray-600">
                Export your account data
              </div>
            </button>
            <button className="w-full text-left py-3 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <div className="font-medium">Delete Account</div>
              <div className="text-sm">Permanently delete your account</div>
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}


