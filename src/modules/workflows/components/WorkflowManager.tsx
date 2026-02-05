import { useState } from 'react';
import { useWorkflowDefinitions } from '../hooks/useWorkflowDefinitions';
import type { WorkflowDefinition } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, GitBranch, ArrowRight, CircleDot, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkflowManager() {
  const {
    definitions,
    loading,
    createDefinition,
    toggleDefinition,
    deleteDefinition,
    addStep,
    deleteStep,
    addTransition,
    deleteTransition,
  } = useWorkflowDefinitions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEntityType, setNewEntityType] = useState('stock_movement');

  // Step form state
  const [stepWorkflowId, setStepWorkflowId] = useState<string | null>(null);
  const [newStepName, setNewStepName] = useState('');
  const [newStepIsInitial, setNewStepIsInitial] = useState(false);
  const [newStepIsFinal, setNewStepIsFinal] = useState(false);
  const [newStepRequiresApproval, setNewStepRequiresApproval] = useState(false);
  const [newStepApprovalRole, setNewStepApprovalRole] = useState('');

  // Transition form state
  const [transWorkflowId, setTransWorkflowId] = useState<string | null>(null);
  const [transFromStep, setTransFromStep] = useState('');
  const [transToStep, setTransToStep] = useState('');
  const [transLabel, setTransLabel] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createDefinition({
      name: newName,
      description: newDesc || undefined,
      entity_type: newEntityType,
    });
    setNewName('');
    setNewDesc('');
    setShowCreateDialog(false);
  };

  const handleAddStep = async (workflowId: string) => {
    if (!newStepName.trim()) return;
    const workflow = definitions.find(d => d.id === workflowId);
    const stepOrder = (workflow?.steps?.length || 0) + 1;
    await addStep(workflowId, {
      name: newStepName,
      step_order: stepOrder,
      is_initial: newStepIsInitial,
      is_final: newStepIsFinal,
      requires_approval: newStepRequiresApproval,
      approval_role: newStepApprovalRole || undefined,
    });
    setNewStepName('');
    setNewStepIsInitial(false);
    setNewStepIsFinal(false);
    setNewStepRequiresApproval(false);
    setNewStepApprovalRole('');
    setStepWorkflowId(null);
  };

  const handleAddTransition = async (workflowId: string) => {
    if (!transFromStep || !transToStep) return;
    await addTransition(workflowId, {
      from_step_id: transFromStep,
      to_step_id: transToStep,
      condition_label: transLabel || undefined,
    });
    setTransFromStep('');
    setTransToStep('');
    setTransLabel('');
    setTransWorkflowId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">İş Akışı Tanımları</h3>
          <p className="text-sm text-muted-foreground">Durum geçiş akışlarını yönetin</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Yeni İş Akışı
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İş Akışı Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>İsim *</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Stok Hareket Onay Akışı"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Bu akış, stok hareketlerinin onay sürecini tanımlar..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Varlık Türü *</Label>
                <Select value={newEntityType} onValueChange={setNewEntityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_movement">Stok Hareketi</SelectItem>
                    <SelectItem value="order">Sipariş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full">
                Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {definitions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Henüz iş akışı tanımlanmadı</p>
            <p className="text-xs text-muted-foreground mt-1">
              İlk iş akışınızı oluşturarak başlayın
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {definitions.map(def => (
            <AccordionItem key={def.id} value={def.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <GitBranch className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">{def.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {def.entity_type === 'stock_movement' ? 'Stok Hareketi' : 'Sipariş'}
                      </Badge>
                      <span>{def.steps?.length || 0} adım</span>
                      <span>{def.transitions?.length || 0} geçiş</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Toggle & Delete */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={def.is_active}
                        onCheckedChange={(checked) => toggleDefinition(def.id, checked)}
                      />
                      <span className="text-sm">
                        {def.is_active ? 'Aktif' : 'Devre Dışı'}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDefinition(def.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Sil
                    </Button>
                  </div>

                  {def.description && (
                    <p className="text-sm text-muted-foreground">{def.description}</p>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Adımlar</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStepWorkflowId(stepWorkflowId === def.id ? null : def.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Adım Ekle
                      </Button>
                    </div>

                    {/* Visual step flow */}
                    {(def.steps?.length || 0) > 0 && (
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-background border">
                        {def.steps?.map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-1.5">
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                              step.is_initial && "bg-success/10 border-success text-success",
                              step.is_final && "bg-primary/10 border-primary text-primary",
                              !step.is_initial && !step.is_final && "bg-muted border-border"
                            )}>
                              {step.is_initial && <CircleDot className="w-3 h-3" />}
                              {step.is_final && <CheckCircle2 className="w-3 h-3" />}
                              {step.requires_approval && <ShieldCheck className="w-3 h-3" />}
                              {step.name}
                              <button
                                onClick={() => deleteStep(step.id)}
                                className="ml-1 text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {idx < (def.steps?.length || 0) - 1 && (
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Step Form */}
                    {stepWorkflowId === def.id && (
                      <Card className="border-dashed">
                        <CardContent className="p-3 space-y-3">
                          <Input
                            value={newStepName}
                            onChange={e => setNewStepName(e.target.value)}
                            placeholder="Adım adı (ör: Beklemede)"
                          />
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={newStepIsInitial} onChange={e => setNewStepIsInitial(e.target.checked)} />
                              Başlangıç adımı
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={newStepIsFinal} onChange={e => setNewStepIsFinal(e.target.checked)} />
                              Son adım
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={newStepRequiresApproval} onChange={e => setNewStepRequiresApproval(e.target.checked)} />
                              Onay gerektirir
                            </label>
                          </div>
                          {newStepRequiresApproval && (
                            <Select value={newStepApprovalRole} onValueChange={setNewStepApprovalRole}>
                              <SelectTrigger>
                                <SelectValue placeholder="Onay rolü seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Yönetici</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button size="sm" onClick={() => handleAddStep(def.id)} disabled={!newStepName.trim()}>
                            Ekle
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Transitions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Geçişler</h4>
                      {(def.steps?.length || 0) >= 2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTransWorkflowId(transWorkflowId === def.id ? null : def.id)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Geçiş Ekle
                        </Button>
                      )}
                    </div>

                    {(def.transitions?.length || 0) > 0 && (
                      <div className="space-y-1.5">
                        {def.transitions?.map(trans => {
                          const fromStep = def.steps?.find(s => s.id === trans.from_step_id);
                          const toStep = def.steps?.find(s => s.id === trans.to_step_id);
                          return (
                            <div key={trans.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                              <Badge variant="outline">{fromStep?.name || '?'}</Badge>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <Badge variant="outline">{toStep?.name || '?'}</Badge>
                              {trans.condition_label && (
                                <span className="text-muted-foreground">({trans.condition_label})</span>
                              )}
                              <button
                                onClick={() => deleteTransition(trans.id)}
                                className="ml-auto text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Transition Form */}
                    {transWorkflowId === def.id && (
                      <Card className="border-dashed">
                        <CardContent className="p-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Kaynak Adım</Label>
                              <Select value={transFromStep} onValueChange={setTransFromStep}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  {def.steps?.filter(s => !s.is_final).map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Hedef Adım</Label>
                              <Select value={transToStep} onValueChange={setTransToStep}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  {def.steps?.filter(s => !s.is_initial && s.id !== transFromStep).map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Input
                            value={transLabel}
                            onChange={e => setTransLabel(e.target.value)}
                            placeholder="Koşul etiketi (isteğe bağlı)"
                          />
                          <Button size="sm" onClick={() => handleAddTransition(def.id)} disabled={!transFromStep || !transToStep}>
                            Ekle
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
