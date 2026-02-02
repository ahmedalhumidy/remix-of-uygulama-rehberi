import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type ActionType = 
  | 'role_change' 
  | 'user_disable' 
  | 'user_enable' 
  | 'user_invite' 
  | 'user_delete'
  | 'product_create' 
  | 'product_update' 
  | 'product_delete' 
  | 'stock_movement';

interface LogParams {
  action_type: ActionType;
  target_user_id?: string;
  target_product_id?: string;
  details?: Record<string, any>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (params: LogParams) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action_type: params.action_type,
          performed_by: user.id,
          target_user_id: params.target_user_id || null,
          target_product_id: params.target_product_id || null,
          details: params.details || null,
        });

      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  return { logAction };
}
