-- Create shelves table for location management
CREATE TABLE public.shelves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

-- RLS policies for shelves
CREATE POLICY "Authenticated users can view shelves" ON public.shelves FOR SELECT USING (true);
CREATE POLICY "Users with permission can insert shelves" ON public.shelves FOR INSERT WITH CHECK (has_permission(auth.uid(), 'products.create'::permission_type));
CREATE POLICY "Users with permission can update shelves" ON public.shelves FOR UPDATE USING (has_permission(auth.uid(), 'products.update'::permission_type));
CREATE POLICY "Users with permission can delete shelves" ON public.shelves FOR DELETE USING (has_permission(auth.uid(), 'products.delete'::permission_type));

-- Add set_stok column to products table
ALTER TABLE public.products ADD COLUMN set_stok INTEGER NOT NULL DEFAULT 0;

-- Add shelf_id column to stock_movements for tracking which shelf the movement was from/to
ALTER TABLE public.stock_movements ADD COLUMN shelf_id UUID REFERENCES public.shelves(id);

-- Create trigger for updated_at on shelves
CREATE TRIGGER update_shelves_updated_at
BEFORE UPDATE ON public.shelves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing unique shelf locations from products into shelves table
INSERT INTO public.shelves (name)
SELECT DISTINCT raf_konum FROM public.products WHERE raf_konum IS NOT NULL AND raf_konum != ''
ON CONFLICT (name) DO NOTHING;