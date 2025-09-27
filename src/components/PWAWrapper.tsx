import React, { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface PWAWrapperProps {
  children: React.ReactNode;
}

export const PWAWrapper: React.FC<PWAWrapperProps> = ({ children }) => {
  const pwa = usePWA();

  // Show connection change notifications (only if PWA is supported)
  useEffect(() => {
    if (!pwa?.isSupported) return;

    const handleOnline = () => {
      toast.success('Connection restored!', { duration: 2000 });
    };

    const handleOffline = () => {
      toast.warning('You\'re offline - app still works!', { duration: 3000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pwa?.isSupported]);

  // Show update notifications
  useEffect(() => {
    if (pwa?.updateAvailable) {
      toast.info('App update available!', {
        action: {
          label: 'Update',
          onClick: () => pwa.skipWaiting()
        },
        duration: 8000
      });
    }
  }, [pwa?.updateAvailable, pwa?.skipWaiting]);

  // Just wrap children without complex UI for now
  return (
    <>{children}</>
  );
};

export default PWAWrapper;