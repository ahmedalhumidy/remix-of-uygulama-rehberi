// Workflow Module Types

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string | null;
  entity_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
  transitions?: WorkflowTransition[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  step_order: number;
  is_initial: boolean;
  is_final: boolean;
  requires_approval: boolean;
  approval_role: string | null;
  color: string;
  created_at: string;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  from_step_id: string;
  to_step_id: string;
  condition_label: string | null;
  created_at: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  current_step_id: string;
  status: 'active' | 'completed' | 'cancelled';
  started_by: string | null;
  created_at: string;
  updated_at: string;
  current_step?: WorkflowStep;
  workflow?: WorkflowDefinition;
}

export interface WorkflowInstanceHistory {
  id: string;
  instance_id: string;
  from_step_id: string | null;
  to_step_id: string;
  action: 'transition' | 'approve' | 'reject';
  performed_by: string | null;
  note: string | null;
  created_at: string;
}
