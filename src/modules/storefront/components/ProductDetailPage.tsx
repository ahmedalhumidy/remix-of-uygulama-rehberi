import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Share2, Minus, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/store/StoreHeader';
import { ProductGallery } from './ProductGallery';
import { ReviewSection } from './ReviewSection';
import { RecommendationSection } from './RecommendationSection';
import { DeliveryEstimateDisplay } from './DeliveryEstimate';
import { useProductDetails } from '@/hooks/useMarketplace';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useProductBadges, getStockVisibility } from '../hooks/useProductBadges';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading } = useProductDetails(id || '');
  const { addToCart, toggleWishlist, isInWishlist } = useCartContext();
  const badges = useProductBadges(product);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Ürün Bulunamadı</h1>
          <p className="text-muted-foreground mb-4">Bu ürün mevcut değil veya kaldırılmış.</p>
          <Button onClick={() => navigate('/store')}>Mağazaya Dön</Button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images as string[] : [];
  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const stockInfo = getStockVisibility(product.mevcut_stok);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!user) { navigate('/auth'); return; }
    addToCart(product.id, quantity);
  };

  const handleToggleWishlist = () => {
    if (!user) { navigate('/auth'); return; }
    toggleWishlist(product.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />

      <main className="container py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/store')} className="hover:text-foreground">Mağaza</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button onClick={() => navigate('/store/products')} className="hover:text-foreground">Ürünler</button>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                onClick={() => navigate(`/store/products?category=${encodeURIComponent(product.category!)}`)}
                className="hover:text-foreground"
              >
                {product.category}
              </button>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[200px]">{product.urun_adi}</span>
        </nav>

        {/* Product Content */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <ProductGallery images={images} productName={product.urun_adi} />

          {/* Info */}
          <div className="space-y-5">
            {/* Store */}
            {product.store && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{product.store.store_name}</span>
                {product.store.is_verified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">✓ Onaylı</Badge>}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{product.urun_adi}</h1>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <Badge key={b.type} variant={b.variant as any}>{b.label}</Badge>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">₺{displayPrice.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">₺{product.price.toFixed(2)}</span>
              )}
            </div>

            {/* Stock */}
            <div className={cn('text-sm font-medium', stockInfo.color)}>
              {stockInfo.label}
            </div>

            <Separator />

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => setQuantity(Math.min(product.mevcut_stok, quantity + 1))}
                  disabled={quantity >= product.mevcut_stok}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                className="flex-1 h-12 text-base"
                onClick={handleAddToCart}
                disabled={product.mevcut_stok <= 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.mevcut_stok > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={cn('h-12 w-12', inWishlist && 'text-destructive border-destructive')}
                onClick={handleToggleWishlist}
              >
                <Heart className={cn('h-5 w-5', inWishlist && 'fill-current')} />
              </Button>
            </div>

            {/* Delivery Estimate */}
            <DeliveryEstimateDisplay city={product.store?.city || undefined} />

            {/* Product Code */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Ürün Kodu: {product.urun_kodu}</p>
              {product.barkod && <p>Barkod: {product.barkod}</p>}
              {product.category && <p>Kategori: {product.category}</p>}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Reviews */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Ürün Açıklaması</TabsTrigger>
              <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
              <TabsTrigger value="shipping">Kargo & İade</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none">
                {product.product_description ? (
                  <p className="whitespace-pre-line">{product.product_description}</p>
                ) : (
                  <p className="text-muted-foreground">Ürün açıklaması henüz eklenmemiş.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <ReviewSection productId={product.id} />
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Kargo Bilgisi</h4>
                  <p>200₺ üzeri siparişlerde ücretsiz kargo. Standart teslimat 1-3 iş günü.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">İade Politikası</h4>
                  <p>Ürünlerimizi teslim aldığınız tarihten itibaren 14 gün içinde iade edebilirsiniz.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recommendations */}
        <div className="mt-12">
          <RecommendationSection productId={product.id} category={product.category} />
        </div>
      </main>
    </div>
  );
}
