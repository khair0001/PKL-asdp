const { supabase } = require('../config/supabase');

class TarifKendaraanModel {
  // Get all
  static async getAll() {
    const { data, error } = await supabase
      .from('tarif_kendaraan')
      .select(`
        *,
        rute:rute_id (
          rute_id,
          nama_rute,
          pelabuhan_asal:pelabuhan_asal_id (nama_pelabuhan),
          pelabuhan_tujuan:pelabuhan_tujuan_id (nama_pelabuhan)
        ),
        golongan:golongan_id (
          golongan_id,
          nomor_golongan,
          tipe_muatan
        )
      `)
      .order('tarif_kendaraan_id');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(tarif_kendaraan_id) {
    const { data, error } = await supabase
      .from('tarif_kendaraan')
      .select(`
        *,
        rute:rute_id (*),
        golongan:golongan_id (*)
      `)
      .eq('tarif_kendaraan_id', tarif_kendaraan_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get by rute
  static async getByRute(rute_id) {
    const { data, error } = await supabase
      .from('tarif_kendaraan')
      .select(`
        *,
        golongan:golongan_id (
          golongan_id,
          nomor_golongan,
          tipe_muatan
        )
      `)
      .eq('rute_id', rute_id)
      .order('golongan_id');

    if (error) throw error;
    return data;
  }

  // Create
  static async create(rute_id, golongan_id, tarif) {
    const { data, error } = await supabase
      .from('tarif_kendaraan')
      .insert([{ rute_id, golongan_id, tarif }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update
  static async update(tarif_kendaraan_id, rute_id, golongan_id, tarif) {
    const { data, error } = await supabase
      .from('tarif_kendaraan')
      .update({ rute_id, golongan_id, tarif })
      .eq('tarif_kendaraan_id', tarif_kendaraan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete
  static async delete(tarif_kendaraan_id) {
    const { data, error } = await supabase
      .from('tarif_kendaraan')
      .delete()
      .eq('tarif_kendaraan_id', tarif_kendaraan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = TarifKendaraanModel;
