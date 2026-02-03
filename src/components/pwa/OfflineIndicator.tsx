import { useState, useEffect } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { pendingActions, syncing, syncAll, hasPendingActions } = useOfflineSync();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show nothing if online and no pending actions
  if (isOnline && !hasPendingActions) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-40',
        'bg-card border border-border rounded-lg shadow-lg p-3',
        'animate-slide-up'
      )}
    >
      {!isOnline ? (
        <div className="flex items-center gap-2 text-warning">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Çevrimdışı</span>
        </div>
      ) : hasPendingActions ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CloudOff className="w-4 h-4" />
            <span className="text-sm">{pendingActions.length} bekleyen işlem</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={syncAll}
            disabled={syncing}
            className="h-7 text-xs"
          >
            {syncing ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Senkronize Et
          </Button>
        </div>
      ) : null}
    </div>
  );
}
