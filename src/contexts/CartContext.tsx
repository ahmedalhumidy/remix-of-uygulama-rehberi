 import { createContext, useContext, ReactNode, useMemo } from 'react';
 import { useCart, useWishlist } from '@/hooks/useMarketplace';
 import type { CartItem, WishlistItem, MarketplaceProduct } from '@/types/marketplace';
 
 interface CartContextType {
   cart: CartItem[];
   wishlist: WishlistItem[];
   isLoading: boolean;
   cartCount: number;
   cartTotal: number;
   addToCart: (productId: string, quantity?: number) => void;
   updateQuantity: (itemId: string, quantity: number) => void;
   removeFromCart: (itemId: string) => void;
   clearCart: () => void;
   toggleWishlist: (productId: string) => void;
   isInWishlist: (productId: string) => boolean;
 }
 
 const CartContext = createContext<CartContextType | undefined>(undefined);
 
 export function CartProvider({ children }: { children: ReactNode }) {
   const {
     cart,
     isLoading: cartLoading,
     addToCart: addToCartMutation,
     updateQuantity: updateQuantityMutation,
     removeFromCart: removeFromCartMutation,
     clearCart: clearCartMutation,
   } = useCart();
 
   const {
     wishlist,
     isLoading: wishlistLoading,
     toggleWishlist: toggleWishlistMutation,
     isInWishlist,
   } = useWishlist();
 
   const cartCount = useMemo(() => {
     return cart.reduce((sum, item) => sum + item.quantity, 0);
   }, [cart]);
 
   const cartTotal = useMemo(() => {
     return cart.reduce((sum, item) => {
       const product = item.product as MarketplaceProduct | undefined;
       const price = product?.sale_price ?? product?.price ?? 0;
       return sum + (price * item.quantity);
     }, 0);
   }, [cart]);
 
   const addToCart = (productId: string, quantity: number = 1) => {
     addToCartMutation.mutate({ productId, quantity });
   };
 
   const updateQuantity = (itemId: string, quantity: number) => {
     if (quantity <= 0) {
       removeFromCartMutation.mutate(itemId);
     } else {
       updateQuantityMutation.mutate({ itemId, quantity });
     }
   };
 
   const removeFromCart = (itemId: string) => {
     removeFromCartMutation.mutate(itemId);
   };
 
   const clearCart = () => {
     clearCartMutation.mutate();
   };
 
   const toggleWishlist = (productId: string) => {
     toggleWishlistMutation.mutate(productId);
   };
 
   return (
     <CartContext.Provider
       value={{
         cart,
         wishlist,
         isLoading: cartLoading || wishlistLoading,
         cartCount,
         cartTotal,
         addToCart,
         updateQuantity,
         removeFromCart,
         clearCart,
         toggleWishlist,
         isInWishlist,
       }}
     >
       {children}
     </CartContext.Provider>
   );
 }
 
 export function useCartContext() {
   const context = useContext(CartContext);
   if (context === undefined) {
     throw new Error('useCartContext must be used within a CartProvider');
   }
   return context;
 }