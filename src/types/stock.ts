export interface Product {
  id: string;
  urunKodu: string;
  urunAdi: string;
  rafKonum: string;
  barkod?: string;
  acilisStok: number;
  toplamGiris: number;
  toplamCikis: number;
  mevcutStok: number;
  minStok: number;
  uyari: boolean;
  sonIslemTarihi?: string;
  not?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'giris' | 'cikis';
  quantity: number;
  date: string;
  time?: string;
  handledBy: string;
  note?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  todayMovements: number;
  totalIn: number;
  totalOut: number;
}

export type ViewMode = 'dashboard' | 'products' | 'movements' | 'locations' | 'alerts' | 'users' | 'logs' | 'profile';

export interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  created_at: string;
  last_sign_in: string | null;
  is_disabled: boolean;
}

export interface AuditLog {
  id: string;
  action_type: string;
  performed_by: string | null;
  performer_name?: string;
  target_user_id: string | null;
  target_user_name?: string;
  target_product_id: string | null;
  target_product_name?: string;
  details: Record<string, any> | null;
  created_at: string;
}
