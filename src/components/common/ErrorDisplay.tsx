import React from 'react';

type Props = {
  message?: string | null;
};

const ErrorDisplay: React.FC<Props> = ({ message }) => {
  if (!message) return null;
  return <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{message}</div>;
};

export default ErrorDisplay;
