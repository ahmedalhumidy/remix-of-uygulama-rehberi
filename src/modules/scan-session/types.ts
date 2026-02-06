export type ScanSessionMode = 'in' | 'out' | 'transfer' | 'count';
export type ScanTarget = 'units' | 'sets' | 'both';
export type ScanInputMethod = 'camera' | 'hardware' | 'both';

export interface ScanQueueItem {
  id: string;
  barcode: string;
  productId: string | null;
  productName: string | null;
  productCode: string | null;
  units: number;
  sets: number;
  shelfId: string | null;
  shelfName: string | null;
  status: 'pending' | 'not_found' | 'processed' | 'error';
  errorMessage?: string;
  scannedAt: number;
}

export interface ScanSessionState {
  id: string;
  mode: ScanSessionMode;
  scanTarget: ScanTarget;
  inputMethod: ScanInputMethod;
  activeShelfId: string | null;
  activeShelfName: string | null;
  // Transfer mode
  fromShelfId: string | null;
  fromShelfName: string | null;
  toShelfId: string | null;
  toShelfName: string | null;
  transferStep: 'from' | 'scan' | 'to';
  // Queue
  queue: ScanQueueItem[];
  // Timestamps
  startedAt: number;
  lastScanAt: number | null;
}

export interface ScanSessionSettings {
  allowNegativeStock: boolean;
  cooldownMs: number;
  defaultScanTarget: ScanTarget;
  defaultInputMethod: ScanInputMethod;
}

export const DEFAULT_SCAN_SETTINGS: ScanSessionSettings = {
  allowNegativeStock: false,
  cooldownMs: 1500,
  defaultScanTarget: 'units',
  defaultInputMethod: 'camera',
};

export interface ScanSessionResult {
  sessionId: string;
  mode: ScanSessionMode;
  totalLines: number;
  totalUnits: number;
  totalSets: number;
  successCount: number;
  errorCount: number;
  processedAt: number;
}

// Persistence key for offline
export const SCAN_SESSION_STORAGE_KEY = 'scan_session_state';
