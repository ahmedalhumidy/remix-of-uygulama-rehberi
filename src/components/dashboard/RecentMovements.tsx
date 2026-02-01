import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StockMovement } from '@/types/stock';
import { cn } from '@/lib/utils';

interface RecentMovementsProps {
  movements: StockMovement[];
}

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <div className="stat-card h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Son Hareketler</h3>
      <div className="space-y-3">
        {movements.map((movement, index) => (
          <div 
            key={movement.id} 
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              'p-2 rounded-lg',
              movement.type === 'giris' ? 'bg-success/10' : 'bg-destructive/10'
            )}>
              {movement.type === 'giris' ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {movement.productName}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(movement.date).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <span className={cn(
              'text-sm font-semibold',
              movement.type === 'giris' ? 'text-success' : 'text-destructive'
            )}>
              {movement.type === 'giris' ? '+' : '-'}{movement.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
