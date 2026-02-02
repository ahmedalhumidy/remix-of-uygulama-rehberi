-- Fix overly permissive RLS policies

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert product activity" ON public.product_activity_log;

-- Create proper policies for login_attempts (only authenticated users can log their own attempts)
CREATE POLICY "Authenticated users can insert login attempts"
ON public.login_attempts FOR INSERT
TO authenticated
WITH CHECK (email = auth.email() OR has_role(auth.uid(), 'admin'));

-- Create proper policies for notifications (admins and managers can create notifications)
CREATE POLICY "Managers can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'users.manage') OR user_id = auth.uid());

-- Create proper policies for product_activity_log
CREATE POLICY "Users with product permission can insert activity"
ON public.product_activity_log FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'products.update') OR has_permission(auth.uid(), 'products.create'));

-- Add permissions for admin and manager roles
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'settings.view'),
  ('admin', 'settings.manage'),
  ('admin', 'security.view'),
  ('manager', 'settings.view')
ON CONFLICT DO NOTHING;