import { useState, useEffect } from 'react';
import { useWorkflowEngine } from '../hooks/useWorkflowEngine';
import type { WorkflowInstance, WorkflowTransition, WorkflowStep } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowRight, GitBranch, Loader2 } from 'lucide-react';

interface WorkflowStatusBadgeProps {
  entityType: string;
  entityId: string;
  compact?: boolean;
}

/**
 * Displays the current workflow status for an entity.
 * If no workflow instance exists, renders nothing.
 * Used in movement lists, order details, etc.
 */
export function WorkflowStatusBadge({ entityType, entityId, compact = false }: WorkflowStatusBadgeProps) {
  const { getEntityInstance, getAvailableTransitions, performTransition, processing } = useWorkflowEngine();
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [transitions, setTransitions] = useState<(WorkflowTransition & { to_step: WorkflowStep })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const inst = await getEntityInstance(entityType, entityId);
      if (cancelled) return;
      setInstance(inst);
      if (inst) {
        const trans = await getAvailableTransitions(inst.workflow_id, inst.current_step_id);
        if (!cancelled) setTransitions(trans);
      }
      setLoaded(true);
    };
    load();
    return () => { cancelled = true; };
  }, [entityType, entityId, getEntityInstance, getAvailableTransitions]);

  if (!loaded || !instance) return null;

  const handleTransition = async (transitionId: string) => {
    const success = await performTransition(instance.id, transitionId);
    if (success) {
      // Reload
      const inst = await getEntityInstance(entityType, entityId);
      setInstance(inst);
      if (inst) {
        const trans = await getAvailableTransitions(inst.workflow_id, inst.current_step_id);
        setTransitions(trans);
      }
    }
  };

  if (compact) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] gap-1"
        style={{ borderColor: instance.current_step?.color }}
      >
        <GitBranch className="w-3 h-3" />
        {instance.current_step?.name || 'Bilinmeyen'}
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <GitBranch className="w-3.5 h-3.5" />
          {instance.current_step?.name || 'Bilinmeyen'}
          {instance.status === 'completed' && ' ✓'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Mevcut Durum</p>
            <p className="font-semibold">{instance.current_step?.name}</p>
          </div>

          {transitions.length > 0 && instance.status === 'active' && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Geçişler</p>
              {transitions.map(t => (
                <Button
                  key={t.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  disabled={processing}
                  onClick={() => handleTransition(t.id)}
                >
                  {processing ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3 mr-1.5" />
                  )}
                  {t.to_step?.name || 'Bilinmeyen'}
                  {t.condition_label && (
                    <span className="ml-auto text-muted-foreground">({t.condition_label})</span>
                  )}
                </Button>
              ))}
            </div>
          )}

          {instance.status === 'completed' && (
            <p className="text-xs text-success">İş akışı tamamlandı</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
