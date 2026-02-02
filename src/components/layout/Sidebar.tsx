import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  MapPin, 
  AlertTriangle,
  UserCog,
  Users,
  ScrollText,
  BarChart3
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ViewMode } from '@/types/stock';
import { cn } from '@/lib/utils';
import { usePermissions, PermissionType } from '@/hooks/usePermissions';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  alertCount: number;
}

interface MenuItem {
  id: ViewMode;
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiredPermission?: PermissionType;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Kontrol Paneli' },
  { id: 'products', path: '/products', icon: Package, label: 'Ürünler' },
  { id: 'movements', path: '/movements', icon: ArrowLeftRight, label: 'Stok Hareketleri' },
  { id: 'locations', path: '/locations', icon: MapPin, label: 'Konumlar' },
  { id: 'alerts', path: '/alerts', icon: AlertTriangle, label: 'Uyarılar' },
  { id: 'reports', path: '/reports', icon: BarChart3, label: 'Raporlar', requiredPermission: 'reports.view' },
  { id: 'users', path: '/users', icon: Users, label: 'Kullanıcılar', requiredPermission: 'users.view' },
  { id: 'logs', path: '/logs', icon: ScrollText, label: 'Denetim Günlüğü', requiredPermission: 'logs.view' },
  { id: 'profile', path: '/profile', icon: UserCog, label: 'Profil Ayarları' },
];

export function Sidebar({ currentView, onViewChange, alertCount }: SidebarProps) {
  const { hasPermission } = usePermissions();
  const location = useLocation();
  
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

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
    </aside>
  );
}
