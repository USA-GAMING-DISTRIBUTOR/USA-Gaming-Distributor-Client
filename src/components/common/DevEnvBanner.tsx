import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DevEnvBannerProps {
  messages: string[];
}

const DevEnvBanner: React.FC<DevEnvBannerProps> = ({ messages }) => {
  if (!messages.length) return null;
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <strong className="font-medium">Environment warnings:</strong>
          <ul className="list-disc pl-5 mt-1">
            {messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DevEnvBanner;
