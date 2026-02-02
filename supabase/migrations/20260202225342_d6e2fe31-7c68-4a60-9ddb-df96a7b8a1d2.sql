-- Insert reports permission for admin and manager
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'reports.view'),
  ('manager', 'reports.view')
ON CONFLICT (role, permission) DO NOTHING;