import React from 'react';

interface ChatbotIdentityProps {
  name: string;
  logoUrl?: string;
}

export const ChatbotIdentity = ({ name, logoUrl }: ChatbotIdentityProps) => {
  const mode = import.meta.env.MODE;
  const isDev = mode === 'development';

  return (
    <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border-b border-gray-100">
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
    </div>
  );
};