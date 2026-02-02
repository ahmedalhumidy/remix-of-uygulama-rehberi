import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, Ban, CheckCircle, ChevronDown } from 'lucide-react';
import { UserWithRole, AppRole } from '@/types/stock';
import { usePermissions } from '@/hooks/usePermissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserTableProps {
  users: UserWithRole[];
  currentUserId: string | undefined;
  updating: string | null;
  deleting: string | null;
  disabling: string | null;
  onChangeRole: (userId: string, newRole: AppRole) => void;
  onToggleDisabled: (user: UserWithRole) => void;
  onDeleteConfirm: (user: UserWithRole) => void;
}

export function UserTable({
  users,
  currentUserId,
  updating,
  deleting,
  disabling,
  onChangeRole,
  onToggleDisabled,
  onDeleteConfirm,
}: UserTableProps) {
  const { roleLabels, allRoles } = usePermissions();

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

  const getRoleBadgeVariant = (role: AppRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 h-auto py-1"
                      disabled={updating === u.user_id || u.user_id === currentUserId}
                    >
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                      {updating === u.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {allRoles.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => onChangeRole(u.user_id, role)}
                        disabled={role === u.role}
                        className={role === u.role ? 'bg-muted' : ''}
                      >
                        <Badge variant={getRoleBadgeVariant(role)} className="mr-2">
                          {roleLabels[role]}
                        </Badge>
                        {role === u.role && <span className="text-xs text-muted-foreground">(Mevcut)</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
