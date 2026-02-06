import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Share2, Minus, Plus, ChevronRight, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductGallery } from './ProductGallery';
import { ReviewSection } from './ReviewSection';
import { RecommendationSection } from './RecommendationSection';
import { DeliveryEstimateDisplay } from './DeliveryEstimate';
import { useProductDetails } from '@/hooks/useMarketplace';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useProductBadges, getStockVisibility } from '../hooks/useProductBadges';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading } = useProductDetails(id || '');
  const { addToCart, toggleWishlist, isInWishlist } = useCartContext();
  const badges = useProductBadges(product);
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <StoreHeader />
        <div className="container py-20 text-center flex-1">
          <h1 className="text-2xl font-bold mb-2">Ürün Bulunamadı</h1>
          <p className="text-muted-foreground mb-6">Bu ürün mevcut değil veya kaldırılmış.</p>
          <Button onClick={() => navigate('/store')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Mağazaya Dön
          </Button>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images as string[] : [];
  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const discountPct = hasDiscount ? Math.round((1 - displayPrice / product.price) * 100) : 0;
  const stockInfo = getStockVisibility(product.mevcut_stok);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!user) { navigate('/auth'); return; }
    addToCart(product.id, quantity);
    toast({
      title: 'Sepete eklendi',
      description: `${product.urun_adi} (${quantity} adet) sepetinize eklendi.`,
    });
  };

  const handleToggleWishlist = () => {
    if (!user) { navigate('/auth'); return; }
    toggleWishlist(product.id);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.urun_adi, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link kopyalandı!' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="container py-6 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/store')} className="hover:text-foreground transition-colors">Mağaza</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button onClick={() => navigate('/store/products')} className="hover:text-foreground transition-colors">Ürünler</button>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                onClick={() => navigate(`/store/products?category=${encodeURIComponent(product.category!)}`)}
                className="hover:text-foreground transition-colors"
              >
                {product.category}
              </button>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[200px] font-medium">{product.urun_adi}</span>
        </nav>

        {/* Product Content */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
          {/* Gallery */}
          <ProductGallery images={images} productName={product.urun_adi} />

          {/* Info */}
          <div className="space-y-5">
            {/* Store */}
            {product.store && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{product.store.store_name}</span>
                {product.store.is_verified && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                    <Check className="h-2.5 w-2.5 mr-0.5" />
                    Onaylı
                  </Badge>
                )}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{product.urun_adi}</h1>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <Badge key={b.type} variant={b.variant as any} className="text-xs font-semibold">
                    {b.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl lg:text-4xl font-bold">₺{displayPrice.toFixed(2)}</span>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">₺{product.price.toFixed(2)}</span>
                  <Badge className="bg-destructive text-destructive-foreground text-xs">%{discountPct}</Badge>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full',
              stockInfo.urgency === 'none' && 'bg-success/10 text-success',
              stockInfo.urgency === 'low' && 'bg-warning/10 text-warning',
              stockInfo.urgency === 'critical' && product.mevcut_stok > 0 && 'bg-destructive/10 text-destructive',
              stockInfo.urgency === 'critical' && product.mevcut_stok <= 0 && 'bg-muted text-muted-foreground',
            )}>
              {stockInfo.urgency !== 'critical' && <Check className="h-3.5 w-3.5" />}
              {stockInfo.label}
            </div>

            <Separator />

            {/* Quantity + Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-14 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none"
                    onClick={() => setQuantity(Math.min(product.mevcut_stok, quantity + 1))}
                    disabled={quantity >= product.mevcut_stok}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  className="flex-1 h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-md"
                  onClick={handleAddToCart}
                  disabled={product.mevcut_stok <= 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.mevcut_stok > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 h-11 rounded-xl',
                    inWishlist && 'text-destructive border-destructive/30 bg-destructive/5'
                  )}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={cn('h-4 w-4 mr-2', inWishlist && 'fill-current')} />
                  {inWishlist ? 'Favorilerde' : 'Favorilere Ekle'}
                </Button>
                <Button variant="outline" className="h-11 rounded-xl" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaş
                </Button>
              </div>
            </div>

            {/* Delivery Estimate */}
            <DeliveryEstimateDisplay city={product.store?.city || undefined} />

            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: 'Ücretsiz Kargo' },
                { icon: Shield, label: 'Güvenli Ödeme' },
                { icon: RotateCcw, label: '14 Gün İade' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                  <item.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Product Info */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p>Ürün Kodu: <span className="font-medium text-foreground">{product.urun_kodu}</span></p>
              {product.barkod && <p>Barkod: <span className="font-medium text-foreground">{product.barkod}</span></p>}
              {product.category && <p>Kategori: <span className="font-medium text-foreground">{product.category}</span></p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium"
              >
                Ürün Açıklaması
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium"
              >
                Değerlendirmeler
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium"
              >
                Kargo & İade
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none">
                {product.product_description ? (
                  <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{product.product_description}</p>
                ) : (
                  <p className="text-muted-foreground italic">Ürün açıklaması henüz eklenmemiş.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <ReviewSection productId={product.id} />
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Kargo Bilgisi</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 200₺ üzeri siparişlerde ücretsiz kargo</li>
                    <li>• Standart teslimat 1-3 iş günü</li>
                    <li>• Kargo takip numarası SMS ile gönderilir</li>
                  </ul>
                </div>
                <div className="bg-card rounded-xl border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <RotateCcw className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">İade Politikası</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 14 gün içinde koşulsuz iade</li>
                    <li>• Ürün orijinal ambalajında olmalıdır</li>
                    <li>• İade kargo ücretsizdir</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recommendations */}
        <div className="mt-14">
          <RecommendationSection productId={product.id} category={product.category} />
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
