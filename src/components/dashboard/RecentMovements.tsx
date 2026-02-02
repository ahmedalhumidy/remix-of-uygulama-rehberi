import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { StockMovement } from '@/types/stock';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentMovementsProps {
  movements: StockMovement[];
}

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <Card className="border-border/60 shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-info/10">
            <Clock className="w-3.5 h-3.5 text-info" />
          </div>
          Son Hareketler
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {movements.map((movement, index) => (
            <div 
              key={movement.id} 
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 animate-fade-in"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className={cn(
                'p-1.5 rounded-lg flex-shrink-0',
                movement.type === 'giris' ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {movement.type === 'giris' ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {movement.productName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(movement.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <span className={cn(
                'text-sm font-bold tabular-nums',
                movement.type === 'giris' ? 'text-success' : 'text-destructive'
              )}>
                {movement.type === 'giris' ? '+' : '-'}{movement.quantity}
              </span>
            </div>
          ))}
          {movements.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Henüz hareket yok</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
