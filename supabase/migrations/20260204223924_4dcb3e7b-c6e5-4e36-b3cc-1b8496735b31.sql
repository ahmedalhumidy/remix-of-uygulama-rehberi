-- Add set_quantity column to stock_movements for tracking set movements
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS set_quantity INTEGER NOT NULL DEFAULT 0;

-- Update the trigger function to handle set_stok as well
CREATE OR REPLACE FUNCTION public.update_product_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.movement_type = 'giris' THEN
    UPDATE public.products
    SET 
      mevcut_stok = mevcut_stok + NEW.quantity,
      set_stok = set_stok + COALESCE(NEW.set_quantity, 0),
      toplam_giris = toplam_giris + NEW.quantity,
      son_islem_tarihi = NEW.movement_date,
      uyari = (mevcut_stok + NEW.quantity) < min_stok,
      updated_at = now()
    WHERE id = NEW.product_id;
  ELSE
    UPDATE public.products
    SET 
      mevcut_stok = mevcut_stok - NEW.quantity,
      set_stok = GREATEST(0, set_stok - COALESCE(NEW.set_quantity, 0)),
      toplam_cikis = toplam_cikis + NEW.quantity,
      son_islem_tarihi = NEW.movement_date,
      uyari = (mevcut_stok - NEW.quantity) < min_stok,
      updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$function$;