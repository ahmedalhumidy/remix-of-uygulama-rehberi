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

export type ViewMode = 'dashboard' | 'products' | 'movements' | 'locations' | 'alerts' | 'users' | 'profile';
