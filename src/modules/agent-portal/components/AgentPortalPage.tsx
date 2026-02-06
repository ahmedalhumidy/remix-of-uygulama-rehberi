import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Package, CreditCard, TrendingUp,
  ShieldCheck, Star, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrders } from '@/modules/storefront/hooks/useOrders';
import { AGENT_TIERS } from '../types';

export default function AgentPortalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useCustomerOrders();

  // Determine agent tier based on order count
  const orderCount = orders.length;
  const currentTier = orderCount >= 100 ? 'platinum'
    : orderCount >= 50 ? 'gold'
    : orderCount >= 10 ? 'silver'
    : 'bronze';

  const tier = AGENT_TIERS[currentTier];
  const totalSpent = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0);

  // Next tier progress
  const nextTierKey = currentTier === 'bronze' ? 'silver'
    : currentTier === 'silver' ? 'gold'
    : currentTier === 'gold' ? 'platinum'
    : null;
  const nextTier = nextTierKey ? AGENT_TIERS[nextTierKey] : null;
  const progressToNext = nextTier
    ? Math.min(100, (orderCount / nextTier.minOrders) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Bayi Portalı</h1>
          <Badge variant="secondary" className="ml-auto">{tier.label} Bayi</Badge>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Tier Card */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{tier.label} Seviye</h2>
                <p className="text-sm text-muted-foreground">%{tier.discount} bayi indirimi</p>
              </div>
            </div>
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sonraki seviye: {nextTier.label}</span>
                  <span>{orderCount}/{nextTier.minOrders} sipariş</span>
                </div>
                <Progress value={progressToNext} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Sipariş', value: orderCount, icon: Package },
            { label: 'Toplam Harcama', value: `₺${totalSpent.toFixed(0)}`, icon: CreditCard },
            { label: 'İndirim Oranı', value: `%${tier.discount}`, icon: TrendingUp },
            { label: 'Durum', value: 'Aktif', icon: ShieldCheck },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><c.icon className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-lg font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Henüz sipariş yok</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">#{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₺{(o.total_amount ?? 0).toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => navigate('/store')} className="flex-1">
            <Package className="h-4 w-4 mr-2" /> Sipariş Ver
          </Button>
          <Button variant="outline" onClick={() => navigate('/store/orders')}>
            Tüm Siparişler
          </Button>
        </div>
      </main>
    </div>
  );
}
