import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  MapPin, 
  AlertTriangle,
  UserCog,
  Users,
  ScrollText
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ViewMode } from '@/types/stock';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  alertCount: number;
}

const menuItems = [
  { id: 'dashboard' as ViewMode, path: '/', icon: LayoutDashboard, label: 'Kontrol Paneli', adminOnly: false },
  { id: 'products' as ViewMode, path: '/products', icon: Package, label: 'Ürünler', adminOnly: false },
  { id: 'movements' as ViewMode, path: '/movements', icon: ArrowLeftRight, label: 'Stok Hareketleri', adminOnly: false },
  { id: 'locations' as ViewMode, path: '/locations', icon: MapPin, label: 'Konumlar', adminOnly: false },
  { id: 'alerts' as ViewMode, path: '/alerts', icon: AlertTriangle, label: 'Uyarılar', adminOnly: false },
  { id: 'users' as ViewMode, path: '/users', icon: Users, label: 'Kullanıcılar', adminOnly: true },
  { id: 'logs' as ViewMode, path: '/logs', icon: ScrollText, label: 'Denetim Günlüğü', adminOnly: true },
  { id: 'profile' as ViewMode, path: '/profile', icon: UserCog, label: 'Profil Ayarları', adminOnly: false },
];

export function Sidebar({ currentView, onViewChange, alertCount }: SidebarProps) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  
  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  // Determine active state from URL for reliability
  const getIsActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <img src="/favicon.png" alt="GLORE Logo" className="w-10 h-10 rounded-xl" />
        <div>
          <h1 className="font-bold text-lg text-sidebar-foreground">GLORE</h1>
          <p className="text-xs text-sidebar-foreground/60">Stok Takip Sistemi</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = getIsActive(item.path);
          const showBadge = item.id === 'alerts' && alertCount > 0;

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'sidebar-link w-full relative',
                isActive && 'sidebar-link-active'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {showBadge && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - removed, profile is now in menu */}
    </aside>
  );
}
