/**
 * Database adapter
 * - Kalau DATABASE_URL ada (Railway): pakai PostgreSQL
 * - Kalau tidak ada: pakai lowdb JSON (lokal/development)
 */

const IS_POSTGRES = !!process.env.DATABASE_URL;

// ─────────────────────────────────────────────────────────
// PostgreSQL adapter
// ─────────────────────────────────────────────────────────
let pgPool;
function getPool() {
  if (!pgPool) {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pgPool;
}

async function initPostgres() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS merchants (
      id                  TEXT PRIMARY KEY,
      submitted_at        TEXT NOT NULL,
      downloaded          BOOLEAN NOT NULL DEFAULT FALSE,
      downloaded_at       TEXT,
      indicator           TEXT, ownership_status TEXT,
      categori_1          TEXT, categori_2 TEXT, categori_3 TEXT,
      nama_pic            TEXT, nama_brand TEXT,
      jenis_identitas     TEXT, no_identitas TEXT,
      alamat_pemilik      TEXT, kode_pos_pemilik TEXT,
      nama_pemilik        TEXT, nomor_kontak_pemilik TEXT,
      email_pemilik       TEXT, provinsi_pemilik TEXT,
      kriteria_merchant   TEXT, mdr TEXT,
      fullname_store      TEXT, store_code TEXT,
      username_merchant   TEXT, code_store TEXT,
      category_mcc        TEXT, detail_mcc TEXT,
      location_store      TEXT, detail_lokasi_store TEXT,
      alamat_store        TEXT, provinsi_store TEXT,
      kota_store          TEXT, kodepos_store TEXT,
      nama_pic_store      TEXT, no_pic_store TEXT,
      nomor_notifikasi    TEXT, email_notifikasi TEXT,
      nama_bank           TEXT, nomor_rekening TEXT, nama_rekening TEXT,
      latitude            TEXT, longitude TEXT,
      device_installation TEXT, jumlah_device TEXT,
      cetak_qris          TEXT, dashboard_merchant TEXT,
      doc_ktp             TEXT, doc_selfie_ktp TEXT,
      doc_npwp            TEXT, doc_buku_tabungan TEXT,
      doc_merchant_logo   TEXT, doc_ktp_pdf TEXT,
      doc_buku_tabungan_pdf TEXT, doc_npwp_pdf TEXT,
      doc_izin_usaha      TEXT, doc_tdp_nib TEXT,
      doc_akta_pendirian  TEXT, doc_sk_kemenkumham TEXT,
      doc_akta_perubahan  TEXT, doc_surat_kuasa TEXT,
      doc_logo_perusahaan TEXT,
      foto_merchant       TEXT,
      foto_plang          TEXT
    )
  `);
  console.log('✅ PostgreSQL connected & table ready');
}

// ─────────────────────────────────────────────────────────
// JSON (lowdb) adapter
// ─────────────────────────────────────────────────────────
let _jsonDb;
async function getJsonDb() {
  if (!_jsonDb) {
    const { JSONFilePreset } = require('lowdb/node');
    const path = require('path');
    const fs = require('fs');
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    _jsonDb = await JSONFilePreset(path.join(dataDir, 'mrf.json'), { merchants: [] });

    // Load seed jika mrf.json kosong dan seed.json ada
    const seedPath = path.join(dataDir, 'seed.json');
    if (_jsonDb.data.merchants.length === 0 && fs.existsSync(seedPath)) {
      const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      _jsonDb.data.merchants = seed.merchants || [];
      await _jsonDb.write();
      console.log(`✅ Seed loaded: ${_jsonDb.data.merchants.length} merchants`);
    }
  }
  return _jsonDb;
}

// ─────────────────────────────────────────────────────────
// Unified DB interface — semua fungsi return Promise
// ─────────────────────────────────────────────────────────
const db = {
  async init() {
    if (IS_POSTGRES) await initPostgres();
    else { await getJsonDb(); console.log('✅ JSON database ready'); }
  },

  async insert(merchant) {
    if (IS_POSTGRES) {
      const keys = Object.keys(merchant);
      const cols = keys.join(', ');
      const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
      await getPool().query(
        `INSERT INTO merchants (${cols}) VALUES (${vals})`,
        keys.map(k => merchant[k])
      );
    } else {
      const ldb = await getJsonDb();
      ldb.data.merchants.push(merchant);
      await ldb.write();
    }
  },

  async getAll(status = 'all') {
    if (IS_POSTGRES) {
      let q = 'SELECT * FROM merchants';
      if (status === 'pending') q += ' WHERE downloaded = FALSE';
      else if (status === 'downloaded') q += ' WHERE downloaded = TRUE';
      q += ' ORDER BY submitted_at DESC';
      const { rows } = await getPool().query(q);
      return rows;
    } else {
      const ldb = await getJsonDb();
      let list = ldb.data.merchants;
      if (status === 'pending') list = list.filter(m => !m.downloaded);
      else if (status === 'downloaded') list = list.filter(m => m.downloaded);
      return [...list].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }
  },

  async getById(id) {
    if (IS_POSTGRES) {
      const { rows } = await getPool().query('SELECT * FROM merchants WHERE id = $1', [id]);
      return rows[0] || null;
    } else {
      const ldb = await getJsonDb();
      return ldb.data.merchants.find(m => m.id === id) || null;
    }
  },

  async markDownloaded(ids) {
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    if (IS_POSTGRES) {
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
      await getPool().query(
        `UPDATE merchants SET downloaded = TRUE, downloaded_at = $1 WHERE id IN (${placeholders})`,
        [now, ...ids]
      );
    } else {
      const ldb = await getJsonDb();
      ldb.data.merchants.forEach(m => {
        if (ids.includes(m.id)) { m.downloaded = true; m.downloaded_at = now; }
      });
      await ldb.write();
    }
  },

  async delete(id) {
    if (IS_POSTGRES) {
      await getPool().query('DELETE FROM merchants WHERE id = $1', [id]);
    } else {
      const ldb = await getJsonDb();
      ldb.data.merchants = ldb.data.merchants.filter(m => m.id !== id);
      await ldb.write();
    }
  },

  async stats() {
    if (IS_POSTGRES) {
      const { rows } = await getPool().query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE downloaded = FALSE) as pending,
          COUNT(*) FILTER (WHERE downloaded = TRUE) as downloaded
        FROM merchants
      `);
      return { total: +rows[0].total, pending: +rows[0].pending, downloaded: +rows[0].downloaded };
    } else {
      const ldb = await getJsonDb();
      const all = ldb.data.merchants;
      return {
        total: all.length,
        pending: all.filter(m => !m.downloaded).length,
        downloaded: all.filter(m => m.downloaded).length,
      };
    }
  },

  // Untuk import seed ke PostgreSQL
  async bulkInsert(merchants) {
    for (const m of merchants) {
      try { await this.insert(m); } catch (e) {
        if (e.code === '23505') { /* skip duplicate */ }
        else throw e;
      }
    }
  }
};

module.exports = db;
