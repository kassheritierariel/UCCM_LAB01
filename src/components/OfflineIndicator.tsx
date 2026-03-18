import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-2 bg-red-500/20 rounded-lg">
        <WifiOff className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold">Mode hors ligne</p>
        <p className="text-xs text-slate-300">Vos modifications seront synchronisées une fois connecté.</p>
      </div>
    </div>
  );
};

export default OfflineIndicator;
