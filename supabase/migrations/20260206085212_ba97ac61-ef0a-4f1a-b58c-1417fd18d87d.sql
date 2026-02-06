-- Drop the existing check constraint that requires quantity > 0
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_quantity_check;

-- Add a new check constraint that allows quantity = 0 if set_quantity > 0
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_quantity_check 
  CHECK (quantity >= 0 AND (quantity > 0 OR set_quantity > 0));