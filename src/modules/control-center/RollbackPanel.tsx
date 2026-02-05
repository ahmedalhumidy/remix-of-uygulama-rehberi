import { FeatureFlag, ModuleKey, MODULE_METADATA } from '@/modules/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Power, PowerOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface RollbackPanelProps {
  flags: FeatureFlag[];
  onToggle: (key: ModuleKey, enabled: boolean) => Promise<void>;
  canManage: boolean;
}

export function RollbackPanel({ flags, onToggle, canManage }: RollbackPanelProps) {
  const enabledModules = flags.filter(f => f.is_enabled && f.module_key !== 'control_center');
  const disabledModules = flags.filter(f => !f.is_enabled);

  const handleDisableAll = async () => {
    if (!canManage) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }

    for (const flag of enabledModules) {
      await onToggle(flag.module_key as ModuleKey, false);
    }
    toast.success('Tüm modüller devre dışı bırakıldı (Kontrol Merkezi hariç)');
  };

  return (
    <div className="space-y-6">
      {/* Warning Card */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Geri Alma Paneli</p>
              <p className="text-xs text-muted-foreground mt-1">
                Burada modülleri anında devre dışı bırakabilirsiniz. Devre dışı bırakılan modüller
                mevcut sistemi etkilemez — uygulama orijinal davranışına geri döner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Disable All */}
      {enabledModules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Toplu İşlem</CardTitle>
            <CardDescription className="text-xs">
              Tüm ek modülleri tek seferde devre dışı bırakın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisableAll}
              disabled={!canManage}
            >
              <PowerOff className="w-4 h-4 mr-1.5" />
              Tümünü Devre Dışı Bırak
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Individual Module Switches */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Aktif Modüller</h3>
        {enabledModules.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Kontrol Merkezi dışında aktif modül yok
              </p>
            </CardContent>
          </Card>
        ) : (
          enabledModules.map(flag => {
            const meta = MODULE_METADATA[flag.module_key as ModuleKey];
            return (
              <Card key={flag.module_key}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-[10px]">
                      {meta?.category || 'Modül'}
                    </Badge>
                    <span className="text-sm font-medium">{flag.module_name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggle(flag.module_key as ModuleKey, false)}
                    disabled={!canManage}
                  >
                    <PowerOff className="w-3.5 h-3.5 mr-1.5" />
                    Devre Dışı
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}

        <h3 className="text-sm font-semibold text-foreground mt-6">Devre Dışı Modüller</h3>
        {disabledModules.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Tüm modüller aktif</p>
            </CardContent>
          </Card>
        ) : (
          disabledModules.map(flag => {
            const meta = MODULE_METADATA[flag.module_key as ModuleKey];
            return (
              <Card key={flag.module_key} className="opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {meta?.category || 'Modül'}
                    </Badge>
                    <span className="text-sm">{flag.module_name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggle(flag.module_key as ModuleKey, true)}
                    disabled={!canManage}
                  >
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    Etkinleştir
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
