'use client';

import { useState } from 'react';
import {
  correctiveActionService,
  type FailureDetails,
} from '@/lib/corrective-actions';

interface CorrectiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (actionId: string) => void;
  inspectionId: string;
  failureItem: {
    itemId: string;
    itemName: string;
    currentValue: boolean | null;
  };
  currentTechnicianId?: string;
}

export default function CorrectiveActionModal({
  isOpen,
  onClose,
  onSuccess,
  inspectionId,
  failureItem,
  currentTechnicianId,
}: CorrectiveActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    requiredAction: '',
    assignedTo: currentTechnicianId || '',
    customSeverity: '' as 'immediate' | '24hr' | '7day' | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const failureDetails: FailureDetails = {
        itemId: failureItem.itemId,
        description: formData.description,
        requiredAction: formData.requiredAction,
        assignedTo: formData.assignedTo || undefined,
        customSeverity: formData.customSeverity || undefined,
      };

      const action = await correctiveActionService.createCorrectiveAction({
        inspectionId,
        itemId: failureItem.itemId,
        failureDetails,
      });

      onSuccess(action.id);
      onClose();
    } catch (error) {
      console.error('Failed to create corrective action:', error);
      alert('Failed to create corrective action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityDescription = (severity: string) => {
    switch (severity) {
      case 'immediate':
        return 'Must be fixed within 4 hours';
      case '24hr':
        return 'Must be fixed within 24 hours';
      case '7day':
        return 'Must be fixed within 7 days';
      default:
        return 'Severity will be determined automatically';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Failed Item Detected
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {failureItem.itemName} - Failed
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Failure Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what failed and why"
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Action *
              </label>
              <textarea
                value={formData.requiredAction}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiredAction: e.target.value,
                  }))
                }
                placeholder="Describe what needs to be done to fix this issue"
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: e.target.value,
                  }))
                }
                placeholder="Technician ID or name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                value={formData.customSeverity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customSeverity: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Auto-determine (recommended)</option>
                <option value="immediate">Immediate (4 hours)</option>
                <option value="24hr">24 Hours</option>
                <option value="7day">7 Days</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getSeverityDescription(formData.customSeverity)}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.description ||
                  !formData.requiredAction
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Corrective Action'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
