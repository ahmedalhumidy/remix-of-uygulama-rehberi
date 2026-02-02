import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, FileText, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Product, StockMovement } from '@/types/stock';
import { ReportFilterValues } from './ReportFilters';
import { exportToExcel, exportToPDF } from './exportUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProductActivityReportProps {
  products: Product[];
  movements: StockMovement[];
  filters: ReportFilterValues;
}

export function ProductActivityReport({ products, movements, filters }: ProductActivityReportProps) {
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (filters.dateFrom && m.date < filters.dateFrom) return false;
      if (filters.dateTo && m.date > filters.dateTo) return false;
      if (filters.productId && m.productId !== filters.productId) return false;
      return true;
    });
  }, [movements, filters]);

  const productStats = useMemo(() => {
    const stats: Record<string, { 
      id: string;
      name: string;
      totalIn: number;
      totalOut: number;
      movementCount: number;
      currentStock: number;
      minStock: number;
      isLowStock: boolean;
    }> = {};
    
    products.forEach(p => {
      stats[p.id] = {
        id: p.id,
        name: p.urunAdi,
        totalIn: 0,
        totalOut: 0,
        movementCount: 0,
        currentStock: p.mevcutStok,
        minStock: p.minStok,
        isLowStock: p.mevcutStok < p.minStok,
      };
    });
    
    filteredMovements.forEach(m => {
      if (stats[m.productId]) {
        stats[m.productId].movementCount++;
        if (m.type === 'giris') {
          stats[m.productId].totalIn += m.quantity;
        } else {
          stats[m.productId].totalOut += m.quantity;
        }
      }
    });
    
    return Object.values(stats).sort((a, b) => b.movementCount - a.movementCount);
  }, [products, filteredMovements]);

  const topActiveProducts = useMemo(() => {
    return productStats
      .filter(p => p.movementCount > 0)
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        fullName: p.name,
        hareketler: p.movementCount,
        giris: p.totalIn,
        cikis: p.totalOut,
      }));
  }, [productStats]);

  const lowStockProducts = useMemo(() => {
    return productStats.filter(p => p.isLowStock);
  }, [productStats]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.mevcutStok, 0);
  }, [products]);

  const exportData = useMemo(() => {
    return productStats.map(p => ({
      name: p.name,
      currentStock: p.currentStock,
      minStock: p.minStock,
      totalIn: p.totalIn,
      totalOut: p.totalOut,
      movementCount: p.movementCount,
      status: p.isLowStock ? 'Düşük Stok' : 'Normal',
    }));
  }, [productStats]);

  const columns = [
    { header: 'Ürün Adı', key: 'name', width: 25 },
    { header: 'Mevcut Stok', key: 'currentStock', width: 12 },
    { header: 'Min. Stok', key: 'minStock', width: 12 },
    { header: 'Toplam Giriş', key: 'totalIn', width: 12 },
    { header: 'Toplam Çıkış', key: 'totalOut', width: 12 },
    { header: 'Hareket Sayısı', key: 'movementCount', width: 14 },
    { header: 'Durum', key: 'status', width: 12 },
  ];

  const handleExportExcel = () => {
    exportToExcel(exportData, columns, `urun-aktivite-${Date.now()}`);
  };

  const handleExportPDF = () => {
    exportToPDF(exportData, columns, `urun-aktivite-${Date.now()}`, 'Ürün Aktivite Raporu');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Ürün</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Stok</p>
                <p className="text-2xl font-bold text-success">{totalStockValue.toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Düşük Stok</p>
                <p className="text-2xl font-bold text-destructive">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktif Ürün</p>
                <p className="text-2xl font-bold">{productStats.filter(p => p.movementCount > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Active Products Chart */}
      {topActiveProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En Aktif Ürünler (Hareket Sayısına Göre)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topActiveProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'hareketler' ? 'Hareket' : name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="hareketler" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Düşük Stok Riski Olan Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.slice(0, 6).map((p) => (
                <div key={p.id} className="p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Mevcut: {p.currentStock}</span>
                    <span className="text-xs text-muted-foreground">Min: {p.minStock}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table with Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">
              Ürün Aktivite Listesi
              <Badge variant="secondary" className="ml-2">{productStats.length} ürün</Badge>
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
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Mevcut</TableHead>
                  <TableHead className="text-right">Giriş</TableHead>
                  <TableHead className="text-right">Çıkış</TableHead>
                  <TableHead className="text-right">Hareket</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productStats.slice(0, 50).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.currentStock}</TableCell>
                    <TableCell className="text-right text-success">{p.totalIn}</TableCell>
                    <TableCell className="text-right text-destructive">{p.totalOut}</TableCell>
                    <TableCell className="text-right">{p.movementCount}</TableCell>
                    <TableCell>
                      <Badge variant={p.isLowStock ? 'destructive' : 'outline'}>
                        {p.isLowStock ? 'Düşük' : 'Normal'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
