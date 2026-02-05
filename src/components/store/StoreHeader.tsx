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
   Store
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
 import { usePermissions, AppRole } from '@/hooks/usePermissions';
 import { useCartContext } from '@/contexts/CartContext';
 import { Badge } from '@/components/ui/badge';
 
 export function StoreHeader() {
   const [searchQuery, setSearchQuery] = useState('');
   const { user, signOut } = useAuth();
   const { role } = usePermissions();
   const { wishlist } = useCartContext();
   const navigate = useNavigate();
 
   const handleSearch = (e: React.FormEvent) => {
     e.preventDefault();
     if (searchQuery.trim()) {
       navigate(`/store/products?search=${encodeURIComponent(searchQuery)}`);
     }
   };
 
   const categories = [
     'Elektronik',
     'Moda',
     'Ev & Yaşam',
     'Spor',
     'Kozmetik',
     'Kitap',
   ];
 
   return (
     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
       {/* Top Bar */}
       <div className="container flex h-16 items-center gap-4">
         {/* Mobile Menu */}
         <Sheet>
           <SheetTrigger asChild>
             <Button variant="ghost" size="icon" className="md:hidden">
               <Menu className="h-5 w-5" />
             </Button>
           </SheetTrigger>
           <SheetContent side="left">
             <SheetHeader>
               <SheetTitle>Kategoriler</SheetTitle>
             </SheetHeader>
             <nav className="flex flex-col gap-2 mt-4">
               {categories.map((cat) => (
                 <Link
                   key={cat}
                   to={`/store/products?category=${encodeURIComponent(cat)}`}
                   className="px-3 py-2 rounded-md hover:bg-accent text-sm"
                 >
                   {cat}
                 </Link>
               ))}
             </nav>
           </SheetContent>
         </Sheet>
 
         {/* Logo */}
         <Link to="/store" className="flex items-center gap-2 font-bold text-xl">
           <Store className="h-6 w-6 text-primary" />
           <span className="hidden sm:inline">GLORE</span>
         </Link>
 
         {/* Search Bar */}
         <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Ürün, kategori veya marka ara..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 pr-4"
             />
           </div>
         </form>
 
         {/* Actions */}
         <div className="flex items-center gap-2">
           {/* Wishlist */}
           <Button 
             variant="ghost" 
             size="icon"
             onClick={() => navigate('/store/wishlist')}
             className="relative hidden sm:flex"
           >
             <Heart className="h-5 w-5" />
             {wishlist.length > 0 && (
               <Badge 
                 className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                 variant="destructive"
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
                 <Button variant="ghost" size="icon">
                   <User className="h-5 w-5" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-56">
                 <div className="px-2 py-1.5 text-sm font-medium">
                   {user.email}
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
                   Hesabım
                 </DropdownMenuItem>
                 
                 {/* Admin/Merchant Links */}
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
             <Button variant="default" onClick={() => navigate('/auth')}>
               Giriş Yap
             </Button>
           )}
         </div>
       </div>
 
       {/* Categories Bar - Desktop */}
       <nav className="hidden md:block border-t bg-muted/50">
         <div className="container flex items-center gap-1 h-10">
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="sm" className="gap-1">
                 <Menu className="h-4 w-4" />
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
           
           <div className="flex items-center gap-1">
             {categories.slice(0, 5).map((cat) => (
               <Button
                 key={cat}
                 variant="ghost"
                 size="sm"
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