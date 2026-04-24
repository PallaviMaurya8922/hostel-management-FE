import React, { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Button from './Button';
import Modal from './Modal';

export interface HeaderProps {
  userName: string;
  onLogout: () => void | Promise<void>;
  photoUrl?: string;
  logoText?: string;
  className?: string;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  onLogout,
  photoUrl,
  logoText = 'Hostel Management',
  className = '',
  onMenuToggle,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 px-4 md:px-6 ${className}`}
        role="banner"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {onMenuToggle && (
              <button
                type="button"
                onClick={onMenuToggle}
                className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-surface-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              <h1 className="text-base font-semibold text-slate-800 hidden sm:block">
                {logoText}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              {photoUrl && !photoLoadError ? (
                <img
                  src={photoUrl}
                  alt={userName}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-100"
                  onError={() => setPhotoLoadError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-slate-600 font-medium hidden sm:block">
                {userName}
              </span>
            </div>
            <div className="w-px h-6 bg-surface-200 hidden sm:block" />
            <Button
              variant="ghost"
              size="small"
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setShowLogoutModal(true)}
              aria-label="Logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

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
              variant="danger"
              onClick={handleLogoutConfirm}
              loading={isLoggingOut}
              disabled={isLoggingOut}
            >
              Logout
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to log out of your account?</p>
      </Modal>
    </>
  );
};

export default Header;
