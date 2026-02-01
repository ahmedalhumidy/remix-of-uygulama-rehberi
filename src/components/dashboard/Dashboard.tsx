import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StatCard } from './StatCard';
import { StockChart } from './StockChart';
import { RecentMovements } from './RecentMovements';
import { LowStockList } from './LowStockList';
import { Product, StockMovement } from '@/types/stock';

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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="Stok Girişi"
          value={totalIn.toLocaleString('tr-TR')}
          icon={ArrowUpRight}
          variant="success"
        />
        <StatCard
          title="Düşük Stok Uyarısı"
          value={lowStockCount}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <StockChart movements={movements} />
        </div>

        {/* Recent Movements */}
        <div>
          <RecentMovements movements={movements.slice(0, 5)} />
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <LowStockList products={lowStockProducts} onViewProduct={onViewProduct} />
      )}
    </div>
  );
}
