import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { RefreshCw, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'report' | 'comment' | 'upvote' | 'message';
  data: any;
  timestamp: Date;
  retries: number;
}

export const OfflineSync: React.FC = () => {
  const { isOnline } = usePWA();
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load pending operations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('offline-pending-ops');
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
        setPendingOps(parsed);
      } catch (error) {
        console.error('Failed to load pending operations:', error);
        localStorage.removeItem('offline-pending-ops');
      }
    }

    const lastSync = localStorage.getItem('last-sync-time');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  }, []);

  // Save pending operations to localStorage
  const savePendingOps = (ops: PendingOperation[]) => {
    localStorage.setItem('offline-pending-ops', JSON.stringify(ops));
    setPendingOps(ops);
  };

  // Add a new pending operation
  const addPendingOperation = (op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>) => {
    const newOp: PendingOperation = {
      ...op,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      retries: 0
    };
    
    const updated = [...pendingOps, newOp];
    savePendingOps(updated);
    
    // If we just came back online, try to sync
    if (isOnline) {
      syncPendingOperations();
    }
  };

  // Remove completed operation
  const removePendingOperation = (id: string) => {
    const updated = pendingOps.filter(op => op.id !== id);
    savePendingOps(updated);
  };

  // Sync a single operation
  const syncOperation = async (op: PendingOperation): Promise<boolean> => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      let endpoint = '';
      let method = '';
      let body: any = null;

      switch (op.resource) {
        case 'report':
          endpoint = op.type === 'create' ? '/reports' : `/reports/${op.data.id}`;
          method = op.type === 'create' ? 'POST' : 
                  op.type === 'update' ? 'PUT' : 'DELETE';
          body = op.type !== 'delete' ? op.data : null;
          break;
          
        case 'comment':
          endpoint = op.type === 'create' ? '/comments' : `/comments/${op.data.id}`;
          method = op.type === 'create' ? 'POST' : 
                  op.type === 'update' ? 'PUT' : 'DELETE';
          body = op.type !== 'delete' ? op.data : null;
          break;
          
        case 'upvote':
          endpoint = `/reports/${op.data.reportId}/upvote`;
          method = op.type === 'create' ? 'POST' : 'DELETE';
          break;
          
        case 'message':
          endpoint = op.type === 'create' ? '/chat/messages' : `/chat/messages/${op.data.id}`;
          method = op.type === 'create' ? 'POST' : 'DELETE';
          body = op.type !== 'delete' ? op.data : null;
          break;
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: body ? JSON.stringify(body) : null
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to sync operation ${op.id}:`, error);
      return false;
    }
  };

  // Sync all pending operations
  const syncPendingOperations = async () => {
    if (!isOnline || syncing || pendingOps.length === 0) return;

    setSyncing(true);
    setSyncProgress(0);

    const maxRetries = 3;
    let successCount = 0;
    let failedOps: PendingOperation[] = [];

    for (let i = 0; i < pendingOps.length; i++) {
      const op = pendingOps[i];
      setSyncProgress(((i + 1) / pendingOps.length) * 100);

      const success = await syncOperation(op);
      
      if (success) {
        successCount++;
        removePendingOperation(op.id);
      } else if (op.retries < maxRetries) {
        // Retry with exponential backoff
        const updatedOp = { ...op, retries: op.retries + 1 };
        failedOps.push(updatedOp);
      } else {
        // Max retries reached, keep for manual retry
        failedOps.push(op);
      }

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update failed operations
    if (failedOps.length > 0) {
      savePendingOps(failedOps);
    }

    setLastSyncTime(new Date());
    localStorage.setItem('last-sync-time', new Date().toISOString());

    setSyncing(false);
    setSyncProgress(0);

    // Show results
    if (successCount > 0) {
      toast.success(`Synced ${successCount} operation${successCount === 1 ? '' : 's'} successfully!`);
    }
    
    if (failedOps.length > 0) {
      toast.warning(`${failedOps.length} operation${failedOps.length === 1 ? '' : 's'} failed to sync. Will retry automatically.`);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOps.length > 0 && !syncing) {
      // Delay to ensure connection is stable
      const timer = setTimeout(() => {
        syncPendingOperations();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOps.length, syncing]);

  // Manual retry all failed operations
  const retryAllOperations = () => {
    const retriedOps = pendingOps.map(op => ({ ...op, retries: 0 }));
    savePendingOps(retriedOps);
    syncPendingOperations();
  };

  // Clear all pending operations (emergency only)
  const clearAllOperations = () => {
    savePendingOps([]);
    localStorage.removeItem('offline-pending-ops');
    toast.info('All pending operations cleared.');
  };

  if (pendingOps.length === 0) return null;

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <Upload className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {pendingOps.length} operation{pendingOps.length === 1 ? '' : 's'} pending sync
              </p>
              {lastSyncTime && (
                <p className="text-xs text-yellow-600">
                  Last synced: {lastSyncTime.toLocaleString()}
                </p>
              )}
            </div>
            
            {isOnline ? (
              <Button
                size="sm"
                onClick={syncPendingOperations}
                disabled={syncing}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {syncing ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            ) : (
              <div className="text-xs text-yellow-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </div>
            )}
          </div>

          {syncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Syncing operations...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Operation summary */}
          <div className="text-xs space-y-1">
            {Object.entries(
              pendingOps.reduce((acc, op) => {
                const key = `${op.resource}-${op.type}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([key, count]) => {
              const [resource, type] = key.split('-');
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">
                    {type} {resource}{count > 1 ? 's' : ''}:
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Action buttons for failed operations */}
          {pendingOps.some(op => op.retries > 0) && (
            <div className="flex gap-2 pt-2 border-t border-yellow-200">
              <Button
                size="sm"
                variant="outline"
                onClick={retryAllOperations}
                disabled={!isOnline || syncing}
                className="flex-1 text-yellow-700 border-yellow-300"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry All
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllOperations}
                className="flex-1 text-red-700 border-red-300 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Hook to add operations when offline
export const useOfflineOperations = () => {
  const { isOnline } = usePWA();
  const [syncComponent, setSyncComponent] = useState<any>(null);

  const addOperation = (op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>) => {
    if (isOnline) {
      // If online, execute immediately
      return Promise.resolve();
    }

    // If offline, queue for later
    const event = new CustomEvent('addPendingOperation', { detail: op });
    window.dispatchEvent(event);
    
    toast.info('Operation saved. Will sync when connection is restored.');
    return Promise.resolve();
  };

  return {
    addOperation,
    isOnline
  };
};

export default OfflineSync;