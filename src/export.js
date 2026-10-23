const ExcelJS = require('exceljs');
const path = require('path');

// Data referensi dari sheet List
const PROVINSI = [
  'Aceh','Bali','Bangka Belitung','Banten','Bengkulu','D.I. Yogyakarta',
  'D.K.I. Jakarta','Gorontalo','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur',
  'Kalimantan Barat','Kalimantan Selatan','Kalimantan Tengah','Kalimantan Timur',
  'Kalimantan Utara','Kepulauan Riau','Kepulauan Seribu','Lampung','Maluku',
  'Maluku Utara','Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat',
  'Riau','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah','Sulawesi Tenggara',
  'Sulawesi Utara','Sumatera Barat','Sumatera Selatan','Sumatera Utara'
];

/**
 * Generate file Excel MRF GPay dari array data merchant
 * Format: satu baris per merchant, kolom sesuai template MRF
 * @param {Array} merchants - array row dari database
 * @returns {Buffer} - buffer file xlsx
 */
async function generateExcel(merchants) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Merchant');

  // ── BARIS 1: Judul ──
  ws.getCell('A1').value = 'Merchant Registration Form';

  // ── BARIS 2: Label kelompok ──
  ws.getCell('A2').value = 'Isi Manual PIC';
  ws.getCell('T2').value = 'Isi Manual';
  ws.getCell('V2').value = 'Isi Manual';

  // ── BARIS 3: Section header ──
  ws.getCell('H3').value = 'INFO LEGALITAS';
  ws.getCell('V3').value = 'INFO STORE';
  ws.getCell('AX3').value = 'DOKUMEN INDIVIDUAL';
  ws.getCell('BB3').value = 'Dokumen Perusahaan';

  // ── BARIS 4: Header kolom ──
  const headers = {
    A: 'No',
    B: 'Indicator',
    C: 'Ownership Status',
    D: 'Categori 1',
    E: 'Categori 2',
    F: 'Categori 3',
    G: 'Nama PIC',
    H: 'Nama Brand (Merchant Name)',
    I: 'Jenis Identitas',
    J: 'No. Identitas',
    K: 'Alamat Pemilik',
    L: 'Kode Pos',
    M: 'Nama Pemilik',
    N: 'Nomor Kontak Pemilik',
    O: 'Email Pemilik',
    P: 'Provinsi Pemilik',
    Q: 'Nama PIC Keuangan',
    R: 'Kontak PIC Keuangan',
    S: 'Email PIC Keuangan',
    T: 'Kriteria/Ukuran Merchant',
    U: 'MDR Sesuai Agreement',
    V: 'Fullname Store (50)',
    W: 'Store Name (25)',
    X: 'Store Code',
    Y: 'Username Merchant Apps',
    Z: 'NMID',
    AA: 'Code',
    AB: 'Category MCC',
    AC: 'Detail MCC',
    AD: 'MCC Code',
    AE: 'Location Store',
    AF: 'Detail Lokasi Store',
    AG: 'Alamat Store',
    AH: 'Provinsi Store',
    AI: 'Kota Store',
    AJ: 'Kodepos Store',
    AK: 'Nama PIC Store',
    AL: 'No PIC Store',
    AM: 'Nomor Kontak notifikasi',
    AN: 'Email Notifikasi',
    AO: 'Nama Bank Rekening',
    AP: 'Nomor Rekening',
    AQ: 'Nama Rekening',
    AR: 'Latitude,Longitude',
    AS: 'Device Instalation',
    AT: 'Jumlah Device',
    AU: 'Cetak QRIS',
    AV: 'Dashboard Merchant',
    AW: 'KTP',
    AX: 'FOTO SELFIE KTP',
    AY: 'NPWP',
    AZ: 'Buku Tabungan',
    BA: 'Merchant Logo (Jika ada)',
    BB: 'KTP (pdf)',
    BC: 'Buku Tabungan',
    BD: 'NPWP (pdf)',
    BE: 'Izin Usaha (pdf)',
    BF: 'TDP/NIB (pdf)',
    BG: 'Akta Pendirian (pdf)',
    BH: 'SK Kemenkumham (pdf)',
    BI: 'Akta Perubahan + SK Pengesahan (Jika ada)',
    BJ: 'Surat Kuasa (Jika ada)',
    BK: 'Merchant Logo',
  };

  for (const [col, title] of Object.entries(headers)) {
    const cell = ws.getCell(`${col}4`);
    cell.value = title;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  }

  // ── BARIS 5+: Data merchant ──
  merchants.forEach((m, idx) => {
    const row = idx + 5;
    const latLng = (m.latitude && m.longitude) ? `${m.latitude},${m.longitude}` : '';

    const data = {
      A: idx + 1,
      B: m.indicator,
      C: m.ownership_status,
      D: m.categori_1,
      E: m.categori_2,
      F: m.categori_3,
      G: m.nama_pic,
      H: m.nama_brand,
      I: m.jenis_identitas,
      J: m.no_identitas ? `'${m.no_identitas}` : '',
      K: m.alamat_pemilik,
      L: m.kode_pos_pemilik,
      M: m.nama_pemilik,
      N: m.nomor_kontak_pemilik ? `'${m.nomor_kontak_pemilik}` : '',
      O: m.email_pemilik,
      P: m.provinsi_pemilik,
      Q: '',  // Rumus — dikosongkan
      R: '',  // Rumus
      S: '',  // Rumus
      T: m.kriteria_merchant,
      U: m.mdr,
      V: m.fullname_store,
      W: '',  // Rumus Store Name
      X: m.store_code,
      Y: m.username_merchant,
      Z: '',  // DIISI OPS
      AA: m.code_store,
      AB: m.category_mcc,
      AC: m.detail_mcc,
      AD: '',  // MCC Code — otomatis
      AE: m.location_store,
      AF: m.detail_lokasi_store,
      AG: m.alamat_store,
      AH: m.provinsi_store,
      AI: m.kota_store,
      AJ: m.kodepos_store,
      AK: m.nama_pic_store,
      AL: m.no_pic_store ? `'${m.no_pic_store}` : '',
      AM: m.nomor_notifikasi ? `'${m.nomor_notifikasi}` : '',
      AN: m.email_notifikasi,
      AO: m.nama_bank,
      AP: m.nomor_rekening ? `'${m.nomor_rekening}` : '',
      AQ: m.nama_rekening,
      AR: latLng,
      AS: m.device_installation,
      AT: m.jumlah_device,
      AU: m.cetak_qris,
      AV: m.dashboard_merchant,
      AW: m.doc_ktp,
      AX: m.doc_selfie_ktp,
      AY: m.doc_npwp,
      AZ: m.doc_buku_tabungan,
      BA: m.doc_merchant_logo,
      BB: m.doc_ktp_pdf,
      BC: m.doc_buku_tabungan_pdf,
      BD: m.doc_npwp_pdf,
      BE: m.doc_izin_usaha,
      BF: m.doc_tdp_nib,
      BG: m.doc_akta_pendirian,
      BH: m.doc_sk_kemenkumham,
      BI: m.doc_akta_perubahan,
      BJ: m.doc_surat_kuasa,
      BK: m.doc_logo_perusahaan,
    };

    for (const [col, val] of Object.entries(data)) {
      ws.getCell(`${col}${row}`).value = val ?? '';
    }
  });

  // Auto-fit kolom (estimasi lebar)
  ws.columns.forEach(col => { col.width = 22; });

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateExcel };
