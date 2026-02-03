// Offline sync queue for stock actions
const SYNC_QUEUE_KEY = 'stock_sync_queue';

export interface SyncAction {
  id: string;
  type: 'stock_movement';
  data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    date: string;
    time: string;
    note?: string;
  };
  timestamp: number;
  retries: number;
}

export function getOfflineQueue(): SyncAction[] {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(action: Omit<SyncAction, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getOfflineQueue();
  const newAction: SyncAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(newAction);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter(action => action.id !== id);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// Background sync registration
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('stock-sync');
    } catch (error) {
      console.log('Background sync registration failed:', error);
    }
  }
}

// Listen for online status
export function setupOnlineListener(onOnline: () => void): () => void {
  const handler = () => {
    if (navigator.onLine) {
      onOnline();
    }
  };
  
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
