-- Fix 1: Drop overly permissive policies on products table
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;

-- Create proper role-based policies for products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Drop overly permissive policy on stock_movements
DROP POLICY IF EXISTS "Authenticated users can insert movements" ON public.stock_movements;

-- Create proper policy - authenticated users can insert their own movements
CREATE POLICY "Authenticated users can insert their own movements" 
ON public.stock_movements 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Fix 3: Add missing policies for user_roles table (only admins can manage)
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));