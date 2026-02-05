import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ModuleKey, FeatureFlag } from '@/modules/types';

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  isModuleEnabled: (key: ModuleKey) => boolean;
  toggleModule: (key: ModuleKey, enabled: boolean) => Promise<boolean>;
  getModuleConfig: (key: ModuleKey) => Record<string, unknown>;
  updateModuleConfig: (key: ModuleKey, config: Record<string, unknown>) => Promise<boolean>;
  refreshFlags: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('module_key');

      if (error) {
        console.warn('[FeatureFlags] Could not fetch flags, modules disabled by default:', error.message);
        setFlags([]);
      } else {
        setFlags((data || []) as FeatureFlag[]);
      }
    } catch (err) {
      console.warn('[FeatureFlags] Fetch error, falling back to empty:', err);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchFlags();
    } else {
      setFlags([]);
      setLoading(false);
    }
  }, [user, fetchFlags]);

  const isModuleEnabled = useCallback(
    (key: ModuleKey): boolean => {
      const flag = flags.find(f => f.module_key === key);
      // Default to false if flag not found (safe fallback)
      return flag?.is_enabled ?? false;
    },
    [flags]
  );

  const getModuleConfig = useCallback(
    (key: ModuleKey): Record<string, unknown> => {
      const flag = flags.find(f => f.module_key === key);
      return (flag?.config as Record<string, unknown>) ?? {};
    },
    [flags]
  );

  const toggleModule = useCallback(
    async (key: ModuleKey, enabled: boolean): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('feature_flags')
          .update({ is_enabled: enabled })
          .eq('module_key', key);

        if (error) {
          console.error('[FeatureFlags] Toggle error:', error);
          return false;
        }

        setFlags(prev =>
          prev.map(f => (f.module_key === key ? { ...f, is_enabled: enabled } : f))
        );
        return true;
      } catch (err) {
        console.error('[FeatureFlags] Toggle error:', err);
        return false;
      }
    },
    []
  );

  const updateModuleConfig = useCallback(
    async (key: ModuleKey, config: Record<string, unknown>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('feature_flags')
          .update({ config: config as unknown as import('@/integrations/supabase/types').Json })
          .eq('module_key', key);

        if (error) {
          console.error('[FeatureFlags] Config update error:', error);
          return false;
        }

        setFlags(prev =>
          prev.map(f => (f.module_key === key ? { ...f, config } : f))
        );
        return true;
      } catch (err) {
        console.error('[FeatureFlags] Config update error:', err);
        return false;
      }
    },
    []
  );

  const refreshFlags = useCallback(() => {
    setLoading(true);
    fetchFlags();
  }, [fetchFlags]);

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        loading,
        isModuleEnabled,
        toggleModule,
        getModuleConfig,
        updateModuleConfig,
        refreshFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
