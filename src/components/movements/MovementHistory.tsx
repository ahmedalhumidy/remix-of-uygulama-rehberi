import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Calendar, User, Clock, Package, Filter, Download } from 'lucide-react';
import { StockMovement } from '@/types/stock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MovementHistoryProps {
  movements: StockMovement[];
  searchQuery: string;
}

export function MovementHistory({ movements, searchQuery }: MovementHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'giris' | 'cikis'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [handlerFilter, setHandlerFilter] = useState('all');

  // Get unique handlers
  const handlers = [...new Set(movements.map(m => m.handledBy))];

  const filteredMovements = movements.filter(movement => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      movement.productName.toLowerCase().includes(query) ||
      movement.handledBy.toLowerCase().includes(query) ||
      movement.note?.toLowerCase().includes(query) ||
      movement.date.includes(query);
    
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    const matchesHandler = handlerFilter === 'all' || movement.handledBy === handlerFilter;
    
    const matchesDateFrom = !dateFrom || movement.date >= dateFrom;
    const matchesDateTo = !dateTo || movement.date <= dateTo;

    return matchesSearch && matchesType && matchesHandler && matchesDateFrom && matchesDateTo;
  });

  // Sort by date descending
  const sortedMovements = [...filteredMovements].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return (b.time || '').localeCompare(a.time || '');
  });

  const handleExport = () => {
    const csvContent = [
      ['Tarih', 'Saat', 'Ürün', 'İşlem', 'Miktar', 'Personel', 'Not'].join(','),
      ...sortedMovements.map(m => [
        m.date,
        m.time || '-',
        `"${m.productName}"`,
        m.type === 'giris' ? 'Giriş' : 'Çıkış',
        m.quantity,
        `"${m.handledBy}"`,
        `"${m.note || '-'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stok-hareketleri-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Filters */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Filtreler</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">İşlem Tipi</label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="giris">Giriş</SelectItem>
                <SelectItem value="cikis">Çıkış</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Personel</label>
            <Select value={handlerFilter} onValueChange={setHandlerFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {handlers.map(handler => (
                  <SelectItem key={handler} value={handler}>{handler}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Başlangıç Tarihi</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Bitiş Tarihi</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={handleExport} className="w-full gap-2">
              <Download className="w-4 h-4" />
              CSV İndir
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedMovements.length} hareket bulundu
        </p>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İşlem</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Tarih & Saat</TableHead>
              <TableHead>Personel</TableHead>
              <TableHead>Not</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMovements.map((movement, index) => (
              <TableRow 
                key={movement.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell>
                  <div className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    movement.type === 'giris' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  )}>
                    {movement.type === 'giris' ? (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        Giriş
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-4 h-4" />
                        Çıkış
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{movement.productName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'font-bold',
                    movement.type === 'giris' ? 'text-success' : 'text-destructive'
                  )}>
                    {movement.type === 'giris' ? '+' : '-'}{movement.quantity}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(movement.date).toLocaleDateString('tr-TR')}
                    </div>
                    {movement.time && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {movement.time}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{movement.handledBy}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {movement.note || '-'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sortedMovements.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpRight className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Hareket bulunamadı</h3>
            <p className="text-muted-foreground">Filtre kriterlerinize uygun stok hareketi yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
