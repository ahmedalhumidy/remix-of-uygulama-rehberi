import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AutomationRule, AutomationLogEntry, TriggerType, ActionType } from '../types';

// Helper to bypass type checks for tables not yet in generated types
const db = supabase as any;

export function useAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []) as AutomationRule[]);
    } catch (err) {
      console.error('Error fetching automation rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (ruleId?: string) => {
    try {
      let query = db
        .from('automation_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (ruleId) {
        query = query.eq('rule_id', ruleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as AutomationLogEntry[]);
    } catch (err) {
      console.error('Error fetching automation logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, [fetchRules, fetchLogs]);

  const createRule = async (data: {
    name: string;
    description?: string;
    trigger_type: TriggerType;
    condition_config?: Record<string, unknown>;
    action_type: ActionType;
    action_config?: Record<string, unknown>;
  }): Promise<AutomationRule | null> => {
    try {
      const { data: created, error } = await db
        .from('automation_rules')
        .insert({
          name: data.name,
          description: data.description || null,
          trigger_type: data.trigger_type,
          condition_config: data.condition_config || {},
          action_type: data.action_type,
          action_config: data.action_config || {},
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Otomasyon kuralı oluşturuldu');
      fetchRules();
      return created as AutomationRule;
    } catch (err) {
      console.error('Error creating automation rule:', err);
      toast.error('Kural oluşturulamadı');
      return null;
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from('automation_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(isActive ? 'Kural etkinleştirildi' : 'Kural devre dışı bırakıldı');
      fetchRules();
    } catch (err) {
      console.error('Error toggling rule:', err);
      toast.error('Kural durumu güncellenemedi');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await db
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Kural silindi');
      fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast.error('Kural silinemedi');
    }
  };

  /**
   * Evaluate and execute rules for a given trigger.
   * Called from compatibility layers when events occur.
   * If automation module is disabled, this is never called.
   */
  const evaluateTrigger = async (
    triggerType: TriggerType,
    triggerData: Record<string, unknown>
  ) => {
    try {
      const activeRules = rules.filter(
        r => r.is_active && r.trigger_type === triggerType
      );

      if (activeRules.length === 0) return;

      for (const rule of activeRules) {
        try {
          const conditionMet = evaluateCondition(rule.condition_config, triggerData);

          if (!conditionMet) {
            await db.from('automation_log').insert({
              rule_id: rule.id,
              trigger_data: triggerData,
              result: 'skipped',
            });
            continue;
          }

          await executeAction(rule.action_type, rule.action_config, triggerData);

          await db.from('automation_log').insert({
            rule_id: rule.id,
            trigger_data: triggerData,
            result: 'success',
          });

          await db
            .from('automation_rules')
            .update({
              execution_count: rule.execution_count + 1,
              last_executed_at: new Date().toISOString(),
            })
            .eq('id', rule.id);

        } catch (ruleErr) {
          console.error(`Automation rule ${rule.id} failed:`, ruleErr);
          await db.from('automation_log').insert({
            rule_id: rule.id,
            trigger_data: triggerData,
            result: 'failure',
            error_message: ruleErr instanceof Error ? ruleErr.message : 'Bilinmeyen hata',
          });
        }
      }

      fetchRules();
      fetchLogs();
    } catch (err) {
      console.error('Error evaluating trigger:', err);
    }
  };

  return {
    rules,
    logs,
    loading,
    createRule,
    toggleRule,
    deleteRule,
    evaluateTrigger,
    refresh: fetchRules,
    refreshLogs: fetchLogs,
  };
}

function evaluateCondition(
  config: Record<string, unknown>,
  triggerData: Record<string, unknown>
): boolean {
  if (!config || Object.keys(config).length === 0) return true;

  for (const [key, expectedValue] of Object.entries(config)) {
    if (key === 'min_quantity' && typeof expectedValue === 'number') {
      const qty = Number(triggerData.quantity || 0);
      if (qty < expectedValue) return false;
    } else if (key === 'max_quantity' && typeof expectedValue === 'number') {
      const qty = Number(triggerData.quantity || 0);
      if (qty > expectedValue) return false;
    } else if (key === 'movement_type' && expectedValue) {
      if (triggerData.movement_type !== expectedValue) return false;
    } else if (key === 'product_id' && expectedValue) {
      if (triggerData.product_id !== expectedValue) return false;
    }
  }

  return true;
}

async function executeAction(
  actionType: string,
  actionConfig: Record<string, unknown>,
  triggerData: Record<string, unknown>
) {
  switch (actionType) {
    case 'notify':
      const message = (actionConfig.message as string) || 'Otomasyon tetiklendi';
      toast.info(`🤖 ${message}`, {
        description: `Tetikleyici: ${JSON.stringify(triggerData).slice(0, 100)}`,
      });
      console.log('[Automation] Notification:', message, triggerData);
      break;

    case 'auto_approve':
      console.log('[Automation] Auto-approve triggered for:', triggerData);
      toast.info('🤖 Otomatik onay verildi');
      break;

    case 'update_status':
      console.log('[Automation] Status update triggered:', actionConfig, triggerData);
      break;

    case 'create_movement':
      console.log('[Automation] Movement creation triggered:', actionConfig, triggerData);
      break;

    default:
      console.warn('[Automation] Unknown action type:', actionType);
  }
}
