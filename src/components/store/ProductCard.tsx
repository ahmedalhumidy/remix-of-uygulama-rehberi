import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MarketplaceProduct } from '@/types/marketplace';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProductBadges, getStockVisibility } from '@/modules/storefront/hooks/useProductBadges';

interface ProductCardProps {
  product: MarketplaceProduct;
  onViewDetails?: (product: MarketplaceProduct) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCartContext();
  const badges = useProductBadges(product);
  const stockInfo = getStockVisibility(product.mevcut_stok);

  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const displayPrice = product.sale_price ?? product.price;
  const inWishlist = isInWishlist(product.id);
  const discountPct = hasDiscount ? Math.round((1 - displayPrice / product.price) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    addToCart(product.id, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    toggleWishlist(product.id);
  };

  return (
    <Card
      className="group overflow-hidden border-border/50 hover:border-border hover:shadow-card-hover transition-all duration-300 cursor-pointer bg-card"
      onClick={() => onViewDetails?.(product)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
        <img
          src={imageUrl}
          alt={product.urun_adi}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges - Top Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {hasDiscount && (
            <Badge className="bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 shadow-md">
              %{discountPct}
            </Badge>
          )}
          {badges.filter(b => b.type !== 'sale' && b.type !== 'low_stock' && b.type !== 'out_of_stock').map(b => (
            <Badge
              key={b.type}
              variant={b.variant as any}
              className="text-[10px] font-semibold px-2 py-0.5 shadow-sm"
            >
              {b.label}
            </Badge>
          ))}
        </div>

        {/* Wishlist Button - Top Right */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            'absolute top-2.5 right-2.5 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/90 hover:bg-background',
            inWishlist && 'opacity-100 text-destructive'
          )}
          onClick={handleToggleWishlist}
        >
          <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
        </Button>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background/95 via-background/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            <Button
              className="flex-1 h-9 text-xs font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
              size="sm"
              onClick={handleAddToCart}
              disabled={product.mevcut_stok <= 0}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              {product.mevcut_stok > 0 ? 'Sepete Ekle' : 'Tükendi'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 bg-background/90"
              onClick={(e) => { e.stopPropagation(); onViewDetails?.(product); }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-3.5">
        {/* Store */}
        {product.store && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {product.store.store_name}
            </span>
            {product.store.is_verified && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-0">
                ✓
              </Badge>
            )}
          </div>
        )}

        {/* Product Name */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[36px] leading-[18px] group-hover:text-primary transition-colors">
          {product.urun_adi}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2.5">
          <div className="flex gap-px">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn('h-3 w-3', s <= 4 ? 'fill-warning text-warning' : 'text-muted-foreground/20')} />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">(24)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-lg text-foreground">
            ₺{displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ₺{product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {stockInfo.urgency !== 'none' && (
          <p className={cn('text-[11px] font-medium mt-1.5', stockInfo.color)}>
            {stockInfo.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
