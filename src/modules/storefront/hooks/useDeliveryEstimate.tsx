import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DeliveryEstimate } from '../types';

export function useDeliveryEstimate(city?: string) {
  return useQuery({
    queryKey: ['delivery-estimate', city],
    queryFn: async (): Promise<DeliveryEstimate[]> => {
      if (!city) return [];

      const { data: zones, error } = await supabase
        .from('shipping_zones')
        .select(`*, carrier:shipping_carriers(name, base_fee, per_kg_fee, is_active)`)
        .eq('city', city);

      if (error || !zones) return getDefaultEstimate();

      return zones
        .filter((z: any) => z.carrier?.is_active)
        .map((z: any) => ({
          carrier_name: z.carrier?.name ?? 'Kargo',
          estimated_days: z.delivery_days ?? 3,
          fee: z.fee_override ?? z.carrier?.base_fee ?? 0,
        }));
    },
    enabled: !!city,
  });
}

function getDefaultEstimate(): DeliveryEstimate[] {
  return [
    { carrier_name: 'Standart Kargo', estimated_days: 3, fee: 29.90 },
    { carrier_name: 'Hızlı Kargo', estimated_days: 1, fee: 49.90 },
  ];
}
