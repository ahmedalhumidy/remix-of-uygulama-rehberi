
-- Custom Field Definitions: defines what custom fields exist
CREATE TABLE public.custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT 'product',
  field_key text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  default_value text,
  placeholder text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, field_key)
);

-- Custom Field Values: stores actual values per entity
CREATE TABLE public.custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT 'product',
  entity_id uuid NOT NULL,
  field_definition_id uuid NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, field_definition_id)
);

-- Enable RLS
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Definitions: everyone can read, admins can manage
CREATE POLICY "Authenticated users can view field definitions"
ON public.custom_field_definitions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage field definitions"
ON public.custom_field_definitions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Values: follow product permissions
CREATE POLICY "Users with product view can read field values"
ON public.custom_field_values FOR SELECT
USING (has_permission(auth.uid(), 'products.view'::permission_type));

CREATE POLICY "Users with product create can insert field values"
ON public.custom_field_values FOR INSERT
WITH CHECK (
  has_permission(auth.uid(), 'products.create'::permission_type)
  OR has_permission(auth.uid(), 'products.update'::permission_type)
);

CREATE POLICY "Users with product update can update field values"
ON public.custom_field_values FOR UPDATE
USING (has_permission(auth.uid(), 'products.update'::permission_type));

CREATE POLICY "Users with product delete can delete field values"
ON public.custom_field_values FOR DELETE
USING (has_permission(auth.uid(), 'products.delete'::permission_type));

-- Triggers for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at
BEFORE UPDATE ON public.custom_field_definitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
BEFORE UPDATE ON public.custom_field_values
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_custom_field_values_entity ON public.custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_definitions_entity_type ON public.custom_field_definitions(entity_type, is_active, display_order);
