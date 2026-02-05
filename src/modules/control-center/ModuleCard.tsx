import { FeatureFlag } from '@/modules/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Settings2, Shield, FileText, GitBranch, Zap, Eye, WifiOff
} from 'lucide-react';

const ICON_MAP: Record<string, typeof Settings2> = {
  Settings2, Shield, FileText, GitBranch, Zap, Eye, WifiOff,
};

interface ModuleCardProps {
  flag: FeatureFlag;
  metadata?: { icon: string; category: string };
  onToggle: (enabled: boolean) => void;
  canManage: boolean;
}

export function ModuleCard({ flag, metadata, onToggle, canManage }: ModuleCardProps) {
  const Icon = metadata ? ICON_MAP[metadata.icon] || Settings2 : Settings2;
  const isControlCenter = flag.module_key === 'control_center';

  return (
    <Card className={`transition-all ${flag.is_enabled ? 'border-primary/30 shadow-sm' : 'opacity-75'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${flag.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{flag.module_name}</CardTitle>
              {metadata && (
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {metadata.category}
                </Badge>
              )}
            </div>
          </div>
          <Switch
            checked={flag.is_enabled}
            onCheckedChange={onToggle}
            disabled={!canManage || isControlCenter}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {flag.description || 'Açıklama mevcut değil'}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant={flag.is_enabled ? 'default' : 'secondary'} className="text-[10px]">
            {flag.is_enabled ? 'Aktif' : 'Devre Dışı'}
          </Badge>
          {isControlCenter && (
            <Badge variant="outline" className="text-[10px]">
              Zorunlu
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
