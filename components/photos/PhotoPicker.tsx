'use client';

import { useState, useRef, useCallback } from 'react';
import { useComplianceMode } from '@/lib/hooks/useComplianceMode';

interface CompressedPhoto {
  id: string;
  blob: Blob;
  dataUrl: string;
  originalName: string;
}

interface PhotoPickerProps {
  photos: CompressedPhoto[];
  onPhotosChange: (photos: CompressedPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export default function PhotoPicker({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
}: PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  // const { complianceInfo } = useComplianceMode();

  const compressImage = useCallback(
    async (file: File): Promise<CompressedPhoto> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions (max 1200px on long edge)
          const maxSize = 1200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create data URL for preview
              const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

              resolve({
                id: crypto.randomUUID(),
                blob,
                dataUrl,
                originalName: file.name,
              });
            },
            'image/jpeg',
            0.75
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || disabled) return;

      const newFiles = Array.from(files).slice(0, maxPhotos - photos.length);

      if (newFiles.length === 0) {
        alert(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      setIsCompressing(true);

      try {
        const compressedPhotos: CompressedPhoto[] = [];

        for (const file of newFiles) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert(`${file.name} is not an image file`);
            continue;
          }

          // Validate file size (5MB max before compression)
          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} is too large (max 5MB)`);
            continue;
          }

          try {
            const compressed = await compressImage(file);
            compressedPhotos.push(compressed);
          } catch (error) {
            console.error('Error compressing image:', error);
            alert(`Failed to process ${file.name}`);
          }
        }

        onPhotosChange([...photos, ...compressedPhotos]);
      } finally {
        setIsCompressing(false);
      }
    },
    [photos, maxPhotos, disabled, compressImage, onPhotosChange]
  );

  const removePhoto = useCallback(
    (photoId: string) => {
      onPhotosChange(photos.filter((photo) => photo.id !== photoId));
    },
    [photos, onPhotosChange]
  );

  const openCamera = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const remainingPhotos = maxPhotos - photos.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Photos ({photos.length}/{maxPhotos})
        </label>
        <span className="text-xs text-gray-500">
          {remainingPhotos} remaining
        </span>
      </div>

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.dataUrl}
                alt={`Photo ${photo.id}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                disabled={disabled}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add photos button */}
      {remainingPhotos > 0 && (
        <button
          type="button"
          onClick={openCamera}
          disabled={disabled || isCompressing}
          className="w-full py-4 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCompressing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Compressing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Add Photos</span>
            </div>
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Take photos of the tank, pressure gauge, and any issues found. Photos
        are automatically compressed to save space.
      </p>
    </div>
  );
}
