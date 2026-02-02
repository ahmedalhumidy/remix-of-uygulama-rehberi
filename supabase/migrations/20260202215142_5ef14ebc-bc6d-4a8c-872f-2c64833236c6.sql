-- Fix user deletion in auth by removing FK to auth.users and referencing profiles instead
ALTER TABLE public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_created_by_fkey;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;