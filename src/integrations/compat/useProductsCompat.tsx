/**
 * Compatibility wrapper for useProducts.
 * Currently passes through to the existing hook unchanged.
 * When enterprise modules are enabled, this can intercept/extend
 * product operations (e.g., custom fields, workflow validation).
 */
import { useProducts } from '@/hooks/useProducts';

export function useProductsCompat() {
  // Direct passthrough — no behavior change
  const productsHook = useProducts();

  // Future: if dynamic_forms module is enabled, merge custom fields
  // Future: if workflows module is enabled, validate status transitions

  return productsHook;
}
