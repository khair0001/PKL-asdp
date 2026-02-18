const { supabase } = require('../config/supabase');

class PelabuhanModel {
  // Get all pelabuhan
  static async getAll() {
    const { data, error } = await supabase
      .from('pelabuhan')
      .select('*')
      .eq('is_active', true)
      .order('nama_pelabuhan');

    if (error) throw error;
    return data;
  }

  // Get by ID
  static async getById(pelabuhan_id) {
    const { data, error } = await supabase
      .from('pelabuhan')
      .select('*')
      .eq('pelabuhan_id', pelabuhan_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create
  static async create(nama_pelabuhan, lokasi) {
    const { data, error } = await supabase
      .from('pelabuhan')
      .insert([{ nama_pelabuhan, lokasi }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update
  static async update(pelabuhan_id, nama_pelabuhan, lokasi) {
    const { data, error } = await supabase
      .from('pelabuhan')
      .update({ nama_pelabuhan, lokasi })
      .eq('pelabuhan_id', pelabuhan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete (soft delete)
  static async delete(pelabuhan_id) {
    const { data, error } = await supabase
      .from('pelabuhan')
      .update({ is_active: false })
      .eq('pelabuhan_id', pelabuhan_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = PelabuhanModel;
