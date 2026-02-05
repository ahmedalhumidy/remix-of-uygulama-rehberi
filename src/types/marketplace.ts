 // =====================================================
 // Types for GLORE Marketplace
 // =====================================================
 
 export type UserType = 'admin' | 'merchant' | 'customer' | 'staff';
 export type AppRole = 'admin' | 'manager' | 'staff' | 'viewer' | 'merchant' | 'customer';
 
 export interface Store {
   id: string;
   owner_id: string;
   store_name: string;
   store_slug: string;
   logo_url?: string;
   description?: string;
   contact_email?: string;
   contact_phone?: string;
   address?: string;
   city?: string;
   is_verified: boolean;
   is_active: boolean;
   commission_rate: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface Address {
   id: string;
   user_id: string;
   label: string;
   full_name: string;
   phone: string;
   city: string;
   district?: string;
   street_address: string;
   postal_code?: string;
   is_default: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface ShippingCarrier {
   id: string;
   name: string;
   logo_url?: string;
   tracking_url_template?: string;
   is_active: boolean;
   base_fee: number;
   per_kg_fee: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface ShippingZone {
   id: string;
   carrier_id: string;
   city: string;
   delivery_days: number;
   fee_override?: number;
   created_at: string;
 }
 
 export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
 export type PaymentMethod = 'card' | 'bank_transfer' | 'cod';
 export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
 export type ShippingMethod = 'courier' | 'pickup';
 
 export interface Order {
   id: string;
   order_number: string;
   customer_id: string;
   shipping_address_id?: string;
   status: OrderStatus;
   subtotal: number;
   shipping_fee: number;
   total_amount: number;
   payment_method?: PaymentMethod;
   payment_status: PaymentStatus;
   shipping_method: ShippingMethod;
   carrier_id?: string;
   tracking_number?: string;
   notes?: string;
   created_at: string;
   updated_at: string;
   // Relations
   shipping_address?: Address;
   carrier?: ShippingCarrier;
   items?: OrderItem[];
 }
 
 export interface OrderItem {
   id: string;
   order_id: string;
   product_id?: string;
   store_id?: string;
   quantity: number;
   unit_price: number;
   total_price: number;
   status: string;
   created_at: string;
   // Relations
   product?: MarketplaceProduct;
   store?: Store;
 }
 
 export interface CartItem {
   id: string;
   user_id: string;
   product_id: string;
   quantity: number;
   created_at: string;
   updated_at: string;
   // Relations
   product?: MarketplaceProduct;
 }
 
 export interface WishlistItem {
   id: string;
   user_id: string;
   product_id: string;
   created_at: string;
   // Relations
   product?: MarketplaceProduct;
 }
 
 export interface Payment {
   id: string;
   order_id: string;
   method: PaymentMethod;
   amount: number;
   status: PaymentStatus;
   transaction_id?: string;
   receipt_url?: string;
   notes?: string;
   created_at: string;
   updated_at: string;
 }
 
 export interface Review {
   id: string;
   product_id: string;
   customer_id: string;
   order_id?: string;
   rating: number;
   comment?: string;
   is_verified_purchase: boolean;
   is_approved: boolean;
   created_at: string;
   updated_at: string;
 }
 
 // Extended Product type for marketplace
 export interface MarketplaceProduct {
   id: string;
   urun_kodu: string;
   urun_adi: string;
   barkod?: string;
   raf_konum: string;
   acilis_stok: number;
   mevcut_stok: number;
   min_stok: number;
   set_stok: number;
   toplam_giris: number;
   toplam_cikis: number;
   uyari: boolean;
   notes?: string;
   son_islem_tarihi?: string;
   is_deleted: boolean;
   created_at: string;
   updated_at: string;
   // Marketplace fields
   store_id?: string;
   price: number;
   sale_price?: number;
   is_published: boolean;
   images: string[];
   category?: string;
   product_description?: string;
   weight: number;
   // Relations
   store?: Store;
   reviews?: Review[];
 }
 
 // Customer Profile
 export interface CustomerProfile {
   id: string;
   user_id: string;
   full_name: string;
   phone?: string;
   avatar_url?: string;
   user_type: UserType;
   is_disabled: boolean;
   last_sign_in?: string;
   created_at: string;
   updated_at: string;
 }
 
 // Stats interfaces
 export interface MerchantStats {
   totalProducts: number;
   totalOrders: number;
   pendingOrders: number;
   totalRevenue: number;
   averageRating: number;
 }
 
 export interface AdminStats {
   totalStores: number;
   totalProducts: number;
   totalOrders: number;
   totalRevenue: number;
   pendingApprovals: number;
 }