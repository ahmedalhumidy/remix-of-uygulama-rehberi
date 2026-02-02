import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'manager' | 'staff' | 'viewer';

export type PermissionType = 
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'stock_movements.view'
  | 'stock_movements.create'
  | 'users.view'
  | 'users.manage'
  | 'logs.view';

interface RolePermissions {
  role: AppRole;
  permissions: PermissionType[];
}

interface PermissionsContextType {
  role: AppRole | null;
  permissions: PermissionType[];
  loading: boolean;
  hasPermission: (permission: PermissionType) => boolean;
  hasAnyPermission: (permissions: PermissionType[]) => boolean;
  hasAllPermissions: (permissions: PermissionType[]) => boolean;
  roleLabels: Record<AppRole, string>;
  roleDescriptions: Record<AppRole, string>;
  allRoles: AppRole[];
  getPermissionsForRole: (role: AppRole) => PermissionType[];
  permissionLabels: Record<PermissionType, string>;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Yönetici',
  manager: 'Müdür',
  staff: 'Personel',
  viewer: 'İzleyici',
};

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Tam sistem erişimi',
  manager: 'Ürün yönetimi, stok hareketleri, log görüntüleme',
  staff: 'Sadece stok hareketi oluşturma',
  viewer: 'Sadece okuma yetkisi',
};

const permissionLabels: Record<PermissionType, string> = {
  'products.view': 'Ürünleri görüntüle',
  'products.create': 'Ürün ekle',
  'products.update': 'Ürün düzenle',
  'products.delete': 'Ürün sil',
  'stock_movements.view': 'Stok hareketlerini görüntüle',
  'stock_movements.create': 'Stok hareketi oluştur',
  'users.view': 'Kullanıcıları görüntüle',
  'users.manage': 'Kullanıcıları yönet',
  'logs.view': 'Denetim günlüklerini görüntüle',
};

const allRoles: AppRole[] = ['admin', 'manager', 'staff', 'viewer'];

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionType[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Map<AppRole, PermissionType[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      if (!user) {
        setRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching role:', roleError);
          setRole('viewer');
        } else {
          setRole((roleData?.role as AppRole) || 'viewer');
        }

        // Fetch all role permissions for the map
        const { data: allPerms, error: permsError } = await supabase
          .from('role_permissions')
          .select('role, permission');

        if (permsError) {
          console.error('Error fetching permissions:', permsError);
        } else if (allPerms) {
          // Build the role-permissions map
          const permMap = new Map<AppRole, PermissionType[]>();
          allPerms.forEach(rp => {
            const r = rp.role as AppRole;
            const p = rp.permission as PermissionType;
            if (!permMap.has(r)) {
              permMap.set(r, []);
            }
            permMap.get(r)!.push(p);
          });
          setRolePermissionsMap(permMap);

          // Set current user's permissions
          const userRole = (roleData?.role as AppRole) || 'viewer';
          setPermissions(permMap.get(userRole) || []);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setRole('viewer');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleAndPermissions();
  }, [user]);

  const hasPermission = useCallback((permission: PermissionType): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: PermissionType[]): boolean => {
    return perms.some(p => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: PermissionType[]): boolean => {
    return perms.every(p => permissions.includes(p));
  }, [permissions]);

  const getPermissionsForRole = useCallback((r: AppRole): PermissionType[] => {
    return rolePermissionsMap.get(r) || [];
  }, [rolePermissionsMap]);

  return (
    <PermissionsContext.Provider 
      value={{ 
        role, 
        permissions, 
        loading, 
        hasPermission, 
        hasAnyPermission,
        hasAllPermissions,
        roleLabels,
        roleDescriptions,
        allRoles,
        getPermissionsForRole,
        permissionLabels,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
