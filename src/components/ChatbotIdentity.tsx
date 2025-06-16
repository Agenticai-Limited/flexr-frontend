import { FC, useState } from 'react';
import flexrLogo from '../assets/flexr-logo.png';

interface ChatbotIdentityProps {
  name: string;
  logoUrl?: string;
}

export const ChatbotIdentity: FC<ChatbotIdentityProps> = ({ name, logoUrl }) => {
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      <div className="relative p-4 bg-white/70 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {logoUrl && (
            <div className="w-8 h-8">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{name}</h1>
            {isDev && (
              <div className="text-xs text-gray-500">
                Environment: <span className="text-primary-600">{mode}</span>
              </div>
            )}
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src={flexrLogo}
            alt="Flexr Logo"
            className="h-8 object-contain"
          />
        </div>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">All conversations will not be saved. Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};