import React, { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { useToast } from '../../contexts/ToastContext';
import { uploadProfilePhoto } from '../../api/auth';

interface FirstLoginModalProps {
  isOpen: boolean;
  userName: string;
  onComplete: () => void;
}

/**
 * FirstLoginModal Component
 * Modal for first-time login setup:
 * - Upload profile photo
 * - Confirm password change (optional reminder)
 */
const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  isOpen,
  userName,
  onComplete,
}) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState(false);
  const { showToast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo size must be less than 5MB', 'error');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('Only JPEG, PNG, and GIF images are allowed', 'error');
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      showToast('Please select a photo', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePhoto(photoFile);
      setUploadedPhoto(true);
      showToast('Profile photo uploaded successfully!', 'success');
    } catch (error) {
      console.error('Photo upload error:', error);
      const message = error instanceof Error ? error.message : 'An error occurred while uploading photo';
      showToast(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    showToast('You can upload your photo later from your profile', 'info');
    onComplete();
  };

  const handleComplete = () => {
    if (uploadedPhoto) {
      showToast('Welcome to the student dashboard!', 'success');
    }
    onComplete();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing by clicking outside
      title="Complete Your Profile"
      size="small"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome, {userName}!</h2>
        <p className="text-sm text-slate-500 mb-6">
          Let's complete your profile by uploading a photo
        </p>

        {/* Photo Upload Section */}
        <div className="mb-6">
          <div className="mb-4">
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-brand-200"
                />
                {uploadedPhoto && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white rounded-full p-1">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto rounded-full bg-surface-100 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-slate-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a3 3 0 00-3 3v2a3 3 0 003 3h4a3 3 0 003-3v-2a3 3 0 00-3-3H10z" />
                </svg>
              </div>
            )}
          </div>

          {!uploadedPhoto && (
            <>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <span className="inline-block px-4 py-2.5 bg-brand-50 text-brand-600 rounded-xl cursor-pointer hover:bg-brand-100 transition-colors text-sm font-medium">
                  Choose Photo
                </span>
              </label>

              {photoFile && (
                <p className="text-sm text-slate-500 mt-2">
                  {photoFile.name}
                </p>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!uploadedPhoto && photoFile && (
            <Button
              onClick={handleUploadPhoto}
              disabled={isUploading}
              className="w-full"
              variant="primary"
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          )}

          {uploadedPhoto ? (
            <Button
              onClick={handleComplete}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl"
            >
              Continue to Dashboard
            </Button>
          ) : (
            <Button
              onClick={handleSkip}
              className="w-full"
              variant="secondary"
            >
              Skip for Now
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          You can update your photo anytime from your profile
        </p>
      </div>
    </Modal>
  );
};

export default FirstLoginModal;
