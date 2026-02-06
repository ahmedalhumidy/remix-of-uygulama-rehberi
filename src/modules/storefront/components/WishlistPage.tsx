import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreHeader } from '@/components/store/StoreHeader';
import { ProductCard } from '@/components/store/ProductCard';
import { useCartContext } from '@/contexts/CartContext';
import type { MarketplaceProduct } from '@/types/marketplace';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist } = useCartContext();

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container py-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Heart className="h-6 w-6" /> Favorilerim ({wishlist.length})
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Favorileriniz boş</h2>
            <p className="text-muted-foreground mb-4">Beğendiğiniz ürünleri favorilere ekleyin.</p>
            <Button onClick={() => navigate('/store')}>Mağazaya Git</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlist.map(item => {
              const product = item.product as MarketplaceProduct | undefined;
              if (!product) return null;
              return (
                <ProductCard
                  key={item.id}
                  product={product}
                  onViewDetails={(p) => navigate(`/store/products/${p.id}`)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
