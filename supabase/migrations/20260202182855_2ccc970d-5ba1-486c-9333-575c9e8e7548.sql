-- Add UPDATE policy - only admins can update stock movements
CREATE POLICY "Admins can update movements" 
ON public.stock_movements 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy - only admins can delete stock movements
CREATE POLICY "Admins can delete movements" 
ON public.stock_movements 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));