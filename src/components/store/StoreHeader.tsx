import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  User,
  Heart,
  ChevronDown,
  LogOut,
  Package,
  Settings,
  Store,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CartDrawer } from './CartDrawer';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useCartContext } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categories = [
  'Elektronik',
  'Moda',
  'Ev & Yaşam',
  'Spor',
  'Kozmetik',
  'Kitap',
];

export function StoreHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { role } = usePermissions();
  const { wishlist } = useCartContext();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50">
      {/* Promo Bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-1.5 font-medium tracking-wide">
        🚚 200₺ üzeri siparişlerde <strong>ÜCRETSİZ KARGO</strong> · Güvenli alışveriş
      </div>

      {/* Main Header */}
      <div className="container flex h-16 items-center gap-3">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent" />
                GLORE
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-6">
              <Link
                to="/store"
                className="px-3 py-2.5 rounded-lg hover:bg-accent/10 text-sm font-medium transition-colors"
              >
                Ana Sayfa
              </Link>
              <Link
                to="/store/products"
                className="px-3 py-2.5 rounded-lg hover:bg-accent/10 text-sm font-medium transition-colors"
              >
                Tüm Ürünler
              </Link>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">
                Kategoriler
              </div>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/store/products?category=${encodeURIComponent(cat)}`}
                  className="px-3 py-2 rounded-lg hover:bg-accent/10 text-sm transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/store" className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-xl tracking-tight">GLORE</span>
            <span className="text-[10px] text-muted-foreground block -mt-1 tracking-widest uppercase">
              Marketplace
            </span>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-6">
          <div className="relative w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Ürün, kategori veya marka ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-11 bg-muted/50 border-muted focus:bg-background focus:border-primary/50 rounded-xl transition-all"
            />
          </div>
        </form>

        {/* Mobile Search Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-1.5">
          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/store/wishlist')}
            className="relative hidden sm:flex hover:text-accent transition-colors"
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-4.5 w-4.5 flex items-center justify-center p-0 text-[10px] bg-accent text-accent-foreground border-2 border-background"
              >
                {wishlist.length}
              </Badge>
            )}
          </Button>

          {/* Cart */}
          <CartDrawer />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:text-primary transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Hesabım</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/store/orders')}>
                  <Package className="mr-2 h-4 w-4" />
                  Siparişlerim
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/store/wishlist')}>
                  <Heart className="mr-2 h-4 w-4" />
                  Favorilerim
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/store/account')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Hesap Ayarları
                </DropdownMenuItem>

                {(role === 'admin' || role === 'manager' || role === 'staff') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Yönetim Paneli
                    </DropdownMenuItem>
                  </>
                )}
                {(role as string) === 'merchant' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/merchant')}>
                      <Store className="mr-2 h-4 w-4" />
                      Satıcı Paneli
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex"
              >
                Giriş Yap
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <User className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Kayıt Ol</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Expanded */}
      {searchOpen && (
        <div className="md:hidden border-t px-4 py-3 bg-background animate-fade-in">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ne aramıştınız?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 rounded-xl"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      {/* Categories Bar - Desktop */}
      <nav className="hidden md:block border-t border-border/30 bg-background/50">
        <div className="container flex items-center gap-0.5 h-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 font-medium text-xs hover:text-accent">
                <Menu className="h-3.5 w-3.5" />
                Tüm Kategoriler
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => navigate(`/store/products?category=${encodeURIComponent(cat)}`)}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-border mx-1" />

          <div className="flex items-center gap-0.5">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant="ghost"
                size="sm"
                className="text-xs font-medium hover:text-accent transition-colors"
                onClick={() => navigate(`/store/products?category=${encodeURIComponent(cat)}`)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
