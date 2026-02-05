
-- Feature Flags table for enterprise module management
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  module_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read flags
CREATE POLICY "Authenticated users can view feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- Only admins can modify flags
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default modules (control_center enabled, rest disabled)
INSERT INTO public.feature_flags (module_key, module_name, description, is_enabled) VALUES
('control_center', 'Kontrol Merkezi', 'Sistem modüllerinin yönetim paneli', true),
('rbac_enhanced', 'Gelişmiş Yetkilendirme', 'Detaylı rol ve izin yönetimi sistemi', false),
('dynamic_forms', 'Dinamik Formlar', 'Özelleştirilebilir ürün formları', false),
('workflows', 'İş Akışları', 'Sipariş ve hareket durumu yönetimi', false),
('automation', 'Otomasyon', 'Otomatik tetikleyiciler ve kurallar', false),
('audit_enhanced', 'Gelişmiş Denetim', 'Detaylı denetim günlüğü ve izleme', false),
('offline_enhanced', 'Gelişmiş Çevrimdışı', 'Gelişmiş çevrimdışı senkronizasyon', false);
