const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { generateExcel } = require('./export');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bypass ngrok browser warning
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

// ─────────────────────────────────────────────
// POST /api/submit
// ─────────────────────────────────────────────
app.post('/api/submit', async (req, res) => {
  try {
    const b = req.body;
    const merchant = {
      id: uuidv4(),
      submitted_at: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      downloaded: false,
      downloaded_at: null,
      indicator: b.indicator || '',
      ownership_status: b.ownership_status || '',
      categori_1: b.categori_1 || '',
      categori_2: b.categori_2 || '',
      categori_3: b.categori_3 || '',
      nama_pic: b.nama_pic || '',
      nama_brand: b.nama_brand || '',
      jenis_identitas: b.jenis_identitas || '',
      no_identitas: b.no_identitas || '',
      alamat_pemilik: b.alamat_pemilik || '',
      kode_pos_pemilik: b.kode_pos_pemilik || '',
      nama_pemilik: b.nama_pemilik || '',
      nomor_kontak_pemilik: b.nomor_kontak_pemilik || '',
      email_pemilik: b.email_pemilik || '',
      provinsi_pemilik: b.provinsi_pemilik || '',
      kriteria_merchant: b.kriteria_merchant || '',
      mdr: b.mdr || '',
      fullname_store: b.fullname_store || '',
      store_code: b.store_code || '',
      username_merchant: b.username_merchant || '',
      code_store: b.code_store || '',
      category_mcc: b.category_mcc || '',
      detail_mcc: b.detail_mcc || '',
      location_store: b.location_store || '',
      detail_lokasi_store: b.detail_lokasi_store || '',
      alamat_store: b.alamat_store || '',
      provinsi_store: b.provinsi_store || '',
      kota_store: b.kota_store || '',
      kodepos_store: b.kodepos_store || '',
      nama_pic_store: b.nama_pic_store || '',
      no_pic_store: b.no_pic_store || '',
      nomor_notifikasi: b.nomor_notifikasi || '',
      email_notifikasi: b.email_notifikasi || '',
      nama_bank: b.nama_bank || '',
      nomor_rekening: b.nomor_rekening || '',
      nama_rekening: b.nama_rekening || '',
      latitude: b.latitude || '',
      longitude: b.longitude || '',
      device_installation: b.device_installation || '',
      jumlah_device: b.jumlah_device || '',
      cetak_qris: b.cetak_qris || '',
      dashboard_merchant: b.dashboard_merchant || '',
      doc_ktp: b.doc_ktp || '',
      doc_selfie_ktp: b.doc_selfie_ktp || '',
      doc_npwp: b.doc_npwp || '',
      doc_buku_tabungan: b.doc_buku_tabungan || '',
      doc_merchant_logo: b.doc_merchant_logo || '',
      doc_ktp_pdf: b.doc_ktp_pdf || '',
      doc_buku_tabungan_pdf: b.doc_buku_tabungan_pdf || '',
      doc_npwp_pdf: b.doc_npwp_pdf || '',
      doc_izin_usaha: b.doc_izin_usaha || '',
      doc_tdp_nib: b.doc_tdp_nib || '',
      doc_akta_pendirian: b.doc_akta_pendirian || '',
      doc_sk_kemenkumham: b.doc_sk_kemenkumham || '',
      doc_akta_perubahan: b.doc_akta_perubahan || '',
      doc_surat_kuasa: b.doc_surat_kuasa || '',
      doc_logo_perusahaan: b.doc_logo_perusahaan || '',
      foto_merchant: b.foto_merchant || '',
      foto_plang: b.foto_plang || '',
    };

    await db.insert(merchant);
    res.json({ success: true, id: merchant.id, message: 'Data merchant berhasil disimpan!' });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan: ' + err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/submissions?status=pending|downloaded|all
// ─────────────────────────────────────────────
app.get('/api/submissions', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const merchants = await db.getAll(status);
    const summary = merchants.map(m => ({
      id: m.id,
      submitted_at: m.submitted_at,
      downloaded: m.downloaded,
      downloaded_at: m.downloaded_at,
      nama_brand: m.nama_brand,
      nama_pic: m.nama_pic,
      ownership_status: m.ownership_status,
      nama_pic_store: m.nama_pic_store,
      provinsi_store: m.provinsi_store,
      kota_store: m.kota_store,
    }));
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/merchant/:id — detail lengkap
// ─────────────────────────────────────────────
app.get('/api/merchant/:id', async (req, res) => {
  try {
    const merchant = await db.getById(req.params.id);
    if (!merchant) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    res.json(merchant);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/download/:id
// ─────────────────────────────────────────────
app.get('/api/download/:id', async (req, res) => {
  try {
    const merchant = await db.getById(req.params.id);
    if (!merchant) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });

    const buffer = await generateExcel([merchant]);
    await db.markDownloaded([merchant.id]);

    const safeName = (merchant.nama_brand || 'merchant').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const filename = `MRF_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/download-batch — semua pending
// ─────────────────────────────────────────────
app.get('/api/download-batch', async (req, res) => {
  try {
    const pending = await db.getAll('pending');
    if (pending.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data pending' });
    }

    const buffer = await generateExcel(pending);
    await db.markDownloaded(pending.map(m => m.id));

    const filename = `MRF_Batch_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Batch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/submissions/:id
// ─────────────────────────────────────────────
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    await db.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/stats
// ─────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.stats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Routes halaman
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'portal.html')));
app.get('/form', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'form.html')));
app.get('/add-store', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'add-store.html')));

// Init database lalu start server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ MRF GPay App berjalan di http://localhost:${PORT}`);
    console.log(`   📋 Form   : http://localhost:${PORT}/form`);
    console.log(`   📊 Portal : http://localhost:${PORT}/\n`);
  });
}).catch(err => {
  console.error('❌ Database init failed:', err.message);
  process.exit(1);
});
