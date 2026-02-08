import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getOfflineQueue,
  removeFromOfflineQueue,
  SyncAction,
  setupOnlineListener,
  isOnline,
} from '@/lib/offlineSync';
import { stockService } from '@/services/stockService'; // ✅ NEW

export function useOfflineSync() {
  const [pendingActions, setPendingActions] = useState<SyncAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadQueue = useCallback(() => {
    setPendingActions(getOfflineQueue());
  }, []);

  const syncAction = async (action: SyncAction): Promise<boolean> => {
    try {
      // ✅ Only handle stock movements here (safe)
      if (action.type !== 'stock_movement') return true;

      // ✅ Use the unified service so triggers + raf_konum update run
      const result = await stockService.createMovement({
        productId: action.data.productId,
        type: action.data.type,
        quantity: action.data.quantity,
        setQuantity: action.data.setQuantity || 0,
        date: action.data.date,
        time: action.data.time,
        note: action.data.note,
        shelfId: action.data.shelfId,
      });

      // If result is null, it means failed (or was re-queued offline)
      return !!result;
    } catch (error) {
      console.error('Sync failed for action:', action.id, error);
      return false;
    }
  };

  const syncAll = useCallback(async () => {
    if (syncing || !isOnline()) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    let syncedCount = 0;

    for (const action of queue) {
      const success = await syncAction(action);
      if (success) {
        removeFromOfflineQueue(action.id);
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      toast.success(`${syncedCount} bekleyen işlem senkronize edildi`);
    }

    loadQueue();
    setSyncing(false);
  }, [syncing, loadQueue]);

  useEffect(() => {
    loadQueue();

    const cleanup = setupOnlineListener(() => {
      syncAll();
    });

    if (isOnline()) {
      syncAll();
    }

    return cleanup;
  }, [loadQueue, syncAll]);

  return {
    pendingActions,
    syncing,
    syncAll,
    hasPendingActions: pendingActions.length > 0,
  };
}
