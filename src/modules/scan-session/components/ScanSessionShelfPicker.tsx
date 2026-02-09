import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const normalizedExisting = useMemo(() => {
    return new Set((shelves || []).map(s => s.name.trim().toLowerCase()));
  }, [shelves]);

  useEffect(() => {
    if (!isOpen) {
      setSelected('');
      setNewShelfName('');
      setCreating(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const shelf = shelves.find(s => s.id === selected);
    if (shelf) onSelectShelf(shelf.id, shelf.name);
  };

  const handleCreateShelf = async () => {
    const name = newShelfName.trim();
    if (!name) return toast.error('Raf adı boş olamaz');
    if (normalizedExisting.has(name.toLowerCase())) return toast.error('Bu raf zaten mevcut');

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('shelves')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;

      toast.success('Yeni raf eklendi');
      onSelectShelf(data.id, data.name);
      onClose();
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
            Listeden raf seçin veya yeni raf ekleyin.
          </p>

          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Yükleniyor...' : 'Raf seçin'} />
            </SelectTrigger>
            <SelectContent>
              {shelves.map(shelf => (
                <SelectItem key={shelf.id} value={shelf.id}>
                  {shelf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium">Yeni Raf Ekle</div>
            <Input
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="Örn: K-2(10)"
              disabled={creating}
            />
            <Button
              type="button"
              className="w-full"
              onClick={handleCreateShelf}
              disabled={creating || !newShelfName.trim()}
            >
              {creating ? 'Ekleniyor...' : 'Raf Ekle ve Seç'}
            </Button>
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