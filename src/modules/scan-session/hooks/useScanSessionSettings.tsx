import { useMemo } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { DEFAULT_SCAN_SETTINGS, ScanSessionSettings } from '../types';

export function useScanSessionSettings(): ScanSessionSettings & { isEnabled: boolean } {
  const { isModuleEnabled, getModuleConfig } = useFeatureFlags();
  const enabled = isModuleEnabled('scan_session');
  const config = getModuleConfig('scan_session');

  const settings = useMemo<ScanSessionSettings>(() => ({
    allowNegativeStock: (config.allowNegativeStock as boolean) ?? DEFAULT_SCAN_SETTINGS.allowNegativeStock,
    cooldownMs: (config.cooldownMs as number) ?? DEFAULT_SCAN_SETTINGS.cooldownMs,
    defaultScanTarget: (config.defaultScanTarget as ScanSessionSettings['defaultScanTarget']) ?? DEFAULT_SCAN_SETTINGS.defaultScanTarget,
    defaultInputMethod: (config.defaultInputMethod as ScanSessionSettings['defaultInputMethod']) ?? DEFAULT_SCAN_SETTINGS.defaultInputMethod,
  }), [config]);

  return { ...settings, isEnabled: enabled };
}
