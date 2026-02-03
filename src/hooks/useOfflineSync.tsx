import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getOfflineQueue,
  removeFromOfflineQueue,
  SyncAction,
  setupOnlineListener,
  isOnline,
} from '@/lib/offlineSync';

export function useOfflineSync() {
  const [pendingActions, setPendingActions] = useState<SyncAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadQueue = useCallback(() => {
    setPendingActions(getOfflineQueue());
  }, []);

  const syncAction = async (action: SyncAction): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      
      if (!userId) return false;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      if (!profile) return false;

      // Insert stock movement
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: action.data.productId,
          movement_type: action.data.type,
          quantity: action.data.quantity,
          movement_date: action.data.date,
          movement_time: action.data.time,
          handled_by: profile.full_name,
          notes: action.data.note || null,
          created_by: userId,
        });

      if (error) throw error;
      return true;
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

    // Sync when coming online
    const cleanup = setupOnlineListener(() => {
      syncAll();
    });

    // Try to sync on mount if online
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
