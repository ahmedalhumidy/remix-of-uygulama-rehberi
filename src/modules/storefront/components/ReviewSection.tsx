import { useState } from 'react';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '../hooks/useReviews';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { reviews, averageRating, reviewCount, submitReview, voteReview } = useReviews(productId);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviewCount > 0 ? (reviews.filter(r => r.rating === star).length / reviewCount) * 100 : 0,
  }));

  const handleSubmit = async () => {
    try {
      await submitReview.mutateAsync({ rating, comment });
      setShowForm(false);
      setComment('');
      setRating(5);
      toast({ title: 'Değerlendirmeniz gönderildi', description: 'Onaylandıktan sonra yayınlanacaktır.' });
    } catch {
      toast({ title: 'Hata', description: 'Değerlendirme gönderilemedi', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Değerlendirmeler ({reviewCount})
        </h3>
        {user && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            Değerlendir
          </Button>
        )}
      </div>

      {/* Rating summary */}
      {reviewCount > 0 && (
        <div className="flex gap-8 p-4 bg-muted/50 rounded-xl">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex gap-0.5 my-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn('h-4 w-4', s <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{reviewCount} değerlendirme</div>
          </div>
          <div className="flex-1 space-y-1">
            {ratingDist.map(d => (
              <div key={d.star} className="flex items-center gap-2 text-sm">
                <span className="w-4">{d.star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Progress value={d.pct} className="h-2 flex-1" />
                <span className="w-6 text-right text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <div className="border rounded-xl p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Puanınız</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <Star className={cn(
                    'h-6 w-6 transition-colors',
                    s <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  )} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Yorumunuzu yazın (isteğe bağlı)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitReview.isPending}>
              {submitReview.isPending ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>İptal</Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(review.customer?.full_name || 'M')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{review.customer?.full_name || 'Müşteri'}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
              {review.is_verified_purchase && (
                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Onaylı Alışveriş</span>
              )}
            </div>
            {review.comment && (
              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
            )}
            {user && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => voteReview.mutate({ reviewId: review.id, voteType: 'helpful' })}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Faydalı
                </Button>
              </div>
            )}
          </div>
        ))}
        {reviewCount === 0 && !showForm && (
          <p className="text-center text-muted-foreground py-8">Henüz değerlendirme yok. İlk yorumu siz yazın!</p>
        )}
      </div>
    </div>
  );
}
