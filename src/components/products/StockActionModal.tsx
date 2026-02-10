import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createStockMovement } from "@/lib/stockMovements";
import { useShelves } from "@/hooks/useShelves";
import { useProductShelfInventory } from "@/hooks/useProductShelfInventory";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string;
  productName: string;
  employeeName: string; // handled_by
  mode?: "giris" | "cikis"; // optional default
  onSuccess?: () => void;
};

export function StockActionModal({
  open,
  onOpenChange,
  productId,
  productName,
  employeeName,
  mode = "giris",
  onSuccess,
}: Props) {
  const { shelves, loading: shelvesLoading } = useShelves();
  const { rows: shelfRows, loading: invLoading, reload: reloadInv } = useProductShelfInventory(productId);

  const [movementType, setMovementType] = useState<"giris" | "cikis">(mode);
  const [shelfId, setShelfId] = useState<string>("");
  const [units, setUnits] = useState<string>("");
  const [sets, setSets] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const canSubmit = useMemo(() => {
    const u = Number(units || 0);
    const s = Number(sets || 0);
    return !!shelfId && (u > 0 || s > 0);
  }, [shelfId, units, sets]);

  async function submit() {
    try {
      if (!canSubmit) {
        toast.error("Raf seçin ve en az bir miktar girin (Adet veya Set).");
        return;
      }

      await createStockMovement({
        productId,
        type: movementType,
        quantity: Number(units || 0),
        setQuantity: Number(sets || 0),
        note: note.trim() || undefined,
        shelfId,
        handledBy: employeeName || "—",
      });

      toast.success("Stok hareketi kaydedildi.");
      setUnits("");
      setSets("");
      setNote("");
      // keep shelfId selected (better UX)
      await reloadInv();
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Hata oluştu.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stok Hareketi — {productName}</DialogTitle>
        </DialogHeader>

        {/* Current per-shelf inventory */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Raflara göre stok</div>
          <div className="rounded-md border p-2 text-sm">
            {invLoading ? (
              <div>Yükleniyor…</div>
            ) : shelfRows.length === 0 ? (
              <div className="opacity-70">Bu ürün henüz hiçbir rafta kayıtlı değil.</div>
            ) : (
              <div className="space-y-1">
                {shelfRows.map((r) => (
                  <div key={r.shelf_id} className="flex items-center justify-between gap-3">
                    <div className="font-medium">{r.shelf_name}</div>
                    <div className="opacity-80">
                      Adet: <b>{r.units}</b> — Set: <b>{r.sets}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Movement type */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={movementType === "giris" ? "default" : "outline"}
            onClick={() => setMovementType("giris")}
          >
            (+) Giriş
          </Button>
          <Button
            type="button"
            variant={movementType === "cikis" ? "destructive" : "outline"}
            onClick={() => setMovementType("cikis")}
          >
            (−) Çıkış
          </Button>
        </div>

        {/* Shelf select (REQUIRED) */}
        <div className="space-y-2">
          <Label>Raf (zorunlu)</Label>
          <Select value={shelfId} onValueChange={setShelfId}>
            <SelectTrigger>
              <SelectValue placeholder={shelvesLoading ? "Yükleniyor…" : "Raf seçin"} />
            </SelectTrigger>
            <SelectContent>
              {shelves.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Adet</Label>
            <Input
              inputMode="numeric"
              value={units}
              onChange={(e) => setUnits(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Set</Label>
            <Input
              inputMode="numeric"
              value={sets}
              onChange={(e) => setSets(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Not</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="İsteğe bağlı…" />
        </div>

        <Button type="button" disabled={!canSubmit} onClick={submit}>
          Kaydet
        </Button>

        <div className="text-xs opacity-70">
          Not: Raf seçmeden hareket kaydedilmez. Ürün birden fazla rafta olabilir; burada hepsi ayrı gösterilir.
        </div>
      </DialogContent>
    </Dialog>
  );
}