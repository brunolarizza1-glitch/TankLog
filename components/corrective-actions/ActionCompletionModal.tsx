'use client';

import { useState, useRef } from 'react';
import { CorrectiveActionWithDetails } from '@/lib/corrective-actions-client';
import { useAuth } from '@/lib/auth';
import { useSyncStatus } from '@/lib/sync';

interface ActionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: CorrectiveActionWithDetails | null;
  onComplete: (
    actionId: string,
    resolutionNotes: string,
    photoEvidence?: string
  ) => void;
}

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  type: 'before' | 'after';
}

export default function ActionCompletionModal({
  isOpen,
  onClose,
  action,
  onComplete,
}: ActionCompletionModalProps) {
  const { user } = useAuth();
  const { isOnline } = useSyncStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [signature, setSignature] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action || !resolutionNotes.trim()) return;

    setIsSubmitting(true);
    try {
      // Upload photos if any
      let photoEvidence = '';
      if (photos.length > 0) {
        photoEvidence = await uploadPhotos(photos);
      }

      await onComplete(action.id, resolutionNotes, photoEvidence);

      // Reset form
      setResolutionNotes('');
      setPhotos([]);
      setSignature('');
      setShowSignaturePad(false);
      onClose();
    } catch (error) {
      console.error('Failed to complete action:', error);
      alert('Failed to complete action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadPhotos = async (photos: PhotoFile[]): Promise<string> => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const formData = new FormData();
      formData.append('file', photo.file);
      formData.append('logId', action?.id || 'completion');
      formData.append('type', photo.type);

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        uploadedUrls.push(url);
      }
    }

    return uploadedUrls.join(',');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);

        setPhotos((prev) => [
          ...prev,
          {
            id,
            file,
            preview,
            type: 'after', // Default to 'after' for completion photos
          },
        ]);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const startSignature = () => {
    setShowSignaturePad(true);
  };

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature('');
  };

  const saveSignature = () => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      setSignature(dataURL);
      setShowSignaturePad(false);
    }
  };

  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Complete Corrective Action
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {action.inspection_item_id.replace('_', ' ').toUpperCase()} -{' '}
                {action.inspection?.site}
              </p>
            </div>
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

          {/* Action Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Action Details</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Issue:</strong> {action.description}
              </p>
              <p>
                <strong>Required Action:</strong> {action.required_action}
              </p>
              <p>
                <strong>Due Date:</strong>{' '}
                {new Date(action.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resolution Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes *
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Photos
              </label>
              <div className="space-y-4">
                {/* Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
                  >
                    📷 Add Photos
                  </button>
                </div>

                {/* Photo Preview */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.preview}
                          alt="Evidence photo"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {photo.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Digital Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature
              </label>

              {!showSignaturePad && !signature ? (
                <button
                  type="button"
                  onClick={startSignature}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  ✍️ Add Digital Signature
                </button>
              ) : showSignaturePad ? (
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={signatureCanvasRef}
                      width={400}
                      height={200}
                      className="border border-gray-200 rounded w-full"
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={saveSignature}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                      Save Signature
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <img
                    src={signature}
                    alt="Digital signature"
                    className="border border-gray-300 rounded-lg max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={startSignature}
                    className="text-sm text-primary hover:text-primary-dark underline"
                  >
                    Redraw Signature
                  </button>
                </div>
              )}
            </div>

            {/* Offline Indicator */}
            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">📡</span>
                  <span className="text-sm text-orange-800">
                    Offline mode - Completion will sync when online
                  </span>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !resolutionNotes.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Completing...' : 'Complete Action'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
