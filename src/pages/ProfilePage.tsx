import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { getRoleBasedPath } from '../components/ProtectedRoute';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../contexts';
import { useToast } from '../contexts';
import { changePassword, uploadProfilePhoto } from '../api/auth';
import { getStudentProfile } from '../api/requests';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [section, setSection] = useState('');
  const [headerPhotoUrl, setHeaderPhotoUrl] = useState<string | undefined>(
    user?.photoUrl
  );
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  useEffect(() => {
    const loadStudentProfile = async () => {
      if (!user?.id || user.role !== 'student') {
        return;
      }

      try {
        const student = await getStudentProfile(user.id);
        setRoomNumber((student.room_number || '').trim());
        setSection((student.block || '').trim().toUpperCase());
      } catch {
        // Keep profile usable even if room metadata fetch fails.
        setRoomNumber('');
        setSection('');
      }
    };

    loadStudentProfile();
  }, [user?.id, user?.role]);

  useEffect(() => {
    setHeaderPhotoUrl(user?.photoUrl);
  }, [user?.photoUrl]);

  const handlePhotoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo size must be less than 5MB', 'error');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('Only JPEG, PNG, and GIF images are allowed', 'error');
      return;
    }

    setSelectedPhotoFile(file);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhotoFile) {
      showToast('Please choose a photo first', 'warning');
      return;
    }

    setIsPhotoUploading(true);
    try {
      const photoUrl = await uploadProfilePhoto(selectedPhotoFile);
      setHeaderPhotoUrl(photoUrl);
      setSelectedPhotoFile(null);
      showToast('Profile photo updated successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      showToast(message, 'error');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setFormError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      showToast('Password changed successfully', 'success');
      setIsChangePasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsChangePasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setFormError('');
  };

  return (
    <AppShell pageTitle="Profile">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-6">
              My Profile
            </h2>

            <div className="mb-6 p-4 border border-surface-200 rounded-2xl bg-surface-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {headerPhotoUrl ? (
                      <img
                        src={headerPhotoUrl}
                        alt={user?.name || 'Profile'}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-200"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-brand-500 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          {(user?.name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Profile Photo</h3>
                      <p className="text-sm text-slate-600">Upload or change your profile photo.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handlePhotoSelection}
                        className="hidden"
                        disabled={isPhotoUploading}
                      />
                      <span className="inline-flex items-center justify-center px-4 py-2.5 text-base min-h-[44px] font-medium rounded-2xl bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 cursor-pointer transition-all duration-200">
                        {headerPhotoUrl ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </label>

                    <Button
                      variant="primary"
                      onClick={handlePhotoUpload}
                      disabled={!selectedPhotoFile || isPhotoUploading}
                      loading={isPhotoUploading}
                    >
                      {isPhotoUploading ? 'Uploading...' : 'Save Photo'}
                    </Button>
                  </div>
                </div>

                {selectedPhotoFile && (
                  <p className="text-sm text-slate-700 mt-3">Selected: {selectedPhotoFile.name}</p>
                )}
              </div>

            <div className="space-y-6">
              <section className="border border-surface-200 rounded-2xl p-4 md:p-5">
                <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-3">
                  Personal Info
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="text-slate-900 font-semibold">{user?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="text-slate-900 font-semibold">{user?.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Role</dt>
                    <dd className="text-slate-900 font-semibold capitalize">
                      {user?.role || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">User ID</dt>
                    <dd className="text-slate-900 font-semibold">{user?.id || 'N/A'}</dd>
                  </div>
                </dl>
              </section>

              {user?.role === 'student' && (
                <section className="border border-surface-200 rounded-2xl p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-3">
                    Hostel Info
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-slate-500">Room Number</dt>
                      <dd className="text-slate-900 font-semibold">{roomNumber || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Section/Wing</dt>
                      <dd className="text-slate-900 font-semibold">{section || 'N/A'}</dd>
                    </div>
                  </dl>
                </section>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate(user?.role ? getRoleBasedPath(user.role) : '/')}
              >
                Back to Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsChangePasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={handleCloseModal}
        title="Change Password"
        size="medium"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePasswordSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-surface-50"
              />
              <button
                type="button"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                onClick={() => setShowCurrentPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m3 3 18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-2.17 3.19" />
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 4.39-1.05" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-surface-50"
              />
              <button
                type="button"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                onClick={() => setShowNewPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m3 3 18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-2.17 3.19" />
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 4.39-1.05" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-surface-50"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m3 3 18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-2.17 3.19" />
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 4.39-1.05" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};

export default ProfilePage;
