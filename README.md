# 📋 MRF GPay App — Panduan Setup & Deploy

Aplikasi web form pendaftaran merchant QRIS GPay.  
Tim lapangan isi form dari HP → data tersimpan → Anda download Excel MRF kapanpun.

---

## 🖥️ Jalankan di Komputer Lokal

### Step 1 — Install Node.js
1. Buka https://nodejs.org
2. Download **LTS version** (misal v20.x)
3. Install, centang semua opsi default
4. Buka ulang terminal / PowerShell
5. Cek: `node --version` dan `npm --version`

### Step 2 — Install dependencies
Buka PowerShell, masuk ke folder app:
```
cd "c:\SCO\FORM MRF GPay\mrf-app"
npm install
```

### Step 3 — Jalankan
```
npm start
```

Buka browser:
- **Form input** (tim lapangan): http://localhost:3000/form
- **Portal download** (Anda): http://localhost:3000/

---

## ☁️ Deploy ke Railway (GRATIS — bisa diakses dari HP manapun)

Railway memberikan hosting Node.js gratis dengan database persistent.

### Step 1 — Buat akun Railway
1. Buka https://railway.app
2. Sign up dengan GitHub (gratis)

### Step 2 — Push kode ke GitHub
```bash
cd "c:\SCO\FORM MRF GPay\mrf-app"
git init
git add .
git commit -m "Initial commit MRF GPay App"
```
Buat repo baru di https://github.com/new (buat Private)
```bash
git remote add origin https://github.com/USERNAME/mrf-gpay.git
git push -u origin main
```

### Step 3 — Deploy di Railway
1. Login ke https://railway.app/dashboard
2. Klik **New Project** → **Deploy from GitHub repo**
3. Pilih repo `mrf-gpay`
4. Railway otomatis detect Node.js dan deploy
5. Klik **Settings** → **Domains** → **Generate Domain**
6. Anda dapat URL seperti: `https://mrf-gpay-production.up.railway.app`

### Step 4 — Akses
- Form (tim lapangan): `https://your-url.railway.app/form`
- Portal (Anda): `https://your-url.railway.app/`

> 💡 **Database**: Railway menyimpan file SQLite di volume persistent. Data tidak hilang walau server restart.

---

## 📁 Struktur Project

```
mrf-app/
├── src/
│   ├── server.js       ← Backend API (Express)
│   ├── database.js     ← SQLite schema & koneksi
│   └── export.js       ← Generate Excel MRF format
├── public/
│   ├── form.html       ← Form input merchant (mobile-friendly)
│   └── portal.html     ← Portal download & kelola data
├── data/               ← Database SQLite (dibuat otomatis)
│   └── mrf.db
├── package.json
└── README.md
```

---

## 🔗 API Endpoints

| Method | URL | Fungsi |
|--------|-----|--------|
| POST | `/api/submit` | Simpan data merchant baru |
| GET | `/api/submissions?status=pending` | Daftar submission (pending/downloaded/all) |
| GET | `/api/merchant/:id` | Detail lengkap satu merchant |
| GET | `/api/download/:id` | Download Excel 1 merchant, auto-mark downloaded |
| GET | `/api/download-batch` | Download semua pending sekaligus |
| DELETE | `/api/submissions/:id` | Hapus submission |
| GET | `/api/stats` | Statistik total/pending/downloaded |

---

## 📝 Field yang Ada di Form

### Info Legalitas
- Tipe Pengajuan (New Merchant / Adding Store)
- Tipe Kepemilikan (Individual / Business)
- Kategori 1, 2, 3
- Nama PIC, Nama Brand
- Jenis & Nomor Identitas, Nama Pemilik
- Alamat, Provinsi, Kode Pos Pemilik
- Kontak & Email Pemilik
- Kriteria Merchant (UMI/UKE/UME/UBE/URE), MDR

### Info Store
- Fullname Store, Store Code, Username
- Category MCC + Detail MCC (dropdown bertingkat)
- Location, Alamat, Provinsi, Kota, Kodepos Store
- PIC Store, Nomor & Email Notifikasi
- Bank, Nomor Rekening, Nama Rekening
- Latitude, Longitude
- Device Installation, Jumlah Device, Cetak QRIS, Dashboard

### Dokumen (link Google Drive)
- Individual: KTP, Selfie KTP, NPWP, Buku Tabungan, Logo
- Perusahaan: KTP pdf, Buku Tabungan pdf, NPWP pdf, Izin Usaha, TDP/NIB, Akta, SK Kemenkumham, Surat Kuasa, Logo

---

## ⚡ Tips Penggunaan

1. **Tim lapangan** bookmark link `/form` di HP masing-masing
2. **Setelah download** Excel, status otomatis berubah ke "Downloaded" — tidak muncul lagi di tab Pending
3. **Download Batch** — download semua submission pending sekaligus dalam 1 file Excel (tiap baris = 1 merchant)
4. **Tab "Semua"** di portal untuk lihat semua history termasuk yang sudah didownload
