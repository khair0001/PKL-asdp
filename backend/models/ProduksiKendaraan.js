const { supabase } = require('../config/supabase');

class ProduksiKendaraanModel {
  // Get all by produksi_id
  static async getByProduksi(produksi_id) {
    const { data, error } = await supabase
      .from('produksi_kendaraan')
      .select('*')
      .eq('produksi_id', produksi_id)
      .order('nomor_golongan');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(produksi_kendaraan_id) {
    const { data, error } = await supabase
      .from('produksi_kendaraan')
      .select('*')
      .eq('produksi_kendaraan_id', produksi_kendaraan_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create
  static async create(produksi_id, golongan_id, nomor_golongan, tipe_muatan, jumlah, tarif, subtotal, is_tarif_custom = false) {
    const { data, error } = await supabase
      .from('produksi_kendaraan')
      .insert([{
        produksi_id,
        golongan_id,
        nomor_golongan,
        tipe_muatan,
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
  static async update(produksi_kendaraan_id, jumlah, tarif, subtotal, is_tarif_custom = false) {
    const { data, error } = await supabase
      .from('produksi_kendaraan')
      .update({ jumlah, tarif, subtotal, is_tarif_custom })
      .eq('produksi_kendaraan_id', produksi_kendaraan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete
  static async delete(produksi_kendaraan_id) {
    const { data, error } = await supabase
      .from('produksi_kendaraan')
      .delete()
      .eq('produksi_kendaraan_id', produksi_kendaraan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete all by produksi_id
  static async deleteByProduksi(produksi_id) {
    const { data, error } = await supabase
      .from('produksi_kendaraan')
      .delete()
      .eq('produksi_id', produksi_id);

    if (error) throw error;
    return data;
  }
}

module.exports = ProduksiKendaraanModel;
