-- Drop the old policy that allows all authenticated users to insert
DROP POLICY IF EXISTS "Authenticated users can insert their own movements" ON public.stock_movements;

-- Create new policy that only allows admins to insert movements
CREATE POLICY "Admins can insert movements"
ON public.stock_movements
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));