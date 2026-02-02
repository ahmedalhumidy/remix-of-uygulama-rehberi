import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, RotateCcw, Search, Loader2, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ArchivedProduct {
  id: string;
  urun_kodu: string;
  urun_adi: string;
  raf_konum: string;
  mevcut_stok: number;
  deleted_at: string;
  deleted_by: string | null;
  deleter_name?: string;
}

export function ArchiveManagement() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<ArchivedProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManageProducts = hasPermission('products.delete');

  const fetchArchivedProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, urun_kodu, urun_adi, raf_konum, mevcut_stok, deleted_at, deleted_by')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      // Fetch deleter names
      const deleterIds = [...new Set((data || []).filter(p => p.deleted_by).map(p => p.deleted_by))];
      let deleterMap = new Map<string, string>();
      
      if (deleterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', deleterIds);
        
        deleterMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      }

      const enrichedProducts = (data || []).map(product => ({
        ...product,
        deleter_name: product.deleted_by ? deleterMap.get(product.deleted_by) : undefined,
      })) as ArchivedProduct[];

      setArchivedProducts(enrichedProducts);
    } catch (error) {
      console.error('Error fetching archived products:', error);
      toast.error('Arşivlenmiş ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  const restoreProduct = async (productId: string) => {
    setRestoring(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_deleted: false, 
          deleted_at: null, 
          deleted_by: null 
        })
        .eq('id', productId);

      if (error) throw error;

      setArchivedProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Ürün geri yüklendi');
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('Ürün geri yüklenemedi');
    } finally {
      setRestoring(null);
    }
  };

  const permanentDelete = async (product: ArchivedProduct) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      setArchivedProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Ürün kalıcı olarak silindi');
    } catch (error) {
      console.error('Error permanently deleting product:', error);
      toast.error('Ürün silinemedi');
    } finally {
      setDeleting(false);
      setPermanentDeleteConfirm(null);
    }
  };

  const filteredProducts = archivedProducts.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.urun_kodu.toLowerCase().includes(query) ||
      p.urun_adi.toLowerCase().includes(query)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5" />
          Arşiv Yönetimi
        </CardTitle>
        <CardDescription>
          Silinen ürünleri görüntüleyin, geri yükleyin veya kalıcı olarak silin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Arşivlenmiş ürün bulunmuyor</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Kodu</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Silinme Tarihi</TableHead>
                  <TableHead>Silen</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.urun_kodu}</TableCell>
                    <TableCell>{product.urun_adi}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.raf_konum}</Badge>
                    </TableCell>
                    <TableCell>{product.mevcut_stok}</TableCell>
                    <TableCell>
                      {product.deleted_at && format(new Date(product.deleted_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </TableCell>
                    <TableCell>{product.deleter_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreProduct(product.id)}
                          disabled={restoring === product.id}
                        >
                          {restoring === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 mr-1" />
                          )}
                          Geri Yükle
                        </Button>
                        {canManageProducts && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPermanentDeleteConfirm(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!permanentDeleteConfirm} onOpenChange={() => setPermanentDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kalıcı Silme</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{permanentDeleteConfirm?.urun_adi}</strong> ürününü kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ürünle ilgili tüm veriler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => permanentDeleteConfirm && permanentDelete(permanentDeleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Kalıcı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
