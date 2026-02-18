const { supabase } = require('../config/supabase');

class PerusahaanModel {
  // Get all perusahaan
  static async getAll() {
    const { data, error } = await supabase
      .from('perusahaan')
      .select('*')
      .eq('is_active', true)
      .order('nama_perusahaan');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(perusahaan_id) {
    const { data, error } = await supabase
      .from('perusahaan')
      .select('*')
      .eq('perusahaan_id', perusahaan_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create
  static async create(nama_perusahaan) {
    const { data, error } = await supabase
      .from('perusahaan')
      .insert([{ nama_perusahaan }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update
  static async update(perusahaan_id, nama_perusahaan) {
    const { data, error } = await supabase
      .from('perusahaan')
      .update({ nama_perusahaan })
      .eq('perusahaan_id', perusahaan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete (soft delete)
  static async delete(perusahaan_id) {
    const { data, error } = await supabase
      .from('perusahaan')
      .update({ is_active: false })
      .eq('perusahaan_id', perusahaan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = PerusahaanModel;
