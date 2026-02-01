import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  accent: 'gradient-accent text-accent-foreground',
  success: 'gradient-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-white/20 text-white',
  accent: 'bg-white/20 text-white',
  success: 'bg-white/20 text-white',
  warning: 'bg-white/20 text-white',
  destructive: 'bg-white/20 text-white',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const isColored = variant !== 'default';

  return (
    <div className={cn(
      'stat-card animate-fade-in',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            isColored ? 'text-white/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold tracking-tight',
            isColored ? 'text-white' : 'text-foreground'
          )}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              'text-xs',
              isColored ? 'text-white/70' : 'text-muted-foreground'
            )}>
              <span className={trend.value >= 0 ? 'text-success' : 'text-destructive'}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              {' '}{trend.label}
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconVariantStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
