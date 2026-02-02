import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2, UserPlus, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { usePermissions, AppRole } from '@/hooks/usePermissions';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onUserInvited }: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('staff');
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { logAction } = useAuditLog();
  const { roleLabels, roleDescriptions, allRoles } = usePermissions();

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleInvite = async () => {
    if (!email || !fullName) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    const tempPassword = generatePassword();

    try {
      // Create user via edge function
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { 
          email, 
          password: tempPassword,
          full_name: fullName,
          role 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Log the action
      await logAction({
        action_type: 'user_invite',
        target_user_id: data?.user_id,
        details: { email, role, full_name: fullName }
      });

      setCreatedCredentials({ email, password: tempPassword });
      onUserInvited();
      toast.success('Kullanıcı başarıyla oluşturuldu');
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Kullanıcı davet edilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    
    const text = `E-posta: ${createdCredentials.email}\nGeçici Şifre: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Bilgiler panoya kopyalandı');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setRole('staff');
    setCreatedCredentials(null);
    setCopied(false);
    onOpenChange(false);
  };

  const getRoleBadgeVariant = (r: AppRole): 'default' | 'secondary' | 'outline' => {
    switch (r) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Yeni Kullanıcı Davet Et
          </DialogTitle>
          <DialogDescription>
            {createdCredentials 
              ? 'Kullanıcı oluşturuldu. Bilgileri kopyalayın ve kullanıcıyla paylaşın.'
              : 'Yeni kullanıcı için bilgileri girin. Geçici şifre otomatik oluşturulacak.'}
          </DialogDescription>
        </DialogHeader>

        {createdCredentials ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">E-posta</Label>
                <p className="font-medium">{createdCredentials.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Geçici Şifre</Label>
                <p className="font-mono font-medium">{createdCredentials.password}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Kopyalandı' : 'Bilgileri Kopyala'}
              </Button>
              <Button onClick={handleClose}>Kapat</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kullanıcı adı soyadı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kullanici@ornek.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Yetki</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(r)} className="text-xs">
                            {roleLabels[r]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {roleDescriptions[r]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>İptal</Button>
              <Button onClick={handleInvite} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Davet Et
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
