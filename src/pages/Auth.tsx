import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Package, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Geçerli bir e-posta adresi girin');
const passwordSchema = z.string().min(6, 'Şifre en az 6 karakter olmalı');

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast.error('Geçerli bir e-posta adresi girin');
      return false;
    }
    try {
      passwordSchema.parse(password);
    } catch {
      toast.error('Şifre en az 6 karakter olmalı');
      return false;
    }
    if (!isLogin && !fullName.trim()) {
      toast.error('Lütfen adınızı girin');
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('E-posta veya şifre hatalı');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('E-posta adresinizi doğrulayın');
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Check if user is disabled
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_disabled')
            .eq('user_id', data.user.id)
            .single();

          if (profile?.is_disabled) {
            await supabase.auth.signOut();
            toast.error('Hesabınız devre dışı bırakıldı. Yöneticiyle iletişime geçin.');
            return;
          }
        }
        
        toast.success('Giriş başarılı!');
        navigate('/');
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Bu e-posta adresi zaten kayıtlı');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Stok Takip Sistemi</CardTitle>
          <CardDescription>
            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ad Soyad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : isLogin ? (
                <LogIn className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={loading}
            >
              {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
