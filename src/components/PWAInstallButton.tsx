import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'default', 
  size = 'default',
  className = ''
}) => {
  const pwa = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (installing || !pwa?.isInstallable) return;

    setInstalling(true);
    try {
      const success = await pwa.install();
      if (success) {
        toast.success('App installed successfully!');
      } else {
        // User cancelled - no error needed
        console.log('Installation cancelled by user');
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Installation failed. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  // Don't show if not installable or already installed
  if (!pwa?.isInstallable || pwa?.isInstalled) {
    return null;
  }

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleInstall}
      disabled={installing}
      className={className}
    >
      {installing ? (
        <>
          <Download className="h-4 w-4 mr-2 animate-pulse" />
          Installing...
        </>
      ) : (
        <>
          <Smartphone className="h-4 w-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  );
};

export default PWAInstallButton;