// Automation Module - Phase 3
// Contains trigger rules, automated actions, execution logging
export { useAutomationRules } from './hooks/useAutomationRules';
export { AutomationManager } from './components/AutomationManager';
export type { AutomationRule, AutomationLogEntry, TriggerType, ActionType } from './types';
export { TRIGGER_TYPE_LABELS, ACTION_TYPE_LABELS } from './types';
export const MODULE_KEY = 'automation' as const;
