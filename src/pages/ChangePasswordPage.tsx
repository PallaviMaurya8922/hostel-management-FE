import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { getRoleBasedPath } from '../components/ProtectedRoute';
import { useAuth } from '../contexts';
import { useToast } from '../contexts';
import { changePassword } from '../api/auth';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

/**
 * Change Password Page
 * First-time login force password change page
 * Users must change their default password before accessing the dashboard
 */

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const currentPassword = user?.role === 'student' ? '123456' : `${user?.role ?? 'staff'}4567`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setFormError('Both password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setFormError('New password must be different from the default password');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      showToast('Password changed successfully', 'success');
      
      navigate(getRoleBasedPath(user?.role || 'student'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <AppShell pageTitle="Change Password">
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-surface-50 to-brand-50 px-4 py-8">
        <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Change Password
            </h1>
            <p className="text-slate-600">
              This is your first login. Please set a new password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
              <p className="text-sm text-brand-700">
                <span className="font-semibold">Default Password:</span> {currentPassword}
              </p>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter a new password (min 6 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 pr-10 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-surface-50"
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
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 pr-10 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-surface-50"
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

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-200">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-slate-600 mt-6">
          Session User: <span className="font-medium">{user?.email}</span>
        </p>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLogoutClick}
              loading={isLoggingOut}
              disabled={isLoggingOut}
            >
              Logout
            </Button>
          </>
        }
      >
        <p className="text-base text-slate-700">Are you sure you want to logout?</p>
        </Modal>
      </div>
    </AppShell>
  );
};

export default ChangePasswordPage;
