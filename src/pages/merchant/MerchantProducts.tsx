 import { useState } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { 
   Package, 
   Plus, 
   Search, 
   MoreHorizontal,
   Edit,
   Trash2,
   Eye,
   EyeOff,
   Store,
   ArrowLeft
 } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { useMyStore } from '@/hooks/useMarketplace';
 import { useAuth } from '@/hooks/useAuth';
 import { supabase } from '@/integrations/supabase/client';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { toast } from 'sonner';
 
 export default function MerchantProducts() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { data: store } = useMyStore();
   const [searchQuery, setSearchQuery] = useState('');
 
   const { data: products, isLoading } = useQuery({
     queryKey: ['merchant-products', store?.id],
     queryFn: async () => {
       if (!store) return [];
 
       const { data, error } = await supabase
         .from('products')
         .select('*')
         .eq('store_id', store.id)
         .eq('is_deleted', false)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       return data;
     },
     enabled: !!store,
   });
 
   const togglePublish = useMutation({
     mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
       const { error } = await supabase
         .from('products')
         .update({ is_published: !is_published })
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
       toast.success('Ürün durumu güncellendi');
     },
   });
 
   const deleteProduct = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('products')
         .update({ is_deleted: true, deleted_at: new Date().toISOString() })
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
       toast.success('Ürün silindi');
     },
   });
 
   const filteredProducts = products?.filter(p =>
     p.urun_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.urun_kodu.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   if (!store) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Card className="max-w-md w-full mx-4">
           <CardContent className="pt-6 text-center">
             <p>Önce mağaza oluşturmanız gerekiyor.</p>
             <Button className="mt-4" onClick={() => navigate('/merchant')}>
               Dashboard'a Dön
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
             <Button variant="ghost" size="icon" onClick={() => navigate('/merchant')}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <h1 className="font-bold text-xl">Ürünlerim</h1>
           </div>
           <Button onClick={() => navigate('/merchant/products/new')}>
             <Plus className="mr-2 h-4 w-4" />
             Yeni Ürün
           </Button>
         </div>
       </header>
 
       <main className="container py-6">
         <Card>
           <CardHeader>
             <div className="flex items-center justify-between">
               <CardTitle>Tüm Ürünler ({filteredProducts?.length || 0})</CardTitle>
               <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Ürün ara..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9"
                 />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <div className="text-center py-8">Yükleniyor...</div>
             ) : filteredProducts && filteredProducts.length > 0 ? (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Ürün</TableHead>
                     <TableHead>Kod</TableHead>
                     <TableHead>Fiyat</TableHead>
                     <TableHead>Stok</TableHead>
                     <TableHead>Durum</TableHead>
                     <TableHead className="text-right">İşlemler</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredProducts.map((product) => (
                     <TableRow key={product.id}>
                       <TableCell>
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                             {product.images?.[0] ? (
                               <img 
                                 src={product.images[0]} 
                                 alt={product.urun_adi}
                                 className="w-full h-full object-cover rounded"
                               />
                             ) : (
                               <Package className="h-5 w-5 text-muted-foreground" />
                             )}
                           </div>
                           <span className="font-medium">{product.urun_adi}</span>
                         </div>
                       </TableCell>
                       <TableCell>{product.urun_kodu}</TableCell>
                       <TableCell>
                         {product.sale_price ? (
                           <div>
                             <span className="font-medium">₺{product.sale_price}</span>
                             <span className="text-sm text-muted-foreground line-through ml-2">
                               ₺{product.price}
                             </span>
                           </div>
                         ) : (
                           <span>₺{product.price}</span>
                         )}
                       </TableCell>
                       <TableCell>
                         <Badge variant={product.mevcut_stok <= product.min_stok ? 'destructive' : 'secondary'}>
                           {product.mevcut_stok}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <Badge variant={product.is_published ? 'default' : 'outline'}>
                           {product.is_published ? 'Yayında' : 'Taslak'}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-right">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => navigate(`/merchant/products/${product.id}/edit`)}>
                               <Edit className="mr-2 h-4 w-4" />
                               Düzenle
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => togglePublish.mutate({ 
                                 id: product.id, 
                                 is_published: product.is_published 
                               })}
                             >
                               {product.is_published ? (
                                 <>
                                   <EyeOff className="mr-2 h-4 w-4" />
                                   Yayından Kaldır
                                 </>
                               ) : (
                                 <>
                                   <Eye className="mr-2 h-4 w-4" />
                                   Yayınla
                                 </>
                               )}
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem 
                               className="text-destructive"
                               onClick={() => {
                                 if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                                   deleteProduct.mutate(product.id);
                                 }
                               }}
                             >
                               <Trash2 className="mr-2 h-4 w-4" />
                               Sil
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             ) : (
               <div className="text-center py-12">
                 <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                 <p className="text-lg font-medium">Henüz ürün yok</p>
                 <p className="text-sm text-muted-foreground mt-1 mb-4">
                   İlk ürününüzü ekleyerek satışa başlayın
                 </p>
                 <Button onClick={() => navigate('/merchant/products/new')}>
                   <Plus className="mr-2 h-4 w-4" />
                   Ürün Ekle
                 </Button>
               </div>
             )}
           </CardContent>
         </Card>
       </main>
     </div>
   );
 }