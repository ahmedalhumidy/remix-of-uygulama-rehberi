import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WorkflowInstance, WorkflowStep, WorkflowTransition } from '../types';

// Helper to bypass type checks for tables not yet in generated types
const db = supabase as any;

/**
 * Workflow Engine: manages workflow instances and transitions.
 * If no active workflow exists for an entity type, operations pass through unchanged.
 */
export function useWorkflowEngine() {
  const [processing, setProcessing] = useState(false);

  const getActiveWorkflow = useCallback(async (entityType: string) => {
    try {
      const { data, error } = await db
        .from('workflow_definitions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking active workflow:', err);
      return null;
    }
  }, []);

  const startWorkflow = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<WorkflowInstance | null> => {
    setProcessing(true);
    try {
      const workflow = await getActiveWorkflow(entityType);
      if (!workflow) return null;

      const { data: steps, error: stepsError } = await db
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflow.id)
        .eq('is_initial', true)
        .limit(1)
        .maybeSingle();

      if (stepsError || !steps) {
        console.warn('No initial step found for workflow:', workflow.id);
        return null;
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      const { data: instance, error } = await db
        .from('workflow_instances')
        .insert({
          workflow_id: workflow.id,
          entity_type: entityType,
          entity_id: entityId,
          current_step_id: steps.id,
          status: 'active',
          started_by: userId || null,
        })
        .select()
        .single();

      if (error) throw error;

      await db.from('workflow_instance_history').insert({
        instance_id: instance.id,
        to_step_id: steps.id,
        action: 'transition',
        performed_by: userId || null,
        note: 'İş akışı başlatıldı',
      });

      return {
        ...instance,
        current_step: steps as WorkflowStep,
      } as WorkflowInstance;
    } catch (err) {
      console.error('Error starting workflow:', err);
      toast.error('İş akışı başlatılamadı');
      return null;
    } finally {
      setProcessing(false);
    }
  }, [getActiveWorkflow]);

  const getEntityInstance = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<WorkflowInstance | null> => {
    try {
      const { data, error } = await db
        .from('workflow_instances')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch the current step separately
      const { data: stepData } = await db
        .from('workflow_steps')
        .select('*')
        .eq('id', data.current_step_id)
        .single();

      return {
        ...data,
        current_step: stepData as WorkflowStep,
      } as WorkflowInstance;
    } catch (err) {
      console.error('Error getting entity instance:', err);
      return null;
    }
  }, []);

  const getAvailableTransitions = useCallback(async (
    workflowId: string,
    currentStepId: string
  ): Promise<(WorkflowTransition & { to_step: WorkflowStep })[]> => {
    try {
      const { data: transitions, error } = await db
        .from('workflow_transitions')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('from_step_id', currentStepId);

      if (error) throw error;
      if (!transitions?.length) return [];

      const toStepIds = transitions.map((t: any) => t.to_step_id);
      const { data: steps } = await db
        .from('workflow_steps')
        .select('*')
        .in('id', toStepIds);

      return transitions.map((t: any) => ({
        ...t,
        to_step: (steps || []).find((s: any) => s.id === t.to_step_id) as WorkflowStep,
      }));
    } catch (err) {
      console.error('Error getting available transitions:', err);
      return [];
    }
  }, []);

  const performTransition = useCallback(async (
    instanceId: string,
    transitionId: string,
    note?: string
  ): Promise<boolean> => {
    setProcessing(true);
    try {
      const { data: instance, error: instErr } = await db
        .from('workflow_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (instErr || !instance) throw instErr || new Error('Instance not found');

      const { data: transition, error: transErr } = await db
        .from('workflow_transitions')
        .select('*')
        .eq('id', transitionId)
        .single();

      if (transErr || !transition) throw transErr || new Error('Transition not found');

      if (transition.from_step_id !== instance.current_step_id) {
        toast.error('Geçersiz geçiş: mevcut adım uyuşmuyor');
        return false;
      }

      const { data: targetStep } = await db
        .from('workflow_steps')
        .select('*')
        .eq('id', transition.to_step_id)
        .single();

      if (targetStep?.requires_approval && targetStep.approval_role) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user.id;
        if (userId) {
          const { data: hasRole } = await supabase.rpc('has_role', {
            _user_id: userId,
            _role: targetStep.approval_role as any,
          });
          if (!hasRole) {
            toast.error(`Bu adım için "${targetStep.approval_role}" rolü gereklidir`);
            return false;
          }
        }
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      const newStatus = targetStep?.is_final ? 'completed' : 'active';
      const { error: updateErr } = await db
        .from('workflow_instances')
        .update({
          current_step_id: transition.to_step_id,
          status: newStatus,
        })
        .eq('id', instanceId);

      if (updateErr) throw updateErr;

      await db.from('workflow_instance_history').insert({
        instance_id: instanceId,
        from_step_id: instance.current_step_id,
        to_step_id: transition.to_step_id,
        action: targetStep?.requires_approval ? 'approve' : 'transition',
        performed_by: userId || null,
        note: note || null,
      });

      toast.success(`Durum güncellendi: ${targetStep?.name || 'Bilinmeyen'}`);
      return true;
    } catch (err) {
      console.error('Error performing transition:', err);
      toast.error('Geçiş gerçekleştirilemedi');
      return false;
    } finally {
      setProcessing(false);
    }
  }, []);

  const requiresApproval = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<boolean> => {
    const instance = await getEntityInstance(entityType, entityId);
    if (!instance?.current_step) return false;
    return instance.current_step.requires_approval;
  }, [getEntityInstance]);

  return {
    processing,
    getActiveWorkflow,
    startWorkflow,
    getEntityInstance,
    getAvailableTransitions,
    performTransition,
    requiresApproval,
  };
}
