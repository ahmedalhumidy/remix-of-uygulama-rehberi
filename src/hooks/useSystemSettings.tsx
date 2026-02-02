import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  date_format: string;
  default_min_stock: number;
  default_warning_threshold: number;
  timezone: string;
  is_active: boolean;
}

interface SystemSettingsContextType {
  organization: Organization | null;
  loading: boolean;
  updateOrganization: (updates: Partial<Organization>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  formatDate: (date: string | Date) => string;
  formatCurrency: (amount: number) => string;
}

const defaultOrganization: Organization = {
  id: '',
  name: 'GLORE',
  logo_url: null,
  currency: 'TRY',
  date_format: 'DD.MM.YYYY',
  default_min_stock: 5,
  default_warning_threshold: 10,
  timezone: 'Europe/Istanbul',
  is_active: true,
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        setOrganization(defaultOrganization);
      } else {
        setOrganization(data as Organization);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setOrganization(defaultOrganization);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateOrganization = async (updates: Partial<Organization>): Promise<boolean> => {
    if (!organization?.id) return false;

    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id);

      if (error) throw error;

      setOrganization(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      return false;
    }
  };

  const formatDate = useCallback((date: string | Date): string => {
    const d = new Date(date);
    const format = organization?.date_format || 'DD.MM.YYYY';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD.MM.YYYY':
      default:
        return `${day}.${month}.${year}`;
    }
  }, [organization?.date_format]);

  const formatCurrency = useCallback((amount: number): string => {
    const currency = organization?.currency || 'TRY';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(amount);
  }, [organization?.currency]);

  return (
    <SystemSettingsContext.Provider
      value={{
        organization,
        loading,
        updateOrganization,
        refreshSettings: fetchSettings,
        formatDate,
        formatCurrency,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}
