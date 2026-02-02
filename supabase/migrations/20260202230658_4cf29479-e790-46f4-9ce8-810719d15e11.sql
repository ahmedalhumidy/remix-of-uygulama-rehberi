-- Create organization table (for future multi-org support)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'GLORE',
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'TRY',
  date_format TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
  default_min_stock INTEGER NOT NULL DEFAULT 5,
  default_warning_threshold INTEGER NOT NULL DEFAULT 10,
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, setting_key)
);

-- Add soft delete columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Add soft delete columns to stock_movements
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create login_attempts table for security monitoring
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_sessions table for session control
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, error, success
  category TEXT NOT NULL DEFAULT 'system', -- system, stock, security, user
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_activity_log for timeline
CREATE TABLE public.product_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- created, updated, stock_in, stock_out, archived, restored
  performed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Authenticated users can view organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage organizations"
ON public.organizations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for system_settings
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for login_attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for product_activity_log
CREATE POLICY "Users with permission can view product activity"
ON public.product_activity_log FOR SELECT
TO authenticated
USING (has_permission(auth.uid(), 'products.view'));

CREATE POLICY "System can insert product activity"
ON public.product_activity_log FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'products.view'));

-- Insert default organization
INSERT INTO public.organizations (name, currency, date_format, timezone)
VALUES ('GLORE', 'TRY', 'DD.MM.YYYY', 'Europe/Istanbul');

-- Create trigger to update updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log product activity
CREATE OR REPLACE FUNCTION public.log_product_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_activity_log (product_id, action_type, performed_by, new_values)
    VALUES (NEW.id, 'created', auth.uid(), to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
      INSERT INTO public.product_activity_log (product_id, action_type, performed_by, old_values)
      VALUES (NEW.id, 'archived', auth.uid(), to_jsonb(OLD));
    ELSIF NEW.is_deleted = false AND OLD.is_deleted = true THEN
      INSERT INTO public.product_activity_log (product_id, action_type, performed_by, new_values)
      VALUES (NEW.id, 'restored', auth.uid(), to_jsonb(NEW));
    ELSE
      INSERT INTO public.product_activity_log (product_id, action_type, performed_by, old_values, new_values)
      VALUES (NEW.id, 'updated', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for product activity logging
CREATE TRIGGER product_activity_trigger
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_activity();

-- Add new permission for system settings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'settings.view' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_type')) THEN
    ALTER TYPE public.permission_type ADD VALUE 'settings.view';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'settings.manage' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_type')) THEN
    ALTER TYPE public.permission_type ADD VALUE 'settings.manage';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'security.view' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_type')) THEN
    ALTER TYPE public.permission_type ADD VALUE 'security.view';
  END IF;
END $$;