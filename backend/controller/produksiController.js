const ProduksiModel = require('../models/Produksi');
const ProduksiPenumpangModel = require('../models/ProduksiPenumpang');
const ProduksiKendaraanModel = require('../models/ProduksiKendaraan');
const PerusahaanModel = require('../models/Perusahaan');
const KapalModel = require('../models/Kapal');
const PelabuhanModel = require('../models/Pelabuhan');
const RuteModel = require('../models/Rute');

class ProduksiController {
  static async getAll(req, res, next) {
    try {
      const filters = {
        perusahaan_id: req.query.perusahaan_id ? req.query.perusahaan_id.split(',').map(Number) : null,
        kapal_id: req.query.kapal_id ? req.query.kapal_id.split(',').map(Number) : null,
        pelabuhan_asal_id: req.query.pelabuhan_asal_id ? req.query.pelabuhan_asal_id.split(',').map(Number) : null,
        rute_id: req.query.rute_id ? req.query.rute_id.split(',').map(Number) : null,
        shift: req.query.shift ? req.query.shift.split(',') : null,
        regu: req.query.regu ? req.query.regu.split(',') : null,
        tanggal_dari: req.query.tanggal_dari,
        tanggal_sampai: req.query.tanggal_sampai
      };

      const data = await ProduksiModel.getAll(filters);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const produksi = await ProduksiModel.getById(req.params.id);
      const penumpang = await ProduksiPenumpangModel.getByProduksi(req.params.id);
      const kendaraan = await ProduksiKendaraanModel.getByProduksi(req.params.id);

      res.json({
        data: {
          ...produksi,
          penumpang,
          kendaraan
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const {
        perusahaan_id,
        kapal_id,
        pelabuhan_asal_id,
        rute_id,
        tanggal_produksi,
        shift,
        regu,
        penumpang,
        kendaraan
      } = req.body;

      // Validasi
      if (!perusahaan_id || !kapal_id || !pelabuhan_asal_id || !rute_id || !tanggal_produksi || !shift || !regu) {
        return res.status(400).json({ error: 'Semua field header harus diisi' });
      }

      // Get snapshot data dari master - PARALLEL
      const [perusahaan, kapal, pelabuhan_asal, rute] = await Promise.all([
        PerusahaanModel.getById(perusahaan_id),
        KapalModel.getById(kapal_id),
        PelabuhanModel.getById(pelabuhan_asal_id),
        RuteModel.getById(rute_id)
      ]);
      
      const pelabuhan_tujuan = await PelabuhanModel.getById(rute.pelabuhan_tujuan_id);

      // Create produksi header
      const produksiData = {
        perusahaan_id,
        kapal_id,
        pelabuhan_asal_id,
        rute_id,
        nama_perusahaan: perusahaan.nama_perusahaan,
        nama_kapal: kapal.nama_kapal,
        nama_pelabuhan_asal: pelabuhan_asal.nama_pelabuhan,
        nama_pelabuhan_tujuan: pelabuhan_tujuan.nama_pelabuhan,
        nama_rute: rute.nama_rute,
        tanggal_produksi,
        shift,
        regu
      };

      const produksi = await ProduksiModel.create(produksiData, req.user.user_id);

      // Insert penumpang dan kendaraan - PARALLEL
      const insertPromises = [];

      if (penumpang && penumpang.length > 0) {
        for (const p of penumpang) {
          if (p.jumlah > 0) {
            insertPromises.push(
              ProduksiPenumpangModel.create(
                produksi.produksi_id,
                p.kategori_penumpang_id,
                p.nama_kategori,
                p.jumlah,
                p.tarif,
                p.subtotal,
                p.is_tarif_custom || false
              )
            );
          }
        }
      }

      if (kendaraan && kendaraan.length > 0) {
        for (const k of kendaraan) {
          if (k.jumlah > 0) {
            insertPromises.push(
              ProduksiKendaraanModel.create(
                produksi.produksi_id,
                k.golongan_id,
                k.nomor_golongan,
                k.tipe_muatan,
                k.jumlah,
                k.tarif,
                k.subtotal,
                k.is_tarif_custom || false
              )
            );
          }
        }
      }

      // Wait for all inserts to complete
      if (insertPromises.length > 0) {
        await Promise.all(insertPromises);
      }

      // Get complete data
      const result = await ProduksiModel.getById(produksi.produksi_id);
      res.status(201).json({ message: 'Produksi berhasil disimpan', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const {
        perusahaan_id,
        kapal_id,
        pelabuhan_asal_id,
        rute_id,
        tanggal_produksi,
        shift,
        regu,
        penumpang,
        kendaraan
      } = req.body;

      // Get snapshot data dari master - PARALLEL
      const [perusahaan, kapal, pelabuhan_asal, rute] = await Promise.all([
        PerusahaanModel.getById(perusahaan_id),
        KapalModel.getById(kapal_id),
        PelabuhanModel.getById(pelabuhan_asal_id),
        RuteModel.getById(rute_id)
      ]);
      
      const pelabuhan_tujuan = await PelabuhanModel.getById(rute.pelabuhan_tujuan_id);

      // Update produksi header
      const produksiData = {
        perusahaan_id,
        kapal_id,
        pelabuhan_asal_id,
        rute_id,
        nama_perusahaan: perusahaan.nama_perusahaan,
        nama_kapal: kapal.nama_kapal,
        nama_pelabuhan_asal: pelabuhan_asal.nama_pelabuhan,
        nama_pelabuhan_tujuan: pelabuhan_tujuan.nama_pelabuhan,
        nama_rute: rute.nama_rute,
        tanggal_produksi,
        shift,
        regu
      };

      await ProduksiModel.update(req.params.id, produksiData, req.user.user_id);

      // Delete existing details
      await Promise.all([
        ProduksiPenumpangModel.deleteByProduksi(req.params.id),
        ProduksiKendaraanModel.deleteByProduksi(req.params.id)
      ]);

      // Insert new penumpang dan kendaraan - PARALLEL
      const insertPromises = [];

      if (penumpang && penumpang.length > 0) {
        for (const p of penumpang) {
          if (p.jumlah > 0) {
            insertPromises.push(
              ProduksiPenumpangModel.create(
                req.params.id,
                p.kategori_penumpang_id,
                p.nama_kategori,
                p.jumlah,
                p.tarif,
                p.subtotal,
                p.is_tarif_custom || false
              )
            );
          }
        }
      }

      if (kendaraan && kendaraan.length > 0) {
        for (const k of kendaraan) {
          if (k.jumlah > 0) {
            insertPromises.push(
              ProduksiKendaraanModel.create(
                req.params.id,
                k.golongan_id,
                k.nomor_golongan,
                k.tipe_muatan,
                k.jumlah,
                k.tarif,
                k.subtotal,
                k.is_tarif_custom || false
              )
            );
          }
        }
      }

      // Wait for all inserts to complete
      if (insertPromises.length > 0) {
        await Promise.all(insertPromises);
      }

      const result = await ProduksiModel.getById(req.params.id);
      res.json({ message: 'Produksi berhasil diupdate', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await ProduksiModel.delete(req.params.id);
      res.json({ message: 'Produksi berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProduksiController;
