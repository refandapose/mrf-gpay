/**
 * Script import data seed ke database (PostgreSQL atau JSON)
 * Jalankan setelah read-excel.js menghasilkan data/seed.json
 * 
 * Lokal (JSON): node scripts/import-seed.js
 * Railway (PostgreSQL): DATABASE_URL=xxx node scripts/import-seed.js
 */
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'data', 'seed.json');

if (!fs.existsSync(seedPath)) {
  console.error('❌ File seed.json tidak ditemukan. Jalankan dulu: npm run read-excel');
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const merchants = seed.merchants || [];
console.log(`📦 Siap import ${merchants.length} merchants...`);

// Load db adapter
const db = require('../src/database');

async function main() {
  await db.init();
  await db.bulkInsert(merchants);
  console.log(`✅ Berhasil import ${merchants.length} merchants ke database!`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
