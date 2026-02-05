import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePermissions } from '@/hooks/usePermissions';
import { ModuleKey, MODULE_METADATA } from '@/modules/types';
import { ModuleCard } from './ModuleCard';
import { MigrationSafetyReport } from './MigrationSafetyReport';
import { RollbackPanel } from './RollbackPanel';
import { FieldDefinitionManager } from '@/modules/dynamic-forms/components/FieldDefinitionManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export function ControlCenterPage() {
  const { flags, loading, toggleModule, refreshFlags } = useFeatureFlags();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('settings.manage');

  if (!hasPermission('settings.view')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bu sayfa için yetkiniz yok</p>
        </CardContent>
      </Card>
    );
  }

  const enabledCount = flags.filter(f => f.is_enabled).length;
  const totalCount = flags.length;

  const handleToggle = async (key: ModuleKey, enabled: boolean) => {
    if (!canManage) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }
    const success = await toggleModule(key, enabled);
    if (success) {
      toast.success(enabled ? 'Modül etkinleştirildi' : 'Modül devre dışı bırakıldı');
    } else {
      toast.error('Modül durumu güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Kontrol Merkezi</h2>
            <p className="text-sm text-muted-foreground">
              Kurumsal modülleri yönetin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {enabledCount}/{totalCount} aktif
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshFlags}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Yenile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Modüller</TabsTrigger>
          <TabsTrigger value="custom-fields">Özel Alanlar</TabsTrigger>
          <TabsTrigger value="safety">Güvenlik Raporu</TabsTrigger>
          <TabsTrigger value="rollback">Geri Alma</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flags.map(flag => (
              <ModuleCard
                key={flag.module_key}
                flag={flag}
                metadata={MODULE_METADATA[flag.module_key as ModuleKey]}
                onToggle={(enabled) => handleToggle(flag.module_key as ModuleKey, enabled)}
                canManage={canManage}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom-fields" className="mt-6">
          <FieldDefinitionManager />
        </TabsContent>

        <TabsContent value="safety" className="mt-6">
          <MigrationSafetyReport flags={flags} />
        </TabsContent>

        <TabsContent value="rollback" className="mt-6">
          <RollbackPanel
            flags={flags}
            onToggle={handleToggle}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
