/**
 * Compatibility wrapper for useMovements.
 * When workflow/automation modules are enabled, intercepts movement operations.
 * When disabled, passes through to the existing hook unchanged.
 */
import { useMovements } from '@/hooks/useMovements';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useWorkflowEngine } from '@/modules/workflows/hooks/useWorkflowEngine';
import { Product } from '@/types/stock';

export function useMovementsCompat(products: Product[]) {
  const movementsHook = useMovements(products);
  const { isModuleEnabled } = useFeatureFlags();
  const { startWorkflow } = useWorkflowEngine();

  const workflowsEnabled = isModuleEnabled('workflows');

  // Wrap addMovement to integrate workflow if enabled
  const addMovementWithWorkflow = async (data: Parameters<typeof movementsHook.addMovement>[0]) => {
    const result = await movementsHook.addMovement(data);

    // If workflows module is enabled and movement was created, start a workflow instance
    if (workflowsEnabled && result) {
      try {
        await startWorkflow('stock_movement', result.id);
      } catch (err) {
        // Non-blocking: workflow failure should not block the movement
        console.warn('[WorkflowCompat] Failed to start workflow for movement:', err);
      }
    }

    return result;
  };

  return {
    ...movementsHook,
    addMovement: workflowsEnabled ? addMovementWithWorkflow : movementsHook.addMovement,
  };
}
