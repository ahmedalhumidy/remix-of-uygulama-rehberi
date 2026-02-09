const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('shelf_inventory')
    .select(`
      quantity,
      set_quantity,
      products (
        id,
        urun_adi,
        barkod,
        urun_kodu,
        minimum_stok
      ),
      shelves ( name )
    `)
    .gt('quantity', 0)
    .or('set_quantity.gt.0');

  if (error) {
    console.error(error);
    return;
  }

  const formatted = data.map(row => ({
    id: row.products.id,
    urun_adi: row.products.urun_adi,
    barkod: row.products.barkod,
    urun_kodu: row.products.urun_kodu,
    minimum_stok: row.products.minimum_stok,
    raf_konum: row.shelves.name,
    mevcut_stok: row.quantity,
    set_stok: row.set_quantity,
  }));

  setProducts(formatted);
};