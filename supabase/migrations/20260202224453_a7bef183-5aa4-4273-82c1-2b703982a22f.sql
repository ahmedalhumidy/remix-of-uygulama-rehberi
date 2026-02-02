-- Step 2: Create permissions enum
CREATE TYPE public.permission_type AS ENUM (
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'stock_movements.view',
  'stock_movements.create',
  'users.view',
  'users.manage',
  'logs.view'
);

-- Step 3: Create role_permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission permission_type NOT NULL,
  UNIQUE(role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read role_permissions (needed for permission checks)
CREATE POLICY "Anyone can view role permissions"
ON public.role_permissions FOR SELECT
USING (true);

-- Step 4: Insert default permissions for each role

-- Admin: full access
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'products.view'),
  ('admin', 'products.create'),
  ('admin', 'products.update'),
  ('admin', 'products.delete'),
  ('admin', 'stock_movements.view'),
  ('admin', 'stock_movements.create'),
  ('admin', 'users.view'),
  ('admin', 'users.manage'),
  ('admin', 'logs.view');

-- Manager: manage products, create stock movements, view logs
INSERT INTO public.role_permissions (role, permission) VALUES
  ('manager', 'products.view'),
  ('manager', 'products.create'),
  ('manager', 'products.update'),
  ('manager', 'products.delete'),
  ('manager', 'stock_movements.view'),
  ('manager', 'stock_movements.create'),
  ('manager', 'logs.view');

-- Staff: create stock movements only
INSERT INTO public.role_permissions (role, permission) VALUES
  ('staff', 'products.view'),
  ('staff', 'stock_movements.view'),
  ('staff', 'stock_movements.create');

-- Viewer: read-only access
INSERT INTO public.role_permissions (role, permission) VALUES
  ('viewer', 'products.view'),
  ('viewer', 'stock_movements.view');

-- Step 5: Create helper function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission permission_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;

-- Step 6: Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Step 7: Update RLS policies for products table
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Users with permission can insert products"
ON public.products FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'products.create'));

CREATE POLICY "Users with permission can update products"
ON public.products FOR UPDATE
USING (has_permission(auth.uid(), 'products.update'));

CREATE POLICY "Users with permission can delete products"
ON public.products FOR DELETE
USING (has_permission(auth.uid(), 'products.delete'));

-- Step 8: Update RLS policies for stock_movements table
DROP POLICY IF EXISTS "Admins can insert movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admins can update movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admins can delete movements" ON public.stock_movements;

CREATE POLICY "Users with permission can insert movements"
ON public.stock_movements FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'stock_movements.create'));

CREATE POLICY "Users with permission can update movements"
ON public.stock_movements FOR UPDATE
USING (has_permission(auth.uid(), 'stock_movements.create'));

CREATE POLICY "Users with permission can delete movements"
ON public.stock_movements FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Step 9: Update RLS policies for user_roles table
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

CREATE POLICY "Users with permission can view all user roles"
ON public.user_roles FOR SELECT
USING (has_permission(auth.uid(), 'users.view') OR auth.uid() = user_id);

CREATE POLICY "Users with permission can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'users.manage'));

CREATE POLICY "Users with permission can update user roles"
ON public.user_roles FOR UPDATE
USING (has_permission(auth.uid(), 'users.manage'));

CREATE POLICY "Users with permission can delete user roles"
ON public.user_roles FOR DELETE
USING (has_permission(auth.uid(), 'users.manage'));

-- Step 10: Update RLS policies for profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users with permission can view all profiles"
ON public.profiles FOR SELECT
USING (has_permission(auth.uid(), 'users.view') OR auth.uid() = user_id);

CREATE POLICY "Users with permission can delete profiles"
ON public.profiles FOR DELETE
USING (has_permission(auth.uid(), 'users.manage'));

-- Step 11: Update RLS policies for audit_logs table
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users with permission can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_permission(auth.uid(), 'logs.view'));

CREATE POLICY "Users with permission can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'logs.view'));

-- Update existing 'employee' roles to 'staff'
UPDATE public.user_roles SET role = 'staff' WHERE role = 'employee';