import { useState } from 'react';
import { useAutomationRules } from '../hooks/useAutomationRules';
import { TRIGGER_TYPE_LABELS, ACTION_TYPE_LABELS, TriggerType, ActionType } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Zap, Clock, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AutomationManager() {
  const {
    rules,
    logs,
    loading,
    createRule,
    toggleRule,
    deleteRule,
    refreshLogs,
  } = useAutomationRules();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTrigger, setNewTrigger] = useState<TriggerType>('stock_movement_created');
  const [newAction, setNewAction] = useState<ActionType>('notify');
  const [newActionMessage, setNewActionMessage] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createRule({
      name: newName,
      description: newDesc || undefined,
      trigger_type: newTrigger,
      action_type: newAction,
      action_config: newAction === 'notify' ? { message: newActionMessage } : {},
    });
    setNewName('');
    setNewDesc('');
    setNewActionMessage('');
    setShowCreateDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Kurallar ({rules.length})</TabsTrigger>
          <TabsTrigger value="logs" onClick={() => refreshLogs()}>Yürütme Günlüğü</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Otomasyon Kuralları</h3>
              <p className="text-sm text-muted-foreground">Tetikleyiciler ve otomatik aksiyonlar</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Yeni Kural
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Otomasyon Kuralı</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Kural Adı *</Label>
                    <Input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Düşük stok bildirimi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Bu kural ne zaman ve neden çalışır..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tetikleyici *</Label>
                    <Select value={newTrigger} onValueChange={(v) => setNewTrigger(v as TriggerType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRIGGER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aksiyon *</Label>
                    <Select value={newAction} onValueChange={(v) => setNewAction(v as ActionType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newAction === 'notify' && (
                    <div className="space-y-2">
                      <Label>Bildirim Mesajı</Label>
                      <Input
                        value={newActionMessage}
                        onChange={e => setNewActionMessage(e.target.value)}
                        placeholder="Stok seviyesi düşük!"
                      />
                    </div>
                  )}
                  <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full">
                    Oluştur
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Henüz otomasyon kuralı tanımlanmadı</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Otomatik aksiyonlar için kurallar ekleyin
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg mt-0.5",
                          rule.is_active ? "bg-success/10" : "bg-muted"
                        )}>
                          <Zap className={cn(
                            "w-4 h-4",
                            rule.is_active ? "text-success" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{rule.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {TRIGGER_TYPE_LABELS[rule.trigger_type as TriggerType] || rule.trigger_type}
                            </Badge>
                          </div>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground">{rule.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Aksiyon: {ACTION_TYPE_LABELS[rule.action_type as ActionType] || rule.action_type}</span>
                            <span>Çalışma: {rule.execution_count}×</span>
                            {rule.last_executed_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(rule.last_executed_at).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Yürütme Günlüğü</h3>
          {logs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Henüz yürütme kaydı yok</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const rule = rules.find(r => r.id === log.rule_id);
                return (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                    {log.result === 'success' && <CheckCircle className="w-4 h-4 text-success shrink-0" />}
                    {log.result === 'failure' && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                    {log.result === 'skipped' && <MinusCircle className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{rule?.name || 'Bilinmeyen kural'}</span>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-0.5">{log.error_message}</p>
                      )}
                    </div>
                    <Badge variant={
                      log.result === 'success' ? 'default' :
                      log.result === 'failure' ? 'destructive' : 'secondary'
                    } className="text-[10px]">
                      {log.result === 'success' ? 'Başarılı' :
                       log.result === 'failure' ? 'Hatalı' : 'Atlandı'}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.executed_at).toLocaleString('tr-TR')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
