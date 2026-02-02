import { useState } from 'react';
import { ArrowLeftRight, Plus, History, ShieldAlert } from 'lucide-react';
import { Product, StockMovement } from '@/types/stock';
import { MovementForm } from './MovementForm';
import { MovementHistory } from './MovementHistory';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';

interface MovementPageProps {
  products: Product[];
  movements: StockMovement[];
  searchQuery: string;
  onAddMovement: (data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    date: string;
    time: string;
    handledBy: string;
    note?: string;
  }) => void;
  onAddNewProduct?: (barcode: string) => void;
}

type Tab = 'form' | 'history';

export function MovementPage({ products, movements, searchQuery, onAddMovement, onAddNewProduct }: MovementPageProps) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'form' : 'history');

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        {isAdmin && (
          <button
            onClick={() => setActiveTab('form')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium',
              activeTab === 'form' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Plus className="w-4 h-4" />
            Yeni Hareket
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium',
            activeTab === 'history' 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <History className="w-4 h-4" />
          Hareket Geçmişi
        </button>
      </div>

      {/* Content */}
      {activeTab === 'form' && isAdmin && (
        <div className="max-w-xl">
          <MovementForm 
            products={products} 
            onSubmit={onAddMovement} 
            onAddNewProduct={onAddNewProduct}
          />
        </div>
      )}

      {activeTab === 'form' && !isAdmin && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Hareket ekleme yetkisi sadece yöneticilere aittir</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <MovementHistory movements={movements} searchQuery={searchQuery} />
      )}
    </div>
  );
}
