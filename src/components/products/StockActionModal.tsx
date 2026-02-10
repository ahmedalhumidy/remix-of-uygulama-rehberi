import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Product } from "@/types/stock";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { QuickStockInput } from "@/components/stock/QuickStockInput";
import { supabase } from "@/integrations/supabase/client";

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: Product | null;
  actionType: "giris" | "cikis";
}

export function StockActionModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  actionType,
}: StockActionModalProps) {
  const isGiris = actionType === "giris";

  const [totals, setTotals] = useState({ totalUnits: 0, totalSets: 0 });

  const loadTotals = async (productId: string) => {
    const { data, error } = await supabase
      .from("shelf_inventory")
      .select("units, sets")
      .eq("product_id", productId);

    if (error) {
      console.error("Failed to load totals in StockActionModal", error);
      setTotals({ totalUnits: 0, totalSets: 0 });
      return;
    }

    const totalUnits = (data ?? []).reduce((sum: number, r: any) => sum + (r.units ?? 0), 0);
    const totalSets  = (data ?? []).reduce((sum: number, r: any) => sum + (r.sets ?? 0), 0);

    setTotals({ totalUnits, totalSets });
  };

  useEffect(() => {
    if (!isOpen || !product?.id) return;
    loadTotals(product.id);
  }, [isOpen, product?.id]);

  const handleSuccess = async () => {
    if (product?.id) await loadTotals(product.id);
    onSuccess?.();
    onClose();
  };

  if (!product) return null;

  // ✅ always pass real totals to QuickStockInput
  const productWithTotals = {
    ...product,
    mevcutStok: totals.totalUnits,
    setStok: totals.totalSets,
  } as any as Product;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn("p-2 rounded-lg", isGiris ? "bg-success/10" : "bg-destructive/10")}
            >
              {isGiris ? (
                <ArrowUpRight className="w-5 h-5 text-success" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              )}
            </div>
            {product.urunAdi}
          </DialogTitle>
        </DialogHeader>

        {/* ✅ show real totals */}
        <div className="text-sm text-muted-foreground mb-2">
          Mevcut Stok: <span className="font-semibold text-foreground">{totals.totalUnits}</span>
          {"  "}Set: <span className="font-semibold text-foreground">{totals.totalSets}</span>
        </div>

        <div className="py-2">
          <QuickStockInput
            product={productWithTotals}
            onSuccess={handleSuccess}
            showShelfSelector={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}