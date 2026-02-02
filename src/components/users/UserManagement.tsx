import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, ShieldOff, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
