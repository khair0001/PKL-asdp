const { supabase } = require('../config/supabase');

class KapalModel {
  static async getAll() {
    const { data, error } = await supabase
      .from('kapal')
      .select(`
        *,
        perusahaan:perusahaan_id (
          perusahaan_id,
          nama_perusahaan
        )
      `)
      .eq('is_active', true)
      .order('nama_kapal');

    if (error) throw error;
    return data;
  }

  static async getById(kapal_id) {
    const { data, error } = await supabase
      .from('kapal')
      .select(`
        *,
        perusahaan:perusahaan_id (
          perusahaan_id,
          nama_perusahaan
        )
      `)
      .eq('kapal_id', kapal_id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByPerusahaan(perusahaan_id) {
    const { data, error } = await supabase
      .from('kapal')
      .select('*')
      .eq('perusahaan_id', perusahaan_id)
      .eq('is_active', true)
      .order('nama_kapal');

    if (error) throw error;
    return data;
  }

  static async create(perusahaan_id, nama_kapal, berat_kapal) {
    const { data, error } = await supabase
      .from('kapal')
      .insert([{ perusahaan_id, nama_kapal, berat_kapal }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(kapal_id, perusahaan_id, nama_kapal, berat_kapal) {
    const { data, error } = await supabase
      .from('kapal')
      .update({ perusahaan_id, nama_kapal, berat_kapal })
      .eq('kapal_id', kapal_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(kapal_id) {
    const { data, error } = await supabase
      .from('kapal')
      .update({ is_active: false })
      .eq('kapal_id', kapal_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = KapalModel;
