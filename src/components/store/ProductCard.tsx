 import { Heart, ShoppingCart, Star } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import type { MarketplaceProduct } from '@/types/marketplace';
 import { useCartContext } from '@/contexts/CartContext';
 import { useAuth } from '@/hooks/useAuth';
 import { useNavigate } from 'react-router-dom';
 import { cn } from '@/lib/utils';
 
 interface ProductCardProps {
   product: MarketplaceProduct;
   onViewDetails?: (product: MarketplaceProduct) => void;
 }
 
 export function ProductCard({ product, onViewDetails }: ProductCardProps) {
   const { user } = useAuth();
   const navigate = useNavigate();
   const { addToCart, toggleWishlist, isInWishlist } = useCartContext();
   
   const imageUrl = product.images?.[0] || '/placeholder.svg';
   const hasDiscount = product.sale_price && product.sale_price < product.price;
   const displayPrice = product.sale_price ?? product.price;
   const inWishlist = isInWishlist(product.id);
 
   const handleAddToCart = (e: React.MouseEvent) => {
     e.stopPropagation();
     if (!user) {
       navigate('/auth');
       return;
     }
     addToCart(product.id, 1);
   };
 
   const handleToggleWishlist = (e: React.MouseEvent) => {
     e.stopPropagation();
     if (!user) {
       navigate('/auth');
       return;
     }
     toggleWishlist(product.id);
   };
 
   return (
     <Card 
       className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
       onClick={() => onViewDetails?.(product)}
     >
       {/* Image Container */}
       <div className="relative aspect-square overflow-hidden bg-muted">
         <img
           src={imageUrl}
           alt={product.urun_adi}
           className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
         />
         
         {/* Discount Badge */}
         {hasDiscount && (
           <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
             -{Math.round((1 - displayPrice / product.price) * 100)}%
           </Badge>
         )}
         
         {/* Wishlist Button */}
         <Button
           variant="ghost"
           size="icon"
           className={cn(
             "absolute top-2 right-2 bg-background/80 hover:bg-background",
             inWishlist && "text-destructive"
           )}
           onClick={handleToggleWishlist}
         >
           <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
         </Button>
         
         {/* Quick Add to Cart */}
         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
           <Button 
             className="w-full" 
             size="sm"
             onClick={handleAddToCart}
             disabled={product.mevcut_stok <= 0}
           >
             <ShoppingCart className="h-4 w-4 mr-2" />
             {product.mevcut_stok > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
           </Button>
         </div>
       </div>
       
       <CardContent className="p-4">
         {/* Store Name */}
         {product.store && (
           <p className="text-xs text-muted-foreground mb-1">
             {product.store.store_name}
             {product.store.is_verified && (
               <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                 ✓
               </Badge>
             )}
           </p>
         )}
         
         {/* Product Name */}
         <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[40px]">
           {product.urun_adi}
         </h3>
         
         {/* Rating */}
         <div className="flex items-center gap-1 mb-2">
           <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
           <span className="text-xs text-muted-foreground">4.5 (24)</span>
         </div>
         
         {/* Price */}
         <div className="flex items-center gap-2">
           <span className="font-bold text-lg">
             ₺{displayPrice.toFixed(2)}
           </span>
           {hasDiscount && (
             <span className="text-sm text-muted-foreground line-through">
               ₺{product.price.toFixed(2)}
             </span>
           )}
         </div>
         
         {/* Stock Status */}
         {product.mevcut_stok <= 5 && product.mevcut_stok > 0 && (
           <p className="text-xs text-destructive mt-1">
             Son {product.mevcut_stok} adet!
           </p>
         )}
       </CardContent>
     </Card>
   );
 }