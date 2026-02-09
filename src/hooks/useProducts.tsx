import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Product } from '@/types/stock'
import { toast } from 'sonner'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('Ürünler yüklenemedi')
      setLoading(false)
      return
    }

    const mapped: Product[] = (data || []).map((p: any) => ({
      id: p.id,
      urunAdi: p.urun_adi,
      urunKodu: p.urun_kodu,
      barkod: p.barkod,
      mevcutStok: p.mevcut_stok || 0,
      setStok: p.set_stok || 0,
      minStok: p.min_stok || 0,
      rafKonum: p.raf_konum || null,
      createdAt: p.created_at,
    }))

    setProducts(mapped)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('products').insert({
      urun_adi: product.urunAdi,
      urun_kodu: product.urunKodu,
      barkod: product.barkod,
      mevcut_stok: product.mevcutStok,
      set_stok: product.setStok,
      min_stok: product.minStok,
      raf_konum: product.rafKonum,
      is_deleted: false,
    })

    if (error) {
      toast.error('Ürün eklenemedi')
      return
    }

    toast.success('Ürün eklendi')
    fetchProducts()
  }

  const updateProduct = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({
        urun_adi: product.urunAdi,
        urun_kodu: product.urunKodu,
        barkod: product.barkod,
        mevcut_stok: product.mevcutStok,
        set_stok: product.setStok,
        min_stok: product.minStok,
        raf_konum: product.rafKonum,
      })
      .eq('id', product.id)

    if (error) {
      toast.error('Ürün güncellenemedi')
      return
    }

    toast.success('Ürün güncellendi')
    fetchProducts()
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) {
      toast.error('Ürün silinemedi')
      return
    }

    toast.success('Ürün silindi')
    fetchProducts()
  }

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: fetchProducts,
  }
}