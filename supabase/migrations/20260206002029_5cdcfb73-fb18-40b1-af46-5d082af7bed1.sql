
-- =====================================================
-- STORE MODULE: New Tables (Additive, No Breaking Changes)
-- =====================================================

-- 1. Promotion Rules (coupons, cart discounts, BOGO, category discounts)
CREATE TABLE public.promotion_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL DEFAULT 'coupon',
  code TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  store_id UUID REFERENCES public.stores(id),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_promotion_code ON public.promotion_rules(code) WHERE code IS NOT NULL;
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions" ON public.promotion_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all promotions" ON public.promotion_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Merchants can manage their store promotions" ON public.promotion_rules
  FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- 2. Product Media (videos, extra images beyond JSONB)
CREATE TABLE public.product_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product media" ON public.product_media
  FOR SELECT USING (true);

CREATE POLICY "Product managers can manage media" ON public.product_media
  FOR ALL USING (has_permission(auth.uid(), 'products.update'::permission_type))
  WITH CHECK (has_permission(auth.uid(), 'products.update'::permission_type));

-- 3. Review Votes (helpful / not helpful)
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL DEFAULT 'helpful',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own votes" ON public.review_votes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view review votes" ON public.review_votes
  FOR SELECT USING (true);

-- 4. Order Notes (customer + internal staff notes)
CREATE TABLE public.order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their non-internal notes" ON public.order_notes
  FOR SELECT USING (
    NOT is_internal AND EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_notes.order_id AND customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all order notes" ON public.order_notes
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "Customers can add notes to their orders" ON public.order_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND NOT is_internal AND EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_notes.order_id AND customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can add any notes" ON public.order_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'manager'::app_role) OR 
      has_role(auth.uid(), 'staff'::app_role)
    )
  );

-- 5. Insert store_module feature flag
INSERT INTO public.feature_flags (module_key, module_name, description, is_enabled, config)
SELECT 'store_module', 'Mağaza Modülü', 'Profesyonel e-ticaret mağaza arayüzü, akıllı satış özellikleri ve mağaza yönetim merkezi', false, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE module_key = 'store_module');
