-- Drop existing SELECT policies and recreate with explicit authentication
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.stock_movements;

-- Recreate SELECT policy for products - explicitly require authenticated role
CREATE POLICY "Authenticated users can view products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

-- Recreate SELECT policy for stock_movements - explicitly require authenticated role
CREATE POLICY "Authenticated users can view movements" 
ON public.stock_movements 
FOR SELECT 
TO authenticated
USING (true);