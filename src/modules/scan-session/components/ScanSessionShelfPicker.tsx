import { useState } from 'react';
import { MapPin, ScanBarcode } from 'lucide-react';
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
import { useShelves } from '@/hooks/useShelves';

interface ScanSessionShelfPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShelf: (shelfId: string, shelfName: string) => void;
}

export function ScanSessionShelfPicker({ isOpen, onClose, onSelectShelf }: ScanSessionShelfPickerProps) {
  const { shelves, loading } = useShelves();
  const [selected, setSelected] = useState<string>('');

  const handleConfirm = () => {
    const shelf = shelves.find(s => s.id === selected);
    if (shelf) {
      onSelectShelf(shelf.id, shelf.name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Raf / Konum Seç
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Raf QR kodunu tarayabilir veya listeden seçebilirsiniz.
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
