import { useMemo } from 'react';
import { Package, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Users, Activity } from 'lucide-react';
import { StatCard } from './StatCard';
import { RecentMovements } from './RecentMovements';
import { LowStockList } from './LowStockList';
import { Product, StockMovement } from '@/types/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  products: Product[];
  movements: StockMovement[];
  onViewProduct: (id: string) => void;
}

export function Dashboard({ products, movements, onViewProduct }: DashboardProps) {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.mevcutStok, 0);
  const lowStockProducts = products.filter(p => p.mevcutStok < p.minStok);
  const lowStockCount = lowStockProducts.length;
  
  const totalIn = movements.filter(m => m.type === 'giris').reduce((sum, m) => sum + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === 'cikis').reduce((sum, m) => sum + m.quantity, 0);

  // Today's movements
  const today = new Date().toISOString().split('T')[0];
  const todayMovements = movements.filter(m => m.date === today);
  const todayIn = todayMovements.filter(m => m.type === 'giris').reduce((sum, m) => sum + m.quantity, 0);
  const todayOut = todayMovements.filter(m => m.type === 'cikis').reduce((sum, m) => sum + m.quantity, 0);

  // Weekly data for chart
  const weeklyData = useMemo(() => {
    const days: Record<string, { date: string; giris: number; cikis: number }> = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = { date: dateStr, giris: 0, cikis: 0 };
    }
    
    movements.forEach(m => {
      if (days[m.date]) {
        if (m.type === 'giris') {
          days[m.date].giris += m.quantity;
        } else {
          days[m.date].cikis += m.quantity;
        }
      }
    });
    
    return Object.values(days);
  }, [movements]);

  // Most active products
  const mostActiveProducts = useMemo(() => {
    const activity: Record<string, { id: string; name: string; count: number; totalQty: number }> = {};
    
    movements.forEach(m => {
      if (!activity[m.productId]) {
        activity[m.productId] = { id: m.productId, name: m.productName, count: 0, totalQty: 0 };
      }
      activity[m.productId].count++;
      activity[m.productId].totalQty += m.quantity;
    });
    
    return Object.values(activity).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [movements]);

  // User activity
  const userActivity = useMemo(() => {
    const activity: Record<string, { name: string; count: number }> = {};
    
    movements.forEach(m => {
      if (!activity[m.handledBy]) {
        activity[m.handledBy] = { name: m.handledBy, count: 0 };
      }
      activity[m.handledBy].count++;
    });
    
    return Object.values(activity).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [movements]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Toplam Ürün"
          value={totalProducts}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Toplam Stok"
          value={totalStock.toLocaleString('tr-TR')}
          icon={TrendingUp}
          variant="accent"
        />
        <StatCard
          title="Toplam Giriş"
          value={totalIn.toLocaleString('tr-TR')}
          icon={ArrowUpRight}
          variant="success"
        />
        <StatCard
          title="Toplam Çıkış"
          value={totalOut.toLocaleString('tr-TR')}
          icon={ArrowDownRight}
          variant="warning"
        />
        <StatCard
          title="Bugün Hareket"
          value={todayMovements.length}
          icon={Activity}
          variant="accent"
        />
        <StatCard
          title="Düşük Stok"
          value={lowStockCount}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bugünkü Giriş</p>
                <p className="text-2xl font-bold text-success">+{todayIn}</p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <ArrowUpRight className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bugünkü Çıkış</p>
                <p className="text-2xl font-bold text-destructive">-{todayOut}</p>
              </div>
              <div className="p-3 rounded-full bg-destructive/10">
                <ArrowDownRight className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bugünkü Net</p>
                <p className={`text-2xl font-bold ${todayIn - todayOut >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {todayIn - todayOut >= 0 ? '+' : ''}{todayIn - todayOut}
                </p>
              </div>
              <div className={`p-3 rounded-full ${todayIn - todayOut >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <TrendingUp className={`w-6 h-6 ${todayIn - todayOut >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Haftalık Stok Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(v) => new Date(v).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
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

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Active Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              En Aktif Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostActiveProducts.map((p, i) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onViewProduct(p.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-primary text-primary-foreground' : 
                      i === 1 ? 'bg-secondary text-secondary-foreground' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[120px]">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.totalQty} adet</p>
                    </div>
                  </div>
                  <Badge variant="outline">{p.count} hareket</Badge>
                </div>
              ))}
              {mostActiveProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz hareket yok</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Activity Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kullanıcı Aktivitesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userActivity.map((u, i) => (
                <div key={u.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-medium truncate max-w-[120px]">{u.name}</p>
                  </div>
                  <Badge variant="secondary">{u.count}</Badge>
                </div>
              ))}
              {userActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz aktivite yok</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <RecentMovements movements={movements.slice(0, 5)} />
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <LowStockList products={lowStockProducts} onViewProduct={onViewProduct} />
      )}
    </div>
  );
}
