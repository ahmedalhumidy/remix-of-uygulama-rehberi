import { useNavigate } from 'react-router-dom';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductCard } from '@/components/store/ProductCard';
import { usePublishedProducts } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  ShoppingBag,
  Package,
  Palette,
  Dumbbell,
  Gem,
  BookOpen,
} from 'lucide-react';
import type { MarketplaceProduct } from '@/types/marketplace';
import heroImage from '@/assets/store-hero.jpg';

const categories = [
  { name: 'Elektronik', icon: Zap, color: 'from-blue-500/20 to-blue-600/10' },
  { name: 'Moda', icon: ShoppingBag, color: 'from-pink-500/20 to-pink-600/10' },
  { name: 'Ev & Yaşam', icon: Package, color: 'from-emerald-500/20 to-emerald-600/10' },
  { name: 'Spor', icon: Dumbbell, color: 'from-orange-500/20 to-orange-600/10' },
  { name: 'Kozmetik', icon: Gem, color: 'from-purple-500/20 to-purple-600/10' },
  { name: 'Kitap', icon: BookOpen, color: 'from-amber-500/20 to-amber-600/10' },
];

export default function StoreFront() {
  const navigate = useNavigate();
  const { data: products, isLoading } = usePublishedProducts();

  const handleViewDetails = (product: MarketplaceProduct) => {
    navigate(`/store/products/${product.id}`);
  };

  // Split products for sections
  const newest = products?.slice(0, 10) ?? [];
  const bestSellers = [...(products ?? [])].sort((a, b) => b.toplam_cikis - a.toplam_cikis).slice(0, 5);
  const onSale = (products ?? []).filter(p => p.sale_price != null && p.sale_price < p.price).slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
          </div>
          <div className="container relative z-10 py-16 md:py-24 lg:py-32">
            <div className="max-w-xl">
              <Badge className="mb-4 bg-accent text-accent-foreground border-0 px-3 py-1 text-xs font-semibold">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Yeni Sezon Ürünleri
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground leading-tight mb-4">
                Premium Alışveriş
                <br />
                <span className="text-accent">Deneyimi</span>
              </h1>
              <p className="text-base md:text-lg text-primary-foreground/70 mb-8 max-w-md leading-relaxed">
                Binlerce ürün, güvenilir satıcılar. En uygun fiyatlarla kaliteli alışveriş deneyimi.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/store/products')}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-8 rounded-xl shadow-lg"
                >
                  Ürünleri Keşfet
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/merchant/create-store')}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 font-semibold h-12 px-8 rounded-xl"
                >
                  Satıcı Ol
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-10 md:py-14">
          <div className="container">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Kategoriler</h2>
                <p className="text-sm text-muted-foreground mt-0.5">İlgi alanınıza göre keşfedin</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/store/products')} className="text-accent hover:text-accent/80">
                Tümünü Gör
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => navigate(`/store/products?category=${encodeURIComponent(cat.name)}`)}
                  className="group flex flex-col items-center p-4 md:p-5 rounded-2xl bg-card border border-border/50 hover:border-accent/30 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <cat.icon className="h-5 w-5 md:h-6 md:w-6 text-foreground/70" />
                  </div>
                  <span className="font-medium text-xs md:text-sm text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-10 md:py-14 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Öne Çıkan Ürünler</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Sizin için seçtiğimiz ürünler</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/store/products')} className="text-accent hover:text-accent/80">
                Tümünü Gör
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/5] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : newest.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {newest.map((product) => (
                  <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Henüz ürün bulunmuyor.</p>
                <p className="text-sm text-muted-foreground mt-1">Yakında yeni ürünler eklenecek!</p>
              </div>
            )}
          </div>
        </section>

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="py-10 md:py-14">
            <div className="container">
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">Çok Satanlar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Müşterilerin en çok tercih ettikleri</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/store/products?sort=popular')} className="text-accent hover:text-accent/80">
                  Tümünü Gör
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {bestSellers.map((product) => (
                  <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* On Sale */}
        {onSale.length > 0 && (
          <section className="py-10 md:py-14 bg-destructive/5">
            <div className="container">
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">İndirimli Ürünler</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Fırsatları kaçırmayın</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {onSale.map((product) => (
                  <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-accent blur-3xl" />
          </div>
          <div className="container text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Satıcı Olmak İster Misiniz?</h2>
            <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto leading-relaxed">
              GLORE Marketplace'te mağazanızı açın, binlerce müşteriye ulaşın.
              Düşük komisyon, güvenli ödeme, 7/24 destek.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/merchant/create-store')}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-8 rounded-xl shadow-lg"
            >
              Hemen Başvur
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
