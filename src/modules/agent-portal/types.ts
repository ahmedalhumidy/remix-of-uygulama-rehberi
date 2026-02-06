export interface AgentProfile {
  user_id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  credit_limit: number;
  credit_used: number;
  is_approved: boolean;
  discount_rate: number;
}

export const AGENT_TIERS = {
  bronze: { label: 'Bronz', discount: 5, minOrders: 0 },
  silver: { label: 'Gümüş', discount: 10, minOrders: 10 },
  gold: { label: 'Altın', discount: 15, minOrders: 50 },
  platinum: { label: 'Platin', discount: 20, minOrders: 100 },
} as const;
