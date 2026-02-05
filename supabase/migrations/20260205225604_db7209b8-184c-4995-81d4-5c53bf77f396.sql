
-- =============================================
-- Phase 3: Workflows & Automation Tables
-- =============================================

-- Workflow Definitions: templates for status transition flows
CREATE TABLE public.workflow_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL DEFAULT 'stock_movement', -- 'stock_movement', 'order'
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Steps: states/stages in a workflow
CREATE TABLE public.workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_role TEXT, -- role required for approval (e.g., 'manager', 'admin')
  color TEXT DEFAULT '#6366f1', -- for UI display
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Transitions: valid transitions between steps
CREATE TABLE public.workflow_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  from_step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  to_step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  condition_label TEXT, -- human-readable condition label
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Instances: tracks active workflow instances for entities
CREATE TABLE public.workflow_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id),
  entity_type TEXT NOT NULL, -- 'stock_movement', 'order'
  entity_id UUID NOT NULL,
  current_step_id UUID NOT NULL REFERENCES public.workflow_steps(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  started_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Instance History: logs transitions
CREATE TABLE public.workflow_instance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  from_step_id UUID REFERENCES public.workflow_steps(id),
  to_step_id UUID NOT NULL REFERENCES public.workflow_steps(id),
  action TEXT NOT NULL DEFAULT 'transition', -- 'transition', 'approve', 'reject'
  performed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation Rules: trigger-condition-action definitions
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'stock_movement_created', 'stock_low', 'order_status_changed'
  condition_config JSONB NOT NULL DEFAULT '{}', -- conditions to evaluate
  action_type TEXT NOT NULL, -- 'notify', 'auto_approve', 'update_status', 'create_movement'
  action_config JSONB NOT NULL DEFAULT '{}', -- action parameters
  is_active BOOLEAN NOT NULL DEFAULT false,
  execution_count INT NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation Execution Log
CREATE TABLE public.automation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB,
  result TEXT NOT NULL DEFAULT 'success', -- 'success', 'failure', 'skipped'
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: workflow_definitions (admin/manager can manage, all authenticated can view)
CREATE POLICY "Anyone can view active workflows"
  ON public.workflow_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workflow definitions"
  ON public.workflow_definitions FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies: workflow_steps
CREATE POLICY "Anyone can view workflow steps"
  ON public.workflow_steps FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workflow steps"
  ON public.workflow_steps FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies: workflow_transitions
CREATE POLICY "Anyone can view workflow transitions"
  ON public.workflow_transitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workflow transitions"
  ON public.workflow_transitions FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies: workflow_instances
CREATE POLICY "Anyone can view workflow instances"
  ON public.workflow_instances FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create workflow instances"
  ON public.workflow_instances FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workflow instances"
  ON public.workflow_instances FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies: workflow_instance_history
CREATE POLICY "Anyone can view workflow history"
  ON public.workflow_instance_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add workflow history"
  ON public.workflow_instance_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies: automation_rules
CREATE POLICY "Anyone can view automation rules"
  ON public.automation_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage automation rules"
  ON public.automation_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies: automation_log
CREATE POLICY "Anyone can view automation log"
  ON public.automation_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert automation log"
  ON public.automation_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_workflow_definitions_updated_at
  BEFORE UPDATE ON public.workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_instances_updated_at
  BEFORE UPDATE ON public.workflow_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
