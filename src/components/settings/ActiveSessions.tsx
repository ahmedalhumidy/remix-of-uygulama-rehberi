import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Monitor, Smartphone, RefreshCw, Loader2, LogOut, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string | null;
  user_name?: string;
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Fetch sessions with user profiles
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch profiles for user names
      const userIds = [...new Set((sessionsData || []).map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const enrichedSessions = (sessionsData || []).map(session => ({
        ...session,
        user_name: profileMap.get(session.user_id) || 'Bilinmiyor',
      })) as UserSession[];

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const terminateSession = async (sessionId: string) => {
    setTerminating(sessionId);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Oturum sonlandırıldı');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Oturum sonlandırılamadı');
    } finally {
      setTerminating(null);
    }
  };

  const terminateAllSessions = async () => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('is_active', true);

      if (error) throw error;

      setSessions([]);
      toast.success('Tüm oturumlar sonlandırıldı');
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      toast.error('Oturumlar sonlandırılamadı');
    }
  };

  const parseDeviceType = (ua: string | null): { type: 'desktop' | 'mobile'; icon: typeof Monitor } => {
    if (!ua) return { type: 'desktop', icon: Monitor };
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    return isMobile ? { type: 'mobile', icon: Smartphone } : { type: 'desktop', icon: Monitor };
  };

  const parseBrowser = (ua: string | null): string => {
    if (!ua) return 'Bilinmiyor';
    if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Diğer';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Aktif Oturumlar
            </CardTitle>
            <CardDescription>
              Şu anda sistemde aktif olan kullanıcı oturumları
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            {sessions.length > 0 && (
              <Button variant="destructive" size="sm" onClick={terminateAllSessions}>
                <LogOut className="w-4 h-4 mr-2" />
                Tümünü Sonlandır
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aktif oturum bulunmuyor</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Cihaz</TableHead>
                  <TableHead>IP Adresi</TableHead>
                  <TableHead>Son Aktivite</TableHead>
                  <TableHead>Oturum Başlangıcı</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const device = parseDeviceType(session.user_agent);
                  const DeviceIcon = device.icon;
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.user_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{parseBrowser(session.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatDistanceToNow(new Date(session.last_activity), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(session.created_at), 'dd MMM HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          disabled={terminating === session.id}
                        >
                          {terminating === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
