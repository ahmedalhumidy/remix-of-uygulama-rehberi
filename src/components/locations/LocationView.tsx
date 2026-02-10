import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Shelf = {
  id: string;
  name: string;
  description?: string | null;
};

type ShelfProductRow = {
  shelf_id: string;
  shelf_name: string;
  product_id: string;
  urun_kodu: string;
  urun_adi: string;
  barkod: string | null;
  units: number;
  sets: number;
  updated_at: string;
};

export function LocationView() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(true);

  const [activeShelfId, setActiveShelfId] = useState<string | null>(null);

  const [rows, setRows] = useState<ShelfProductRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const [searchShelf, setSearchShelf] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  async function loadShelves() {
    setLoadingShelves(true);
    const { data, error } = await supabase
      .from("shelves")
      .select("id,name,description")
      .order("name", { ascending: true });

    if (error) {
      toast.error(error.message);
      setShelves([]);
      setLoadingShelves(false);
      return;
    }

    setShelves((data ?? []) as Shelf[]);
    setLoadingShelves(false);

    // Auto pick first shelf if none selected
    if (!activeShelfId && (data ?? []).length > 0) {
      setActiveShelfId((data ?? [])[0].id);
    }
  }

  async function loadShelfProducts(shelfId: string) {
    setLoadingRows(true);

    // ✅ IMPORTANT: we read from the VIEW so shelf name is always correct
    const { data, error } = await supabase
      .from("v_shelf_products")
      .select("shelf_id,shelf_name,product_id,urun_kodu,urun_adi,barkod,units,sets,updated_at")
      .eq("shelf_id", shelfId);

    if (error) {
      toast.error(error.message);
      setRows([]);
      setLoadingRows(false);
      return;
    }

    const mapped = (data ?? []).map((r: any) => ({
      shelf_id: r.shelf_id,
      shelf_name: r.shelf_name,
      product_id: r.product_id,
      urun_kodu: r.urun_kodu,
      urun_adi: r.urun_adi,
      barkod: r.barkod ?? null,
      units: r.units ?? 0,
      sets: r.sets ?? 0,
      updated_at: r.updated_at,
    })) as ShelfProductRow[];

    // show only products that actually have stock
    const filtered = mapped.filter((x) => (x.units ?? 0) > 0 || (x.sets ?? 0) > 0);

    // nice sorting
    filtered.sort((a, b) => a.urun_adi.localeCompare(b.urun_adi, "tr"));

    setRows(filtered);
    setLoadingRows(false);
  }

  useEffect(() => {
    loadShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeShelfId) loadShelfProducts(activeShelfId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShelfId]);

  const filteredShelves = useMemo(() => {
    const q = searchShelf.trim().toLowerCase();
    if (!q) return shelves;
    return shelves.filter((s) => s.name.toLowerCase().includes(q));
  }, [shelves, searchShelf]);

  const activeShelf = useMemo(
    () => shelves.find((s) => s.id === activeShelfId) ?? null,
    [shelves, activeShelfId]
  );

  const filteredRows = useMemo(() => {
    const q = searchProduct.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        r.urun_adi.toLowerCase().includes(q) ||
        r.urun_kodu.toLowerCase().includes(q) ||
        (r.barkod ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, searchProduct]);

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* LEFT: Shelves list */}
      <Card className="h-fit">
        <CardHeader className="space-y-2">
          <CardTitle>Raflar</CardTitle>
          <Input
            placeholder="Raf ara…"
            value={searchShelf}
            onChange={(e) => setSearchShelf(e.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingShelves ? (
            <div className="text-sm opacity-70">Yükleniyor…</div>
          ) : filteredShelves.length === 0 ? (
            <div className="text-sm opacity-70">Raf bulunamadı.</div>
          ) : (
            <div className="space-y-2">
              {filteredShelves.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant={s.id === activeShelfId ? "default" : "outline"}
                  className={cn("w-full justify-between")}
                  onClick={() => setActiveShelfId(s.id)}
                >
                  <span className="truncate">{s.name}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIGHT: Shelf details */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>
            {activeShelf ? (
              <span>
                {activeShelf.name}{" "}
                <span className="text-xs opacity-70">
                  (Bu sayfa artık products.raf_konum kullanmaz ✅)
                </span>
              </span>
            ) : (
              "Raf seçin"
            )}
          </CardTitle>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Ürün ara (ad/kod/barkod)…"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="sm:max-w-md"
              disabled={!activeShelfId}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!activeShelfId}
              onClick={() => activeShelfId && loadShelfProducts(activeShelfId)}
            >
              Yenile
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!activeShelfId ? (
            <div className="text-sm opacity-70">Soldan bir raf seçin.</div>
          ) : loadingRows ? (
            <div className="text-sm opacity-70">Yükleniyor…</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-sm opacity-70">Bu rafta ürün yok.</div>
          ) : (
            <div className="space-y-2">
              {filteredRows.map((r) => (
                <div
                  key={r.product_id}
                  className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.urun_adi}</div>
                    <div className="text-xs opacity-70">
                      Kod: <b>{r.urun_kodu}</b>
                      {r.barkod ? (
                        <>
                          {" "}
                          — Barkod: <b>{r.barkod}</b>
                        </>
                      ) : null}
                    </div>

                    {/* ✅ Always show the REAL shelf name here */}
                    <div className="mt-2">
                      <Badge variant="secondary">
                        Raf: {r.shelf_name}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge>Adet: {r.units}</Badge>
                    <Badge variant="outline">Set: {r.sets}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}