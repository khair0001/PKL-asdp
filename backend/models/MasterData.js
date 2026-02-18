const { supabase } = require('../config/supabase');

class MasterDataModel {
  // Get kategori penumpang
  static async getKategoriPenumpang() {
    const { data, error } = await supabase
      .from('kategori_penumpang')
      .select('*')
      .order('kategori_penumpang_id');

    if (error) throw error;
    return data;
  }

  // Get golongan kendaraan
  static async getGolonganKendaraan() {
    const { data, error } = await supabase
      .from('golongan_kendaraan')
      .select('*')
      .order('nomor_golongan', { ascending: true });

    if (error) throw error;
    return data;
  }
}

module.exports = MasterDataModel;
