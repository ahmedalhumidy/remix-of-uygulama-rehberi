import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WorkflowDefinition, WorkflowStep, WorkflowTransition } from '../types';

// Helper to bypass type checks for tables not yet in generated types
const db = supabase as any;

export function useWorkflowDefinitions() {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('workflow_definitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched: WorkflowDefinition[] = [];
      for (const def of data || []) {
        const { data: steps } = await db
          .from('workflow_steps')
          .select('*')
          .eq('workflow_id', def.id)
          .order('step_order', { ascending: true });

        const { data: transitions } = await db
          .from('workflow_transitions')
          .select('*')
          .eq('workflow_id', def.id);

        enriched.push({
          ...def,
          steps: (steps || []) as WorkflowStep[],
          transitions: (transitions || []) as WorkflowTransition[],
        });
      }

      setDefinitions(enriched);
    } catch (err) {
      console.error('Error fetching workflow definitions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  const createDefinition = async (data: {
    name: string;
    description?: string;
    entity_type: string;
  }): Promise<WorkflowDefinition | null> => {
    try {
      const { data: created, error } = await db
        .from('workflow_definitions')
        .insert({
          name: data.name,
          description: data.description || null,
          entity_type: data.entity_type,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('İş akışı oluşturuldu');
      fetchDefinitions();
      return created as WorkflowDefinition;
    } catch (err) {
      console.error('Error creating workflow:', err);
      toast.error('İş akışı oluşturulamadı');
      return null;
    }
  };

  const toggleDefinition = async (id: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from('workflow_definitions')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(isActive ? 'İş akışı etkinleştirildi' : 'İş akışı devre dışı bırakıldı');
      fetchDefinitions();
    } catch (err) {
      console.error('Error toggling workflow:', err);
      toast.error('İş akışı durumu güncellenemedi');
    }
  };

  const deleteDefinition = async (id: string) => {
    try {
      const { error } = await db
        .from('workflow_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('İş akışı silindi');
      fetchDefinitions();
    } catch (err) {
      console.error('Error deleting workflow:', err);
      toast.error('İş akışı silinemedi');
    }
  };

  const addStep = async (workflowId: string, step: {
    name: string;
    step_order: number;
    is_initial?: boolean;
    is_final?: boolean;
    requires_approval?: boolean;
    approval_role?: string;
    color?: string;
  }) => {
    try {
      const { error } = await db
        .from('workflow_steps')
        .insert({
          workflow_id: workflowId,
          name: step.name,
          step_order: step.step_order,
          is_initial: step.is_initial || false,
          is_final: step.is_final || false,
          requires_approval: step.requires_approval || false,
          approval_role: step.approval_role || null,
          color: step.color || '#6366f1',
        });

      if (error) throw error;
      toast.success('Adım eklendi');
      fetchDefinitions();
    } catch (err) {
      console.error('Error adding step:', err);
      toast.error('Adım eklenemedi');
    }
  };

  const deleteStep = async (stepId: string) => {
    try {
      const { error } = await db
        .from('workflow_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
      toast.success('Adım silindi');
      fetchDefinitions();
    } catch (err) {
      console.error('Error deleting step:', err);
      toast.error('Adım silinemedi');
    }
  };

  const addTransition = async (workflowId: string, transition: {
    from_step_id: string;
    to_step_id: string;
    condition_label?: string;
  }) => {
    try {
      const { error } = await db
        .from('workflow_transitions')
        .insert({
          workflow_id: workflowId,
          from_step_id: transition.from_step_id,
          to_step_id: transition.to_step_id,
          condition_label: transition.condition_label || null,
        });

      if (error) throw error;
      toast.success('Geçiş eklendi');
      fetchDefinitions();
    } catch (err) {
      console.error('Error adding transition:', err);
      toast.error('Geçiş eklenemedi');
    }
  };

  const deleteTransition = async (transitionId: string) => {
    try {
      const { error } = await db
        .from('workflow_transitions')
        .delete()
        .eq('id', transitionId);

      if (error) throw error;
      toast.success('Geçiş silindi');
      fetchDefinitions();
    } catch (err) {
      console.error('Error deleting transition:', err);
      toast.error('Geçiş silinemedi');
    }
  };

  return {
    definitions,
    loading,
    createDefinition,
    toggleDefinition,
    deleteDefinition,
    addStep,
    deleteStep,
    addTransition,
    deleteTransition,
    refresh: fetchDefinitions,
  };
}
