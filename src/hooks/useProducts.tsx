const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      urun_adi,
      urun_kodu,
      barkod,
      min_stok,
      shelf_inventory(
        quantity,
        set_quantity,
        shelf:shelf_id(name)
      )
    `);

  if (error) {
    toast.error('Ürünler yüklenemedi');
    return;
  }

  const formatted = data.map(p => {
    const shelves = p.shelf_inventory || [];

    const totalUnits = shelves.reduce((a, s) => a + (s.quantity || 0), 0);
    const totalSets  = shelves.reduce((a, s) => a + (s.set_quantity || 0), 0);

    return {
      id: p.id,
      urunAdi: p.urun_adi,
      urunKodu: p.urun_kodu,
      barkod: p.barkod,
      minStok: p.min_stok,
      mevcutStok: totalUnits,
      setStok: totalSets,
      rafKonum: shelves.map(s => s.shelf?.name).filter(Boolean).join(', '), // ← متعدد الرفوف
      shelves,
    };
  });

  setProducts(formatted);
};