
-- =====================================================
-- المرحلة 1B: إنشاء الجداول والسياسات
-- =====================================================

-- 1. إضافة أعمدة جديدة لجدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'customer';

-- 2. إنشاء جدول المتاجر (stores)
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  store_name text NOT NULL,
  store_slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  contact_email text,
  contact_phone text,
  address text,
  city text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  commission_rate decimal(5,2) DEFAULT 10.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. إضافة أعمدة جديدة لجدول products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price decimal(10,2),
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS product_description text,
ADD COLUMN IF NOT EXISTS weight decimal(10,2) DEFAULT 0;

-- 4. إنشاء جدول العناوين (addresses)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text DEFAULT 'home',
  full_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  district text,
  street_address text NOT NULL,
  postal_code text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. إنشاء جدول شركات الشحن (shipping_carriers)
CREATE TABLE IF NOT EXISTS public.shipping_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  tracking_url_template text,
  is_active boolean DEFAULT true,
  base_fee decimal(10,2) DEFAULT 0,
  per_kg_fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. إنشاء جدول مناطق الشحن (shipping_zones)
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid REFERENCES public.shipping_carriers(id) ON DELETE CASCADE,
  city text NOT NULL,
  delivery_days integer DEFAULT 3,
  fee_override decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- 7. إنشاء جدول الطلبات (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT '',
  customer_id uuid NOT NULL,
  shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal decimal(10,2) DEFAULT 0,
  shipping_fee decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) DEFAULT 0,
  payment_method text CHECK (payment_method IN ('card', 'bank_transfer', 'cod')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_method text DEFAULT 'courier' CHECK (shipping_method IN ('courier', 'pickup')),
  carrier_id uuid REFERENCES public.shipping_carriers(id) ON DELETE SET NULL,
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. إنشاء جدول تفاصيل الطلب (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- 9. إنشاء جدول سلة التسوق (cart_items)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 10. إنشاء جدول المفضلة (wishlist)
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 11. إنشاء جدول المدفوعات (payments)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('card', 'bank_transfer', 'cod')),
  amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 12. إنشاء جدول التقييمات (reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- تفعيل RLS على جميع الجداول الجديدة
-- =====================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- سياسات RLS للمتاجر (stores)
-- =====================================================

CREATE POLICY "Anyone can view active stores"
ON public.stores FOR SELECT
USING (is_active = true);

CREATE POLICY "Merchants can manage their own stores"
ON public.stores FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all stores"
ON public.stores FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- سياسات RLS للعناوين (addresses)
-- =====================================================

CREATE POLICY "Users can manage their own addresses"
ON public.addresses FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all addresses"
ON public.addresses FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- سياسات RLS لشركات الشحن (shipping_carriers)
-- =====================================================

CREATE POLICY "Anyone can view active carriers"
ON public.shipping_carriers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage carriers"
ON public.shipping_carriers FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- سياسات RLS لمناطق الشحن (shipping_zones)
-- =====================================================

CREATE POLICY "Anyone can view shipping zones"
ON public.shipping_zones FOR SELECT
USING (true);

CREATE POLICY "Admins can manage shipping zones"
ON public.shipping_zones FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- سياسات RLS للطلبات (orders)
-- =====================================================

CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "Customers can create orders"
ON public.orders FOR INSERT
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Merchants can view orders with their products"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.stores s ON oi.store_id = s.id
    WHERE oi.order_id = orders.id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage all orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'staff'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- =====================================================
-- سياسات RLS لتفاصيل الطلب (order_items)
-- =====================================================

CREATE POLICY "Customers can view their order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
  )
);

CREATE POLICY "Merchants can view their order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = order_items.store_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update their order items"
ON public.order_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = order_items.store_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all order items"
ON public.order_items FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- سياسات RLS لسلة التسوق (cart_items)
-- =====================================================

CREATE POLICY "Users can manage their own cart"
ON public.cart_items FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- سياسات RLS للمفضلة (wishlist)
-- =====================================================

CREATE POLICY "Users can manage their own wishlist"
ON public.wishlist FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- سياسات RLS للمدفوعات (payments)
-- =====================================================

CREATE POLICY "Customers can view their payments"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- سياسات RLS للتقييمات (reviews)
-- =====================================================

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Users can create their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
ON public.reviews FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- إضافة صلاحيات للأدوار الجديدة
-- =====================================================

INSERT INTO public.role_permissions (role, permission) VALUES
('merchant', 'products.view'),
('merchant', 'products.create'),
('merchant', 'products.update'),
('merchant', 'stock_movements.view'),
('merchant', 'stock_movements.create'),
('merchant', 'reports.view'),
('customer', 'products.view')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Triggers للتحديث التلقائي
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_shipping_carriers_updated_at
  BEFORE UPDATE ON public.shipping_carriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

-- =====================================================
-- إضافة بيانات أولية لشركات الشحن التركية
-- =====================================================

INSERT INTO public.shipping_carriers (name, tracking_url_template, base_fee, per_kg_fee) VALUES
('Yurtiçi Kargo', 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={tracking}', 45.00, 5.00),
('Aras Kargo', 'https://www.araskargo.com.tr/trs/tuiKargoTakip.aspx?kargo_takip_no={tracking}', 40.00, 4.50),
('MNG Kargo', 'https://www.mngkargo.com.tr/gonderi-takip/?code={tracking}', 42.00, 4.75),
('PTT Kargo', 'https://gonderitakip.ptt.gov.tr/?barkod={tracking}', 35.00, 4.00),
('Sürat Kargo', 'https://www.suratkargo.com.tr/gonderi-takip?barkod={tracking}', 38.00, 4.25)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Function لتوليد رقم الطلب
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  prefix text := 'GL';
  current_date_str text := to_char(now(), 'YYMMDD');
  random_suffix text := lpad(floor(random() * 10000)::text, 4, '0');
BEGIN
  new_number := prefix || current_date_str || random_suffix;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();
