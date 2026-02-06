// Storefront Module — Professional E-Commerce Store
// Feature flag: store_module
export { usePromotions } from './hooks/usePromotions';
export { useProductBadges } from './hooks/useProductBadges';
export { useReviews } from './hooks/useReviews';
export { useDeliveryEstimate } from './hooks/useDeliveryEstimate';
export { useRecommendations } from './hooks/useRecommendations';
export { useCustomerOrders } from './hooks/useOrders';
export type * from './types';
export const MODULE_KEY = 'store_module' as const;
