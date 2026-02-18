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

  static async getMonthlyRevenue(req, res, next) {
    try {
      const { month, year } = req.query;
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      console.log('Getting monthly revenue for:', { targetMonth, targetYear });

      // Get all production data for the target month
      const { data: produksiData, error } = await supabase
        .from('produksi')
        .select('tanggal_produksi, total_pendapatan');

      if (error) throw error;

      console.log('Total produksi records:', produksiData?.length);

      // Filter data by month and year
      const filteredData = produksiData ? produksiData.filter(item => {
        const date = new Date(item.tanggal_produksi);
        return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear;
      }) : [];

      console.log('Filtered data count:', filteredData.length);
      console.log('Sample filtered data:', filteredData.slice(0, 3));

      // Group by date and sum revenue
      const revenueByDate = {};
      filteredData.forEach(item => {
        const date = new Date(item.tanggal_produksi);
        const day = date.getDate();
        
        if (!revenueByDate[day]) {
          revenueByDate[day] = 0;
        }
        revenueByDate[day] += parseFloat(item.total_pendapatan || 0);
      });

      console.log('Revenue by date:', revenueByDate);

      // Get number of days in the target month
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      // Create array with all dates (1 to daysInMonth)
      const dailyRevenue = [];
      for (let day = 1; day <= daysInMonth; day++) {
        dailyRevenue.push({
          tanggal: day,
          total: revenueByDate[day] || 0
        });
      }

      console.log('Daily revenue array length:', dailyRevenue.length);

      res.json({
        data: {
          month: targetMonth,
          year: targetYear,
          dailyRevenue
        }
      });
    } catch (error) {
      console.error('Error in getMonthlyRevenue:', error);
      next(error);
    }
  }
}

module.exports = DashboardController;
