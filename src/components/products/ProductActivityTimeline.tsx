import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Package, ArrowDownCircle, ArrowUpCircle, Edit, Archive, RotateCcw, Plus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  product_id: string;
  action_type: string;
  performed_by: string | null;
  performer_name?: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  note: string | null;
  created_at: string;
}

interface ProductActivityTimelineProps {
  productId: string;
  productName: string;
}

const actionIcons: Record<string, typeof Package> = {
  created: Plus,
  updated: Edit,
  stock_in: ArrowDownCircle,
  stock_out: ArrowUpCircle,
  archived: Archive,
  restored: RotateCcw,
};

const actionLabels: Record<string, string> = {
  created: 'Oluşturuldu',
  updated: 'Güncellendi',
  stock_in: 'Stok Girişi',
  stock_out: 'Stok Çıkışı',
  archived: 'Arşivlendi',
  restored: 'Geri Yüklendi',
};

const actionColors: Record<string, string> = {
  created: 'bg-green-500',
  updated: 'bg-blue-500',
  stock_in: 'bg-emerald-500',
  stock_out: 'bg-orange-500',
  archived: 'bg-gray-500',
  restored: 'bg-purple-500',
};

export function ProductActivityTimeline({ productId, productName }: ProductActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('product_activity_log')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Fetch performer names
        const performerIds = [...new Set((data || []).filter(a => a.performed_by).map(a => a.performed_by))];
        let performerMap = new Map<string, string>();

        if (performerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', performerIds);

          performerMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        }

        const enrichedActivities = (data || []).map(activity => ({
          ...activity,
          performer_name: activity.performed_by ? performerMap.get(activity.performed_by) : undefined,
        })) as ActivityLog[];

        setActivities(enrichedActivities);
      } catch (error) {
        console.error('Error fetching product activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [productId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Aktivite Geçmişi
        </CardTitle>
        <CardDescription>
          {productName} için tüm değişiklikler ve hareketler
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Henüz aktivite kaydı yok</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {activities.map((activity, index) => {
                  const Icon = actionIcons[activity.action_type] || Package;
                  const bgColor = actionColors[activity.action_type] || 'bg-gray-500';

                  return (
                    <div key={activity.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={cn('absolute left-2.5 w-3 h-3 rounded-full', bgColor)} />

                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline">
                              {actionLabels[activity.action_type] || activity.action_type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </span>
                        </div>

                        {activity.performer_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {activity.performer_name} tarafından
                          </p>
                        )}

                        {activity.note && (
                          <p className="text-sm">{activity.note}</p>
                        )}

                        {activity.action_type === 'updated' && activity.old_values && activity.new_values && (
                          <div className="mt-2 text-xs space-y-1">
                            {Object.keys(activity.new_values).slice(0, 3).map(key => {
                              const oldVal = activity.old_values?.[key];
                              const newVal = activity.new_values?.[key];
                              if (oldVal === newVal) return null;
                              return (
                                <p key={key} className="text-muted-foreground">
                                  <span className="font-medium">{key}:</span> {String(oldVal)} → {String(newVal)}
                                </p>
                              );
                            })}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
