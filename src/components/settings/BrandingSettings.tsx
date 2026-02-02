import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette, Save, Loader2, Upload, Image } from 'lucide-react';

interface BrandingSettingsProps {
  canEdit: boolean;
}

export function BrandingSettings({ canEdit }: BrandingSettingsProps) {
  const { organization, updateOrganization, loading } = useSystemSettings();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: organization?.name || 'GLORE',
    logo_url: organization?.logo_url || null,
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dosya boyutu 2MB\'dan küçük olmalı');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo yüklendi');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Logo yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updateOrganization(formData);
    setSaving(false);

    if (success) {
      toast.success('Marka ayarları kaydedildi');
    } else {
      toast.error('Marka ayarları kaydedilemedi');
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
          <Palette className="w-5 h-5" />
          Marka Ayarları
        </CardTitle>
        <CardDescription>
          Şirket adı ve logo gibi marka bilgilerini özelleştirin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Şirket Adı</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!canEdit}
              placeholder="Şirket adını girin"
            />
          </div>

          <div className="space-y-2">
            <Label>Şirket Logosu</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              {canEdit && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Logo Yükle
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Önerilen: 200x200px, maksimum 2MB
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border bg-sidebar">
          <p className="text-sm text-muted-foreground mb-3">Önizleme:</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sidebar-foreground">{formData.name || 'GLORE'}</h3>
              <p className="text-xs text-sidebar-foreground/60">Stok Takip Sistemi</p>
            </div>
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
