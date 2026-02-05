 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { StoreHeader } from '@/components/store/StoreHeader';
 import { ProductCard } from '@/components/store/ProductCard';
 import { usePublishedProducts } from '@/hooks/useMarketplace';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ChevronRight, Truck, ShieldCheck, CreditCard, Headphones } from 'lucide-react';
 import type { MarketplaceProduct } from '@/types/marketplace';
 
 export default function StoreFront() {
   const navigate = useNavigate();
   const { data: products, isLoading } = usePublishedProducts();
 
   const handleViewDetails = (product: MarketplaceProduct) => {
     navigate(`/store/products/${product.id}`);
   };
 
   const features = [
     {
       icon: Truck,
       title: 'Ücretsiz Kargo',
       description: '200₺ üzeri siparişlerde',
     },
     {
       icon: ShieldCheck,
       title: 'Güvenli Alışveriş',
       description: '256-bit SSL şifreleme',
     },
     {
       icon: CreditCard,
       title: 'Kolay Ödeme',
       description: 'Kredi kartı, havale, kapıda',
     },
     {
       icon: Headphones,
       title: '7/24 Destek',
       description: 'Her zaman yanınızdayız',
     },
   ];
 
   const categories = [
     { name: 'Elektronik', image: '/placeholder.svg', count: 234 },
     { name: 'Moda', image: '/placeholder.svg', count: 512 },
     { name: 'Ev & Yaşam', image: '/placeholder.svg', count: 189 },
     { name: 'Spor', image: '/placeholder.svg', count: 156 },
     { name: 'Kozmetik', image: '/placeholder.svg', count: 298 },
     { name: 'Kitap', image: '/placeholder.svg', count: 423 },
   ];
 
   return (
     <div className="min-h-screen bg-background">
       <StoreHeader />
       
       <main>
         {/* Hero Section */}
         <section className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16 md:py-24">
           <div className="container">
             <div className="max-w-2xl">
               <Badge className="mb-4">Yeni Sezon</Badge>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                 GLORE Marketplace'e Hoş Geldiniz
               </h1>
               <p className="text-lg text-muted-foreground mb-6">
                 Binlerce ürün, yüzlerce satıcı. En uygun fiyatlarla güvenli alışveriş deneyimi.
               </p>
               <div className="flex flex-wrap gap-3">
                 <Button size="lg" onClick={() => navigate('/store/products')}>
                   Ürünleri Keşfet
                   <ChevronRight className="ml-2 h-4 w-4" />
                 </Button>
                 <Button size="lg" variant="outline">
                   Satıcı Ol
                 </Button>
               </div>
             </div>
           </div>
         </section>
 
         {/* Features */}
         <section className="border-y bg-muted/30 py-6">
           <div className="container">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {features.map((feature) => (
                 <div key={feature.title} className="flex items-center gap-3">
                   <div className="rounded-full bg-primary/10 p-2.5">
                     <feature.icon className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="font-medium text-sm">{feature.title}</p>
                     <p className="text-xs text-muted-foreground">{feature.description}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </section>
 
         {/* Categories */}
         <section className="py-12">
           <div className="container">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold">Kategoriler</h2>
               <Button variant="ghost" size="sm" onClick={() => navigate('/store/products')}>
                 Tümünü Gör
                 <ChevronRight className="ml-1 h-4 w-4" />
               </Button>
             </div>
             <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
               {categories.map((cat) => (
                 <button
                   key={cat.name}
                   onClick={() => navigate(`/store/products?category=${encodeURIComponent(cat.name)}`)}
                   className="group flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                 >
                   <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                     <img 
                       src={cat.image} 
                       alt={cat.name}
                       className="w-10 h-10 object-contain"
                     />
                   </div>
                   <span className="font-medium text-sm text-center">{cat.name}</span>
                   <span className="text-xs text-muted-foreground">{cat.count} ürün</span>
                 </button>
               ))}
             </div>
           </div>
         </section>
 
         {/* Featured Products */}
         <section className="py-12 bg-muted/30">
           <div className="container">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold">Öne Çıkan Ürünler</h2>
               <Button variant="ghost" size="sm" onClick={() => navigate('/store/products')}>
                 Tümünü Gör
                 <ChevronRight className="ml-1 h-4 w-4" />
               </Button>
             </div>
             
             {isLoading ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {[...Array(10)].map((_, i) => (
                   <div key={i} className="space-y-3">
                     <Skeleton className="aspect-square rounded-lg" />
                     <Skeleton className="h-4 w-3/4" />
                     <Skeleton className="h-4 w-1/2" />
                   </div>
                 ))}
               </div>
             ) : products && products.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {products.slice(0, 10).map((product) => (
                   <ProductCard
                     key={product.id}
                     product={product}
                     onViewDetails={handleViewDetails}
                   />
                 ))}
               </div>
             ) : (
               <div className="text-center py-12">
                 <p className="text-muted-foreground">Henüz ürün bulunmuyor.</p>
                 <p className="text-sm text-muted-foreground mt-1">
                   Yakında yeni ürünler eklenecek!
                 </p>
               </div>
             )}
           </div>
         </section>
 
         {/* CTA Section */}
         <section className="py-16 bg-primary text-primary-foreground">
           <div className="container text-center">
             <h2 className="text-3xl font-bold mb-4">Satıcı Olmak İster Misiniz?</h2>
             <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
               GLORE Marketplace'te mağazanızı açın, binlerce müşteriye ulaşın. 
               Komisyon oranları düşük, ödeme güvenli.
             </p>
             <Button size="lg" variant="secondary">
               Hemen Başvur
             </Button>
           </div>
         </section>
       </main>
 
       {/* Footer */}
       <footer className="border-t py-12 bg-muted/30">
         <div className="container">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             <div>
               <h3 className="font-bold mb-4">GLORE</h3>
               <p className="text-sm text-muted-foreground">
                 Türkiye'nin en güvenilir e-ticaret platformu.
               </p>
             </div>
             <div>
               <h4 className="font-medium mb-3">Kurumsal</h4>
               <ul className="space-y-2 text-sm text-muted-foreground">
                 <li><a href="#" className="hover:text-foreground">Hakkımızda</a></li>
                 <li><a href="#" className="hover:text-foreground">Kariyer</a></li>
                 <li><a href="#" className="hover:text-foreground">İletişim</a></li>
               </ul>
             </div>
             <div>
               <h4 className="font-medium mb-3">Yardım</h4>
               <ul className="space-y-2 text-sm text-muted-foreground">
                 <li><a href="#" className="hover:text-foreground">Sıkça Sorulan Sorular</a></li>
                 <li><a href="#" className="hover:text-foreground">Kargo Takip</a></li>
                 <li><a href="#" className="hover:text-foreground">İade Koşulları</a></li>
               </ul>
             </div>
             <div>
               <h4 className="font-medium mb-3">Satıcılar</h4>
               <ul className="space-y-2 text-sm text-muted-foreground">
                 <li><a href="#" className="hover:text-foreground">Satıcı Ol</a></li>
                 <li><a href="#" className="hover:text-foreground">Satıcı Girişi</a></li>
                 <li><a href="#" className="hover:text-foreground">Komisyon Oranları</a></li>
               </ul>
             </div>
           </div>
           <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
             © 2025 GLORE. Tüm hakları saklıdır.
           </div>
         </div>
       </footer>
     </div>
   );
 }