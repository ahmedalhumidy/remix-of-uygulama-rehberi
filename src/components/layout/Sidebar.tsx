import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  MapPin, 
  AlertTriangle,
  Settings,
  BarChart3
} from 'lucide-react';
import { ViewMode } from '@/types/stock';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  alertCount: number;
}

const menuItems = [
  { id: 'dashboard' as ViewMode, icon: LayoutDashboard, label: 'Kontrol Paneli' },
  { id: 'products' as ViewMode, icon: Package, label: 'Ürünler' },
  { id: 'movements' as ViewMode, icon: ArrowLeftRight, label: 'Stok Hareketleri' },
  { id: 'locations' as ViewMode, icon: MapPin, label: 'Konumlar' },
  { id: 'alerts' as ViewMode, icon: AlertTriangle, label: 'Uyarılar' },
];

export function Sidebar({ currentView, onViewChange, alertCount }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-sidebar-foreground">Stok Takip</h1>
          <p className="text-xs text-sidebar-foreground/60">Yönetim Sistemi</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const showBadge = item.id === 'alerts' && alertCount > 0;

          return (
            <button
              key={item.id}
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
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button className="sidebar-link w-full">
          <Settings className="w-5 h-5" />
          <span>Ayarlar</span>
        </button>
      </div>
    </aside>
  );
}
