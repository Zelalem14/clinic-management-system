import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading details...', size = 'md' }) => {
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <Loader2 className={`${iconSize} animate-spin text-brand-600 mb-2`} />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
