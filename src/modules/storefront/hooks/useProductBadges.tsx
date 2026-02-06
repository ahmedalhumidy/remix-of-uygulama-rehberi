import { useMemo } from 'react';
import type { ProductBadge } from '../types';
import type { MarketplaceProduct } from '@/types/marketplace';

const NEW_THRESHOLD_DAYS = 14;
const BESTSELLER_THRESHOLD = 50;
const LOW_STOCK_THRESHOLD = 5;

export function useProductBadges(product: MarketplaceProduct | null | undefined) {
  return useMemo<ProductBadge[]>(() => {
    if (!product) return [];
    const badges: ProductBadge[] = [];

    // SALE badge
    if (product.sale_price && product.sale_price < product.price) {
      const pct = Math.round((1 - product.sale_price / product.price) * 100);
      badges.push({ type: 'sale', label: `%${pct} İndirim`, variant: 'destructive' });
    }

    // NEW badge
    const createdAt = new Date(product.created_at);
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated <= NEW_THRESHOLD_DAYS) {
      badges.push({ type: 'new', label: 'Yeni', variant: 'default' });
    }

    // BEST SELLER badge
    if (product.toplam_cikis >= BESTSELLER_THRESHOLD) {
      badges.push({ type: 'bestseller', label: 'Çok Satan', variant: 'secondary' });
    }

    // Stock badges
    if (product.mevcut_stok <= 0) {
      badges.push({ type: 'out_of_stock', label: 'Tükendi', variant: 'outline' });
    } else if (product.mevcut_stok <= LOW_STOCK_THRESHOLD) {
      badges.push({ type: 'low_stock', label: `Son ${product.mevcut_stok} Adet`, variant: 'destructive' });
    }

    return badges;
  }, [product]);
}

export function getStockVisibility(stock: number): {
  label: string;
  color: string;
  urgency: 'none' | 'low' | 'critical';
} {
  if (stock <= 0) return { label: 'Tükendi', color: 'text-muted-foreground', urgency: 'critical' };
  if (stock <= 3) return { label: `Son ${stock} adet!`, color: 'text-destructive', urgency: 'critical' };
  if (stock <= 10) return { label: `Stokta ${stock} adet`, color: 'text-warning', urgency: 'low' };
  return { label: 'Stokta', color: 'text-success', urgency: 'none' };
}
