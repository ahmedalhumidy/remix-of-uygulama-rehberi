 import { useState } from 'react';
 import { Link, useNavigate, useLocation } from 'react-router-dom';
 import { 
   LayoutDashboard, 
   Package, 
   ShoppingBag, 
   DollarSign, 
   Settings,
   TrendingUp,
   TrendingDown,
   Store,
   ChevronRight,
   LogOut,
   Plus,
   Eye,
   Clock
 } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useAuth } from '@/hooks/useAuth';
 import { useMyStore } from '@/hooks/useMarketplace';
 import { supabase } from '@/integrations/supabase/client';
 import { useQuery } from '@tanstack/react-query';
 
 export default function MerchantDashboard() {
   const { user, signOut } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const { data: store, isLoading: storeLoading } = useMyStore();
 
   // Fetch merchant stats
   const { data: stats } = useQuery({
     queryKey: ['merchant-stats', store?.id],
     queryFn: async () => {
       if (!store) return null;
 
       // Get products count
       const { count: productsCount } = await supabase
         .from('products')
         .select('*', { count: 'exact', head: true })
         .eq('store_id', store.id)
         .eq('is_deleted', false);
 
       // Get orders with this store's products
       const { data: orderItems } = await supabase
         .from('order_items')
         .select('total_price, status, order_id')
         .eq('store_id', store.id);
 
       const uniqueOrders = new Set(orderItems?.map(item => item.order_id) || []);
       const pendingOrders = orderItems?.filter(item => item.status === 'pending').length || 0;
       const totalRevenue = orderItems?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;
 
       return {
         totalProducts: productsCount || 0,
         totalOrders: uniqueOrders.size,
         pendingOrders,
         totalRevenue,
       };
     },
     enabled: !!store,
   });
 
   const navItems = [
     { path: '/merchant', icon: LayoutDashboard, label: 'Dashboard' },
     { path: '/merchant/products', icon: Package, label: 'Ürünlerim' },
     { path: '/merchant/orders', icon: ShoppingBag, label: 'Siparişler' },
     { path: '/merchant/earnings', icon: DollarSign, label: 'Kazançlar' },
     { path: '/merchant/settings', icon: Settings, label: 'Mağaza Ayarları' },
   ];
 
   if (storeLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
     );
   }
 
   if (!store) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-muted/30">
         <Card className="max-w-md w-full mx-4">
           <CardHeader className="text-center">
             <Store className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
             <CardTitle>Mağazanız Yok</CardTitle>
           </CardHeader>
           <CardContent className="text-center space-y-4">
             <p className="text-muted-foreground">
               Satıcı olmak için mağaza oluşturmanız gerekiyor.
             </p>
             <Button onClick={() => navigate('/merchant/create-store')}>
               <Plus className="mr-2 h-4 w-4" />
               Mağaza Oluştur
             </Button>
             <Button variant="outline" className="ml-2" onClick={() => navigate('/store')}>
               Mağazaya Dön
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-muted/30">
       {/* Header */}
       <header className="sticky top-0 z-50 w-full border-b bg-background">
         <div className="container flex h-16 items-center justify-between">
           <div className="flex items-center gap-4">
             <Link to="/merchant" className="flex items-center gap-2 font-bold text-xl">
               <Store className="h-6 w-6 text-primary" />
               <span>{store.store_name}</span>
             </Link>
             {store.is_verified && (
               <Badge variant="secondary">✓ Onaylı</Badge>
             )}
           </div>
           
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => navigate('/store')}>
               <Eye className="mr-2 h-4 w-4" />
               Mağazayı Gör
             </Button>
             <Button variant="ghost" size="icon" onClick={signOut}>
               <LogOut className="h-5 w-5" />
             </Button>
           </div>
         </div>
       </header>
 
       <div className="flex">
         {/* Sidebar */}
         <aside className="hidden md:block w-64 border-r bg-background min-h-[calc(100vh-4rem)]">
           <nav className="p-4 space-y-1">
             {navItems.map((item) => (
               <Link
                 key={item.path}
                 to={item.path}
                 className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                   location.pathname === item.path
                     ? 'bg-primary text-primary-foreground'
                     : 'hover:bg-muted'
                 }`}
               >
                 <item.icon className="h-5 w-5" />
                 {item.label}
               </Link>
             ))}
           </nav>
         </aside>
 
         {/* Main Content */}
         <main className="flex-1 p-6">
           <div className="max-w-6xl mx-auto space-y-6">
             {/* Welcome */}
             <div>
               <h1 className="text-2xl font-bold">Hoş Geldiniz!</h1>
               <p className="text-muted-foreground">
                 {store.store_name} mağazanızın özeti
               </p>
             </div>
 
             {/* Stats Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Card>
                 <CardContent className="pt-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-muted-foreground">Toplam Ürün</p>
                       <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
                     </div>
                     <Package className="h-8 w-8 text-muted-foreground" />
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardContent className="pt-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                       <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                     </div>
                     <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardContent className="pt-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-muted-foreground">Bekleyen Sipariş</p>
                       <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
                     </div>
                     <Clock className="h-8 w-8 text-muted-foreground" />
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardContent className="pt-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                       <p className="text-2xl font-bold">₺{stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
                     </div>
                     <DollarSign className="h-8 w-8 text-muted-foreground" />
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Quick Actions */}
             <div className="grid md:grid-cols-2 gap-4">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   <Button 
                     className="w-full justify-start" 
                     variant="outline"
                     onClick={() => navigate('/merchant/products/new')}
                   >
                     <Plus className="mr-2 h-4 w-4" />
                     Yeni Ürün Ekle
                   </Button>
                   <Button 
                     className="w-full justify-start" 
                     variant="outline"
                     onClick={() => navigate('/merchant/orders')}
                   >
                     <ShoppingBag className="mr-2 h-4 w-4" />
                     Siparişleri Görüntüle
                   </Button>
                   <Button 
                     className="w-full justify-start" 
                     variant="outline"
                     onClick={() => navigate('/merchant/settings')}
                   >
                     <Settings className="mr-2 h-4 w-4" />
                     Mağaza Ayarları
                   </Button>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Mağaza Durumu</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Mağaza Durumu</span>
                     <Badge variant={store.is_active ? 'default' : 'secondary'}>
                       {store.is_active ? 'Aktif' : 'Pasif'}
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Doğrulama</span>
                     <Badge variant={store.is_verified ? 'default' : 'outline'}>
                       {store.is_verified ? 'Onaylı' : 'Onay Bekliyor'}
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Komisyon Oranı</span>
                     <span className="font-medium">%{store.commission_rate}</span>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
         </main>
       </div>
     </div>
   );
 }