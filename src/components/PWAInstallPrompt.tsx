import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { X, Download, Smartphone, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

export const PWAInstallPrompt: React.FC = () => {
  const pwa = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleInstall = async () => {
    if (installing) return;
    
    setInstalling(true);
    try {
      const success = await pwa.install();
      if (success) {
        toast.success('App installed successfully! You can now use Urban Guardians offline.');
        setShowInstallPrompt(false);
      } else {
        toast.error('Installation cancelled or failed.');
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Failed to install app. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const handleUpdate = async () => {
    if (updating) return;
    
    setUpdating(true);
    try {
      pwa.skipWaiting();
      toast.success('Updating app... Please wait while we reload.');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update app. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or not installable
  const shouldShowInstallPrompt = pwa.isInstallable && 
                                 !pwa.isInstalled && 
                                 showInstallPrompt &&
                                 localStorage.getItem('install-prompt-dismissed') !== 'true';

  return (
    <>
      {/* Connection Status */}
      {!pwa.isOnline && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You're offline. Don't worry - Urban Guardians works offline too! 
            Your data will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}

      {pwa.isOnline && pwa.isStandalone && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You're online and using the installed app! All features are available.
          </AlertDescription>
        </Alert>
      )}

      {/* Update Available */}
      {pwa.updateAvailable && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>A new version of Urban Guardians is available!</span>
              <Button 
                size="sm" 
                onClick={handleUpdate}
                disabled={updating}
                className="ml-4"
              >
                {updating ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Update
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Install Prompt */}
      {shouldShowInstallPrompt && (
        <Card className="mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Install Urban Guardians
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Get the full app experience! Install Urban Guardians for:
                  </p>
                  
                  <ul className="text-xs text-blue-600 space-y-1 mb-4">
                    <li>• Offline access to your reports</li>
                    <li>• Push notifications for updates</li>
                    <li>• Faster loading and better performance</li>
                    <li>• Home screen access without browser</li>
                  </ul>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleInstall}
                      disabled={installing}
                      className="flex-1 sm:flex-initial"
                    >
                      {installing ? (
                        <>
                          <Download className="h-3 w-3 mr-2 animate-pulse" />
                          Installing...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-2" />
                          Install App
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={dismissInstallPrompt}
                      className="flex-1 sm:flex-initial"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissInstallPrompt}
                className="flex-shrink-0 -mt-1 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

// Standalone install banner for iOS Safari
export const IOSInstallBanner: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  React.useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    const isIOSSafari = isIOSDevice && !isInStandaloneMode && !window.matchMedia('(display-mode: standalone)').matches;

    setIsIOS(isIOSSafari);
    setShowBanner(isIOSSafari && localStorage.getItem('ios-install-dismissed') !== 'true');
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('ios-install-dismissed', 'true');
  };

  if (!showBanner || !isIOS) return null;

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Smartphone className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium mb-2">Install Urban Guardians on your iPhone</p>
            <p className="text-sm mb-3">
              Tap the <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong>
            </p>
            <div className="text-xs bg-blue-100 p-2 rounded border border-blue-200">
              📱 Safari → Share → Add to Home Screen → Add
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={dismissBanner} className="ml-2 -mt-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PWAInstallPrompt;