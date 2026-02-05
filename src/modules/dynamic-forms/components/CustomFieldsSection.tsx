import { useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useCustomFields } from '../hooks/useCustomFields';
import { useCustomFieldValues } from '../hooks/useCustomFieldValues';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import type { CustomFieldValuesMap } from '../types';
import { Separator } from '@/components/ui/separator';

interface CustomFieldsSectionProps {
  entityId: string | null; // null for new entities
  entityType?: string;
  onValuesChange?: (values: CustomFieldValuesMap) => void;
  /** Exposed ref-like for parent to call saveValues */
  valuesRef?: React.MutableRefObject<{
    values: CustomFieldValuesMap;
    save: (entityId: string) => Promise<boolean>;
  } | null>;
}

export function CustomFieldsSection({
  entityId,
  entityType = 'product',
  onValuesChange,
  valuesRef,
}: CustomFieldsSectionProps) {
  const { isModuleEnabled } = useFeatureFlags();
  const { fields, loading: fieldsLoading } = useCustomFields(entityType);
  const { values, setValues, loading: valuesLoading, saveValues } = useCustomFieldValues(entityType, entityId);

  // Don't render if module is disabled or no fields defined
  if (!isModuleEnabled('dynamic_forms') || fields.length === 0) {
    // Expose empty save function
    if (valuesRef) {
      valuesRef.current = {
        values: {},
        save: async () => true,
      };
    }
    return null;
  }

  // Expose save function to parent
  if (valuesRef) {
    valuesRef.current = {
      values,
      save: (targetId: string) => saveValues(targetId, values),
    };
  }

  const handleChange = (fieldDefId: string, value: unknown) => {
    const newValues = { ...values, [fieldDefId]: value };
    setValues(newValues);
    onValuesChange?.(newValues);
  };

  if (fieldsLoading || valuesLoading) {
    return (
      <div className="py-2">
        <div className="animate-pulse h-8 bg-muted rounded w-1/3 mb-2" />
        <div className="animate-pulse h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Separator />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Özel Alanlar
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(field => (
          <CustomFieldRenderer
            key={field.id}
            field={field}
            value={values[field.id] ?? field.default_value ?? (field.field_type === 'checkbox' ? false : '')}
            onChange={(val) => handleChange(field.id, val)}
          />
        ))}
      </div>
    </div>
  );
}
