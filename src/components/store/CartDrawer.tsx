 import { ShoppingCart, Minus, Plus, Trash2, X } from 'lucide-react';
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
   SheetFooter,
 } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { useCartContext } from '@/contexts/CartContext';
 import { useNavigate } from 'react-router-dom';
 import type { MarketplaceProduct } from '@/types/marketplace';
 
 export function CartDrawer() {
   const { cart, cartCount, cartTotal, updateQuantity, removeFromCart } = useCartContext();
   const navigate = useNavigate();
 
   const handleCheckout = () => {
     navigate('/store/checkout');
   };
 
   return (
     <Sheet>
       <SheetTrigger asChild>
         <Button variant="outline" size="icon" className="relative">
           <ShoppingCart className="h-5 w-5" />
           {cartCount > 0 && (
             <Badge 
               className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
               variant="destructive"
             >
               {cartCount}
             </Badge>
           )}
         </Button>
       </SheetTrigger>
       
       <SheetContent className="flex flex-col w-full sm:max-w-lg">
         <SheetHeader>
           <SheetTitle className="flex items-center gap-2">
             <ShoppingCart className="h-5 w-5" />
             Sepetim ({cartCount} ürün)
           </SheetTitle>
         </SheetHeader>
         
         {cart.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
             <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
             <p className="text-lg font-medium">Sepetiniz boş</p>
             <p className="text-sm text-muted-foreground mt-1">
               Ürünleri sepete ekleyerek alışverişe başlayın
             </p>
           </div>
         ) : (
           <>
             <ScrollArea className="flex-1 -mx-6 px-6">
               <div className="space-y-4">
                 {cart.map((item) => {
                   const product = item.product as MarketplaceProduct | undefined;
                   if (!product) return null;
                   
                   const price = product.sale_price ?? product.price;
                   const imageUrl = product.images?.[0] || '/placeholder.svg';
                   
                   return (
                     <div key={item.id} className="flex gap-4">
                       {/* Product Image */}
                       <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                         <img
                           src={imageUrl}
                           alt={product.urun_adi}
                           className="w-full h-full object-cover"
                         />
                       </div>
                       
                       {/* Product Info */}
                       <div className="flex-1 min-w-0">
                         <h4 className="font-medium text-sm line-clamp-2">
                           {product.urun_adi}
                         </h4>
                         <p className="text-sm text-muted-foreground mt-1">
                           ₺{price.toFixed(2)}
                         </p>
                         
                         {/* Quantity Controls */}
                         <div className="flex items-center gap-2 mt-2">
                           <Button
                             variant="outline"
                             size="icon"
                             className="h-7 w-7"
                             onClick={() => updateQuantity(item.id, item.quantity - 1)}
                           >
                             <Minus className="h-3 w-3" />
                           </Button>
                           <span className="w-8 text-center text-sm font-medium">
                             {item.quantity}
                           </span>
                           <Button
                             variant="outline"
                             size="icon"
                             className="h-7 w-7"
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             disabled={item.quantity >= product.mevcut_stok}
                           >
                             <Plus className="h-3 w-3" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive"
                             onClick={() => removeFromCart(item.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                       
                       {/* Item Total */}
                       <div className="text-right">
                         <span className="font-medium">
                           ₺{(price * item.quantity).toFixed(2)}
                         </span>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </ScrollArea>
             
             <Separator className="my-4" />
             
             <SheetFooter className="flex-col gap-4 sm:flex-col">
               {/* Order Summary */}
               <div className="w-full space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Ara Toplam</span>
                   <span>₺{cartTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Kargo</span>
                   <span className="text-green-600">Hesaplanacak</span>
                 </div>
                 <Separator />
                 <div className="flex justify-between font-medium text-lg">
                   <span>Toplam</span>
                   <span>₺{cartTotal.toFixed(2)}</span>
                 </div>
               </div>
               
               {/* Checkout Button */}
               <Button 
                 className="w-full" 
                 size="lg"
                 onClick={handleCheckout}
               >
                 Siparişi Tamamla
               </Button>
             </SheetFooter>
           </>
         )}
       </SheetContent>
     </Sheet>
   );
 }