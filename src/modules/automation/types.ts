// Automation Module Types

export type TriggerType =
  | 'stock_movement_created'
  | 'stock_low'
  | 'order_status_changed'
  | 'product_created'
  | 'product_updated';

export type ActionType =
  | 'notify'
  | 'auto_approve'
  | 'update_status'
  | 'create_movement';

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: TriggerType;
  condition_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLogEntry {
  id: string;
  rule_id: string;
  trigger_data: Record<string, unknown> | null;
  result: 'success' | 'failure' | 'skipped';
  error_message: string | null;
  executed_at: string;
}

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  stock_movement_created: 'Stok hareketi oluşturulduğunda',
  stock_low: 'Stok düşük olduğunda',
  order_status_changed: 'Sipariş durumu değiştiğinde',
  product_created: 'Ürün oluşturulduğunda',
  product_updated: 'Ürün güncellendiğinde',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  notify: 'Bildirim gönder',
  auto_approve: 'Otomatik onayla',
  update_status: 'Durumu güncelle',
  create_movement: 'Stok hareketi oluştur',
};
