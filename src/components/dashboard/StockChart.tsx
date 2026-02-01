import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StockMovement } from '@/types/stock';

interface StockChartProps {
  movements: StockMovement[];
}

export function StockChart({ movements }: StockChartProps) {
  // Group by date
  const chartData = movements.reduce((acc, movement) => {
    const date = movement.date;
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      if (movement.type === 'giris') {
        existing.giris += movement.quantity;
      } else {
        existing.cikis += movement.quantity;
      }
    } else {
      acc.push({
        date,
        giris: movement.type === 'giris' ? movement.quantity : 0,
        cikis: movement.type === 'cikis' ? movement.quantity : 0,
      });
    }
    
    return acc;
  }, [] as { date: string; giris: number; cikis: number }[]);

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format dates for display
  const formattedData = chartData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
  }));

  return (
    <div className="stat-card h-[350px]">
      <h3 className="text-lg font-semibold text-foreground mb-4">Stok Hareketleri</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Bar 
            dataKey="giris" 
            name="Giriş" 
            fill="hsl(var(--success))" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="cikis" 
            name="Çıkış" 
            fill="hsl(var(--destructive))" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
