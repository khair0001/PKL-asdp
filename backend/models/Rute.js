const { supabase } = require('../config/supabase');

class RuteModel {
  // Get all rute
  static async getAll() {
    const { data, error } = await supabase
      .from('rute')
      .select(`
        *,
        pelabuhan_asal:pelabuhan_asal_id (
          pelabuhan_id,
          nama_pelabuhan,
          lokasi
        ),
        pelabuhan_tujuan:pelabuhan_tujuan_id (
          pelabuhan_id,
          nama_pelabuhan,
          lokasi
        )
      `)
      .eq('is_active', true)
      .order('nama_rute');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(rute_id) {
    const { data, error } = await supabase
      .from('rute')
      .select(`
        *,
        pelabuhan_asal:pelabuhan_asal_id (
          pelabuhan_id,
          nama_pelabuhan,
          lokasi
        ),
        pelabuhan_tujuan:pelabuhan_tujuan_id (
          pelabuhan_id,
          nama_pelabuhan,
          lokasi
        )
      `)
      .eq('rute_id', rute_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get rute by pelabuhan asal
  static async getByPelabuhanAsal(pelabuhan_asal_id) {
    const { data, error } = await supabase
      .from('rute')
      .select(`
        *,
        pelabuhan_asal:pelabuhan_asal_id (
          pelabuhan_id,
          nama_pelabuhan
        ),
        pelabuhan_tujuan:pelabuhan_tujuan_id (
          pelabuhan_id,
          nama_pelabuhan
        )
      `)
      .eq('pelabuhan_asal_id', pelabuhan_asal_id)
      .eq('is_active', true)
      .order('nama_rute');

    if (error) throw error;
    return data;
  }

  // Create
  static async create(pelabuhan_asal_id, pelabuhan_tujuan_id, nama_rute, jarak) {
    if (pelabuhan_asal_id === pelabuhan_tujuan_id) {
      throw new Error('Pelabuhan asal dan tujuan tidak boleh sama');
    }

    // Jarak boleh kosong/null
    const jarakValue = jarak && jarak !== '' ? parseFloat(jarak) : null;

    const { data, error } = await supabase
      .from('rute')
      .insert([{ pelabuhan_asal_id, pelabuhan_tujuan_id, nama_rute, jarak: jarakValue }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update
  static async update(rute_id, pelabuhan_asal_id, pelabuhan_tujuan_id, nama_rute, jarak) {
    if (pelabuhan_asal_id === pelabuhan_tujuan_id) {
      throw new Error('Pelabuhan asal dan tujuan tidak boleh sama');
    }

    // Jarak boleh kosong/null
    const jarakValue = jarak && jarak !== '' ? parseFloat(jarak) : null;

    const { data, error } = await supabase
      .from('rute')
      .update({ pelabuhan_asal_id, pelabuhan_tujuan_id, nama_rute, jarak: jarakValue })
      .eq('rute_id', rute_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete (soft delete)
  static async delete(rute_id) {
    const { data, error } = await supabase
      .from('rute')
      .update({ is_active: false })
      .eq('rute_id', rute_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = RuteModel;
