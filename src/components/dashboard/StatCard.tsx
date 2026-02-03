import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  comparison?: {
    current: number;
    previous: number;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  compact?: boolean;
}

const variantStyles = {
  default: 'bg-card border-border/60',
  primary: 'gradient-primary text-primary-foreground border-transparent',
  accent: 'gradient-accent text-accent-foreground border-transparent',
  success: 'gradient-success text-success-foreground border-transparent',
  warning: 'bg-warning text-warning-foreground border-transparent',
  destructive: 'bg-destructive text-destructive-foreground border-transparent',
};

const iconBgStyles = {
  default: 'bg-primary/8 text-primary',
  primary: 'bg-white/15 text-white',
  accent: 'bg-white/15 text-white',
  success: 'bg-white/15 text-white',
  warning: 'bg-white/15 text-white',
  destructive: 'bg-white/15 text-white',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  comparison,
  variant = 'default',
  compact = false
}: StatCardProps) {
  const isColored = variant !== 'default';

  // Calculate comparison percentage
  const comparisonData = comparison ? (() => {
    const diff = comparison.current - comparison.previous;
    const percentage = comparison.previous > 0 
      ? Math.round((diff / comparison.previous) * 100) 
      : diff > 0 ? 100 : 0;
    return { diff, percentage, isPositive: diff >= 0 };
  })() : null;

  return (
    <div className={cn(
      'stat-card-enhanced animate-fade-in border',
      variantStyles[variant],
      compact && 'p-3 md:p-4'
    )}>
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
          <p className={cn(
            'text-[10px] md:text-xs font-medium uppercase tracking-wide truncate',
            isColored ? 'text-white/70' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-lg md:text-2xl lg:text-3xl font-bold tracking-tight tabular-nums',
            isColored ? 'text-white' : 'text-foreground'
          )}>
            {value}
          </p>
          
          {/* Trend indicator */}
          {trend && (
            <p className={cn(
              'text-xs flex items-center gap-1',
              isColored ? 'text-white/70' : 'text-muted-foreground'
            )}>
              <span className={cn(
                'font-medium inline-flex items-center gap-0.5',
                trend.value >= 0 ? 'text-success' : 'text-destructive',
                isColored && (trend.value >= 0 ? 'text-white/90' : 'text-white/90')
              )}>
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="ml-0.5">{trend.label}</span>
            </p>
          )}

          {/* Comparison indicator (vs yesterday) */}
          {comparisonData && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs',
              isColored ? 'text-white/70' : 'text-muted-foreground'
            )}>
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                comparisonData.isPositive 
                  ? 'bg-success/10 text-success' 
                  : 'bg-destructive/10 text-destructive',
                isColored && 'bg-white/20 text-white'
              )}>
                {comparisonData.isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                {comparisonData.isPositive ? '+' : ''}{comparisonData.percentage}%
              </span>
              <span>{comparison.label || 'vs dün'}</span>
            </div>
          )}
        </div>

        {/* Icon with subtle background circle */}
        <div className={cn(
          'flex-shrink-0 p-2 md:p-3 rounded-lg md:rounded-xl transition-transform duration-200',
          iconBgStyles[variant]
        )}>
          <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
        </div>
      </div>
    </div>
  );
}
