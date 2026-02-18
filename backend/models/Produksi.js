const { supabase } = require('../config/supabase');

class ProduksiModel {
  // Get all produksi dengan filter
  static async getAll(filters = {}) {
    let query = supabase
      .from('produksi')
      .select(`
        *,
        perusahaan:perusahaan_id (nama_perusahaan),
        kapal:kapal_id (nama_kapal),
        pelabuhan_asal:pelabuhan_asal_id (nama_pelabuhan),
        rute:rute_id (nama_rute),
        created_by_user:created_by (nama_lengkap, username),
        updated_by_user:updated_by (nama_lengkap, username)
      `);

    // Apply filters
    if (filters.perusahaan_id && filters.perusahaan_id.length > 0) {
      query = query.in('perusahaan_id', filters.perusahaan_id);
    }
    if (filters.kapal_id && filters.kapal_id.length > 0) {
      query = query.in('kapal_id', filters.kapal_id);
    }
    if (filters.pelabuhan_asal_id && filters.pelabuhan_asal_id.length > 0) {
      query = query.in('pelabuhan_asal_id', filters.pelabuhan_asal_id);
    }
    if (filters.rute_id && filters.rute_id.length > 0) {
      query = query.in('rute_id', filters.rute_id);
    }
    if (filters.shift && filters.shift.length > 0) {
      query = query.in('shift', filters.shift);
    }
    if (filters.regu && filters.regu.length > 0) {
      query = query.in('regu', filters.regu);
    }
    if (filters.tanggal_dari) {
      query = query.gte('tanggal_produksi', filters.tanggal_dari);
    }
    if (filters.tanggal_sampai) {
      query = query.lte('tanggal_produksi', filters.tanggal_sampai);
    }

    query = query.order('tanggal_produksi', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(produksi_id) {
    const { data, error } = await supabase
      .from('produksi')
      .select(`
        *,
        created_by_user:created_by (nama_lengkap, username),
        updated_by_user:updated_by (nama_lengkap, username)
      `)
      .eq('produksi_id', produksi_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create
  static async create(produksi_data, user_id) {
    const { data, error } = await supabase
      .from('produksi')
      .insert([{
        ...produksi_data,
        created_by: user_id,
        updated_by: user_id
      }])
      .select()
      .single();

    if (error) {
      // Handle duplicate key error
      if (error.code === '23505' && error.message.includes('unique_produksi')) {
        throw new Error('Data produksi dengan kombinasi Kapal, Rute, Tanggal, Shift, dan Regu ini sudah ada. Silakan ubah salah satu parameter atau edit data yang sudah ada.');
      }
      throw error;
    }
    return data;
  }

  // Update
  static async update(produksi_id, produksi_data, user_id) {
    const { data, error } = await supabase
      .from('produksi')
      .update({
        ...produksi_data,
        updated_by: user_id,
        updated_at: new Date().toISOString()
      })
      .eq('produksi_id', produksi_id)
      .select()
      .single();

    if (error) {
      // Handle duplicate key error
      if (error.code === '23505' && error.message.includes('unique_produksi')) {
        throw new Error('Data produksi dengan kombinasi Kapal, Rute, Tanggal, Shift, dan Regu ini sudah ada. Silakan ubah salah satu parameter atau edit data yang sudah ada.');
      }
      throw error;
    }
    return data;
  }

  // Delete
  static async delete(produksi_id) {
    const { data, error } = await supabase
      .from('produksi')
      .delete()
      .eq('produksi_id', produksi_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = ProduksiModel;
