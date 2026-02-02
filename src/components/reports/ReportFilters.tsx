import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { Product } from '@/types/stock';
import { supabase } from '@/integrations/supabase/client';

export interface ReportFilterValues {
  dateFrom: string | null;
  dateTo: string | null;
  productId: string | null;
  userId: string | null;
  movementType: 'giris' | 'cikis' | null;
}

interface ReportFiltersProps {
  products: Product[];
  filters: ReportFilterValues;
  onFiltersChange: (filters: ReportFilterValues) => void;
  showUserFilter?: boolean;
  showProductFilter?: boolean;
  showMovementTypeFilter?: boolean;
}

interface UserOption {
  id: string;
  name: string;
}

export function ReportFilters({
  products,
  filters,
  onFiltersChange,
  showUserFilter = true,
  showProductFilter = true,
  showMovementTypeFilter = true,
}: ReportFiltersProps) {
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      
      if (data) {
        setUsers(data.map(u => ({ id: u.user_id, name: u.full_name })));
      }
    };
    
    if (showUserFilter) {
      fetchUsers();
    }
  }, [showUserFilter]);

  const updateFilter = <K extends keyof ReportFilterValues>(
    key: K,
    value: ReportFilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateFrom: null,
      dateTo: null,
      productId: null,
      userId: null,
      movementType: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  // Set default date range to last 30 days
  useEffect(() => {
    if (!filters.dateFrom && !filters.dateTo) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      onFiltersChange({
        ...filters,
        dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
      });
    }
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Rapor Filtreleri
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Temizle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Başlangıç Tarihi</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value || null)}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="dateTo">Bitiş Tarihi</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value || null)}
            />
          </div>

          {/* Product Filter */}
          {showProductFilter && (
            <div className="space-y-2">
              <Label>Ürün</Label>
              <Select
                value={filters.productId || 'all'}
                onValueChange={(v) => updateFilter('productId', v === 'all' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm ürünler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm ürünler</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.urunAdi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User Filter */}
          {showUserFilter && (
            <div className="space-y-2">
              <Label>Kullanıcı</Label>
              <Select
                value={filters.userId || 'all'}
                onValueChange={(v) => updateFilter('userId', v === 'all' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm kullanıcılar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm kullanıcılar</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Movement Type Filter */}
          {showMovementTypeFilter && (
            <div className="space-y-2">
              <Label>Hareket Tipi</Label>
              <Select
                value={filters.movementType || 'all'}
                onValueChange={(v) => updateFilter('movementType', v === 'all' ? null : (v as 'giris' | 'cikis'))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="giris">Giriş</SelectItem>
                  <SelectItem value="cikis">Çıkış</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
