import { Truck, Clock, Package } from 'lucide-react';
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
    <div className="border border-border/50 rounded-xl p-4 bg-card/50 space-y-3">
      <div className="flex items-center gap-2 font-medium text-sm">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Truck className="h-4 w-4 text-primary" />
        </div>
        Tahmini Teslimat
      </div>
      <div className="flex items-center gap-2 text-sm pl-9">
        <Clock className="h-3.5 w-3.5 text-success" />
        <span>
          <strong className="text-success">{formattedDate}</strong>
          {' tarihine kadar teslim'}
        </span>
      </div>
      {displayEstimates.map((e, i) => (
        <div key={i} className="flex items-center justify-between text-xs text-muted-foreground pl-9">
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3" />
            {e.carrier_name} ({e.estimated_days} iş günü)
          </div>
          <span className={e.fee > 0 ? 'font-medium' : 'text-success font-medium'}>
            {e.fee > 0 ? `₺${e.fee.toFixed(2)}` : 'Ücretsiz'}
          </span>
        </div>
      ))}
    </div>
  );
}
