const { neon } = require('@neondatabase/serverless');
// using node --env-file

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  console.log('--- Starting Migration ---');

  // 1. Table Santri
  await sql`
    CREATE TABLE IF NOT EXISTS santri (
      id VARCHAR(64) PRIMARY KEY,
      nisn VARCHAR(32) NOT NULL,
      nama VARCHAR(255) NOT NULL,
      marhalah VARCHAR(32) NOT NULL,
      kampus VARCHAR(32) NOT NULL,
      kelas VARCHAR(64) NOT NULL,
      halaqah VARCHAR(128),
      target_juz VARCHAR(128) DEFAULT 'Juz 30',
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_santri_unit ON santri(marhalah, kampus)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_santri_kelas ON santri(kelas)`;
  console.log('✓ Table santri ready');

  // 2. Table Pengajar
  await sql`
    CREATE TABLE IF NOT EXISTS pengajar (
      id VARCHAR(64) PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      panggilan VARCHAR(128),
      phone VARCHAR(32),
      gender VARCHAR(16) NOT NULL DEFAULT 'IKHWAN',
      kampus VARCHAR(32) NOT NULL DEFAULT 'BANIN',
      marhalah VARCHAR(32) NOT NULL DEFAULT 'SEMUA',
      mapel VARCHAR(128) DEFAULT 'Tahfidz Al-Quran',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✓ Table pengajar ready');

  // 3. Table Penugasan Penguji Ujian
  await sql`
    CREATE TABLE IF NOT EXISTS tahfidz_penguji (
      id VARCHAR(64) PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      tipe_asal VARCHAR(32) NOT NULL,
      ref_id VARCHAR(64),
      kampus VARCHAR(32) NOT NULL,
      marhalah VARCHAR(32) NOT NULL DEFAULT 'SEMUA',
      is_penguji_aktif BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✓ Table tahfidz_penguji ready');

  // 4. Table Penilaian Ujian
  await sql`
    CREATE TABLE IF NOT EXISTS tahfidz_penilaian (
      id VARCHAR(64) PRIMARY KEY,
      santri_id VARCHAR(64) NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
      marhalah VARCHAR(32) NOT NULL,
      kampus VARCHAR(32) NOT NULL,
      kelas VARCHAR(64) NOT NULL,
      jenis_ujian VARCHAR(16) NOT NULL,
      tahun_ajaran VARCHAR(32) DEFAULT '2026/2027',
      semester VARCHAR(16) DEFAULT 'Ganjil',
      selected_juz_list JSONB DEFAULT '[]'::jsonb,
      jumlah_juz INTEGER DEFAULT 0,
      total_soal INTEGER DEFAULT 10,
      rata_rata NUMERIC(5, 2) DEFAULT 0,
      predikat VARCHAR(64) DEFAULT 'Gagal',
      nilai_per_juz JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(32) DEFAULT 'DRAFT',
      penguji_id VARCHAR(64),
      penguji_nama VARCHAR(255),
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_santri_ujian UNIQUE(santri_id, jenis_ujian, tahun_ajaran, semester)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_penilaian_filter ON tahfidz_penilaian(marhalah, kampus, jenis_ujian)`;
  console.log('✓ Table tahfidz_penilaian ready');

  // 5. Table Detail Soal Penilaian
  await sql`
    CREATE TABLE IF NOT EXISTS tahfidz_soal_detail (
      id VARCHAR(64) PRIMARY KEY,
      penilaian_id VARCHAR(64) NOT NULL REFERENCES tahfidz_penilaian(id) ON DELETE CASCADE,
      nomor_soal INTEGER NOT NULL,
      juz_label VARCHAR(64),
      sb INTEGER DEFAULT 0,
      sk INTEGER DEFAULT 0,
      tahsin INTEGER DEFAULT 0,
      kbe NUMERIC(4, 2) DEFAULT 0,
      nilai_dasar NUMERIC(5, 2) DEFAULT 100,
      bonus_tahsin INTEGER DEFAULT 0,
      nilai_akhir_soal NUMERIC(5, 2) DEFAULT 100,
      CONSTRAINT uq_soal_nomor UNIQUE(penilaian_id, nomor_soal)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_soal_penilaian ON tahfidz_soal_detail(penilaian_id)`;
  console.log('✓ Table tahfidz_soal_detail ready');

  // Seed default santri jika santri kosong
  const santriCount = await sql`SELECT COUNT(*) as count FROM santri`;
  if (Number(santriCount[0]?.count) === 0) {
    const defaultSantri = [
      { id: 's_1', nisn: '0089123401', nama: 'Muhammad Fatih Al-Habsyi', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '7A Ula/MTs', halaqah: 'Halaqah Utsman bin Affan', target_juz: 'Juz 30, Juz 29' },
      { id: 's_2', nisn: '0089123402', nama: 'Ahmad Rayhan Pratama', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '7A Ula/MTs', halaqah: 'Halaqah Abu Bakar Ash-Shiddiq', target_juz: 'Juz 30, Juz 29, Juz 28' },
      { id: 's_3', nisn: '0089123403', nama: 'Zaidan Bilal Al-Ghafiqi', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '8A Ula/MTs', halaqah: 'Halaqah Ali bin Abi Thalib', target_juz: 'Juz 1, Juz 2, Juz 3' },
      { id: 's_4', nisn: '0089123404', nama: 'Fauzan Dzaki Ar-Rasyid', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '8A Ula/MTs', halaqah: 'Halaqah Umar bin Khattab', target_juz: 'Juz 28, Juz 29' },
      { id: 's_5', nisn: '0089123405', nama: 'Hamzah Ibnu Thufail', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '9A Ula/MTs', halaqah: 'Halaqah Thariq bin Ziyad', target_juz: 'Juz 1, Juz 2, Juz 3, Juz 4, Juz 5' },
      { id: 's_6', nisn: '0089123406', nama: 'Aisyah Humaira Putri', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '7B Ula/MTs', halaqah: 'Halaqah Sayyidah Khadijah', target_juz: 'Juz 30, Juz 29' },
      { id: 's_7', nisn: '0089123407', nama: 'Fatimah Az-Zahra Rahman', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '7B Ula/MTs', halaqah: 'Halaqah Sayyidah Fatimah', target_juz: 'Juz 30, Juz 29, Juz 28' },
      { id: 's_8', nisn: '0089123408', nama: 'Maryam Nabila Salsabila', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '8B Ula/MTs', halaqah: 'Halaqah Sayyidah Maryam', target_juz: 'Juz 1, Juz 2' },
      { id: 's_9', nisn: '0129123409', nama: 'Sulaiman Al-Farisi', marhalah: 'MI', kampus: 'BANIN', kelas: '5A MI', halaqah: 'Halaqah Anas bin Malik', target_juz: 'Juz 30' },
      { id: 's_10', nisn: '0129123410', nama: 'Ibrahim Khalilurrahman', marhalah: 'MI', kampus: 'BANIN', kelas: '5A MI', halaqah: 'Halaqah Abdullah bin Umar', target_juz: 'Juz 30, Juz 29' },
      { id: 's_11', nisn: '0129123411', nama: 'Umar Khalid Wijaya', marhalah: 'MI', kampus: 'BANIN', kelas: '6A MI', halaqah: 'Halaqah Khalid bin Walid', target_juz: 'Juz 29, Juz 28' },
      { id: 's_12', nisn: '0129123412', nama: 'Hafshah Nur Azizah', marhalah: 'MI', kampus: 'BANAT', kelas: '5B MI', halaqah: 'Halaqah Ummu Salamah', target_juz: 'Juz 30' },
      { id: 's_13', nisn: '0129123413', nama: 'Ruqayyah Athiyyah', marhalah: 'MI', kampus: 'BANAT', kelas: '6B MI', halaqah: 'Halaqah Asma binti Abi Bakar', target_juz: 'Juz 30, Juz 29' },
    ];
    for (const s of defaultSantri) {
      await sql`
        INSERT INTO santri (id, nisn, nama, marhalah, kampus, kelas, halaqah, target_juz)
        VALUES (${s.id}, ${s.nisn}, ${s.nama}, ${s.marhalah}, ${s.kampus}, ${s.kelas}, ${s.halaqah}, ${s.target_juz})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✓ Seeded default santri');
  }

  // Seed default pengajar jika kosong
  const pengajarCount = await sql`SELECT COUNT(*) as count FROM pengajar`;
  if (Number(pengajarCount[0]?.count) === 0) {
    const defaultPengajar = [
      { id: 'p_1', nama: 'Ust. Ahmad Fauzi, Lc.', panggilan: 'Ust. Fauzi', phone: '081234567890', gender: 'IKHWAN', kampus: 'BANIN', marhalah: 'ULA_MTS', mapel: 'Tahfidz Al-Quran' },
      { id: 'p_2', nama: 'Ust. Ridwan Kamil, S.Pd.I.', panggilan: 'Ust. Ridwan', phone: '081234567891', gender: 'IKHWAN', kampus: 'BANIN', marhalah: 'ULA_MTS', mapel: 'Tahfidz Al-Quran' },
      { id: 'p_3', nama: 'Usth. Sarah Mutmainnah, S.Ag.', panggilan: 'Usth. Sarah', phone: '081234567892', gender: 'AKHWAT', kampus: 'BANAT', marhalah: 'ULA_MTS', mapel: 'Tahfidz Al-Quran' },
      { id: 'p_4', nama: 'Ust. Muhammad Zaki, Al-Hafidz', panggilan: 'Ust. Zaki', phone: '081234567893', gender: 'IKHWAN', kampus: 'BANIN', marhalah: 'MI', mapel: 'Tahfidz Al-Quran' },
      { id: 'p_5', nama: 'Usth. Fatimah Az-Zahra, S.Pd.', panggilan: 'Usth. Zahra', phone: '081234567894', gender: 'AKHWAT', kampus: 'BANAT', marhalah: 'MI', mapel: 'Tahfidz Al-Quran' },
    ];
    for (const p of defaultPengajar) {
      await sql`
        INSERT INTO pengajar (id, nama, panggilan, phone, gender, kampus, marhalah, mapel)
        VALUES (${p.id}, ${p.nama}, ${p.panggilan}, ${p.phone}, ${p.gender}, ${p.kampus}, ${p.marhalah}, ${p.mapel})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✓ Seeded default pengajar');
  }

  // Seed default penguji jika kosong
  const pengujiCount = await sql`SELECT COUNT(*) as count FROM tahfidz_penguji`;
  if (Number(pengujiCount[0]?.count) === 0) {
    const defaultPenguji = [
      { id: 'tp_1', nama: 'Ust. Ahmad Fauzi, Lc.', tipe_asal: 'PENGAJAR', ref_id: 'p_1', kampus: 'BANIN', marhalah: 'ULA_MTS' },
      { id: 'tp_2', nama: 'Ust. Ridwan Kamil, S.Pd.I.', tipe_asal: 'PENGAJAR', ref_id: 'p_2', kampus: 'BANIN', marhalah: 'ULA_MTS' },
      { id: 'tp_3', nama: 'Usth. Sarah Mutmainnah, S.Ag.', tipe_asal: 'PENGAJAR', ref_id: 'p_3', kampus: 'BANAT', marhalah: 'ULA_MTS' },
      { id: 'tp_4', nama: 'Ust. Muhammad Zaki, Al-Hafidz', tipe_asal: 'PENGAJAR', ref_id: 'p_4', kampus: 'BANIN', marhalah: 'MI' },
      { id: 'tp_5', nama: 'Usth. Fatimah Az-Zahra, S.Pd.', tipe_asal: 'PENGAJAR', ref_id: 'p_5', kampus: 'BANAT', marhalah: 'MI' },
    ];
    for (const pj of defaultPenguji) {
      await sql`
        INSERT INTO tahfidz_penguji (id, nama, tipe_asal, ref_id, kampus, marhalah)
        VALUES (${pj.id}, ${pj.nama}, ${pj.tipe_asal}, ${pj.ref_id}, ${pj.kampus}, ${pj.marhalah})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✓ Seeded default penguji');
  }

  console.log('--- ALL TABLES AND SEED DATA SUCCESSFULLY CREATED! ---');
}

migrate().catch(e => {
  console.error('Migration Error:', e);
  process.exit(1);
});
