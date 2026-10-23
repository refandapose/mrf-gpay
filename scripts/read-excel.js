/**
 * Script untuk membaca data dari Excel MRF dan generate seed file JSON
 * Jalankan: node scripts/read-excel.js
 */
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const EXCEL_PATH = path.join(__dirname, '..', '..', 'MRF Merchant Online POSe 17-09-2026.xlsx');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'seed.json');

// Pastikan folder data ada
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Mapping kolom Excel -> field database
// Hanya kolom "Isi Manual" — skip Rumus (Q,R,S,W,AD,Z,AK)
const COL_MAP = {
  B: 'indicator',
  C: 'ownership_status',
  D: 'categori_1',
  E: 'categori_2',
  F: 'categori_3',
  G: 'nama_pic',
  H: 'nama_brand',
  I: 'jenis_identitas',
  J: 'no_identitas',
  K: 'alamat_pemilik',
  L: 'kode_pos_pemilik',
  M: 'nama_pemilik',
  N: 'nomor_kontak_pemilik',
  O: 'email_pemilik',
  P: 'provinsi_pemilik',
  // Q,R,S = Rumus — skip
  T: 'kriteria_merchant',
  U: 'mdr',
  V: 'fullname_store',
  // W = Rumus store name — skip
  X: 'store_code',
  Y: 'username_merchant',
  // Z = DIISI OPS — skip
  AA: 'code_store',
  AB: 'category_mcc',
  AC: 'detail_mcc',
  // AD = MCC Code otomatis — skip
  AE: 'location_store',
  AF: 'detail_lokasi_store',
  AG: 'alamat_store',
  AH: 'provinsi_store',
  AI: 'kota_store',
  AJ: 'kodepos_store',
  // AK = Rumus PIC — skip
  AL: 'no_pic_store',
  AM: 'nomor_notifikasi',
  AN: 'email_notifikasi',
  AO: 'nama_bank',
  AP: 'nomor_rekening',
  AQ: 'nama_rekening',
  AR: 'lat_lng_raw',  // nanti dipisah
  AS: 'device_installation',
  AT: 'jumlah_device',
  AU: 'cetak_qris',
  AV: 'dashboard_merchant',
  AW: 'doc_ktp',
  AX: 'doc_selfie_ktp',
  AY: 'doc_npwp',
  AZ: 'doc_buku_tabungan',
  BA: 'doc_merchant_logo',
  BB: 'doc_ktp_pdf',
  BC: 'doc_buku_tabungan_pdf',
  BD: 'doc_npwp_pdf',
  BE: 'doc_izin_usaha',
  BF: 'doc_tdp_nib',
  BG: 'doc_akta_pendirian',
  BH: 'doc_sk_kemenkumham',
  BI: 'doc_akta_perubahan',
  BJ: 'doc_surat_kuasa',
  BK: 'doc_logo_perusahaan',
};

// Konversi nomor kolom Excel ke huruf (A, B, ..., AA, AB, ...)
function colNumToLetter(n) {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

async function main() {
  console.log('📖 Membaca Excel:', EXCEL_PATH);

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ File Excel tidak ditemukan di:', EXCEL_PATH);
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);

  // Cari sheet "Merchant"
  const ws = wb.getWorksheet('Merchant');
  if (!ws) {
    console.error('❌ Sheet "Merchant" tidak ditemukan');
    console.log('Sheet yang ada:', wb.worksheets.map(s => s.name));
    process.exit(1);
  }

  console.log(`✅ Sheet "Merchant" ditemukan`);

  const merchants = [];
  let rowCount = 0;

  // Baris data mulai dari row 5 (row 1-4 adalah header)
  ws.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return; // skip header

    // Cek apakah baris ini punya data (minimal nama brand atau fullname store)
    const namaBrand = row.getCell('H').value;
    const fullnameStore = row.getCell('V').value;

    if (!namaBrand && !fullnameStore) return; // skip baris kosong

    const merchant = {
      id: uuidv4(),
      submitted_at: new Date().toISOString(),
      downloaded: true, // data lama, tandai sudah downloaded
      downloaded_at: new Date().toISOString(),
      // init semua field kosong
      indicator: '', ownership_status: '', categori_1: '', categori_2: '', categori_3: '',
      nama_pic: '', nama_brand: '', jenis_identitas: '', no_identitas: '',
      alamat_pemilik: '', kode_pos_pemilik: '', nama_pemilik: '',
      nomor_kontak_pemilik: '', email_pemilik: '', provinsi_pemilik: '',
      kriteria_merchant: '', mdr: '', fullname_store: '', store_code: '',
      username_merchant: '', code_store: '', category_mcc: '', detail_mcc: '',
      location_store: '', detail_lokasi_store: '', alamat_store: '',
      provinsi_store: '', kota_store: '', kodepos_store: '',
      nama_pic_store: '', no_pic_store: '', nomor_notifikasi: '',
      email_notifikasi: '', nama_bank: '', nomor_rekening: '', nama_rekening: '',
      latitude: '', longitude: '', device_installation: '', jumlah_device: '',
      cetak_qris: '', dashboard_merchant: '',
      doc_ktp: '', doc_selfie_ktp: '', doc_npwp: '', doc_buku_tabungan: '',
      doc_merchant_logo: '', doc_ktp_pdf: '', doc_buku_tabungan_pdf: '',
      doc_npwp_pdf: '', doc_izin_usaha: '', doc_tdp_nib: '',
      doc_akta_pendirian: '', doc_sk_kemenkumham: '', doc_akta_perubahan: '',
      doc_surat_kuasa: '', doc_logo_perusahaan: '',
    };

    // Isi field dari kolom Excel
    for (const [colLetter, fieldName] of Object.entries(COL_MAP)) {
      const cell = row.getCell(colLetter);
      let val = cell.value;

      // Handle berbagai tipe nilai ExcelJS
      if (val === null || val === undefined) { val = ''; }
      else if (typeof val === 'object' && val.text) { val = val.text; } // rich text
      else if (typeof val === 'object' && val.result !== undefined) { val = val.result; } // formula
      else { val = String(val).trim(); }

      if (fieldName === 'lat_lng_raw') {
        // Pisahkan latitude dan longitude
        if (val && val.includes(',')) {
          const parts = val.split(',');
          merchant.latitude = parts[0].trim();
          merchant.longitude = parts[1].trim();
        }
      } else {
        merchant[fieldName] = val;
      }
    }

    // Nama PIC Store dari kolom AK (walau rumus, ambil nilai hasil rumusnya)
    const picStoreCell = row.getCell('AK');
    let picStoreVal = picStoreCell.value;
    if (picStoreVal && typeof picStoreVal === 'object' && picStoreVal.result) {
      merchant.nama_pic_store = String(picStoreVal.result);
    } else if (picStoreVal) {
      merchant.nama_pic_store = String(picStoreVal).trim();
    }

    // MDR: konversi dari angka desimal ke string persentase
    if (merchant.mdr && !isNaN(merchant.mdr)) {
      const num = parseFloat(merchant.mdr);
      if (num < 1) merchant.mdr = (num * 100).toFixed(2) + '%';
    }

    merchants.push(merchant);
    rowCount++;
    console.log(`  ✓ Row ${rowNumber}: ${merchant.nama_brand || '(no brand)'} — ${merchant.fullname_store || '(no store)'}`);
  });

  console.log(`\n✅ Total ${rowCount} merchant berhasil dibaca`);

  // Simpan ke seed.json
  const output = { merchants };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`💾 Tersimpan ke: ${OUTPUT_PATH}`);
  console.log('\n🎉 Selesai! Jalankan "node scripts/import-seed.js" untuk import ke database.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
