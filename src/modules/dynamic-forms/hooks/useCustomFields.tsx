import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CustomFieldDefinition, CustomFieldType } from '../types';

export function useCustomFields(entityType: string = 'product') {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const mapped: CustomFieldDefinition[] = (data || []).map(d => ({
        ...d,
        field_type: d.field_type as CustomFieldType,
        options: Array.isArray(d.options) ? (d.options as string[]) : [],
      }));

      setFields(mapped);
    } catch (err) {
      console.warn('[DynamicForms] Could not fetch field definitions:', err);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const addField = useCallback(async (field: Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert({
          entity_type: field.entity_type,
          field_key: field.field_key,
          field_label: field.field_label,
          field_type: field.field_type,
          options: field.options as unknown as import('@/integrations/supabase/types').Json,
          is_required: field.is_required,
          default_value: field.default_value,
          placeholder: field.placeholder,
          display_order: field.display_order,
          is_active: field.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      const newField: CustomFieldDefinition = {
        ...data,
        field_type: data.field_type as CustomFieldType,
        options: Array.isArray(data.options) ? (data.options as string[]) : [],
      };

      setFields(prev => [...prev, newField].sort((a, b) => a.display_order - b.display_order));
      toast.success('Alan eklendi');
      return newField;
    } catch (err) {
      console.error('[DynamicForms] Add field error:', err);
      toast.error('Alan eklenirken hata oluştu');
      return null;
    }
  }, []);

  const updateField = useCallback(async (id: string, updates: Partial<CustomFieldDefinition>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.field_label !== undefined) updateData.field_label = updates.field_label;
      if (updates.field_type !== undefined) updateData.field_type = updates.field_type;
      if (updates.options !== undefined) updateData.options = updates.options as unknown as import('@/integrations/supabase/types').Json;
      if (updates.is_required !== undefined) updateData.is_required = updates.is_required;
      if (updates.default_value !== undefined) updateData.default_value = updates.default_value;
      if (updates.placeholder !== undefined) updateData.placeholder = updates.placeholder;
      if (updates.display_order !== undefined) updateData.display_order = updates.display_order;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { error } = await supabase
        .from('custom_field_definitions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setFields(prev =>
        prev.map(f => (f.id === id ? { ...f, ...updates } : f))
          .sort((a, b) => a.display_order - b.display_order)
      );
      toast.success('Alan güncellendi');
      return true;
    } catch (err) {
      console.error('[DynamicForms] Update field error:', err);
      toast.error('Alan güncellenirken hata oluştu');
      return false;
    }
  }, []);

  const deleteField = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFields(prev => prev.filter(f => f.id !== id));
      toast.success('Alan silindi');
      return true;
    } catch (err) {
      console.error('[DynamicForms] Delete field error:', err);
      toast.error('Alan silinirken hata oluştu');
      return false;
    }
  }, []);

  const fetchAllFields = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('entity_type', entityType)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        ...d,
        field_type: d.field_type as CustomFieldType,
        options: Array.isArray(d.options) ? (d.options as string[]) : [],
      })) as CustomFieldDefinition[];
    } catch (err) {
      console.warn('[DynamicForms] Could not fetch all fields:', err);
      return [];
    }
  }, [entityType]);

  return {
    fields,
    loading,
    addField,
    updateField,
    deleteField,
    refreshFields: fetchFields,
    fetchAllFields,
  };
}
