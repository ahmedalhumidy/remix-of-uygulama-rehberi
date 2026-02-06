import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Heart, Package, LogOut, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useAuth } from '@/hooks/useAuth';
import { useCartContext } from '@/contexts/CartContext';
import { useAddresses } from '../hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/store/ProductCard';
import type { MarketplaceProduct } from '@/types/marketplace';

export default function CustomerAccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { wishlist } = useCartContext();
  const { addresses, addAddress } = useAddresses();
  const { toast } = useToast();
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ full_name: '', phone: '', city: '', district: '', street_address: '', postal_code: '', label: 'ev' });

  const handleAddAddress = async () => {
    try {
      await addAddress.mutateAsync(newAddr);
      setShowAddrForm(false);
      setNewAddr({ full_name: '', phone: '', city: '', district: '', street_address: '', postal_code: '', label: 'ev' });
      toast({ title: 'Adres eklendi' });
    } catch {
      toast({ title: 'Adres eklenemedi', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Hesabım</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" /> Profil</TabsTrigger>
            <TabsTrigger value="addresses"><MapPin className="h-4 w-4 mr-1" /> Adreslerim</TabsTrigger>
            <TabsTrigger value="wishlist"><Heart className="h-4 w-4 mr-1" /> Favorilerim</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Profil Bilgileri</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>E-posta</Label><Input value={user?.email || ''} disabled /></div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => navigate('/store/orders')}>
                    <Package className="h-4 w-4 mr-2" />Siparişlerim
                  </Button>
                  <Button variant="destructive" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />Çıkış Yap
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="addresses" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Adreslerim</h2>
                <Dialog open={showAddrForm} onOpenChange={setShowAddrForm}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Yeni Adres</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Yeni Adres</DialogTitle></DialogHeader>
                    <div className="grid gap-3 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Ad Soyad</Label><Input value={newAddr.full_name} onChange={e => setNewAddr(p => ({ ...p, full_name: e.target.value }))} /></div>
                        <div><Label>Telefon</Label><Input value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Şehir</Label><Input value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} /></div>
                        <div><Label>İlçe</Label><Input value={newAddr.district} onChange={e => setNewAddr(p => ({ ...p, district: e.target.value }))} /></div>
                      </div>
                      <div><Label>Adres</Label><Textarea value={newAddr.street_address} onChange={e => setNewAddr(p => ({ ...p, street_address: e.target.value }))} rows={2} /></div>
                      <Button onClick={handleAddAddress} disabled={addAddress.isPending}>Kaydet</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {addresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Henüz adres eklenmemiş</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <Card key={addr.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{addr.full_name}</span>
                          {addr.is_default && <Badge variant="secondary" className="text-xs">Varsayılan</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{addr.street_address}</p>
                        <p className="text-sm text-muted-foreground">{addr.district && `${addr.district}, `}{addr.city}</p>
                        <p className="text-sm text-muted-foreground mt-1">{addr.phone}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist" className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Favorilerim ({wishlist.length})</h2>
            {wishlist.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Favorilere ürün eklenmemiş</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {wishlist.map(item => {
                  const product = item.product as MarketplaceProduct | undefined;
                  if (!product) return null;
                  return (
                    <ProductCard
                      key={item.id}
                      product={product}
                      onViewDetails={(p) => navigate(`/store/products/${p.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
