/**
 * Compatibility wrapper for useAuth.
 * Currently passes through to the existing hook unchanged.
 * When enhanced RBAC module is enabled, this can extend
 * with granular permissions, multi-tenant isolation, etc.
 */
import { useAuth } from '@/hooks/useAuth';

export function useAuthCompat() {
  // Direct passthrough — no behavior change
  const authHook = useAuth();

  // Future: if rbac_enhanced module is enabled, add fine-grained permissions
  // Future: add multi-tenant organization context

  return authHook;
}
