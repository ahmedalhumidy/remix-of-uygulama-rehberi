import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, FileText, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Product, StockMovement } from '@/types/stock';
import { ReportFilterValues } from './ReportFilters';
import { exportToExcel, exportToPDF } from './exportUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StockMovementReportProps {
  products: Product[];
  movements: StockMovement[];
  filters: ReportFilterValues;
}

export function StockMovementReport({ products, movements, filters }: StockMovementReportProps) {
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (filters.dateFrom && m.date < filters.dateFrom) return false;
      if (filters.dateTo && m.date > filters.dateTo) return false;
      if (filters.productId && m.productId !== filters.productId) return false;
      if (filters.movementType && m.type !== filters.movementType) return false;
      return true;
    });
  }, [movements, filters]);

  const stats = useMemo(() => {
    const totalIn = filteredMovements.filter(m => m.type === 'giris').reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = filteredMovements.filter(m => m.type === 'cikis').reduce((sum, m) => sum + m.quantity, 0);
    const netChange = totalIn - totalOut;
    
    return { totalIn, totalOut, netChange, count: filteredMovements.length };
  }, [filteredMovements]);

  const dailyData = useMemo(() => {
    const byDate: Record<string, { date: string; giris: number; cikis: number }> = {};
    
    filteredMovements.forEach(m => {
      if (!byDate[m.date]) {
        byDate[m.date] = { date: m.date, giris: 0, cikis: 0 };
      }
      if (m.type === 'giris') {
        byDate[m.date].giris += m.quantity;
      } else {
        byDate[m.date].cikis += m.quantity;
      }
    });
    
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMovements]);

  const exportData = useMemo(() => {
    return filteredMovements.map(m => ({
      date: m.date,
      time: m.time || '-',
      product: m.productName,
      type: m.type === 'giris' ? 'Giriş' : 'Çıkış',
      quantity: m.quantity,
      handledBy: m.handledBy,
      note: m.note || '-',
    }));
  }, [filteredMovements]);

  const columns = [
    { header: 'Tarih', key: 'date', width: 12 },
    { header: 'Saat', key: 'time', width: 8 },
    { header: 'Ürün', key: 'product', width: 25 },
    { header: 'Tip', key: 'type', width: 8 },
    { header: 'Miktar', key: 'quantity', width: 10 },
    { header: 'Yapan', key: 'handledBy', width: 20 },
    { header: 'Not', key: 'note', width: 25 },
  ];

  const handleExportExcel = () => {
    exportToExcel(exportData, columns, `stok-hareketleri-${Date.now()}`);
  };

  const handleExportPDF = () => {
    exportToPDF(exportData, columns, `stok-hareketleri-${Date.now()}`, 'Stok Hareketleri Raporu');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <ArrowDownCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Giriş</p>
                <p className="text-2xl font-bold text-success">{stats.totalIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ArrowUpCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Çıkış</p>
                <p className="text-2xl font-bold text-destructive">{stats.totalOut}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.netChange >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {stats.netChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Değişim</p>
                <p className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {stats.netChange > 0 ? '+' : ''}{stats.netChange}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hareket Sayısı</p>
                <p className="text-2xl font-bold">{stats.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Günlük Stok Hareketleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(v) => new Date(v).toLocaleDateString('tr-TR')}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="giris" name="Giriş" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cikis" name="Çıkış" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table with Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">
              Hareket Listesi
              <Badge variant="secondary" className="ml-2">{filteredMovements.length} kayıt</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead>Yapan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.slice(0, 50).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString('tr-TR')}
                      {m.time && <span className="text-muted-foreground ml-1">{m.time}</span>}
                    </TableCell>
                    <TableCell className="font-medium">{m.productName}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'giris' ? 'default' : 'destructive'}>
                        {m.type === 'giris' ? 'Giriş' : 'Çıkış'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{m.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{m.handledBy}</TableCell>
                  </TableRow>
                ))}
                {filteredMovements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Seçilen filtrelere uygun hareket bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredMovements.length > 50 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              İlk 50 kayıt gösteriliyor. Tüm verileri görmek için dışa aktarın.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
