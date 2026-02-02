import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { BrandingSettings } from './BrandingSettings';
import { GeneralSettings } from './GeneralSettings';
import { SecurityMonitoring } from './SecurityMonitoring';
import { ActiveSessions } from './ActiveSessions';
import { SystemInfo } from './SystemInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SystemSettingsPage() {
  const { hasPermission } = usePermissions();
  const canViewSettings = hasPermission('settings.view');
  const canManageSettings = hasPermission('settings.manage');
  const canViewSecurity = hasPermission('security.view');

  if (!canViewSettings) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bu sayfa için yetkiniz yok</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="branding">Marka</TabsTrigger>
          <TabsTrigger value="security" disabled={!canViewSecurity}>Güvenlik</TabsTrigger>
          <TabsTrigger value="sessions" disabled={!canViewSecurity}>Oturumlar</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings canEdit={canManageSettings} />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSettings canEdit={canManageSettings} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {canViewSecurity ? (
            <SecurityMonitoring />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Güvenlik verilerini görüntüleme yetkiniz yok</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          {canViewSecurity ? (
            <ActiveSessions />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Oturum verilerini görüntüleme yetkiniz yok</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
