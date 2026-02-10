import { useEffect, useMemo, useState } from "react";
import {
  Package,
  MapPin,
  AlertTriangle,
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import { Product } from "@/types/stock";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";

type Totals = { units: number; sets: number };

interface ProductListProps {
  products: Product[];
  searchQuery: string;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onViewProduct: (id: string) => void;
  onStockAction: (product: Product, type: "giris" | "cikis") => void;
}

type SortField = "urunAdi" | "urunKodu" | "mevcutStok" | "rafKonum";
type SortOrder = "asc" | "desc";

export function ProductList({
  products,
  searchQuery,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
  onStockAction,
}: ProductListProps) {
  const { hasPermission } = usePermissions();
  const canEditProducts = hasPermission("products.update");
  const canDeleteProducts = hasPermission("products.delete");
  const canCreateMovements = hasPermission("stock_movements.create");

  const [sortField, setSortField] = useState<SortField>("urunAdi");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ✅ totals map loaded from shelf_inventory for visible products
  const [totalsByProductId, setTotalsByProductId] = useState<Record<string, Totals>>({});

  // ✅ shelf location summary loaded from shelf_inventory -> shelves(name) for visible products
  const [locationByProductId, setLocationByProductId] = useState<Record<string, string>>({});

  const getTotals = (p: Product): Totals => {
    // fallback while loading to avoid flicker
    return (
      totalsByProductId[p.id] ?? {
        units: (p as any).mevcutStok ?? 0,
        sets: (p as any).setStok ?? 0,
      }
    );
  };

  // ✅ IMPORTANT: Use REAL shelves, not product.rafKonum
  const getLocationText = (p: Product) => {
    const loc = locationByProductId[p.id];
    return loc && loc.trim().length > 0 ? loc : "—";
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return products.filter((product) => {
      const loc = (locationByProductId[product.id] ?? "").toLowerCase();

      return (
        product.urunAdi.toLowerCase().includes(query) ||
        product.urunKodu.toLowerCase().includes(query) ||
        loc.includes(query)
      );
    });
  }, [products, searchQuery, locationByProductId]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let comparison = 0;

      if (sortField === "mevcutStok") {
        const au = getTotals(a).units;
        const bu = getTotals(b).units;
        comparison = au - bu;
      } else if (sortField === "rafKonum") {
        comparison = getLocationText(a).localeCompare(getLocationText(b), "tr");
      } else {
        comparison = (a as any)[sortField].localeCompare((b as any)[sortField], "tr");
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts, sortField, sortOrder, totalsByProductId, locationByProductId]);

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, sortField, sortOrder]);

  // ✅ Load totals + locations for visible products only
  useEffect(() => {
    const ids = visibleProducts.map((p) => p.id).filter(Boolean);
    if (ids.length === 0) return;

    let cancelled = false;

    (async () => {
      // 1) Totals
      const { data: totalsData, error: totalsError } = await supabase
        .from("shelf_inventory")
        .select("product_id, units, sets")
        .in("product_id", ids);

      if (cancelled) return;

      if (totalsError) {
        console.error("Failed to load shelf totals for list", totalsError);
      } else {
        const totalsMap: Record<string, Totals> = {};
        for (const id of ids) totalsMap[id] = { units: 0, sets: 0 };

        for (const r of totalsData ?? []) {
          const pid = (r as any).product_id as string;
          if (!pid) continue;
          if (!totalsMap[pid]) totalsMap[pid] = { units: 0, sets: 0 };
          totalsMap[pid].units += (r as any).units ?? 0;
          totalsMap[pid].sets += (r as any).sets ?? 0;
        }

        setTotalsByProductId((prev) => ({ ...prev, ...totalsMap }));
      }

      // 2) Real shelf locations (names)
      const { data: locData, error: locError } = await supabase
        .from("shelf_inventory")
        .select("product_id, shelves(name)")
        .in("product_id", ids);

      if (cancelled) return;

      if (locError) {
        console.error("Failed to load shelf locations for list", locError);
      } else {
        const buckets: Record<string, string[]> = {};
        for (const id of ids) buckets[id] = [];

        for (const r of locData ?? []) {
          const pid = (r as any).product_id as string;
          const name = (r as any)?.shelves?.name as string | undefined;
          if (!pid || !name) continue;
          if (!buckets[pid]) buckets[pid] = [];
          buckets[pid].push(name);
        }

        const locMap: Record<string, string> = {};
        for (const pid of Object.keys(buckets)) {
          const uniq = Array.from(new Set(buckets[pid])).sort((a, b) =>
            a.localeCompare(b, "tr")
          );
          locMap[pid] = uniq.join(", ");
        }

        setLocationByProductId((prev) => ({ ...prev, ...locMap }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visibleProducts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown
        className={cn("w-3 h-3", sortField === field ? "text-accent" : "text-muted-foreground/50")}
      />
    </button>
  );

  return (
    <div className="animate-slide-up">
      {/* Desktop Table */}
      <div className="hidden md:block stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                  <SortButton field="urunKodu" label="Ürün Kodu" />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                  <SortButton field="urunAdi" label="Ürün Adı" />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                  <SortButton field="rafKonum" label="Konum" />
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                  <SortButton field="mevcutStok" label="Stok" />
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Set</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">Durum</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {visibleProducts.map((product, index) => {
                const delay = index < 20 ? index * 20 : 0;
                const loc = getLocationText(product);

                const totals = getTotals(product);
                const isLowStock = totals.units < product.minStok;

                // send correct totals when opening stock actions / edit
                const productWithTotals = {
                  ...product,
                  mevcutStok: totals.units,
                  setStok: totals.sets,
                } as any as Product;

                return (
                  <tr
                    key={product.id}
                    className="table-row-hover border-b border-border last:border-0 animate-fade-in"
                    style={delay ? { animationDelay: `${delay}ms` } : undefined}
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{product.urunKodu}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{product.urunAdi}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-2">{loc}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className={cn("font-semibold", isLowStock ? "text-destructive" : "text-foreground")}>
                        {totals.units}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/ {product.minStok}</span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="font-medium text-muted-foreground">{totals.sets || 0}</span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {isLowStock ? (
                        <span className="badge-status bg-destructive/10 text-destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Düşük
                        </span>
                      ) : (
                        <span className="badge-status bg-success/10 text-success">Normal</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canCreateMovements && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-success hover:bg-success/10 hover:text-success"
                              onClick={() => onStockAction(productWithTotals, "giris")}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onStockAction(productWithTotals, "cikis")}
                            >
                              −
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewProduct(product.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Görüntüle
                            </DropdownMenuItem>
                            {canEditProducts && (
                              <DropdownMenuItem onClick={() => onEditProduct(productWithTotals)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                            )}
                            {canDeleteProducts && (
                              <DropdownMenuItem
                                onClick={() => onDeleteProduct(product.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {visibleProducts.map((product, index) => {
          const delay = index < 20 ? index * 30 : 0;
          const loc = getLocationText(product);

          const totals = getTotals(product);
          const isLowStock = totals.units < product.minStok;

          const productWithTotals = {
            ...product,
            mevcutStok: totals.units,
            setStok: totals.sets,
          } as any as Product;

          return (
            <div
              key={product.id}
              className="stat-card animate-slide-up"
              style={delay ? { animationDelay: `${delay}ms` } : undefined}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{product.urunAdi}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{product.urunKodu}</p>
                  </div>
                </div>
                {isLowStock && (
                  <span className="badge-status bg-destructive/10 text-destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Düşük
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-2">{loc}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={cn("font-semibold text-lg", isLowStock ? "text-destructive" : "text-foreground")}>
                      {totals.units}
                    </span>
                    <span className="text-muted-foreground ml-1">/ {product.minStok}</span>
                  </div>

                  {(totals.sets || 0) > 0 && (
                    <div className="text-right border-l pl-3 border-border">
                      <span className="text-sm text-muted-foreground">Set: </span>
                      <span className="font-medium">{totals.sets}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                {canCreateMovements && (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-success/10 text-success hover:bg-success/20 border-0"
                      onClick={() => onStockAction(productWithTotals, "giris")}
                    >
                      + Giriş
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                      onClick={() => onStockAction(productWithTotals, "cikis")}
                    >
                      − Çıkış
                    </Button>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewProduct(product.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Görüntüle
                    </DropdownMenuItem>
                    {canEditProducts && (
                      <DropdownMenuItem onClick={() => onEditProduct(productWithTotals)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                    )}
                    {canDeleteProducts && (
                      <DropdownMenuItem
                        onClick={() => onDeleteProduct(product.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {sortedProducts.length === 0 && (
        <div className="stat-card text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Ürün bulunamadı</h3>
          <p className="text-muted-foreground">Arama kriterlerinize uygun ürün yok.</p>
        </div>
      )}

      {sortedProducts.length > 0 && sortedProducts.length > visibleCount && (
        <div className="mt-4 stat-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Gösterilen: <span className="font-medium text-foreground">{visibleProducts.length}</span> /{" "}
              {sortedProducts.length}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, sortedProducts.length))}
            >
              Daha fazla yükle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}