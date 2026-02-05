import { useState } from 'react';
import { useCustomFields } from '../hooks/useCustomFields';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { CustomFieldDefinition, CustomFieldType } from '../types';
import { FIELD_TYPE_LABELS } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function FieldDefinitionManager() {
  const { isModuleEnabled } = useFeatureFlags();
  const { fields, loading, addField, updateField, deleteField, refreshFields, fetchAllFields } = useCustomFields('product');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [allFields, setAllFields] = useState<CustomFieldDefinition[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    field_key: '',
    field_label: '',
    field_type: 'text' as CustomFieldType,
    options: '' as string,
    is_required: false,
    default_value: '',
    placeholder: '',
  });

  const moduleEnabled = isModuleEnabled('dynamic_forms');

  const resetForm = () => {
    setFormData({
      field_key: '',
      field_label: '',
      field_type: 'text',
      options: '',
      is_required: false,
      default_value: '',
      placeholder: '',
    });
    setEditingField(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      options: (field.options || []).join(', '),
      is_required: field.is_required,
      default_value: field.default_value || '',
      placeholder: field.placeholder || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const key = formData.field_key.trim();
    const label = formData.field_label.trim();

    if (!key || !label) {
      toast.error('Alan anahtarı ve etiketi zorunludur');
      return;
    }

    // Validate key format
    if (!/^[a-z0-9_]+$/.test(key)) {
      toast.error('Alan anahtarı sadece küçük harf, rakam ve alt çizgi içerebilir');
      return;
    }

    const options = formData.field_type === 'select'
      ? formData.options.split(',').map(o => o.trim()).filter(Boolean)
      : [];

    if (editingField) {
      await updateField(editingField.id, {
        field_label: label,
        field_type: formData.field_type,
        options,
        is_required: formData.is_required,
        default_value: formData.default_value || null,
        placeholder: formData.placeholder || null,
      });
    } else {
      const maxOrder = fields.reduce((max, f) => Math.max(max, f.display_order), 0);
      await addField({
        entity_type: 'product',
        field_key: key,
        field_label: label,
        field_type: formData.field_type,
        options,
        is_required: formData.is_required,
        default_value: formData.default_value || null,
        placeholder: formData.placeholder || null,
        display_order: maxOrder + 10,
        is_active: true,
      });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (field: CustomFieldDefinition) => {
    if (confirm(`"${field.field_label}" alanını silmek istediğinize emin misiniz?`)) {
      await deleteField(field.id);
    }
  };

  const handleToggleActive = async (field: CustomFieldDefinition) => {
    await updateField(field.id, { is_active: !field.is_active });
  };

  const handleShowAll = async () => {
    const all = await fetchAllFields();
    setAllFields(all);
    setShowAll(true);
  };

  const displayFields = showAll ? allFields : fields;

  return (
    <div className="space-y-6">
      {/* Module Status */}
      {!moduleEnabled && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Modül Devre Dışı</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dinamik Formlar modülü şu anda devre dışı. Alanları tanımlayabilirsiniz ancak
                  ürün formlarında görünmeyeceklerdir. Kontrol Merkezi'nden modülü etkinleştirin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-base font-semibold">Özel Ürün Alanları</h3>
            <p className="text-xs text-muted-foreground">
              Ürün formlarına özel alanlar ekleyin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={showAll ? () => { setShowAll(false); refreshFields(); } : handleShowAll}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            {showAll ? 'Sadece Aktif' : 'Tümünü Göster'}
          </Button>
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Yeni Alan
          </Button>
        </div>
      </div>

      {/* Field List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : displayFields.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Henüz özel alan tanımlanmamış</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenNew}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              İlk Alanı Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayFields.map(field => (
            <Card key={field.id} className={!field.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{field.field_label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {FIELD_TYPE_LABELS[field.field_type]}
                      </Badge>
                      {field.is_required && (
                        <Badge variant="secondary" className="text-[10px]">Zorunlu</Badge>
                      )}
                      {!field.is_active && (
                        <Badge variant="destructive" className="text-[10px]">Pasif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Anahtar: {field.field_key}
                      {field.field_type === 'select' && field.options.length > 0 && (
                        <> · Seçenekler: {field.options.join(', ')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={field.is_active}
                      onCheckedChange={() => handleToggleActive(field)}
                      className="mr-2"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(field)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(field)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Alanı Düzenle' : 'Yeni Özel Alan'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Alan Anahtarı *</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="ornek_alan"
                disabled={!!editingField}
                maxLength={50}
              />
              <p className="text-[10px] text-muted-foreground">
                Sadece küçük harf, rakam ve alt çizgi. Sonradan değiştirilemez.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Alan Etiketi *</Label>
              <Input
                value={formData.field_label}
                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                placeholder="Özel Alan Adı"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Alan Türü</Label>
              <Select
                value={formData.field_type}
                onValueChange={(v) => setFormData({ ...formData, field_type: v as CustomFieldType })}
                disabled={!!editingField}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.field_type === 'select' && (
              <div className="space-y-2">
                <Label>Seçenekler (virgülle ayırın)</Label>
                <Input
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Seçenek 1, Seçenek 2, Seçenek 3"
                  maxLength={500}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Yer Tutucu Metin</Label>
              <Input
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Kullanıcının göreceği ipucu metni"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Varsayılan Değer</Label>
              <Input
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                placeholder="Opsiyonel"
                maxLength={200}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData({ ...formData, is_required: !!checked })}
              />
              <Label>Zorunlu alan</Label>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingField ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
