/**
 * Compatibility wrapper for useMovements.
 * Currently passes through to the existing hook unchanged.
 * When enterprise modules are enabled, this can intercept/extend
 * movement operations (e.g., workflow approvals, automation triggers).
 */
import { useMovements } from '@/hooks/useMovements';
import { Product } from '@/types/stock';

export function useMovementsCompat(products: Product[]) {
  // Direct passthrough — no behavior change
  const movementsHook = useMovements(products);

  // Future: if workflows module is enabled, require approval before movement
  // Future: if automation module is enabled, trigger rules after movement

  return movementsHook;
}
