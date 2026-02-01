import { ArrowUpRight, ArrowDownRight, Calendar, Package } from 'lucide-react';
import { StockMovement } from '@/types/stock';
import { cn } from '@/lib/utils';

interface MovementListProps {
  movements: StockMovement[];
  searchQuery: string;
}

export function MovementList({ movements, searchQuery }: MovementListProps) {
  const filteredMovements = movements.filter(movement => {
    const query = searchQuery.toLowerCase();
    return (
      movement.productName.toLowerCase().includes(query) ||
      movement.note?.toLowerCase().includes(query) ||
      movement.date.includes(query)
    );
  });

  // Group by date
  const groupedMovements = filteredMovements.reduce((groups, movement) => {
    const date = movement.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(movement);
    return groups;
  }, {} as Record<string, StockMovement[]>);

  const sortedDates = Object.keys(groupedMovements).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {sortedDates.map((date, dateIndex) => (
        <div key={date} className="animate-fade-in" style={{ animationDelay: `${dateIndex * 50}ms` }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {new Date(date).toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
          </div>
          
          <div className="space-y-2">
            {groupedMovements[date].map((movement, index) => (
              <div 
                key={movement.id} 
                className="stat-card flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${(dateIndex * 50) + (index * 30)}ms` }}
              >
                <div className={cn(
                  'p-3 rounded-xl',
                  movement.type === 'giris' ? 'bg-success/10' : 'bg-destructive/10'
                )}>
                  {movement.type === 'giris' ? (
                    <ArrowUpRight className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground truncate">
                      {movement.productName}
                    </span>
                  </div>
                  {movement.note && (
                    <p className="text-sm text-muted-foreground truncate">
                      {movement.note}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <span className={cn(
                    'text-lg font-bold',
                    movement.type === 'giris' ? 'text-success' : 'text-destructive'
                  )}>
                    {movement.type === 'giris' ? '+' : '-'}{movement.quantity}
                  </span>
                  <p className="text-xs text-muted-foreground">adet</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sortedDates.length === 0 && (
        <div className="stat-card text-center py-12">
          <ArrowUpRight className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Hareket bulunamadı</h3>
          <p className="text-muted-foreground">Arama kriterlerinize uygun stok hareketi yok.</p>
        </div>
      )}
    </div>
  );
}
