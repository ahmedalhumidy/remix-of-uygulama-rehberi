import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, ShieldOff, Users, Loader2, Trash2 } from 'lucide-react';
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

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export function UserManagement() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserWithRole | null>(null);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, created_at');

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

  const deleteUser = async (userToDelete: UserWithRole) => {
    if (userToDelete.user_id === user?.id) {
      toast.error('Kendinizi silemezsiniz');
      return;
    }

    setDeleting(userToDelete.user_id);

    try {
      // Call edge function to delete user completely (including from auth.users)
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.user_id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Kullanıcı Yönetimi
          <Badge variant="secondary" className="ml-2">
            {users.length} kullanıcı
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Yetki</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{u.full_name}</p>
                      {u.user_id === user?.id && (
                        <Badge variant="outline" className="text-xs mt-1">Siz</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={u.role === 'admin' ? 'default' : 'secondary'}
                      className={u.role === 'admin' ? 'bg-primary' : ''}
                    >
                      {u.role === 'admin' ? 'Yönetici' : 'Çalışan'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={u.role === 'admin' ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => toggleRole(u.user_id, u.role)}
                      disabled={updating === u.user_id || u.user_id === user?.id}
                    >
                      {updating === u.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : u.role === 'admin' ? (
                        <>
                          <ShieldOff className="w-4 h-4 mr-1" />
                          Yetkiyi Kaldır
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-1" />
                          Yönetici Yap
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(u)}
                      disabled={deleting === u.user_id || u.user_id === user?.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deleting === u.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

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
    </Card>
  );
}
