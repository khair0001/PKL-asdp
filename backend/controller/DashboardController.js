const { supabase } = require('../config/supabase');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Transaksi hari ini
      const { count: transaksiHariIni } = await supabase
        .from('produksi')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal_produksi', today);

      // Transaksi bulan ini - ambil semua data dan filter di JavaScript
      const { data: allProduksi } = await supabase
        .from('produksi')
        .select('tanggal_produksi');
      
      const transaksiBulanIni = allProduksi ? allProduksi.filter(t => {
        const date = new Date(t.tanggal_produksi);
        return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
      }).length : 0;

      // Total kapal aktif
      const { count: totalKapal } = await supabase
        .from('kapal')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total perusahaan aktif
      const { count: totalPerusahaan } = await supabase
        .from('perusahaan')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      res.json({
        data: {
          transaksiHariIni: transaksiHariIni || 0,
          transaksiBulanIni: transaksiBulanIni || 0,
          totalKapal: totalKapal || 0,
          totalPerusahaan: totalPerusahaan || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
