 import { useState, useMemo } from 'react';
 import { useNavigate, useSearchParams } from 'react-router-dom';
 import { StoreHeader } from '@/components/store/StoreHeader';
 import { ProductCard } from '@/components/store/ProductCard';
 import { usePublishedProducts } from '@/hooks/useMarketplace';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Slider } from '@/components/ui/slider';
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
 import { Filter, SlidersHorizontal, Grid, List } from 'lucide-react';
 import type { MarketplaceProduct } from '@/types/marketplace';
 
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
 
     // Search filter
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       result = result.filter(p => 
         p.urun_adi.toLowerCase().includes(query) ||
         p.urun_kodu.toLowerCase().includes(query) ||
         p.product_description?.toLowerCase().includes(query)
       );
     }
 
     // Category filter
     if (categoryFilter) {
       result = result.filter(p => p.category === categoryFilter);
     }
 
     // Price filter
     result = result.filter(p => {
       const price = p.sale_price ?? p.price;
       return price >= priceRange[0] && price <= priceRange[1];
     });
 
     // Sorting
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
 
   const categories = [
     'Elektronik',
     'Moda',
     'Ev & Yaşam',
     'Spor',
     'Kozmetik',
     'Kitap',
   ];
 
   const FilterContent = () => (
     <div className="space-y-6">
       {/* Category Filter */}
       <div>
         <Label className="text-sm font-medium mb-3 block">Kategori</Label>
         <div className="space-y-2">
           <Button
             variant={!categoryFilter ? 'secondary' : 'ghost'}
             size="sm"
             className="w-full justify-start"
             onClick={() => setSearchParams(prev => {
               prev.delete('category');
               return prev;
             })}
           >
             Tümü
           </Button>
           {categories.map(cat => (
             <Button
               key={cat}
               variant={categoryFilter === cat ? 'secondary' : 'ghost'}
               size="sm"
               className="w-full justify-start"
               onClick={() => setSearchParams(prev => {
                 prev.set('category', cat);
                 return prev;
               })}
             >
               {cat}
             </Button>
           ))}
         </div>
       </div>
 
       {/* Price Range */}
       <div>
         <Label className="text-sm font-medium mb-3 block">Fiyat Aralığı</Label>
         <div className="px-2">
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
               className="h-8"
             />
             <span>-</span>
             <Input
               type="number"
               value={priceRange[1]}
               onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
               className="h-8"
             />
           </div>
         </div>
       </div>
     </div>
   );
 
   return (
     <div className="min-h-screen bg-background">
       <StoreHeader />
       
       <main className="container py-6">
         <div className="flex gap-6">
           {/* Desktop Filters */}
           <aside className="hidden lg:block w-64 shrink-0">
             <div className="sticky top-20 space-y-6">
               <h2 className="font-bold text-lg flex items-center gap-2">
                 <Filter className="h-5 w-5" />
                 Filtreler
               </h2>
               <FilterContent />
             </div>
           </aside>
 
           {/* Products */}
           <div className="flex-1">
             {/* Toolbar */}
             <div className="flex items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-2">
                 {/* Mobile Filter */}
                 <Sheet>
                   <SheetTrigger asChild>
                     <Button variant="outline" size="sm" className="lg:hidden">
                       <SlidersHorizontal className="h-4 w-4 mr-2" />
                       Filtreler
                     </Button>
                   </SheetTrigger>
                   <SheetContent side="left">
                     <SheetHeader>
                       <SheetTitle>Filtreler</SheetTitle>
                     </SheetHeader>
                     <div className="mt-4">
                       <FilterContent />
                     </div>
                   </SheetContent>
                 </Sheet>
 
                 <span className="text-sm text-muted-foreground">
                   {filteredProducts.length} ürün bulundu
                 </span>
               </div>
 
               <div className="flex items-center gap-2">
                 {/* Sort */}
                 <Select value={sortBy} onValueChange={setSortBy}>
                   <SelectTrigger className="w-[180px]">
                     <SelectValue placeholder="Sırala" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="newest">En Yeniler</SelectItem>
                     <SelectItem value="popular">En Çok Satanlar</SelectItem>
                     <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                     <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                   </SelectContent>
                 </Select>
 
                 {/* View Mode */}
                 <div className="hidden md:flex border rounded-md">
                   <Button
                     variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                     size="icon"
                     className="rounded-r-none"
                     onClick={() => setViewMode('grid')}
                   >
                     <Grid className="h-4 w-4" />
                   </Button>
                   <Button
                     variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                     size="icon"
                     className="rounded-l-none"
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
                     <Skeleton className="aspect-square rounded-lg" />
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
                   <ProductCard
                     key={product.id}
                     product={product}
                     onViewDetails={handleViewDetails}
                   />
                 ))}
               </div>
             ) : (
               <div className="text-center py-12">
                 <p className="text-lg font-medium">Ürün bulunamadı</p>
                 <p className="text-sm text-muted-foreground mt-1">
                   Farklı filtreler deneyebilirsiniz
                 </p>
               </div>
             )}
           </div>
         </div>
       </main>
     </div>
   );
 }