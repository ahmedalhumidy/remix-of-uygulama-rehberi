import { useMemo } from 'react';
import { Product, StockMovement } from '@/types/stock';

type ShelfProductRow = {
  productId: string;
  urunKodu: string;
  urunAdi: string;
  barkod?: string;
  units: number;
  sets: number;
};

export type ShelfInventory = {
  shelfName: string;
  products: ShelfProductRow[];
};

function toSortableKey(m: StockMovement) {
  const t = m.time ?? '00:00';
  return `${m.date} ${t}`;
}

export function useShelfInventory(products: Product[], movements: StockMovement[], searchQuery: string) {
  return useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const productById = new Map(products.map(p => [p.id, p]));
    const shelfMap = new Map<string, Map<string, ShelfProductRow>>();

    const ensureShelf = (shelfName: string) => {
      if (!shelfMap.has(shelfName)) shelfMap.set(shelfName, new Map());
      return shelfMap.get(shelfName)!;
    };

    const ensureRow = (shelfName: string, p: Product) => {
      const s = ensureShelf(shelfName);
      if (!s.has(p.id)) {
        s.set(p.id, {
          productId: p.id,
          urunKodu: p.urunKodu,
          urunAdi: p.urunAdi,
          barkod: p.barkod,
          units: 0,
          sets: 0,
        });
      }
      return s.get(p.id)!;
    };

    // 1) Seed opening stock to the product's default shelf
    for (const p of products) {
      const baseShelf = p.rafKonum || 'General';
      const row = ensureRow(baseShelf, p);
      row.units += p.acilisStok || 0;
      // sets opening not stored => keep 0
    }

    // 2) Apply movements chronologically
    const sorted = [...movements].sort((a, b) => toSortableKey(a).localeCompare(toSortableKey(b)));

    for (const m of sorted) {
      const p = productById.get(m.productId);
      if (!p) continue;

      const shelfName = m.shelfName || p.rafKonum || 'General';
      const row = ensureRow(shelfName, p);

      const sign = m.type === 'cikis' ? -1 : 1;
      row.units += sign * (m.quantity || 0);
      row.sets += sign * (m.setQuantity || 0);
    }

    // 3) Build output + search filter
    const shelves: ShelfInventory[] = [];
    for (const [shelfName, rows] of shelfMap.entries()) {
      let list = Array.from(rows.values())
        .filter(r => (r.units !== 0 || r.sets !== 0)); // hide empty

      if (q) {
        list = list.filter(r =>
          r.urunAdi.toLowerCase().includes(q) ||
          r.urunKodu.toLowerCase().includes(q) ||
          (r.barkod || '').toLowerCase().includes(q)
        );
      }

      if (list.length > 0) {
        // sort by product name
        list.sort((a, b) => a.urunAdi.localeCompare(b.urunAdi));
        shelves.push({ shelfName, products: list });
      }
    }

    // sort shelves by name
    shelves.sort((a, b) => a.shelfName.localeCompare(b.shelfName));
    return shelves;
  }, [products, movements, searchQuery]);
}