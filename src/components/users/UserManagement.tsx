import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Users, Loader2, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
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
import { UserTable } from './UserTable';
import { InviteUserDialog } from './InviteUserDialog';
import { UserWithRole } from '@/types/stock';

export function UserManagement() {
  const { isAdmin, user } = useAuth();
  const { logAction } = useAuditLog();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [disabling, setDisabling] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserWithRole | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, created_at, last_sign_in, is_disabled');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          email: profile.full_name,
          full_name: profile.full_name,
          role: (userRole?.role as 'admin' | 'employee') || 'employee',
          created_at: profile.created_at,
          last_sign_in: profile.last_sign_in,
          is_disabled: profile.is_disabled,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcı verileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const toggleRole = async (userId: string, currentRole: 'admin' | 'employee') => {
    if (userId === user?.id) {
      toast.error('Kendi yetkinizi değiştiremezsiniz');
      return;
    }

    setUpdating(userId);
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction({
        action_type: 'role_change',
        target_user_id: userId,
        details: { old_role: currentRole, new_role: newRole }
      });

      setUsers(prev => 
        prev.map(u => 
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );

      toast.success(
        newRole === 'admin' 
          ? 'Kullanıcı yönetici olarak yükseltildi' 
          : 'Yönetici yetkisi kaldırıldı'
      );
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Yetki güncellenemedi');
    } finally {
      setUpdating(null);
    }
  };

  const toggleDisabled = async (targetUser: UserWithRole) => {
    if (targetUser.user_id === user?.id) {
      toast.error('Kendinizi engelleyemezsiniz');
      return;
    }

    setDisabling(targetUser.user_id);
    const newDisabledState = !targetUser.is_disabled;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_disabled: newDisabledState })
        .eq('user_id', targetUser.user_id);

      if (error) throw error;

      await logAction({
        action_type: newDisabledState ? 'user_disable' : 'user_enable',
        target_user_id: targetUser.user_id,
        details: { user_name: targetUser.full_name }
      });

      setUsers(prev => 
        prev.map(u => 
          u.user_id === targetUser.user_id ? { ...u, is_disabled: newDisabledState } : u
        )
      );

      toast.success(newDisabledState ? 'Kullanıcı erişimi engellendi' : 'Kullanıcı erişimi açıldı');
    } catch (error) {
      console.error('Error toggling disabled:', error);
      toast.error('İşlem başarısız');
    } finally {
      setDisabling(null);
    }
  };

  const deleteUser = async (userToDelete: UserWithRole) => {
    if (userToDelete.user_id === user?.id) {
      toast.error('Kendinizi silemezsiniz');
      return;
    }

    setDeleting(userToDelete.user_id);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.user_id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await logAction({
        action_type: 'user_delete',
        target_user_id: userToDelete.user_id,
        details: { user_name: userToDelete.full_name, email: userToDelete.email }
      });

      setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
      toast.success('Kullanıcı başarıyla silindi');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Kullanıcı silinemedi');
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bu sayfa sadece yöneticiler için</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">Kullanıcılar yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kullanıcı Yönetimi
              <Badge variant="secondary" className="ml-2">
                {users.length} kullanıcı
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Kullanıcı Davet Et
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable
            users={filteredUsers}
            currentUserId={user?.id}
            updating={updating}
            deleting={deleting}
            disabling={disabling}
            onToggleRole={toggleRole}
            onToggleDisabled={toggleDisabled}
            onDeleteConfirm={setDeleteConfirm}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteConfirm?.full_name}</strong> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteUser(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onUserInvited={fetchUsers}
      />
    </>
  );
}
