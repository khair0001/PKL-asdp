const ProduksiModel = require("../models/Produksi");
const ProduksiPenumpangModel = require("../models/ProduksiPenumpang");
const ProduksiKendaraanModel = require("../models/ProduksiKendaraan");
const RuteModel = require("../models/Rute");
const KapalModel = require("../models/Kapal");
const TarifKendaraanModel = require("../models/TarifKendaraan");
const ExcelJS = require("exceljs");

class ProduksiExportController {
  static async exportExcel(req, res, next) {
    try {
      console.log("=== EXPORT EXCEL START ===");
      console.log("Query params:", req.query);

      // Validasi
      if (!req.query.rute_id) {
        return res.status(400).json({
          error: "Pilih rute terlebih dahulu sebelum mengekspor data.",
        });
      }

      if (!req.query.tanggal_dari || !req.query.tanggal_sampai) {
        return res.status(400).json({ error: "Pilih periode (tanggal dari dan tanggal sampai) terlebih dahulu sebelum mengekspor data." });
      }

      const filters = {
        perusahaan_id: req.query.perusahaan_id
          ? req.query.perusahaan_id.split(",").map(Number)
          : null,
        kapal_id: req.query.kapal_id
          ? req.query.kapal_id.split(",").map(Number)
          : null,
        pelabuhan_asal_id: req.query.pelabuhan_asal_id
          ? req.query.pelabuhan_asal_id.split(",").map(Number)
          : null,
        rute_id: req.query.rute_id
          ? req.query.rute_id.split(",").map(Number)
          : null,
        shift: req.query.shift ? req.query.shift.split(",") : null,
        regu: req.query.regu ? req.query.regu.split(",") : null,
        tanggal_dari: req.query.tanggal_dari,
        tanggal_sampai: req.query.tanggal_sampai,
      };

      console.log("Filters:", filters);

      const produksiList = await ProduksiModel.getAll(filters);
      console.log(`Found ${produksiList.length} produksi records`);

      if (produksiList.length === 0) {
        return res.status(404).json({ error: "Tidak ada data untuk diekspor" });
      }

      const dataWithDetails = await Promise.all(
        produksiList.map(async (p) => {
          const penumpang = await ProduksiPenumpangModel.getByProduksi(
            p.produksi_id,
          );
          const kendaraan = await ProduksiKendaraanModel.getByProduksi(
            p.produksi_id,
          );
          return { ...p, penumpang, kendaraan };
        }),
      );

      // Get kapal data (GT)
      const kapalIds = [...new Set(dataWithDetails.map((p) => p.kapal_id))];
      const kapalData = {};
      for (const kapal_id of kapalIds) {
        try {
          kapalData[kapal_id] = await KapalModel.getById(kapal_id);
        } catch {
          kapalData[kapal_id] = { berat_kapal: 0 };
        }
      }

      // Detect if any penumpang or kendaraan has custom tarif
      let hasCustomDws = false;
      let hasCustomBayi = false;

      dataWithDetails.forEach((item) => {
        item.penumpang.forEach((p) => {
          const kat = String(p.nama_kategori || "").toLowerCase();
          if (p.is_tarif_custom) {
            if (kat.includes("dewasa")) hasCustomDws = true;
            if (kat.includes("bayi")) hasCustomBayi = true;
          }
        });
      });

      // Collect golongan kendaraan dari data
      const golonganSet = new Set();
      const golonganCustomSet = new Set();
      const golonganTipeMuatan = {};
      dataWithDetails.forEach((item) => {
        item.kendaraan.forEach((k) => {
          golonganSet.add(k.golongan_id);
          if (k.is_tarif_custom) golonganCustomSet.add(k.golongan_id);
          if (!golonganTipeMuatan[k.golongan_id] && k.tipe_muatan) {
            golonganTipeMuatan[k.golongan_id] = String(
              k.tipe_muatan,
            ).toLowerCase();
          }
        });
      });

      const GOLONGAN_STANDAR = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const GOLONGAN_PNP_BRG_MAP = {};
      const ROMAWI = {
        1: "I",
        2: "II",
        3: "III",
        4: "IV",
        5: "V",
        6: "VI",
        7: "VII",
        8: "VIII",
        9: "IX",
      };
      const toRomawi = (n) => ROMAWI[n] || String(n);

      let tarifData = [];
      const firstRuteId = dataWithDetails[0]?.rute_id;
      if (firstRuteId) {
        try {
          const allTarif = await TarifKendaraanModel.getByRute(firstRuteId);
          const tarifStandar = [];
          const tarifTambahan = [];

          allTarif.forEach((t) => {
            const nomorGol = parseInt(t.golongan?.nomor_golongan || 0);
            if (GOLONGAN_STANDAR.includes(nomorGol)) {
              tarifStandar.push(t);
            } else if (golonganSet.has(t.golongan_id)) {
              tarifTambahan.push(t);
            }
          });

          const golonganStandarDitemukan = new Set(
            tarifStandar.map((t) => parseInt(t.golongan?.nomor_golongan || 0)),
          );

          const nomorStandarAda = new Set();
          tarifStandar.forEach((t) =>
            nomorStandarAda.add(parseInt(t.golongan?.nomor_golongan || 0)),
          );

          GOLONGAN_STANDAR.forEach((nomor) => {
            if (!nomorStandarAda.has(nomor)) {
              tarifStandar.push({
                golongan_id: `standar_${nomor}`,
                tarif: 0,
                golongan: { nomor_golongan: nomor },
              });
            }
          });

          tarifStandar.sort(
            (a, b) =>
              parseInt(a.golongan?.nomor_golongan || 0) -
              parseInt(b.golongan?.nomor_golongan || 0),
          );
          tarifTambahan.sort(
            (a, b) =>
              parseInt(a.golongan?.nomor_golongan || 0) -
              parseInt(b.golongan?.nomor_golongan || 0),
          );

          tarifData = [...tarifStandar, ...tarifTambahan];
        } catch (e) {
          console.error("Error getting tarif:", e);
        }
      }

      if (tarifData.length === 0) {
        tarifData = GOLONGAN_STANDAR.map((nomor) => ({
          golongan_id: `standar_${nomor}`,
          tarif: 0,
          golongan: { nomor_golongan: nomor },
        }));
      }

      tarifData = tarifData.map((t) => {
        const sampleCustom = dataWithDetails
          .flatMap((d) => d.kendaraan)
          .find((k) => k.golongan_id === t.golongan_id && k.is_tarif_custom);
        return {
          ...t,
          hasCustom: golonganCustomSet.has(t.golongan_id),
          tarif_custom: sampleCustom?.tarif || null,
          tipe_muatan:
            golonganTipeMuatan[t.golongan_id] ||
            t.golongan?.tipe_muatan ||
            null,
        };
      });

      // Temukan nomor_golongan yang punya 2 row (satu PNP, satu BRG)
      tarifData.forEach((t) => {
        const nomor = parseInt(t.golongan?.nomor_golongan || 0);
        const tipe = String(t.tipe_muatan || "").toLowerCase();
        if (!tipe) return;
        if (!GOLONGAN_PNP_BRG_MAP[nomor]) GOLONGAN_PNP_BRG_MAP[nomor] = {};
        if (tipe.includes("barang")) {
          GOLONGAN_PNP_BRG_MAP[nomor].brg_id = t.golongan_id;
          GOLONGAN_PNP_BRG_MAP[nomor].brg_tarif = t.tarif;
          GOLONGAN_PNP_BRG_MAP[nomor].brg_tarif_custom = t.tarif_custom;
          GOLONGAN_PNP_BRG_MAP[nomor].brg_hasCustom = t.hasCustom;
        } else {
          GOLONGAN_PNP_BRG_MAP[nomor].pnp_id = t.golongan_id;
          GOLONGAN_PNP_BRG_MAP[nomor].pnp_tarif = t.tarif;
          GOLONGAN_PNP_BRG_MAP[nomor].pnp_tarif_custom = t.tarif_custom;
          GOLONGAN_PNP_BRG_MAP[nomor].pnp_hasCustom = t.hasCustom;
        }
      });

      // Hanya simpan nomor_golongan yang benar-benar punya keduanya (PNP & BRG)
      Object.keys(GOLONGAN_PNP_BRG_MAP).forEach((nomor) => {
        const g = GOLONGAN_PNP_BRG_MAP[nomor];
        if (!g.pnp_id || !g.brg_id) delete GOLONGAN_PNP_BRG_MAP[nomor];
      });

      console.log("GOLONGAN_PNP_BRG_MAP:", GOLONGAN_PNP_BRG_MAP);

      const getTarifPenumpang = (data, kategori, isCustom) => {
        for (const item of data) {
          const found = item.penumpang.find(
            (p) =>
              String(p.nama_kategori || "")
                .toLowerCase()
                .includes(kategori) && !!p.is_tarif_custom === isCustom,
          );
          if (found) return found.tarif || 0;
        }
        return 0;
      };

      const tarifDwsNormal = getTarifPenumpang(
        dataWithDetails,
        "dewasa",
        false,
      );
      const tarifDwsCustom = getTarifPenumpang(dataWithDetails, "dewasa", true);
      const tarifBayiNormal = getTarifPenumpang(dataWithDetails, "bayi", false);
      const tarifBayiCustom = getTarifPenumpang(dataWithDetails, "bayi", true);

      dataWithDetails.sort((a, b) => {
        const pc = (a.perusahaan?.nama_perusahaan || "").localeCompare(
          b.perusahaan?.nama_perusahaan || "",
        );
        if (pc !== 0) return pc;
        return (a.kapal?.nama_kapal || "").localeCompare(
          b.kapal?.nama_kapal || "",
        );
      });

      const groupedByKapal = {};
      dataWithDetails.forEach((item) => {
        const kapalId = item.kapal_id;
        if (!groupedByKapal[kapalId]) {
          groupedByKapal[kapalId] = {
            kapal_id: kapalId,
            nama_kapal: item.kapal?.nama_kapal || "",
            perusahaan_id: item.perusahaan_id,
            nama_perusahaan: item.perusahaan?.nama_perusahaan || "",
            gt: kapalData[kapalId]?.berat_kapal || 0,
            trips: 0,
            dws: 0,
            dwsCustom: 0,
            bayi: 0,
            bayiCustom: 0,
            kendaraanByGolongan: {},
            kendaraanCustomByGolongan: {},
          };
          tarifData.forEach((tarif) => {
            groupedByKapal[kapalId].kendaraanByGolongan[tarif.golongan_id] = 0;
            groupedByKapal[kapalId].kendaraanCustomByGolongan[
              tarif.golongan_id
            ] = 0;
          });
        }

        groupedByKapal[kapalId].trips++;

        item.penumpang.forEach((p) => {
          const kat = String(p.nama_kategori || "").toLowerCase();
          if (kat.includes("dewasa")) {
            if (p.is_tarif_custom)
              groupedByKapal[kapalId].dwsCustom += p.jumlah;
            else groupedByKapal[kapalId].dws += p.jumlah;
          } else if (kat.includes("bayi")) {
            if (p.is_tarif_custom)
              groupedByKapal[kapalId].bayiCustom += p.jumlah;
            else groupedByKapal[kapalId].bayi += p.jumlah;
          }
        });

        item.kendaraan.forEach((k) => {
          if (k.is_tarif_custom) {
            if (
              groupedByKapal[kapalId].kendaraanCustomByGolongan.hasOwnProperty(
                k.golongan_id,
              )
            ) {
              groupedByKapal[kapalId].kendaraanCustomByGolongan[
                k.golongan_id
              ] += k.jumlah;
            }
          } else {
            if (
              groupedByKapal[kapalId].kendaraanByGolongan.hasOwnProperty(
                k.golongan_id,
              )
            ) {
              groupedByKapal[kapalId].kendaraanByGolongan[k.golongan_id] +=
                k.jumlah;
            }
          }
        });
      });

      const groupedData = Object.values(groupedByKapal).sort((a, b) => {
        const pc = a.nama_perusahaan.localeCompare(b.nama_perusahaan);
        if (pc !== 0) return pc;
        return a.nama_kapal.localeCompare(b.nama_kapal);
      });

      console.log(`Grouped data: ${groupedData.length} kapal`);
    
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Produksi");

      worksheet.properties.defaultFont = {
        name: "Calibri",
        size: 12,
        bold: true,
      };

      const setBorder = (cell, style = "thin") => {
        cell.border = {
          top: { style },
          left: { style },
          bottom: { style },
          right: { style },
        };
      };

      const getColumnLetter = (colNumber) => {
        let letter = "";
        while (colNumber > 0) {
          const remainder = (colNumber - 1) % 26;
          letter = String.fromCharCode(65 + remainder) + letter;
          colNumber = Math.floor((colNumber - 1) / 26);
        }
        return letter;
      };

      const dynamicCols = [];

      dynamicCols.push({
        key: "dws",
        label: "DWS",
        tarifRow8: tarifDwsNormal,
        isCustom: false,
        type: "pnp",
      });
      dynamicCols.push({
        key: "dwsCustom",
        label: "DWS+",
        tarifRow8: tarifDwsCustom,
        isCustom: true,
        type: "pnp",
        hideIfEmpty: !hasCustomDws,
      });
      dynamicCols.push({
        key: "bayi",
        label: "BAYI",
        tarifRow8: tarifBayiNormal,
        isCustom: false,
        type: "pnp",
      });
      dynamicCols.push({
        key: "bayiCustom",
        label: "BAYI+",
        tarifRow8: tarifBayiCustom,
        isCustom: true,
        type: "pnp",
        hideIfEmpty: !hasCustomBayi,
      });
      dynamicCols.push({
        key: "jmlPnp",
        label: "JML",
        isFormula: true,
        type: "jmlPnp",
      });

      const nomorSudahDiproses = new Set();

      tarifData.forEach((tarif) => {
        const nomorGol = parseInt(tarif.golongan?.nomor_golongan || 0);
        const isStandar = GOLONGAN_STANDAR.includes(nomorGol);
        const adaData = golonganSet.has(tarif.golongan_id);
        const isPasanganPnpBrg = GOLONGAN_PNP_BRG_MAP[nomorGol] !== undefined;

        if (isPasanganPnpBrg) {
          if (nomorSudahDiproses.has(nomorGol)) return;
          nomorSudahDiproses.add(nomorGol);

          const g = GOLONGAN_PNP_BRG_MAP[nomorGol];

          // PNP normal
          dynamicCols.push({
            key: `knd_${g.pnp_id}_normal`,
            label: "PNP",
            nomorGolLabel: toRomawi(nomorGol),
            tarifRow8: g.pnp_tarif || null,
            isCustom: false,
            type: "knd",
            subType: "pnp",
            golongan_id: g.pnp_id,
            nomorGol,
            isPnpBrg: true,
            hideIfEmpty: false,
          });
          // PNP custom
          dynamicCols.push({
            key: `knd_${g.pnp_id}_custom`,
            label: "PNP+",
            tarifRow8: g.pnp_tarif_custom || null,
            isCustom: true,
            type: "knd",
            subType: "pnp_custom",
            golongan_id: g.pnp_id,
            nomorGol,
            isPnpBrg: true,
            hideIfEmpty: !g.pnp_hasCustom,
          });
          // BRG normal
          dynamicCols.push({
            key: `knd_${g.brg_id}_normal`,
            label: "BRG",
            tarifRow8: g.brg_tarif || null,
            isCustom: false,
            type: "knd",
            subType: "brg",
            golongan_id: g.brg_id,
            nomorGol,
            isPnpBrg: true,
            hideIfEmpty: false,
          });
          // BRG custom
          dynamicCols.push({
            key: `knd_${g.brg_id}_custom`,
            label: "BRG+",
            tarifRow8: g.brg_tarif_custom || null,
            isCustom: true,
            type: "knd",
            subType: "brg_custom",
            golongan_id: g.brg_id,
            nomorGol,
            isPnpBrg: true,
            hideIfEmpty: !g.brg_hasCustom,
          });
        } else {
          // Golongan biasa (tanpa pasangan BRG)
          dynamicCols.push({
            key: `knd_${tarif.golongan_id}_normal`,
            label: toRomawi(nomorGol),
            tarifRow8: tarif.tarif || null,
            isCustom: false,
            type: "knd",
            subType: "normal",
            golongan_id: tarif.golongan_id,
            nomorGol,
            nomorGolLabel: toRomawi(nomorGol),
            isPnpBrg: false,
            hideIfEmpty: !isStandar && !adaData,
          });
          dynamicCols.push({
            key: `knd_${tarif.golongan_id}_custom`,
            label: `${toRomawi(nomorGol)}+`,
            tarifRow8: tarif.tarif_custom || null,
            isCustom: true,
            type: "knd",
            subType: "normal_custom",
            golongan_id: tarif.golongan_id,
            nomorGol,
            nomorGolLabel: toRomawi(nomorGol),
            isPnpBrg: false,
            hideIfEmpty: !tarif.hasCustom,
          });
        }
      });

      // JML kendaraan
      dynamicCols.push({
        key: "jmlKnd",
        label: "JML",
        isFormula: true,
        type: "jmlKnd",
      });

      // Pendapatan
      dynamicCols.push({
        key: "pendPnp",
        label: "PENUMPANG1",
        type: "pendapatan",
      });
      dynamicCols.push({
        key: "pendKnd",
        label: "KENDARAAN",
        type: "pendapatan",
      });
      dynamicCols.push({ key: "pendBrg", label: "BARANG", type: "pendapatan" });
      dynamicCols.push({
        key: "pendTotal",
        label: "TOTAL PENDAPATAN",
        isFormula: true,
        type: "pendapatan",
      });
      dynamicCols.push({
        key: "rataRata",
        label: "RATA-RATA PER TRIP",
        isFormula: true,
        type: "rataRata",
      });


      const visibleCols = dynamicCols.filter((c) => !c.hideIfEmpty);

      const dynStartCol = 7;
      const colIndexMap = {};
      visibleCols.forEach((col, i) => {
        colIndexMap[col.key] = dynStartCol + i;
      });

      const lastCol = dynStartCol + visibleCols.length - 1;
      const allCols = [
        { width: 20 },
        { width: 10 },
        { width: 40 },
        { width: 40 },
        { width: 10 },
        { width: 10 },
        { width: 15 },
        ...visibleCols.map((c) => ({
          width:
            c.key === "pendTotal"
              ? 20
              : c.key === "pendPnp" ||
                  c.key === "pendKnd" ||
                  c.key === "pendBrg"
                ? 20
                : c.type === "rataRata"
                  ? 20
                  : c.label === "JML"
                    ? 15
                    : 15,
        })),
      ];
      worksheet.columns = allCols;

      const pelabuhan = produksiList[0]?.nama_pelabuhan_asal || "-";
      const cabang = produksiList[0]?.nama_perusahaan || "-";
      const periodeAwal = filters.tanggal_dari || "-";
      const periodeAkhir = filters.tanggal_sampai || "-";

      const boldFont12 = { name: "Calibri", size: 12, bold: true };

      worksheet.getCell("B2").value =
        "PRODUKSI DAN PENDAPATAN KAPAL PENYEBERANGAN";
      worksheet.getCell("B2").font = boldFont12;
      worksheet.getCell("B3").value =
        "PELABUHAN PT. ASDP INDONESIA FERRY (PERSERO)";
      worksheet.getCell("B3").font = boldFont12;
      worksheet.getCell("B4").value = `PELABUHAN : ${pelabuhan}`;
      worksheet.getCell("B4").font = boldFont12;
      worksheet.getCell("B5").value = `CABANG       : ${pelabuhan}`;
      worksheet.getCell("B5").font = boldFont12;
      worksheet.getCell("B6").value = `PERIODE       : ${periodeAwal} s/d ${periodeAkhir}`;
      worksheet.getCell("B6").font = boldFont12;
      worksheet.getRow(8).height = 35;

      worksheet.mergeCells("E8:F8");
      const tarifLabelCell = worksheet.getCell("E8");
      tarifLabelCell.value = "Tarif Jasa Penyeberangan";
      tarifLabelCell.font = boldFont12;
      tarifLabelCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      // Tarif penumpang di row 8
      visibleCols.forEach((col) => {
        if (col.type === "pnp" && col.tarifRow8 != null) {
          const cell = worksheet.getCell(8, colIndexMap[col.key]);
          cell.value = col.tarifRow8;
          cell.font = boldFont12;
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "#,##0";
        }
      });

      // Tarif kendaraan di row 8
      visibleCols.forEach((col) => {
        if (col.type === "knd" && col.tarifRow8 != null) {
          const cell = worksheet.getCell(8, colIndexMap[col.key]);
          cell.value = col.tarifRow8;
          cell.font = boldFont12;
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "#,##0";
        }
      });

      const headerStyle = {
        font: { name: "Calibri", size: 12, bold: true },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        },
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      };

      const mergeHeader = (r1, c1, r2, c2, value) => {
        const a = `${getColumnLetter(c1)}${r1}`;
        const b = `${getColumnLetter(c2)}${r2}`;
        if (a !== b) worksheet.mergeCells(`${a}:${b}`);
        const cell = worksheet.getCell(a);
        cell.value = value;
        Object.assign(cell, headerStyle);
      };

      mergeHeader(9, 2, 12, 2, "NO");
      mergeHeader(9, 3, 12, 3, "KAPAL");
      mergeHeader(9, 4, 12, 4, "PERUSAHAAN");
      mergeHeader(9, 5, 12, 5, "GT");
      mergeHeader(9, 6, 12, 6, "TRIP");

      const pnpAllCols = visibleCols
        .filter((c) => c.type === "pnp" || c.type === "jmlPnp")
        .map((c) => colIndexMap[c.key]);

      if (pnpAllCols.length > 0) {
        mergeHeader(
          9,
          pnpAllCols[0],
          9,
          pnpAllCols[pnpAllCols.length - 1],
          " ",
        );
      }

      const kndAllCols = visibleCols
        .filter((c) => c.type === "knd" || c.type === "jmlKnd")
        .map((c) => colIndexMap[c.key]);

      if (kndAllCols.length > 0) {
        mergeHeader(9, kndAllCols[0], 9, kndAllCols[kndAllCols.length - 1], "");
      }

      const pendCols = visibleCols
        .filter((c) => c.type === "pendapatan")
        .map((c) => colIndexMap[c.key]);
      if (pendCols.length > 0) {
        mergeHeader(
          9,
          pendCols[0],
          9,
          pendCols[pendCols.length - 1],
          "PENDAPATAN (Rp.)",
        );
      }

      if (colIndexMap["rataRata"]) {
        mergeHeader(
          9,
          colIndexMap["rataRata"],
          12,
          colIndexMap["rataRata"],
          "RATA-RATA\nPER TRIP",
        );
      }

      const dwsCols = visibleCols
        .filter((c) => c.type === "pnp" && c.key.startsWith("dws"))
        .map((c) => colIndexMap[c.key]);
      const bayiCols = visibleCols
        .filter((c) => c.type === "pnp" && c.key.startsWith("bayi"))
        .map((c) => colIndexMap[c.key]);

      const allDwsBayiCols = [...dwsCols, ...bayiCols];
      if (allDwsBayiCols.length > 0) {
        mergeHeader(
          10,
          allDwsBayiCols[0],
          10,
          allDwsBayiCols[allDwsBayiCols.length - 1],
          "",
        );
      }

      if (colIndexMap["jmlPnp"]) {
        mergeHeader(
          11,
          colIndexMap["jmlPnp"],
          12,
          colIndexMap["jmlPnp"],
          "JML",
        );
      }

      const allPnpDataCols = [...dwsCols, ...bayiCols];
      if (allPnpDataCols.length > 0) {
        mergeHeader(
          11,
          allPnpDataCols[0],
          11,
          allPnpDataCols[allPnpDataCols.length - 1],
          "EKONOMI",
        );
      }

      visibleCols
        .filter((c) => c.type === "pnp")
        .forEach((col) => {
          mergeHeader(
            12,
            colIndexMap[col.key],
            12,
            colIndexMap[col.key],
            col.label,
          );
        });

      const golonganGroups = {};
      const nomorGolonganSudahDiproses = new Set();

      tarifData.forEach((tarif) => {
        const nomorGol = parseInt(tarif.golongan?.nomor_golongan || 0);

        if (GOLONGAN_PNP_BRG_MAP[nomorGol]) {
          if (nomorGolonganSudahDiproses.has(nomorGol)) return;
          nomorGolonganSudahDiproses.add(nomorGol);

          const g = GOLONGAN_PNP_BRG_MAP[nomorGol];
          const cols = [
            colIndexMap[`knd_${g.pnp_id}_normal`],
            colIndexMap[`knd_${g.pnp_id}_custom`],
            colIndexMap[`knd_${g.brg_id}_normal`],
            colIndexMap[`knd_${g.brg_id}_custom`],
          ].filter(Boolean);

          if (cols.length > 0) {
            golonganGroups[`nomor_${nomorGol}`] = {
              cols,
              label: toRomawi(nomorGol),
              isPnpBrg: true,
              nomorGol,
            };
          }
        } else {
          const normalKey = `knd_${tarif.golongan_id}_normal`;
          const customKey = `knd_${tarif.golongan_id}_custom`;
          const cols = [];
          if (colIndexMap[normalKey]) cols.push(colIndexMap[normalKey]);
          if (colIndexMap[customKey]) cols.push(colIndexMap[customKey]);
          if (cols.length > 0) {
            golonganGroups[tarif.golongan_id] = {
              cols,
              label: toRomawi(nomorGol),
              isPnpBrg: false,
              nomorGol,
            };
          }
        }
      });

      const kndOnlyCols = visibleCols
        .filter((c) => c.type === "knd")
        .map((c) => colIndexMap[c.key]);

      if (kndOnlyCols.length > 0) {
        mergeHeader(
          10,
          kndOnlyCols[0],
          10,
          kndOnlyCols[kndOnlyCols.length - 1],
          "KENDARAAN PER GOLONGAN",
        );
      }

      if (colIndexMap["jmlKnd"]) {
        mergeHeader(
          11,
          colIndexMap["jmlKnd"],
          12,
          colIndexMap["jmlKnd"],
          "JML",
        );
      }

      Object.values(golonganGroups).forEach((g) => {
        if (g.isPnpBrg && g.cols.length > 0) {
          mergeHeader(
            11,
            g.cols[0],
            11,
            g.cols[g.cols.length - 1],
            `${g.label}`,
          );
        }
      });

      visibleCols
        .filter((c) => c.type === "knd")
        .forEach((col) => {
          if (col.isPnpBrg) {
            mergeHeader(
              12,
              colIndexMap[col.key],
              12,
              colIndexMap[col.key],
              col.label,
            );
          } else {
            mergeHeader(
              11,
              colIndexMap[col.key],
              12,
              colIndexMap[col.key],
              col.label,
            );
          }
        });

      pendCols.forEach((colIdx, i) => {
        const labels = [
          "PENUMPANG",
          "KENDARAAN",
          "BARANG",
          "TOTAL\nPENDAPATAN",
        ];
        mergeHeader(10, colIdx, 12, colIdx, labels[i] || "");
      });

      for (let row = 9; row <= 12; row++) {
        for (let col = 2; col <= lastCol; col++) {
          setBorder(worksheet.getCell(row, col), "thin");
        }
      }
      worksheet.getRow(9).height = 25;
      worksheet.getRow(10).height = 20;
      worksheet.getRow(11).height = 20;
      worksheet.getRow(12).height = 20;

      let currentRow = 13;
      let perusahaanMergeStart = null;
      let lastPerusahaan = null;
      const perusahaanMergeRanges = [];

      groupedData.forEach((item, globalIndex) => {
        const row = worksheet.getRow(currentRow);

        if (lastPerusahaan !== item.nama_perusahaan) {
          if (perusahaanMergeStart !== null) {
            perusahaanMergeRanges.push({
              start: perusahaanMergeStart,
              end: currentRow - 1,
              name: lastPerusahaan,
            });
          }
          perusahaanMergeStart = currentRow;
          lastPerusahaan = item.nama_perusahaan;
        }

        row.getCell(2).value = globalIndex + 1;
        row.getCell(3).value = item.nama_kapal;
        row.getCell(4).value = item.nama_perusahaan;
        row.getCell(5).value = item.gt;
        row.getCell(6).value = item.trips;

        const setCell = (key, value) => {
          if (colIndexMap[key] !== undefined) {
            row.getCell(colIndexMap[key]).value = value;
          }
        };

        setCell("dws", item.dws);
        setCell("dwsCustom", item.dwsCustom);
        setCell("bayi", item.bayi);
        setCell("bayiCustom", item.bayiCustom);

        if (colIndexMap["jmlPnp"]) {
          const pnpFormulaKeys = visibleCols
            .filter((c) => c.type === "pnp")
            .map((c) => colIndexMap[c.key]);
          const formula = pnpFormulaKeys
            .map((ci) => `${getColumnLetter(ci)}${currentRow}`)
            .join("+");
          row.getCell(colIndexMap["jmlPnp"]).value = formula ? { formula } : 0;
        }

        tarifData.forEach((tarif) => {
          setCell(
            `knd_${tarif.golongan_id}_normal`,
            item.kendaraanByGolongan[tarif.golongan_id] || 0,
          );
          setCell(
            `knd_${tarif.golongan_id}_custom`,
            item.kendaraanCustomByGolongan[tarif.golongan_id] || 0,
          );
        });

        if (colIndexMap["jmlKnd"]) {
          const kndFormulaKeys = visibleCols
            .filter((c) => c.type === "knd")
            .map((c) => colIndexMap[c.key]);
          const formula =
            kndFormulaKeys.length > 0
              ? `SUM(${getColumnLetter(kndFormulaKeys[0])}${currentRow}:${getColumnLetter(kndFormulaKeys[kndFormulaKeys.length - 1])}${currentRow})`
              : "0";
          row.getCell(colIndexMap["jmlKnd"]).value = { formula };
        }

        if (colIndexMap["pendPnp"]) {
          const pnpTerms = visibleCols
            .filter((c) => c.type === "pnp" && c.tarifRow8)
            .map((c) => {
              const colL = getColumnLetter(colIndexMap[c.key]);
              return `${colL}${currentRow}*${c.tarifRow8}`;
            });
          row.getCell(colIndexMap["pendPnp"]).value =
            pnpTerms.length > 0 ? { formula: pnpTerms.join("+") } : 0;
        }

        if (colIndexMap["pendKnd"]) {
          const kndPnpTerms = [];
          visibleCols
            .filter(
              (c) =>
                c.type === "knd" &&
                c.tarifRow8 &&
                (c.subType === "pnp" ||
                  c.subType === "pnp_custom" ||
                  c.subType === "normal" ||
                  c.subType === "normal_custom"),
            )
            .forEach((col) => {
              kndPnpTerms.push(
                `${getColumnLetter(colIndexMap[col.key])}${currentRow}*${col.tarifRow8}`,
              );
            });
          row.getCell(colIndexMap["pendKnd"]).value =
            kndPnpTerms.length > 0 ? { formula: kndPnpTerms.join("+") } : 0;
        }

        // PENDAPATAN BARANG
        if (colIndexMap["pendBrg"]) {
          const kndBrgTerms = [];
          visibleCols
            .filter(
              (c) =>
                c.type === "knd" &&
                c.tarifRow8 &&
                (c.subType === "brg" || c.subType === "brg_custom"),
            )
            .forEach((col) => {
              kndBrgTerms.push(
                `${getColumnLetter(colIndexMap[col.key])}${currentRow}*${col.tarifRow8}`,
              );
            });
          row.getCell(colIndexMap["pendBrg"]).value =
            kndBrgTerms.length > 0 ? { formula: kndBrgTerms.join("+") } : 0;
        }

        // Total pendapatan
        if (colIndexMap["pendTotal"]) {
          const pL = getColumnLetter(colIndexMap["pendPnp"]);
          const kL = getColumnLetter(colIndexMap["pendKnd"]);
          const bL = getColumnLetter(colIndexMap["pendBrg"]);
          row.getCell(colIndexMap["pendTotal"]).value = {
            formula: `${pL}${currentRow}+${kL}${currentRow}+${bL}${currentRow}`,
          };
        }

        // Rata-rata per trip
        if (colIndexMap["rataRata"] && colIndexMap["pendTotal"]) {
          const tL = getColumnLetter(colIndexMap["pendTotal"]);
          row.getCell(colIndexMap["rataRata"]).value = {
            formula: `IF(F${currentRow}>0,${tL}${currentRow}/F${currentRow},0)`,
          };
        }

        row.getCell(2).alignment = { horizontal: "center", vertical: "center" };
        row.getCell(3).alignment = { horizontal: "left", vertical: "center" };
        row.getCell(4).alignment = { horizontal: "left", vertical: "center" };

        for (let col = 5; col <= lastCol; col++) {
          row.getCell(col).alignment = {
            horizontal: "right",
            vertical: "center",
          };
        }

        const pendColIndices = [
          "pendPnp",
          "pendKnd",
          "pendBrg",
          "pendTotal",
          "rataRata",
        ]
          .filter((k) => colIndexMap[k])
          .map((k) => colIndexMap[k]);
        pendColIndices.forEach((ci) => {
          row.getCell(ci).numFmt = "#,##0";
        });

        for (let col = 2; col <= lastCol; col++) {
          row.getCell(col).font = { name: "Calibri", size: 12, bold: true };
          setBorder(row.getCell(col), "thin");
        }

        currentRow++;
      });

      if (perusahaanMergeStart !== null) {
        perusahaanMergeRanges.push({
          start: perusahaanMergeStart,
          end: currentRow - 1,
          name: lastPerusahaan,
        });
      }

      perusahaanMergeRanges.forEach((range) => {
        try {
          if (range.start < range.end) {
            worksheet.mergeCells(`D${range.start}:D${range.end}`);
          }
          const cell = worksheet.getCell(`D${range.start}`);
          cell.value = range.name;
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } catch (e) {
          worksheet.getCell(`D${range.start}`).value = range.name;
        }
      });

      const totalRow = worksheet.getRow(currentRow);
      const dataStartRow = 13;
      const dataEndRow = currentRow - 1;

      worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
      totalRow.getCell(2).value = "JUMLAH";
      totalRow.getCell(2).font = { name: "Calibri", size: 12, bold: true };
      totalRow.getCell(2).alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      totalRow.getCell(5).value = "";

      const setTotalFormula = (colKey) => {
        if (!colIndexMap[colKey]) return;
        const ci = colIndexMap[colKey];
        const L = getColumnLetter(ci);
        totalRow.getCell(ci).value = {
          formula: `SUM(${L}${dataStartRow}:${L}${dataEndRow})`,
        };
      };

      totalRow.getCell(6).value = {
        formula: `SUM(F${dataStartRow}:F${dataEndRow})`,
      };

      visibleCols.forEach((col) => {
        if (col.type === "rataRata") return;
        setTotalFormula(col.key);
      });

      const pendColIndices = ["pendPnp", "pendKnd", "pendBrg", "pendTotal"]
        .filter((k) => colIndexMap[k])
        .map((k) => colIndexMap[k]);
      pendColIndices.forEach((ci) => {
        totalRow.getCell(ci).numFmt = "#,##0";
      });

      for (let col = 2; col <= lastCol; col++) {
        totalRow.getCell(col).font = { name: "Calibri", size: 12, bold: true };
        totalRow.getCell(col).alignment = {
          horizontal: "right",
          vertical: "middle",
        };
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: "medium" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      totalRow.getCell(2).alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.views = [{ state: "frozen", ySplit: 12 }];
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        margins: {
          left: 0.3,
          right: 0.3,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3,
        },
      };
      const lastColLetter = getColumnLetter(lastCol);
      worksheet.pageSetup.printArea = `B2:${lastColLetter}${currentRow}`;

      const filename = `Laporan_Produksi_${periodeAwal}_sampai_${periodeAkhir}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export Excel Error:", error);
      next(error);
    }
  }
}

module.exports = ProduksiExportController;
