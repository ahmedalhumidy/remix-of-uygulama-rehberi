import { useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/store/ProductCard';
import { useRecommendations } from '../hooks/useRecommendations';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp } from 'lucide-react';
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
          <Skeleton className="h-7 w-48 mb-5" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/5] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0 && frequentlyBought.length === 0) return null;

  return (
    <div className="space-y-12">
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-lg font-bold">Benzer Ürünler</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedProducts.slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
            ))}
          </div>
        </div>
      )}

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
            <h3 className="text-lg font-bold">Birlikte Sıkça Alınanlar</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {frequentlyBought.slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
