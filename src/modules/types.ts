// Enterprise Module System Types
// These types define the module registry and feature flag system

export type ModuleKey =
  | 'control_center'
  | 'rbac_enhanced'
  | 'dynamic_forms'
  | 'workflows'
  | 'automation'
  | 'audit_enhanced'
  | 'offline_enhanced'
  | 'store_module';

export interface FeatureFlag {
  id: string;
  module_key: ModuleKey;
  module_name: string;
  description: string | null;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModuleStatus {
  key: ModuleKey;
  name: string;
  description: string;
  enabled: boolean;
  healthy: boolean;
  missingConfigs: string[];
  icon: string;
}

export interface MigrationSafetyCheck {
  module: string;
  check: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

// Module metadata for UI display
export const MODULE_METADATA: Record<ModuleKey, { icon: string; category: string }> = {
  control_center: { icon: 'Settings2', category: 'Sistem' },
  rbac_enhanced: { icon: 'Shield', category: 'Güvenlik' },
  dynamic_forms: { icon: 'FileText', category: 'Formlar' },
  workflows: { icon: 'GitBranch', category: 'İş Akışı' },
  automation: { icon: 'Zap', category: 'Otomasyon' },
  audit_enhanced: { icon: 'Eye', category: 'Denetim' },
  offline_enhanced: { icon: 'WifiOff', category: 'Altyapı' },
  store_module: { icon: 'Store', category: 'Mağaza' },
};
