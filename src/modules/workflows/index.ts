// Workflows Module - Phase 3
// Contains workflow definitions, steps, transitions, and instance management
export { useWorkflowDefinitions } from './hooks/useWorkflowDefinitions';
export { useWorkflowEngine } from './hooks/useWorkflowEngine';
export { WorkflowManager } from './components/WorkflowManager';
export { WorkflowStatusBadge } from './components/WorkflowStatusBadge';
export type { WorkflowDefinition, WorkflowStep, WorkflowTransition, WorkflowInstance } from './types';
export const MODULE_KEY = 'workflows' as const;
