import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Server, Database, Users, Package, ArrowLeftRight, HardDrive, Download, Loader2 } from 'lucide-react';

interface SystemStats {
  totalProducts: number;
  totalMovements: number;
  totalUsers: number;
  activeUsers: number;
  archivedProducts: number;
  lowStockProducts: number;
}

export function SystemInfo() {
  const [stats, setStats] = useState<SystemStats>({
    totalProducts: 0,
    totalMovements: 0,
    totalUsers: 0,
    activeUsers: 0,
    archivedProducts: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false);

        // Fetch archived products
        const { count: archivedCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', true);

        // Fetch low stock products
        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)
          .eq('uyari', true);

        // Fetch movements count
        const { count: movementsCount } = await supabase
          .from('stock_movements')
          .select('*', { count: 'exact', head: true });

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch active users (not disabled)
        const { count: activeCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_disabled', false);

        setStats({
          totalProducts: productsCount || 0,
          totalMovements: movementsCount || 0,
          totalUsers: usersCount || 0,
          activeUsers: activeCount || 0,
          archivedProducts: archivedCount || 0,
          lowStockProducts: lowStockCount || 0,
        });
      } catch (error) {
        console.error('Error fetching system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      // Fetch all data
      const [productsRes, movementsRes, usersRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_deleted', false),
        supabase.from('stock_movements').select('*'),
        supabase.from('profiles').select('user_id, full_name, created_at, is_disabled'),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        products: productsRes.data || [],
        movements: movementsRes.data || [],
        users: usersRes.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    { label: 'Toplam Ürün', value: stats.totalProducts, icon: Package, color: 'text-blue-500' },
    { label: 'Arşivli Ürün', value: stats.archivedProducts, icon: HardDrive, color: 'text-gray-500' },
    { label: 'Düşük Stoklu', value: stats.lowStockProducts, icon: Package, color: 'text-orange-500' },
    { label: 'Stok Hareketi', value: stats.totalMovements, icon: ArrowLeftRight, color: 'text-green-500' },
    { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users, color: 'text-purple-500' },
    { label: 'Aktif Kullanıcı', value: stats.activeUsers, icon: Users, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* System Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Sistem İstatistikleri
          </CardTitle>
          <CardDescription>
            Sistemdeki kaynak kullanımı ve veritabanı istatistikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="p-4 rounded-lg border bg-muted/30 text-center">
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sistem Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Uygulama Versiyonu</p>
              <p className="font-mono font-medium">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Platform</p>
              <p className="font-medium">Lovable Cloud</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Veritabanı</p>
              <div className="flex items-center gap-2">
                <Badge variant="default">PostgreSQL</Badge>
                <Badge variant="outline">Supabase</Badge>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Çalışma Durumu</p>
              <Badge variant="default" className="bg-green-500">
                <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
                Çalışıyor
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Yedekleme & Dışa Aktarma
          </CardTitle>
          <CardDescription>
            Tüm sistem verilerini JSON formatında dışa aktarın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportAll} disabled={exporting}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Tüm Verileri Dışa Aktar (JSON)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Ürünler, stok hareketleri ve kullanıcı bilgilerini içerir
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
