import { useState, useEffect, useCallback } from 'react';
import { StockMovement, Product } from '@/types/stock';
import { stockService, StockMovementInput } from '@/services/stockService';

export function useMovements(products: Product[]) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const data = await stockService.fetchMovements();
    setMovements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const addMovement = async (data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    setQuantity?: number;
    date: string;
    time: string;
    note?: string;
    shelfId?: string;
  }) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) {
      return null;
    }

    const input: StockMovementInput = {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      setQuantity: data.setQuantity || 0,
      date: data.date,
      time: data.time,
      note: data.note,
      shelfId: data.shelfId,
    };

    const result = await stockService.createMovement(input);

    if (result) {
      setMovements(prev => [result, ...prev]);
    }

    return result;
  };

  const refreshMovements = () => {
    fetchMovements();
  };

  return {
    movements,
    loading,
    addMovement,
    refreshMovements,
    setMovements,
  };
}
