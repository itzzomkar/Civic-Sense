import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  isSupported: boolean;
}

interface PWAActions {
  install: () => Promise<boolean>;
  skipWaiting: () => void;
  checkForUpdates: () => void;
}

export const usePWA = (): PWAState & PWAActions => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Skip all PWA functionality in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PWA: Completely disabled in development mode');
      // Unregister any existing service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
            console.log('PWA: Unregistered service worker');
          }
        });
      }
      return;
    }
    // Check if app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    // Check if app is installed (PWA)
    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    setState(prev => ({
      ...prev,
      isStandalone,
      isInstalled
    }));

    // Skip service worker registration in development
    if (process.env.NODE_ENV !== 'development') {
      registerServiceWorker();
    } else {
      console.log('PWA: Service worker registration skipped in development mode');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setState(prev => ({ ...prev, isInstallable: true }));
      
      console.log('PWA: Install prompt available');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      setState(prev => ({ 
        ...prev, 
        isInstallable: false, 
        isInstalled: true 
      }));
    };

    // Listen for online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        setSWRegistration(registration);
        console.log('PWA: Service worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('PWA: Service worker update found');
          
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('PWA: New content available, update required');
                  setState(prev => ({ ...prev, updateAvailable: true }));
                } else {
                  console.log('PWA: Content cached for offline use');
                }
              }
            });
          }
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('PWA: Message from service worker:', event.data);
          
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            setState(prev => ({ ...prev, updateAvailable: true }));
          }
        });

        // Check for existing service worker
        if (registration.waiting) {
          setState(prev => ({ ...prev, updateAvailable: true }));
        }

      } catch (error) {
        console.error('PWA: Service worker registration failed:', error);
      }
    }
  };

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('PWA: Install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setState(prev => ({ 
          ...prev, 
          isInstalled: true, 
          isInstallable: false 
        }));
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA: Install failed:', error);
      return false;
    }
  };

  const skipWaiting = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setState(prev => ({ ...prev, updateAvailable: false }));
      
      // Reload page after service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  const checkForUpdates = async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        console.log('PWA: Checked for updates');
      } catch (error) {
        console.error('PWA: Update check failed:', error);
      }
    }
  };

  return {
    ...state,
    install,
    skipWaiting,
    checkForUpdates
  };
};

// Utility function to show install prompt
export const showInstallPrompt = (pwa: ReturnType<typeof usePWA>) => {
  if (pwa.isInstallable) {
    return pwa.install();
  }
  return Promise.resolve(false);
};

// Utility function to detect PWA features support
export const getPWACapabilities = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    badging: 'setAppBadge' in navigator,
    sharing: 'share' in navigator,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    installPrompt: 'onbeforeinstallprompt' in window
  };
};

export default usePWA;