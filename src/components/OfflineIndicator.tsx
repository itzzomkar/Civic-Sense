import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Upload, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineReportsCount, setOfflineReportsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is back online');
      // Automatically try to sync when coming back online
      if (offlineReportsCount > 0) {
        setTimeout(() => {
          handleSync();
        }, 2000); // Wait 2 seconds to ensure connection is stable
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is offline');
      toast({
        title: "Connection Lost",
        description: "You're now offline. Reports will be saved locally and synced when connection returns.",
        variant: "default",
      });
    };

    const updateOfflineCount = () => {
      const count = apiService.getOfflineReportsCount();
      setOfflineReportsCount(count);
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update count on mount and periodically
    updateOfflineCount();
    const interval = setInterval(updateOfflineCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [offlineReportsCount, toast]);

  const handleSync = async () => {
    if (isSyncing || offlineReportsCount === 0) return;

    setIsSyncing(true);
    try {
      await apiService.syncOfflineReports();
      const remainingCount = apiService.getOfflineReportsCount();
      const syncedCount = offlineReportsCount - remainingCount;
      
      if (syncedCount > 0) {
        toast({
          title: "Reports Synced",
          description: `${syncedCount} offline report${syncedCount > 1 ? 's' : ''} successfully uploaded to server.`,
        });
      }
      
      setOfflineReportsCount(remainingCount);
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync offline reports. Will try again automatically when connection improves.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't render if online and no offline reports
  if (isOnline && offlineReportsCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className={`shadow-lg border-2 ${
        isOnline 
          ? 'border-green-500 bg-green-50' 
          : 'border-orange-500 bg-orange-50'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-600" />
              )}
              <span className={`text-sm font-medium ${
                isOnline ? 'text-green-800' : 'text-orange-800'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {offlineReportsCount > 0 && (
              <>
                <Badge variant="outline" className="text-xs">
                  {offlineReportsCount} pending
                </Badge>
                
                {isOnline && (
                  <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </Button>
                )}
              </>
            )}
          </div>

          {!isOnline && (
            <p className="text-xs text-orange-700 mt-1">
              Reports will be saved offline and synced when connection returns
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;