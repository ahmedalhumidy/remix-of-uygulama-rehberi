import { useState, useRef } from 'react';
import { User, Camera, Lock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string;
  avatar_url: string | null;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    avatar_url: null,
  });
  
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch profile on mount
  useState(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfile({
          full_name: data?.full_name || '',
          avatar_url: data?.avatar_url || null,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfile();
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dosya boyutu 2MB\'dan küçük olmalıdır');
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profil fotoğrafı güncellendi');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Fotoğraf yüklenirken hata oluştu');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!profile.full_name.trim()) {
      toast.error('İsim boş olamaz');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profil güncellendi');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      setPasswords({ newPassword: '', confirmPassword: '' });
      toast.success('Şifre başarıyla değiştirildi');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Şifre değiştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil Bilgileri
          </CardTitle>
          <CardDescription>
            Profil bilgilerinizi ve fotoğrafınızı güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getInitials(profile.full_name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Profil fotoğrafınızı değiştirmek için kamera ikonuna tıklayın
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maksimum dosya boyutu: 2MB
              </p>
            </div>
          </div>

          <Separator />

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input
              id="fullName"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Adınızı girin"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              E-posta adresi değiştirilemez
            </p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Şifre Değiştir
          </CardTitle>
          <CardDescription>
            Hesabınızın şifresini güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="En az 6 karakter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Şifreyi tekrar girin"
            />
          </div>

          <Button onClick={handleChangePassword} disabled={loading} variant="secondary">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Şifreyi Değiştir
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
