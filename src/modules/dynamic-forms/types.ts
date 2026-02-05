export const MODULE_KEY = 'dynamic_forms' as const;

export type CustomFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date';

export interface CustomFieldDefinition {
  id: string;
  entity_type: string;
  field_key: string;
  field_label: string;
  field_type: CustomFieldType;
  options: string[]; // for select type
  is_required: boolean;
  default_value: string | null;
  placeholder: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  entity_type: string;
  entity_id: string;
  field_definition_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

// Map of field_definition_id -> value for easy form usage
export type CustomFieldValuesMap = Record<string, unknown>;

export const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Metin',
  number: 'Sayı',
  select: 'Seçim Listesi',
  checkbox: 'Onay Kutusu',
  textarea: 'Uzun Metin',
  date: 'Tarih',
};
