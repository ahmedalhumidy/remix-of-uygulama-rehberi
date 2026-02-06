import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const allImages = images.length > 0 ? images : ['/placeholder.svg'];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const prev = () => setActiveIndex((i) => (i > 0 ? i - 1 : allImages.length - 1));
  const next = () => setActiveIndex((i) => (i < allImages.length - 1 ? i + 1 : 0));

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        ref={imageRef}
        className={cn(
          'relative aspect-square rounded-xl overflow-hidden bg-muted cursor-crosshair group',
          isZoomed && 'cursor-zoom-out'
        )}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={allImages[activeIndex]}
          alt={`${productName} - ${activeIndex + 1}`}
          className={cn(
            'w-full h-full object-contain transition-transform duration-200',
            isZoomed && 'scale-[2.5]'
          )}
          style={
            isZoomed
              ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
        />

        {/* Zoom indicator */}
        {!isZoomed && (
          <div className="absolute top-3 right-3 bg-background/80 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4" />
          </div>
        )}

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full h-8 w-8"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full h-8 w-8"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                idx === activeIndex
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={img}
                alt={`${productName} - ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
