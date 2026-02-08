import { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useShelves } from '@/hooks/useShelves';
import { supabase } from '@/integrations/supabase/client';

interface ScanSessionShelfPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShelf: (shelfId: string, shelfName: string) => void;
}

export function ScanSessionShelfPicker({ isOpen, onClose, onSelectShelf }: ScanSessionShelfPickerProps) {
  const { shelves, loading } = useShelves();

  const [selected, setSelected] = useState<string>('');
  const [newShelfName, setNewShelfName] = useState('');
  const [creating, setCreating] = useState(false);

  // Local list so new shelf appears immediately
  const [localShelves, setLocalShelves] = useState(shelves);

  useEffect(() => {
    setLocalShelves(shelves);
  }, [shelves]);

  const normalizedExisting = useMemo(() => {
    return new Set(localShelves.map(s => s.name.trim().toLowerCase()));
  }, [localShelves]);

  const handleConfirm = () => {
    const shelf = localShelves.find(s => s.id === selected);
    if (shelf) {
      onSelectShelf(shelf.id, shelf.name);
      onClose();
    }
  };

  const handleCreateShelf = async () => {
    const name = newShelfName.trim();
    if (!name) {
      toast.error('Raf adı boş olamaz');
      return;
    }

    if (normalizedExisting.has(name.toLowerCase())) {
      toast.error('Bu raf zaten mevcut');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('shelves')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;

      setLocalShelves(prev => [data, ...prev]);
      setSelected(data.id);

      toast.success('Yeni raf eklendi');

      // Auto-select the new shelf
      onSelectShelf(data.id, data.name);
      onClose();

      setNewShelfName('');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Raf eklenemedi');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Raf / Konum Seç
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Rafı listeden seçin veya yeni raf ekleyin.
          </p>

          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Yükleniyor...' : 'Raf seçin'} />
            </SelectTrigger>
            <SelectContent>
              {localShelves.map(shelf => (
                <SelectItem key={shelf.id} value={shelf.id}>
                  {shelf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ✅ Add new shelf */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium">Yeni raf ekle</div>
            <div className="flex gap-2">
              <Input
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="Örn: C-4 (5)"
                disabled={creating}
              />
              <Button
                type="button"
                onClick={handleCreateShelf}
                disabled={creating}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {creating ? '...' : 'Ekle'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Ekle’ye basınca raf kaydedilir ve otomatik seçilir.
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              İptal
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={!selected}>
              Seç
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
