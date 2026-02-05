
-- =====================================================
-- المرحلة 1A: إضافة الأدوار الجديدة للـ enum
-- =====================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'merchant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
