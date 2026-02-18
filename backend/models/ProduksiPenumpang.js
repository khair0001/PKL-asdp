const { supabase } = require('../config/supabase');

class ProduksiPenumpangModel {
  // Get all by produksi_id
  static async getByProduksi(produksi_id) {
    const { data, error } = await supabase
      .from('produksi_penumpang')
      .select('*')
      .eq('produksi_id', produksi_id)
      .order('produksi_penumpang_id');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(produksi_penumpang_id) {
    const { data, error } = await supabase
      .from('produksi_penumpang')
      .select('*')
      .eq('produksi_penumpang_id', produksi_penumpang_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create
  static async create(produksi_id, kategori_penumpang_id, nama_kategori, jumlah, tarif, subtotal, is_tarif_custom = false) {
    const { data, error } = await supabase
      .from('produksi_penumpang')
      .insert([{
        produksi_id,
        kategori_penumpang_id,
        nama_kategori,
        jumlah,
        tarif,
        subtotal,
        is_tarif_custom
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update
  static async update(produksi_penumpang_id, jumlah, tarif, subtotal, is_tarif_custom = false) {
    const { data, error } = await supabase
      .from('produksi_penumpang')
      .update({ jumlah, tarif, subtotal, is_tarif_custom })
      .eq('produksi_penumpang_id', produksi_penumpang_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete
  static async delete(produksi_penumpang_id) {
    const { data, error } = await supabase
      .from('produksi_penumpang')
      .delete()
      .eq('produksi_penumpang_id', produksi_penumpang_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete all by produksi_id
  static async deleteByProduksi(produksi_id) {
    const { data, error } = await supabase
      .from('produksi_penumpang')
      .delete()
      .eq('produksi_id', produksi_id);

    if (error) throw error;
    return data;
  }
}

module.exports = ProduksiPenumpangModel;
