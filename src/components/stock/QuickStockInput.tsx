import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ShelfSelector } from "@/components/shelves/ShelfSelector";
import { useShelves, Shelf } from "@/hooks/useShelves";
import { stockService } from "@/services/stockService";
import { Product } from "@/types/stock";
import { supabase } from "@/integrations/supabase/client";

interface QuickStockInputProps {
  product: Product;
  onSuccess?: () => void;
  showShelfSelector?: boolean;
  compact?: boolean;
  className?: string;
}

type ActionMode = "idle" | "giris" | "cikis";

export function QuickStockInput({
  product,
  onSuccess,
  showShelfSelector = true,
  compact = false,
  className,
}: QuickStockInputProps) {
  const [mode, setMode] = useState<ActionMode>("idle");
  const [adetInput, setAdetInput] = useState<number>(0);
  const [setInput, setSetInput] = useState<number>(0);
  const [note, setNote] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { shelves, addShelf, getShelfByName } = useShelves();

  // ✅ Current shelf inventory (important for çıkış validation)
  const [shelfStock, setShelfStock] = useState<{ units: number; sets: number }>({ units: 0, sets: 0 });
  const [loadingShelfStock, setLoadingShelfStock] = useState(false);

  const loadShelfStock = async (productId: string, shelfId?: string) => {
    if (!shelfId) {
      setShelfStock({ units: 0, sets: 0 });
      return;
    }
    setLoadingShelfStock(true);

    const { data, error } = await supabase
      .from("shelf_inventory")
      .select("units, sets")
      .eq("product_id", productId)
      .eq("shelf_id", shelfId)
      .maybeSingle();

    setLoadingShelfStock(false);

    if (error) {
      console.error("Failed to load shelf stock", error);
      setShelfStock({ units: 0, sets: 0 });
      return;
    }

    setShelfStock({
      units: (data as any)?.units ?? 0,
      sets: (data as any)?.sets ?? 0,
    });
  };

  // Auto-select shelf based on product location (default shelf)
  useEffect(() => {
    if (product.rafKonum) {
      const shelf = getShelfByName(product.rafKonum);
      if (shelf) setSelectedShelfId(shelf.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.rafKonum, shelves]);

  // Load shelf stock whenever shelf changes
  useEffect(() => {
    if (!product?.id) return;
    if (showShelfSelector) {
      loadShelfStock(product.id, selectedShelfId);
    } else {
      // If shelf selector hidden, treat as product totals already injected from parent
      setShelfStock({ units: product.mevcutStok ?? 0, sets: (product as any).setStok ?? 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, selectedShelfId, showShelfSelector]);

  const resetForm = () => {
    setMode("idle");
    setAdetInput(0);
    setSetInput(0);
    setNote("");
  };

  const handleModeChange = (newMode: ActionMode) => {
    if (mode === newMode) {
      resetForm();
    } else {
      setMode(newMode);
      setAdetInput(0);
      setSetInput(0);
      setNote("");
    }
  };

  const effectiveUnits = showShelfSelector ? shelfStock.units : (product.mevcutStok ?? 0);
  const effectiveSets = showShelfSelector ? shelfStock.sets : ((product as any).setStok ?? 0);

  // Validation
  const isValid = () => {
    if (mode === "idle") return false;
    if (adetInput === 0 && setInput === 0) return false;
    if (adetInput < 0 || setInput < 0) return false;

    // If shelf selector is enabled, must choose a shelf
    if (showShelfSelector && !selectedShelfId) return false;

    if (mode === "cikis") {
      if (adetInput > effectiveUnits) return false;
      if (setInput > effectiveSets) return false;
    }

    return true;
  };

  // Calculate new values for preview (based on selected shelf stock when applicable)
  const newAdet =
    mode === "giris" ? effectiveUnits + adetInput : mode === "cikis" ? effectiveUnits - adetInput : effectiveUnits;

  const newSet =
    mode === "giris" ? effectiveSets + setInput : mode === "cikis" ? effectiveSets - setInput : effectiveSets;

  const handleSubmit = async () => {
    if (!isValid()) return;

    setIsSubmitting(true);

    const now = new Date();
    const result = await stockService.createMovement({
      productId: product.id,
      type: mode as "giris" | "cikis",
      quantity: adetInput,
      setQuantity: setInput,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
      note: note || undefined,
      shelfId: selectedShelfId,
    });

    setIsSubmitting(false);

    if (result) {
      resetForm();

      // refresh shelf stock after movement
      if (product?.id && (selectedShelfId || !showShelfSelector)) {
        await loadShelfStock(product.id, selectedShelfId);
      }

      onSuccess?.();
    }
  };

  const handleShelfSelect = (shelf: Shelf) => {
    setSelectedShelfId(shelf.id);
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-success hover:bg-success/10 hover:text-success"
          onClick={() => handleModeChange("giris")}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => handleModeChange("cikis")}
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current Stock Display with +/- Buttons */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">
                {showShelfSelector ? "Seçili Raf Stok:" : "Mevcut Stok:"}
              </span>
              <span className="font-bold text-lg ml-2">{effectiveUnits}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Set:</span>
              <span className="font-bold text-lg ml-2">{effectiveSets}</span>
            </div>
            {showShelfSelector && loadingShelfStock && (
              <span className="text-xs text-muted-foreground ml-2">Yükleniyor...</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === "giris" ? "default" : "outline"}
            className={cn(
              "h-9 px-3",
              mode === "giris"
                ? "bg-success hover:bg-success/90 text-success-foreground"
                : "text-success border-success/30 hover:bg-success/10 hover:text-success"
            )}
            onClick={() => handleModeChange("giris")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Giriş
          </Button>
          <Button
            size="sm"
            variant={mode === "cikis" ? "default" : "outline"}
            className={cn(
              "h-9 px-3",
              mode === "cikis"
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            )}
            onClick={() => handleModeChange("cikis")}
          >
            <Minus className="w-4 h-4 mr-1" />
            Çıkış
          </Button>
        </div>
      </div>

      {/* Expanded Form when mode is active */}
      {mode !== "idle" && (
        <div className="animate-slide-up space-y-3 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-2 h-2 rounded-full", mode === "giris" ? "bg-success" : "bg-destructive")} />
            <span className="text-sm font-medium">{mode === "giris" ? "Stok Girişi" : "Stok Çıkışı"}</span>
          </div>

          {/* Quantity Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adet-input" className="text-xs">
                {mode === "giris" ? "+ Adet" : "− Adet"}
              </Label>
              <Input
                id="adet-input"
                type="number"
                min="0"
                max={mode === "cikis" ? effectiveUnits : undefined}
                value={adetInput || ""}
                onChange={(e) => setAdetInput(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="h-9"
              />
              {mode === "cikis" && (
                <p className="text-xs text-muted-foreground">Maks: {effectiveUnits}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="set-input" className="text-xs">
                {mode === "giris" ? "+ Set" : "− Set"}
              </Label>
              <Input
                id="set-input"
                type="number"
                min="0"
                max={mode === "cikis" ? effectiveSets : undefined}
                value={setInput || ""}
                onChange={(e) => setSetInput(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="h-9"
              />
              {mode === "cikis" && (
                <p className="text-xs text-muted-foreground">Maks: {effectiveSets}</p>
              )}
            </div>
          </div>

          {/* New Values Preview */}
          {(adetInput > 0 || setInput > 0) && (
            <div className="flex items-center gap-4 p-2 rounded bg-muted/30 text-sm">
              <span className="text-muted-foreground">Yeni değerler:</span>
              <span className={cn("font-semibold", mode === "giris" ? "text-success" : "text-destructive")}>
                {newAdet} adet
              </span>
              <span className={cn("font-semibold", mode === "giris" ? "text-success" : "text-destructive")}>
                {newSet} set
              </span>
            </div>
          )}

          {/* Shelf Selector */}
          {showShelfSelector && (
            <ShelfSelector
              shelves={shelves}
              selectedShelfId={selectedShelfId}
              onSelect={handleShelfSelect}
              onAddNew={addShelf}
              label="Raf"
              placeholder="Raf seçin..."
              required
            />
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note-input" className="text-xs">
              Not (opsiyonel)
            </Label>
            <Textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İşlem açıklaması..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isValid() || isSubmitting}
              onClick={handleSubmit}
              className={cn(mode === "giris" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90")}
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}