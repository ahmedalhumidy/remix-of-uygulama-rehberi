import { Truck, Clock } from 'lucide-react';
import { useDeliveryEstimate } from '../hooks/useDeliveryEstimate';

interface DeliveryEstimateProps {
  city?: string;
}

export function DeliveryEstimateDisplay({ city }: DeliveryEstimateProps) {
  const { data: estimates, isLoading } = useDeliveryEstimate(city);

  if (isLoading) return null;

  const displayEstimates = estimates && estimates.length > 0
    ? estimates
    : [{ carrier_name: 'Standart Kargo', estimated_days: 2, fee: 0 }];

  const today = new Date();
  const fastest = displayEstimates.reduce((min, e) => e.estimated_days < min.estimated_days ? e : min, displayEstimates[0]);

  const deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + fastest.estimated_days);
  const formattedDate = deliveryDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Truck className="h-4 w-4 text-primary" />
        Tahmini Teslimat
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          <strong>{formattedDate}</strong>
          {' tarihine kadar'}
        </span>
      </div>
      {displayEstimates.map((e, i) => (
        <div key={i} className="flex items-center justify-between text-xs text-muted-foreground pl-6">
          <span>{e.carrier_name} ({e.estimated_days} gün)</span>
          <span>{e.fee > 0 ? `₺${e.fee.toFixed(2)}` : 'Ücretsiz'}</span>
        </div>
      ))}
    </div>
  );
}
