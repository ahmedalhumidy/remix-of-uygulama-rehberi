import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { Settings, Save, Loader2 } from 'lucide-react';

interface GeneralSettingsProps {
  canEdit: boolean;
}

const currencies = [
  { value: 'TRY', label: '₺ Türk Lirası (TRY)' },
  { value: 'USD', label: '$ ABD Doları (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ İngiliz Sterlini (GBP)' },
];

const dateFormats = [
  { value: 'DD.MM.YYYY', label: 'GG.AA.YYYY (31.12.2024)' },
  { value: 'MM/DD/YYYY', label: 'AA/GG/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-AA-GG (2024-12-31)' },
];

const timezones = [
  { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
  { value: 'Europe/London', label: 'Londra (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
];

export function GeneralSettings({ canEdit }: GeneralSettingsProps) {
  const { organization, updateOrganization, loading } = useSystemSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    currency: organization?.currency || 'TRY',
    date_format: organization?.date_format || 'DD.MM.YYYY',
    timezone: organization?.timezone || 'Europe/Istanbul',
    default_min_stock: organization?.default_min_stock || 5,
    default_warning_threshold: organization?.default_warning_threshold || 10,
  });

  const handleSave = async () => {
    setSaving(true);
    const success = await updateOrganization(formData);
    setSaving(false);

    if (success) {
      toast.success('Ayarlar kaydedildi');
    } else {
      toast.error('Ayarlar kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">Ayarlar yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Genel Ayarlar
        </CardTitle>
        <CardDescription>
          Sistem genelinde kullanılacak varsayılan değerleri yapılandırın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Para birimi seçin" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_format">Tarih Formatı</Label>
            <Select
              value={formData.date_format}
              onValueChange={(value) => setFormData(prev => ({ ...prev, date_format: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tarih formatı seçin" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map(df => (
                  <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Saat Dilimi</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Saat dilimi seçin" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_min_stock">Varsayılan Minimum Stok</Label>
            <Input
              id="default_min_stock"
              type="number"
              min={0}
              value={formData.default_min_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, default_min_stock: parseInt(e.target.value) || 0 }))}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_warning_threshold">Varsayılan Uyarı Eşiği</Label>
            <Input
              id="default_warning_threshold"
              type="number"
              min={0}
              value={formData.default_warning_threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, default_warning_threshold: parseInt(e.target.value) || 0 }))}
              disabled={!canEdit}
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
