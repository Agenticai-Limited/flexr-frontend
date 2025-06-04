import React from 'react';

interface ChatbotIdentityProps {
  name: string;
  logoUrl?: string;
}

export const ChatbotIdentity: React.FC<ChatbotIdentityProps> = ({ name, logoUrl }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white/70 backdrop-blur-sm border-b border-gray-100">
      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-primary-100">
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-primary-600 font-medium text-lg">{name[0].toUpperCase()}</span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{name}</span>
        <span className="text-xs text-gray-500">Assistant</span>
      </div>
    </div>
  );
};