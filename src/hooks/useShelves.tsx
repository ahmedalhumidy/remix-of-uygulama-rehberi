import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Shelf {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export function useShelves() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShelves = async () => {
    try {
      const { data, error } = await supabase
        .from('shelves')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setShelves(data || []);
    } catch (error) {
      console.error('Error fetching shelves:', error);
      toast.error('Raflar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, []);

  const addShelf = async (name: string, description?: string): Promise<Shelf | null> => {
    try {
      // Check if shelf already exists
      const existingShelf = shelves.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (existingShelf) {
        toast.info('Bu raf zaten mevcut');
        return existingShelf;
      }

      const { data, error } = await supabase
        .from('shelves')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      setShelves(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Yeni raf eklendi');
      return data;
    } catch (error) {
      console.error('Error adding shelf:', error);
      toast.error('Raf eklenirken hata oluştu');
      return null;
    }
  };

  const updateShelf = async (id: string, name: string, description?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shelves')
        .update({ name, description })
        .eq('id', id);

      if (error) throw error;

      setShelves(prev => prev.map(s => s.id === id ? { ...s, name, description } : s));
      toast.success('Raf güncellendi');
      return true;
    } catch (error) {
      console.error('Error updating shelf:', error);
      toast.error('Raf güncellenirken hata oluştu');
      return false;
    }
  };

  const deleteShelf = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shelves')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShelves(prev => prev.filter(s => s.id !== id));
      toast.success('Raf silindi');
      return true;
    } catch (error) {
      console.error('Error deleting shelf:', error);
      toast.error('Raf silinirken hata oluştu');
      return false;
    }
  };

  const getShelfByName = (name: string): Shelf | undefined => {
    return shelves.find(s => s.name === name);
  };

  const refreshShelves = () => {
    setLoading(true);
    fetchShelves();
  };

  return {
    shelves,
    loading,
    addShelf,
    updateShelf,
    deleteShelf,
    getShelfByName,
    refreshShelves,
  };
}
