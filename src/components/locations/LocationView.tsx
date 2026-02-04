import { useState } from 'react';
import { MapPin, Package, AlertTriangle, Plus, Trash2, Edit2 } from 'lucide-react';
import { Product } from '@/types/stock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useShelves } from '@/hooks/useShelves';
import { usePermissions } from '@/hooks/usePermissions';

interface LocationViewProps {
  products: Product[];
  searchQuery: string;
  onViewProduct: (id: string) => void;
}

export function LocationView({ products, searchQuery, onViewProduct }: LocationViewProps) {
  const { shelves, addShelf, updateShelf, deleteShelf, loading } = useShelves();
  const { hasPermission } = usePermissions();
  const canManageShelves = hasPermission('products.create');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [editingShelf, setEditingShelf] = useState<{ id: string; name: string } | null>(null);
  const [deletingShelfId, setDeletingShelfId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group products by location
  const locationGroups = products.reduce((groups, product) => {
    const location = product.rafKonum;
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  // Filter locations based on search
  const filteredLocations = Object.keys(locationGroups)
    .filter(location => {
      const query = searchQuery.toLowerCase();
      return (
        location.toLowerCase().includes(query) ||
        locationGroups[location].some(p => 
          p.urunAdi.toLowerCase().includes(query) ||
          p.urunKodu.toLowerCase().includes(query)
        )
      );
    })
    .sort();

  const handleAddShelf = async () => {
    if (!newShelfName.trim()) return;
    setIsSubmitting(true);
    await addShelf(newShelfName.trim());
    setNewShelfName('');
    setShowAddDialog(false);
    setIsSubmitting(false);
  };

  const handleEditShelf = async () => {
    if (!editingShelf || !editingShelf.name.trim()) return;
    setIsSubmitting(true);
    await updateShelf(editingShelf.id, editingShelf.name.trim());
    setEditingShelf(null);
    setShowEditDialog(false);
    setIsSubmitting(false);
  };

  const handleDeleteShelf = async () => {
    if (!deletingShelfId) return;
    setIsSubmitting(true);
    await deleteShelf(deletingShelfId);
    setDeletingShelfId(null);
    setShowDeleteDialog(false);
    setIsSubmitting(false);
  };

  const openEditDialog = (id: string, name: string) => {
    setEditingShelf({ id, name });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingShelfId(id);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header with Add Button */}
      {canManageShelves && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Raf Ekle
          </Button>
        </div>
      )}

      {/* Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location, index) => {
          const locationProducts = locationGroups[location];
          const totalStock = locationProducts.reduce((sum, p) => sum + p.mevcutStok, 0);
          const totalSetStock = locationProducts.reduce((sum, p) => sum + p.setStok, 0);
          const lowStockCount = locationProducts.filter(p => p.mevcutStok < p.minStok).length;
          const shelf = shelves.find(s => s.name === location);

          return (
            <div 
              key={location} 
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{location}</h3>
                    <p className="text-sm text-muted-foreground">
                      {locationProducts.length} ürün
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lowStockCount > 0 && (
                    <span className="badge-status bg-destructive/10 text-destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {lowStockCount}
                    </span>
                  )}
                  {canManageShelves && shelf && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(shelf.id, shelf.name)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(shelf.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {locationProducts.map((product) => {
                  const isLowStock = product.mevcutStok < product.minStok;
                  return (
                    <button
                      key={product.id}
                      onClick={() => onViewProduct(product.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{product.urunAdi}</span>
                      </div>
                      <span className={cn(
                        'text-sm font-medium ml-2 flex-shrink-0',
                        isLowStock ? 'text-destructive' : 'text-foreground'
                      )}>
                        {product.mevcutStok}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Toplam</span>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{totalStock} adet</span>
                    {totalSetStock > 0 && (
                      <span className="text-sm text-muted-foreground ml-2">+ {totalSetStock} set</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLocations.length === 0 && (
          <div className="col-span-full stat-card text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Konum bulunamadı</h3>
            <p className="text-muted-foreground mb-4">Arama kriterlerinize uygun konum yok.</p>
            {canManageShelves && (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Yeni Raf Ekle
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Shelf Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Yeni Raf Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newShelfName">Raf Adı *</Label>
              <Input
                id="newShelfName"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="Örn: A-1, B-2(1), D-8(3)"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewShelfName('');
                setShowAddDialog(false);
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleAddShelf}
              disabled={!newShelfName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shelf Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Raf Düzenle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editShelfName">Raf Adı *</Label>
              <Input
                id="editShelfName"
                value={editingShelf?.name || ''}
                onChange={(e) => setEditingShelf(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Raf adını girin"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingShelf(null);
                setShowEditDialog(false);
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleEditShelf}
              disabled={!editingShelf?.name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rafı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Raf silinecek ancak ürünler etkilenmeyecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingShelfId(null)}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShelf}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
