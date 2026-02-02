-- Add is_disabled column to profiles for soft blocking users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

-- Add last_sign_in column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_sign_in timestamp with time zone;

-- Create audit_logs table for tracking all admin actions
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type text NOT NULL, -- 'role_change', 'user_disable', 'user_enable', 'user_invite', 'product_create', 'product_update', 'product_delete', 'stock_movement'
  performed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  target_user_id uuid, -- for user-related actions
  target_product_id uuid, -- for product-related actions
  details jsonb, -- additional details about the action
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log user sign in and update last_sign_in
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_sign_in = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create index for faster audit log queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_performed_by ON public.audit_logs(performed_by);