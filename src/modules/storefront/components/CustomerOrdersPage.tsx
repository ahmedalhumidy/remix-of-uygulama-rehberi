import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useCustomerOrders } from '../hooks/useOrders';
import type { MarketplaceProduct } from '@/types/marketplace';

const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
  pending: { label: 'Beklemede', variant: 'secondary', icon: Clock },
  confirmed: { label: 'Onaylandı', variant: 'default', icon: CheckCircle },
  processing: { label: 'Hazırlanıyor', variant: 'default', icon: Package },
  shipped: { label: 'Kargoda', variant: 'default', icon: Truck },
  delivered: { label: 'Teslim Edildi', variant: 'secondary', icon: CheckCircle },
  cancelled: { label: 'İptal', variant: 'destructive', icon: XCircle },
  refunded: { label: 'İade Edildi', variant: 'outline', icon: XCircle },
};

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const { orders, isLoading } = useCustomerOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="container py-6 space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" /> Siparişlerim
          </h1>
          <Button variant="outline" onClick={() => navigate('/store/account')}>Hesabım</Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Henüz siparişiniz yok</h2>
            <p className="text-muted-foreground mb-4">Alışverişe başlayarak ilk siparişinizi oluşturun.</p>
            <Button onClick={() => navigate('/store')}>Mağazaya Git</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const status = statusMap[order.status || 'pending'] || statusMap.pending;
              const StatusIcon = status.icon;
              const items = (order as any).items || [];

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium">Sipariş #{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={status.variant as any} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <span className="font-semibold">₺{(order.total_amount ?? 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {items.slice(0, 4).map((item: any) => {
                          const product = item.product as MarketplaceProduct | undefined;
                          return (
                            <div key={item.id} className="flex items-center gap-3 min-w-[200px]">
                              <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                                <img
                                  src={(product?.images as string[])?.[0] || '/placeholder.svg'}
                                  alt={product?.urun_adi || ''}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{product?.urun_adi || 'Ürün'}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} adet</p>
                              </div>
                            </div>
                          );
                        })}
                        {items.length > 4 && (
                          <span className="text-sm text-muted-foreground self-center">+{items.length - 4} ürün</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
