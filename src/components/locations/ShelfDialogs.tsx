import { MapPin, Edit2 } from 'lucide-react';
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

interface ShelfDialogsProps {
  showAddDialog: boolean;
  setShowAddDialog: (v: boolean) => void;
  showEditDialog: boolean;
  setShowEditDialog: (v: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  newShelfName: string;
  setNewShelfName: (v: string) => void;
  editingShelf: { id: string; name: string } | null;
  setEditingShelf: (v: { id: string; name: string } | null) => void;
  deletingShelfId: string | null;
  setDeletingShelfId: (v: string | null) => void;
  isSubmitting: boolean;
  onAddShelf: () => void;
  onEditShelf: () => void;
  onDeleteShelf: () => void;
}

export function ShelfDialogs({
  showAddDialog,
  setShowAddDialog,
  showEditDialog,
  setShowEditDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  newShelfName,
  setNewShelfName,
  editingShelf,
  setEditingShelf,
  deletingShelfId,
  setDeletingShelfId,
  isSubmitting,
  onAddShelf,
  onEditShelf,
  onDeleteShelf,
}: ShelfDialogsProps) {
  return (
    <>
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
              onClick={onAddShelf}
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
                onChange={(e) => {
                  if (editingShelf) {
                    setEditingShelf({ ...editingShelf, name: e.target.value });
                  }
                }}
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
              onClick={onEditShelf}
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
              onClick={onDeleteShelf}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
