import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollText, Loader2, Shield, Search } from 'lucide-react';
import { AuditLog } from '@/types/stock';

const actionTypeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  role_change: { label: 'Yetki Değişikliği', variant: 'default' },
  user_disable: { label: 'Kullanıcı Engelleme', variant: 'destructive' },
  user_enable: { label: 'Kullanıcı Etkinleştirme', variant: 'outline' },
  user_invite: { label: 'Kullanıcı Daveti', variant: 'secondary' },
  user_delete: { label: 'Kullanıcı Silme', variant: 'destructive' },
  product_create: { label: 'Ürün Ekleme', variant: 'secondary' },
  product_update: { label: 'Ürün Güncelleme', variant: 'outline' },
  product_delete: { label: 'Ürün Silme', variant: 'destructive' },
  stock_movement: { label: 'Stok Hareketi', variant: 'default' },
};

export function AuditLogList() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      const performerIds = [...new Set(logsData?.map(l => l.performed_by).filter(Boolean))];
      const targetUserIds = [...new Set(logsData?.map(l => l.target_user_id).filter(Boolean))];
      const targetProductIds = [...new Set(logsData?.map(l => l.target_product_id).filter(Boolean))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', [...performerIds, ...targetUserIds]);

      const { data: products } = await supabase
        .from('products')
        .select('id, urun_adi')
        .in('id', targetProductIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      const productMap = new Map(products?.map(p => [p.id, p.urun_adi]) || []);

      const enrichedLogs: AuditLog[] = (logsData || []).map(log => ({
        id: log.id,
        action_type: log.action_type,
        performed_by: log.performed_by,
        performer_name: log.performed_by ? profileMap.get(log.performed_by) || 'Bilinmiyor' : 'Sistem',
        target_user_id: log.target_user_id,
        target_user_name: log.target_user_id ? profileMap.get(log.target_user_id) : undefined,
        target_product_id: log.target_product_id,
        target_product_name: log.target_product_id ? productMap.get(log.target_product_id) : undefined,
        details: log.details as Record<string, any> | null,
        created_at: log.created_at,
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDetails = (log: AuditLog) => {
    const parts: string[] = [];
    
    if (log.target_user_name) {
      parts.push(`Kullanıcı: ${log.target_user_name}`);
    }
    if (log.target_product_name) {
      parts.push(`Ürün: ${log.target_product_name}`);
    }
    if (log.details) {
      if (log.details.old_role && log.details.new_role) {
        parts.push(`${log.details.old_role} → ${log.details.new_role}`);
      }
      if (log.details.quantity) {
        parts.push(`Miktar: ${log.details.quantity}`);
      }
      if (log.details.movement_type) {
        parts.push(`Tip: ${log.details.movement_type === 'giris' ? 'Giriş' : 'Çıkış'}`);
      }
      if (log.details.email) {
        parts.push(`E-posta: ${log.details.email}`);
      }
    }
    
    return parts.join(' | ') || '-';
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.performer_name?.toLowerCase().includes(query) ||
      log.target_user_name?.toLowerCase().includes(query) ||
      log.target_product_name?.toLowerCase().includes(query) ||
      log.action_type.toLowerCase().includes(query) ||
      (log.details?.email as string)?.toLowerCase().includes(query)
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
          <p className="text-muted-foreground mt-2">Loglar yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Denetim Günlüğü
            <Badge variant="secondary" className="ml-2">
              {filteredLogs.length} kayıt
            </Badge>
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead>Yapan</TableHead>
                <TableHead>Detaylar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Kayıt bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const actionInfo = actionTypeLabels[log.action_type] || { label: log.action_type, variant: 'outline' as const };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionInfo.variant}>
                          {actionInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.performer_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                        {formatDetails(log)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
