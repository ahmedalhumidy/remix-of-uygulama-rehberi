import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, ShieldOff, Loader2, Trash2, Ban, CheckCircle } from 'lucide-react';
import { UserWithRole } from '@/types/stock';

interface UserTableProps {
  users: UserWithRole[];
  currentUserId: string | undefined;
  updating: string | null;
  deleting: string | null;
  disabling: string | null;
  onToggleRole: (userId: string, currentRole: 'admin' | 'employee') => void;
  onToggleDisabled: (user: UserWithRole) => void;
  onDeleteConfirm: (user: UserWithRole) => void;
}

export function UserTable({
  users,
  currentUserId,
  updating,
  deleting,
  disabling,
  onToggleRole,
  onToggleDisabled,
  onDeleteConfirm,
}: UserTableProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Yetki</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead>Son Giriş</TableHead>
            <TableHead className="text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.user_id} className={u.is_disabled ? 'opacity-50' : ''}>
              <TableCell className="font-medium">
                <div>
                  <p>{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  {u.user_id === currentUserId && (
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
              <TableCell>
                <Badge variant={u.is_disabled ? 'destructive' : 'outline'}>
                  {u.is_disabled ? 'Engelli' : 'Aktif'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(u.created_at)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(u.last_sign_in)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant={u.role === 'admin' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => onToggleRole(u.user_id, u.role)}
                    disabled={updating === u.user_id || u.user_id === currentUserId}
                    title={u.role === 'admin' ? 'Yetkiyi Kaldır' : 'Yönetici Yap'}
                  >
                    {updating === u.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : u.role === 'admin' ? (
                      <ShieldOff className="w-4 h-4" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant={u.is_disabled ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => onToggleDisabled(u)}
                    disabled={disabling === u.user_id || u.user_id === currentUserId}
                    title={u.is_disabled ? 'Erişimi Aç' : 'Erişimi Engelle'}
                  >
                    {disabling === u.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : u.is_disabled ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteConfirm(u)}
                    disabled={deleting === u.user_id || u.user_id === currentUserId}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Kullanıcıyı Sil"
                  >
                    {deleting === u.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
