-- Fix: role_permissions table should only be readable by authenticated users
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view role permissions" 
ON public.role_permissions 
FOR SELECT 
TO authenticated
USING (true);