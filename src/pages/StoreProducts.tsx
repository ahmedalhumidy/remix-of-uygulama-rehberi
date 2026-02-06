import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductCard } from '@/components/store/ProductCard';
import { usePublishedProducts } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, SlidersHorizontal, Grid, List, X, Package } from 'lucide-react';
import type { MarketplaceProduct } from '@/types/marketplace';

const categories = [
  'Elektronik',
  'Moda',
  'Ev & Yaşam',
  'Spor',
  'Kozmetik',
  'Kitap',
];

export default function StoreProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products, isLoading } = usePublishedProducts();

  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.urun_adi.toLowerCase().includes(query) ||
        p.urun_kodu.toLowerCase().includes(query) ||
        p.product_description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }

    result = result.filter(p => {
      const price = p.sale_price ?? p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
        break;
      case 'popular':
        result.sort((a, b) => b.toplam_cikis - a.toplam_cikis);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, searchQuery, categoryFilter, priceRange, sortBy]);

  const handleViewDetails = (product: MarketplaceProduct) => {
    navigate(`/store/products/${product.id}`);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([0, 10000]);
    setSortBy('newest');
  };

  const hasFilters = !!searchQuery || !!categoryFilter || priceRange[0] > 0 || priceRange[1] < 10000;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
          Kategori
        </Label>
        <div className="space-y-1">
          <Button
            variant={!categoryFilter ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full justify-start text-sm"
            onClick={() => setSearchParams(prev => { prev.delete('category'); return prev; })}
          >
            Tümü
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => setSearchParams(prev => { prev.set('category', cat); return prev; })}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
          Fiyat Aralığı
        </Label>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={10000}
            step={100}
            className="mb-4"
          />
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="h-8 text-xs"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {hasFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
          <X className="h-3.5 w-3.5 mr-1.5" />
          Filtreleri Temizle
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="container py-6 flex-1">
        {/* Active Filters */}
        {hasFilters && (
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1.5 pr-1">
                Arama: "{searchQuery}"
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-transparent"
                  onClick={() => setSearchParams(prev => { prev.delete('search'); return prev; })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {categoryFilter && (
              <Badge variant="secondary" className="gap-1.5 pr-1">
                {categoryFilter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-transparent"
                  onClick={() => setSearchParams(prev => { prev.delete('category'); return prev; })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-36 space-y-6">
              <h2 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filtreler
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtreler
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px]">
                    <SheetHeader>
                      <SheetTitle>Filtreler</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{filteredProducts.length}</strong> ürün bulundu
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">En Yeniler</SelectItem>
                    <SelectItem value="popular">En Çok Satanlar</SelectItem>
                    <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                    <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden md:flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/5] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-4'
              }>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">Ürün bulunamadı</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Farklı filtreler deneyebilirsiniz</p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters}>Filtreleri Temizle</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
