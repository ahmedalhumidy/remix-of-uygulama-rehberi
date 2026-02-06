import { useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/store/ProductCard';
import { useRecommendations } from '../hooks/useRecommendations';
import { Skeleton } from '@/components/ui/skeleton';
import type { MarketplaceProduct } from '@/types/marketplace';

interface RecommendationSectionProps {
  productId: string;
  category?: string | null;
}

export function RecommendationSection({ productId, category }: RecommendationSectionProps) {
  const navigate = useNavigate();
  const { relatedProducts, frequentlyBought, isLoading } = useRecommendations(productId, category);

  const handleViewDetails = (product: MarketplaceProduct) => {
    navigate(`/store/products/${product.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Benzer Ürünler</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Benzer Ürünler</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Frequently Bought Together / Best Sellers */}
      {frequentlyBought.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Birlikte Sıkça Alınanlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {frequentlyBought.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
