// generate_secure_data.js
// --------------------------------------------------
// Split the master `data/database.json` into per‑student files.
// Each file is named with the SHA‑256 hash of the
// `no_peserta` value (the participant number).
// --------------------------------------------------

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to the master database (array of student objects)
const DB_PATH = path.join(__dirname, 'data', 'database.json');
// Output directory (same folder as the database)
const OUT_DIR = path.join(__dirname, 'data');

// Helper: compute SHA‑256 hash and return hex string
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function main() {
  // Load the master JSON file
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ database.json not found at', DB_PATH);
    process.exit(1);
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  let records;
  try {
    records = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse database.json:', e.message);
    process.exit(1);
  }

  console.log(`🚀 Processing ${records.length} student record(s)...`);

  for (const rec of records) {
    const participant = rec.no_peserta;
    if (!participant) continue;
    const fileName = `${hash(participant)}.json`;
    const outPath = path.join(OUT_DIR, fileName);
    // Write pretty‑printed JSON (2‑space indentation)
    fs.writeFileSync(outPath, JSON.stringify(rec, null, 2), 'utf8');
    console.log(`✅ Saved: ${fileName} (No. Peserta: ${participant})`);
  }

  console.log('✅ All files written to ./data/');
}

main();
