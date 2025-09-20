'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useComplianceMode } from '@/lib/hooks/useComplianceMode';
import { useSyncStatus } from '@/lib/sync';
import AppShell from '@/components/AppShell';
import PhotoPicker from '@/components/photos/PhotoPicker';
import CorrectiveActionModal from '@/components/CorrectiveActionModal';
import CorrectiveActionIndicator from '@/components/CorrectiveActionIndicator';
import CorrectiveActionSummary from '@/components/CorrectiveActionSummary';
import { useRouter } from 'next/navigation';
import { validateLogData } from '@/lib/compliance';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  queueLogSubmission,
  saveUserPreference,
  loadUserPreference,
  // isOnline,
} from '@/lib/offline';

interface CompressedPhoto {
  id: string;
  blob: Blob;
  dataUrl: string;
  originalName: string;
}

export default function NewLogPage() {
  const { user } = useAuth();
  const {
    complianceMode,
    complianceInfo,
    loading: complianceLoading,
  } = useComplianceMode();
  const { isOnline: online, isSyncing, queuedCount } = useSyncStatus();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Corrective action state
  const [showCorrectiveActionModal, setShowCorrectiveActionModal] =
    useState(false);
  const [currentFailureItem, setCurrentFailureItem] = useState<{
    itemId: string;
    itemName: string;
    currentValue: boolean | null;
  } | null>(null);
  const [createdActions, setCreatedActions] = useState<string[]>([]);
  const [showActionSummary, setShowActionSummary] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    site: '',
    vehicle_id: '',
    tank_id: '',
    pressure: '',
    leak_check: null as boolean | null,
    visual_ok: null as boolean | null,
    notes: '',
    corrective_action: '',
    customer_email: '',
    initials: '',
  });

  const [photos, setPhotos] = useState<CompressedPhoto[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    // Load user preferences for autofill
    if (user.id) {
      const lastSite = loadUserPreference(user.id, 'lastSite');
      const lastTankId = loadUserPreference(user.id, 'lastTankId');

      if (lastSite || lastTankId) {
        setFormData((prev) => ({
          ...prev,
          site: lastSite || '',
          tank_id: lastTankId || '',
        }));
      }

      // Check for existing draft
      const draft = loadDraft(user.id);
      if (draft) {
        setHasDraft(true);
        setShowDraftPrompt(true);
      }
    }
  }, [user, router]);

  const handleInputChange = (field: string, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }

    // Check for failures when boolean fields change
    if (typeof value === 'boolean') {
      checkForFailures(field, value);
    }
  };

  // Check for failures and trigger corrective action modal
  const checkForFailures = (field: string, value: boolean | null) => {
    if (field === 'leak_check' && value === false) {
      setCurrentFailureItem({
        itemId: 'leak_check',
        itemName: 'Leak Check',
        currentValue: value,
      });
      setShowCorrectiveActionModal(true);
    } else if (field === 'visual_ok' && value === false) {
      setCurrentFailureItem({
        itemId: 'visual_inspection',
        itemName: 'Visual Inspection',
        currentValue: value,
      });
      setShowCorrectiveActionModal(true);
    }
  };

  const handleCorrectiveActionCreated = (actionId: string) => {
    setCreatedActions((prev) => [...prev, actionId]);
    setShowActionSummary(true);
    setMessage('Corrective action created successfully!');
  };

  const handleCorrectiveActionModalClose = () => {
    setShowCorrectiveActionModal(false);
    setCurrentFailureItem(null);
  };

  const handleResumeDraft = useCallback(() => {
    if (!user?.id) return;

    const draft = loadDraft(user.id);
    if (draft) {
      setFormData(draft.fields);
      setPhotos(
        draft.photos.map((photo) => ({
          id: photo.id,
          blob: new Blob(), // We'll need to reconstruct this from dataUrl if needed
          dataUrl: photo.dataUrl,
          originalName: photo.originalName,
        }))
      );
      setShowDraftPrompt(false);
    }
  }, [user?.id]);

  const handleDiscardDraft = useCallback(() => {
    if (!user?.id) return;

    clearDraft(user.id);
    setHasDraft(false);
    setShowDraftPrompt(false);
  }, [user?.id]);

  const handleSaveDraft = useCallback(() => {
    if (!user?.id) return;

    const draft = {
      fields: formData,
      photos: photos.map((photo) => ({
        id: photo.id,
        dataUrl: photo.dataUrl,
        originalName: photo.originalName,
      })),
    };

    saveDraft(user.id, draft);
    setMessage('Draft saved locally');
    setHasDraft(true);
  }, [user?.id, formData, photos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrors([]);

    // Validate form data
    const validation = validateLogData(formData, complianceMode);
    if (!validation.valid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    // Validate initials
    if (
      !formData.initials ||
      formData.initials.length < 2 ||
      formData.initials.length > 3
    ) {
      setErrors(['Initials must be 2-3 characters']);
      setIsSubmitting(false);
      return;
    }

    // Check if there are failures that need corrective actions
    const hasFailures =
      formData.leak_check === false || formData.visual_ok === false;
    if (hasFailures && createdActions.length === 0) {
      setErrors([
        'Please create corrective actions for all failed items before submitting.',
      ]);
      setIsSubmitting(false);
      return;
    }

    try {
      if (online) {
        // Online submission
        await submitOnline();
      } else {
        // Offline submission
        await submitOffline();
      }
    } catch (error) {
      setMessage('Failed to submit log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOnline = async () => {
    // Upload photos first
    const photoUrls: string[] = [];

    for (const photo of photos) {
      const formData = new FormData();
      formData.append('file', photo.blob, photo.originalName);
      formData.append('logId', crypto.randomUUID());

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const { url } = await response.json();
      photoUrls.push(url);
    }

    // Submit the log
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        photo_urls: photoUrls,
        compliance_mode: complianceMode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create log');
    }

    const result = await response.json();

    // Handle corrective actions if any were created
    if (result.correctiveActions && result.correctiveActions.length > 0) {
      setCreatedActions(result.correctiveActions);
      setMessage(
        `Log created successfully! ${result.correctiveActions.length} corrective action(s) created.`
      );
    } else {
      setMessage('Log created successfully!');
    }

    // Save user preferences for autofill
    if (user?.id) {
      saveUserPreference(user.id, 'lastSite', formData.site);
      saveUserPreference(user.id, 'lastTankId', formData.tank_id);
    }

    // Clear draft and redirect
    if (user?.id) {
      clearDraft(user.id);
    }

    setTimeout(() => {
      router.push('/logs/success');
    }, 1500);
  };

  const submitOffline = async () => {
    if (!user?.id) return;

    // Queue for background sync
    queueLogSubmission({
      fields: formData,
      photos: photos.map((photo) => ({
        id: photo.id,
        blob: photo.blob,
        originalName: photo.originalName,
      })),
    });

    // Clear draft
    clearDraft(user.id);

    setMessage("Saved offline — will send when you're back online");
    setTimeout(() => {
      router.push('/logs');
    }, 2000);
  };

  if (!user) {
    return (
      <AppShell
        title="New Inspection"
        breadcrumbs={[
          { label: 'Inspections', href: '/logs' },
          { label: 'New Inspection' },
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (complianceLoading) {
    return (
      <AppShell
        title="New Inspection"
        breadcrumbs={[
          { label: 'Inspections', href: '/logs' },
          { label: 'New Inspection' },
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="New Inspection"
      breadcrumbs={[
        { label: 'Inspections', href: '/logs' },
        { label: 'New Inspection' },
      ]}
    >
      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/logs')}
              className="text-primary text-sm font-medium"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-brand-dark">
              {complianceInfo.labels.formTitle}
            </h1>
            <div className="w-16"></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{complianceInfo.title}</p>
        </div>

        {/* Draft Prompt */}
        {showDraftPrompt && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Resume draft?
                </p>
                <p className="text-xs text-yellow-600">
                  You have an unsaved draft
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleResumeDraft}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded"
                >
                  Yes
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {!online && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
            <p className="text-sm text-orange-800">
              Offline mode — changes will sync when online
            </p>
          </div>
        )}

        {isSyncing && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <p className="text-sm text-blue-800">
              Syncing {queuedCount} queued logs...
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mx-4 mt-4 p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">
              Please fix the following errors:
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Corrective Action Summary */}
        {showActionSummary && createdActions.length > 0 && (
          <div className="mx-4 mt-4">
            <CorrectiveActionSummary
              inspectionId="draft"
              onViewActions={() => {
                router.push('/corrective-actions');
              }}
            />
          </div>
        )}

        {/* Form */}
        <form
          id="log-form"
          onSubmit={handleSubmit}
          className="px-4 py-6 space-y-6"
        >
          {/* Site */}
          <div>
            <label
              htmlFor="site"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Site {complianceInfo.requirements.siteRequired ? '*' : ''}
            </label>
            <input
              id="site"
              type="text"
              value={formData.site}
              onChange={(e) => handleInputChange('site', e.target.value)}
              placeholder="Enter site or facility name"
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            />
          </div>

          {/* Vehicle ID - Only show for US_NFPA58 */}
          {complianceMode === 'US_NFPA58' && (
            <div>
              <label
                htmlFor="vehicle_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Vehicle/Bobtail ID
              </label>
              <input
                id="vehicle_id"
                type="text"
                value={formData.vehicle_id}
                onChange={(e) =>
                  handleInputChange('vehicle_id', e.target.value)
                }
                placeholder="Enter vehicle or bobtail ID (optional if Site is provided)"
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Either Site or Vehicle ID is required for US NFPA 58 compliance
              </p>
            </div>
          )}

          {/* Tank ID */}
          <div>
            <label
              htmlFor="tank_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tank/Cylinder ID *
            </label>
            <input
              id="tank_id"
              type="text"
              value={formData.tank_id}
              onChange={(e) => handleInputChange('tank_id', e.target.value)}
              placeholder="Enter tank or cylinder ID"
              required
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            />
          </div>

          {/* Pressure */}
          <div>
            <label
              htmlFor="pressure"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Pressure {complianceInfo.requirements.pressureRequired ? '*' : ''}
            </label>
            <input
              id="pressure"
              type="text"
              inputMode="numeric"
              value={formData.pressure}
              onChange={(e) => handleInputChange('pressure', e.target.value)}
              placeholder={`Enter pressure in ${complianceInfo.labels.pressureUnit}`}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              {complianceInfo.labels.pressureHint}
            </p>
          </div>

          {/* Leak Check */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Leak Check *
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="leak_check"
                  checked={formData.leak_check === true}
                  onChange={() => handleInputChange('leak_check', true)}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-base">Pass</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="leak_check"
                  checked={formData.leak_check === false}
                  onChange={() => handleInputChange('leak_check', false)}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-base">Fail</span>
              </label>
            </div>

            {/* Corrective Action Indicator for Leak Check */}
            <CorrectiveActionIndicator
              inspectionId="draft" // Will be updated after log creation
              itemId="leak_check"
              itemName="Leak Check"
              hasFailure={formData.leak_check === false}
              onActionCreated={handleCorrectiveActionCreated}
            />
          </div>

          {/* Visual Inspection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {complianceInfo.labels.visualInspectionLabel}
              {complianceInfo.requirements.visualInspectionRequired ? ' *' : ''}
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="visual_ok"
                  checked={formData.visual_ok === true}
                  onChange={() => handleInputChange('visual_ok', true)}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-base">All OK</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="visual_ok"
                  checked={formData.visual_ok === false}
                  onChange={() => handleInputChange('visual_ok', false)}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-base">Issues Found</span>
              </label>
            </div>

            {/* Corrective Action Indicator for Visual Inspection */}
            <CorrectiveActionIndicator
              inspectionId="draft" // Will be updated after log creation
              itemId="visual_inspection"
              itemName="Visual Inspection"
              hasFailure={formData.visual_ok === false}
              onActionCreated={handleCorrectiveActionCreated}
            />
          </div>

          {/* Photos */}
          <PhotoPicker
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={5}
            disabled={isSubmitting}
          />

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional observations or comments"
              rows={3}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            />
          </div>

          {/* Corrective Action - Show if leak check fails or visual inspection shows issues */}
          {(formData.leak_check === false || formData.visual_ok === false) && (
            <div>
              <label
                htmlFor="corrective_action"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Corrective Action *
              </label>
              <textarea
                id="corrective_action"
                value={formData.corrective_action}
                onChange={(e) =>
                  handleInputChange('corrective_action', e.target.value)
                }
                placeholder="Describe the corrective action taken"
                rows={3}
                required
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              />
            </div>
          )}

          {/* Customer Email */}
          <div>
            <label
              htmlFor="customer_email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Customer Email
            </label>
            <input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) =>
                handleInputChange('customer_email', e.target.value)
              }
              placeholder="Enter customer email (optional)"
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            />
          </div>

          {/* Initials */}
          <div>
            <label
              htmlFor="initials"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Initials *
            </label>
            <input
              id="initials"
              type="text"
              value={formData.initials}
              onChange={(e) =>
                handleInputChange('initials', e.target.value.toUpperCase())
              }
              placeholder="Enter your initials (2-3 characters)"
              maxLength={3}
              required
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">2-3 uppercase letters</p>
          </div>
        </form>

        {/* Sticky Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-3">
          {/* Draft Actions */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Save Draft
            </button>
            {hasDraft && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="flex-1 py-3 px-4 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                Discard Draft
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            form="log-form"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 px-6 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? 'Saving...'
              : online
                ? 'Save & Send PDF'
                : 'Save Offline'}
          </button>
        </div>

        {/* Corrective Action Modal */}
        {currentFailureItem && (
          <CorrectiveActionModal
            isOpen={showCorrectiveActionModal}
            onClose={handleCorrectiveActionModalClose}
            onSuccess={handleCorrectiveActionCreated}
            inspectionId="draft" // Will be updated after log creation
            failureItem={currentFailureItem}
            currentTechnicianId={user?.id}
          />
        )}
      </div>
    </AppShell>
  );
}
