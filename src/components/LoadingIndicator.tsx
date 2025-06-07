import React from 'react';

interface LoadingIndicatorProps {
  chatbotName: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ chatbotName }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg max-w-[70%] animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-600">
          {chatbotName} is preparing the answer...
        </span>
        <span className="flex space-x-1 mt-1">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
        </span>
      </div>
    </div>
  );
};