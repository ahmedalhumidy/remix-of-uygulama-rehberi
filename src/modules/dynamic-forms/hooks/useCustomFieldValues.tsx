import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CustomFieldValuesMap } from '../types';
import type { Json } from '@/integrations/supabase/types';

export function useCustomFieldValues(entityType: string, entityId: string | null) {
  const [values, setValues] = useState<CustomFieldValuesMap>({});
  const [loading, setLoading] = useState(false);

  const fetchValues = useCallback(async () => {
    if (!entityId) {
      setValues({});
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;

      const map: CustomFieldValuesMap = {};
      (data || []).forEach(v => {
        map[v.field_definition_id] = v.value;
      });
      setValues(map);
    } catch (err) {
      console.warn('[DynamicForms] Could not fetch field values:', err);
      setValues({});
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  const saveValues = useCallback(async (
    targetEntityId: string,
    fieldValues: CustomFieldValuesMap
  ): Promise<boolean> => {
    try {
      // Upsert each field value
      const upserts = Object.entries(fieldValues).map(([fieldDefId, value]) => ({
        entity_type: entityType,
        entity_id: targetEntityId,
        field_definition_id: fieldDefId,
        value: value as Json,
      }));

      if (upserts.length === 0) return true;

      const { error } = await supabase
        .from('custom_field_values')
        .upsert(upserts, {
          onConflict: 'entity_id,field_definition_id',
        });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('[DynamicForms] Save values error:', err);
      return false;
    }
  }, [entityType]);

  return {
    values,
    setValues,
    loading,
    saveValues,
    refreshValues: fetchValues,
  };
}
