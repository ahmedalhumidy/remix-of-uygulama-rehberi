import { supabase } from "@/integrations/supabase/client";

export type MovementType = "giris" | "cikis";

export interface StockMovementInput {
  productId: string;
  type: MovementType;
  quantity: number;      // units
  setQuantity?: number;  // sets
  date?: string;         // YYYY-MM-DD
  time?: string;         // HH:mm:ss
  note?: string;
  shelfId: string;       // REQUIRED
  handledBy: string;     // employee name
}

export async function createStockMovement(input: StockMovementInput) {
  if (!input.shelfId) throw new Error("Lütfen raf seçin (shelfId zorunlu).");

  const payload = {
    product_id: input.productId,
    movement_type: input.type,
    quantity: Math.max(0, Number(input.quantity || 0)),
    set_quantity: Math.max(0, Number(input.setQuantity || 0)),
    movement_date: input.date ?? new Date().toISOString().slice(0, 10),
    movement_time:
      input.time ??
      new Date().toTimeString().slice(0, 8), // HH:mm:ss
    notes: input.note ?? null,
    shelf_id: input.shelfId,
    handled_by: input.handledBy,
  };

  const { data, error } = await supabase
    .from("stock_movements")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}