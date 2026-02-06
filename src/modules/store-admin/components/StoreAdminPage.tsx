import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Tag, MessageSquare, Package, BarChart3,
  Plus, Edit, Trash2, Check, X, Star, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PromotionRule } from '@/modules/storefront/types';

export default function StoreAdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Mağaza Yönetim Merkezi</h1>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4 mr-1" /> Genel</TabsTrigger>
            <TabsTrigger value="promotions"><Tag className="h-4 w-4 mr-1" /> Promosyonlar</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare className="h-4 w-4 mr-1" /> Yorumlar</TabsTrigger>
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-1" /> Siparişler</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="promotions"><PromotionsTab /></TabsContent>
          <TabsContent value="reviews"><ReviewsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ['store-admin-stats'],
    queryFn: async () => {
      const [products, orders, reviews] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('orders').select('id, total_amount', { count: 'exact' }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
      ]);
      const totalRevenue = (orders.data || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      return {
        products: products.count || 0,
        orders: orders.count || 0,
        reviews: reviews.count || 0,
        revenue: totalRevenue,
      };
    },
  });

  const cards = [
    { label: 'Yayında Ürün', value: stats?.products || 0, icon: Package },
    { label: 'Toplam Sipariş', value: stats?.orders || 0, icon: Package },
    { label: 'Değerlendirme', value: stats?.reviews || 0, icon: Star },
    { label: 'Toplam Gelir', value: `₺${(stats?.revenue || 0).toFixed(0)}`, icon: BarChart3 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg"><c.icon className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PromotionsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', promotion_type: 'coupon', code: '',
    discount_type: 'percentage', discount_value: '10', min_order_amount: '0',
    max_discount_amount: '', usage_limit: '',
  });

  const { data: promos } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('promotion_rules').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PromotionRule[];
    },
  });

  const createPromo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('promotion_rules').insert({
        name: form.name,
        description: form.description || null,
        promotion_type: form.promotion_type,
        code: form.code ? form.code.toUpperCase() : null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      setShowForm(false);
      toast({ title: 'Promosyon oluşturuldu' });
    },
  });

  const togglePromo = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('promotion_rules').update({ is_active: active }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Promosyonlar & Kuponlar</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Yeni Promosyon</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Yeni Promosyon</DialogTitle></DialogHeader>
            <div className="grid gap-3 mt-2">
              <div><Label>Ad</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Tür</Label>
                <Select value={form.promotion_type} onValueChange={v => setForm(p => ({ ...p, promotion_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coupon">Kupon Kodu</SelectItem>
                    <SelectItem value="cart_threshold">Sepet Eşik İndirimi</SelectItem>
                    <SelectItem value="category_discount">Kategori İndirimi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.promotion_type === 'coupon' && (
                <div><Label>Kupon Kodu</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="INDIRIM20" /></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>İndirim Tipi</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm(p => ({ ...p, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>İndirim Değeri</Label><Input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Min. Sipariş (₺)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))} /></div>
                <div><Label>Kullanım Limiti</Label><Input type="number" value={form.usage_limit} onChange={e => setForm(p => ({ ...p, usage_limit: e.target.value }))} placeholder="Sınırsız" /></div>
              </div>
              <Button onClick={() => createPromo.mutate()} disabled={createPromo.isPending || !form.name}>Oluştur</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Kod</TableHead>
            <TableHead>İndirim</TableHead>
            <TableHead>Kullanım</TableHead>
            <TableHead>Aktif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(promos || []).map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell><Badge variant="outline">{p.promotion_type}</Badge></TableCell>
              <TableCell>{p.code || '-'}</TableCell>
              <TableCell>{p.discount_type === 'percentage' ? `%${p.discount_value}` : `₺${p.discount_value}`}</TableCell>
              <TableCell>{p.usage_count}{p.usage_limit ? `/${p.usage_limit}` : ''}</TableCell>
              <TableCell>
                <Switch checked={p.is_active} onCheckedChange={(v) => togglePromo.mutate({ id: p.id, active: v })} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReviewsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reviews } = useQuery({
    queryKey: ['admin-all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, product:products(urun_adi)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const approveReview = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      await supabase.from('reviews').update({ is_approved: approved }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-reviews'] });
      toast({ title: 'Yorum güncellendi' });
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Yorum Moderasyonu</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ürün</TableHead>
            <TableHead>Puan</TableHead>
            <TableHead>Yorum</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(reviews || []).map((r: any) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium max-w-[150px] truncate">{r.product?.urun_adi || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{r.comment || '-'}</TableCell>
              <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString('tr-TR')}</TableCell>
              <TableCell>
                <Badge variant={r.is_approved ? 'default' : 'secondary'}>
                  {r.is_approved ? 'Onaylı' : 'Bekliyor'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {!r.is_approved && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => approveReview.mutate({ id: r.id, approved: true })}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {r.is_approved && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => approveReview.mutate({ id: r.id, approved: false })}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrdersTab() {
  const { data: orders } = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(quantity)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const statusLabels: Record<string, string> = {
    pending: 'Beklemede', confirmed: 'Onaylandı', processing: 'Hazırlanıyor',
    shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sipariş Yönetimi</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sipariş No</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>Ürün Adedi</TableHead>
            <TableHead>Tutar</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(orders || []).map((o: any) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">#{o.order_number}</TableCell>
              <TableCell>{new Date(o.created_at).toLocaleDateString('tr-TR')}</TableCell>
              <TableCell>{(o.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)}</TableCell>
              <TableCell>₺{(o.total_amount || 0).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant="outline">{statusLabels[o.status] || o.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
