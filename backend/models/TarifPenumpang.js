const { supabase } = require('../config/supabase');

class TarifPenumpangModel {
  // Get all
  static async getAll() {
    const { data, error } = await supabase
      .from('tarif_penumpang')
      .select(`
        *,
        rute:rute_id (
          rute_id,
          nama_rute,
          pelabuhan_asal:pelabuhan_asal_id (nama_pelabuhan),
          pelabuhan_tujuan:pelabuhan_tujuan_id (nama_pelabuhan)
        ),
        kategori:kategori_penumpang_id (
          kategori_penumpang_id,
          nama_kategori
        )
      `)
      .order('tarif_penumpang_id');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(tarif_penumpang_id) {
    const { data, error } = await supabase
      .from('tarif_penumpang')
      .select(`
        *,
        rute:rute_id (*),
        kategori:kategori_penumpang_id (*)
      `)
      .eq('tarif_penumpang_id', tarif_penumpang_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get by rute
  static async getByRute(rute_id) {
    const { data, error } = await supabase
      .from('tarif_penumpang')
      .select(`
        *,
        kategori:kategori_penumpang_id (
          kategori_penumpang_id,
          nama_kategori
        )
      `)
      .eq('rute_id', rute_id)
      .order('kategori_penumpang_id');

    if (error) throw error;
    return data;
  }

  // Create
  static async create(rute_id, kategori_penumpang_id, tarif) {
    const { data, error } = await supabase
      .from('tarif_penumpang')
      .insert([{ rute_id, kategori_penumpang_id, tarif }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update
  static async update(tarif_penumpang_id, rute_id, kategori_penumpang_id, tarif) {
    const { data, error } = await supabase
      .from('tarif_penumpang')
      .update({ rute_id, kategori_penumpang_id, tarif })
      .eq('tarif_penumpang_id', tarif_penumpang_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete
  static async delete(tarif_penumpang_id) {
    const { data, error } = await supabase
      .from('tarif_penumpang')
      .delete()
      .eq('tarif_penumpang_id', tarif_penumpang_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = TarifPenumpangModel;
