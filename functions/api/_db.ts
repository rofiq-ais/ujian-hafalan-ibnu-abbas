import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL: string;
}

export function getDb(env?: Env) {
  let url = env?.DATABASE_URL || (typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined);
  if (!url) {
    throw new Error('DATABASE_URL belum terpasang di Cloudflare Pages Environment Variables. Silakan atur DATABASE_URL di Settings > Variables and Secrets lalu klik Redeploy.');
  }
  // Bersihkan kutip ganda atau spasi yang tidak sengaja terbawa saat copy-paste
  url = url.trim().replace(/^["']|["']$/g, '');
  return neon(url);
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

/**
 * Migration & Sanity DDL for Tahfidz System
 */
export async function ensureTahfidzTables(sql: any) {
  try {
    // 1. Table Santri
    await sql`
      CREATE TABLE IF NOT EXISTS santri (
        id VARCHAR(64) PRIMARY KEY,
        nisn VARCHAR(32) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        marhalah VARCHAR(32) NOT NULL, -- 'MI', 'ULA_MTS'
        kampus VARCHAR(32) NOT NULL,   -- 'BANIN', 'BANAT'
        kelas VARCHAR(64) NOT NULL,    -- '7A Ula/MTs', '5A MI', etc.
        halaqah VARCHAR(128),
        target_juz VARCHAR(128) DEFAULT 'Juz 30',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_santri_unit ON santri(marhalah, kampus)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_santri_kelas ON santri(kelas)`;

    // 2. Table Pengajar (Guru / Asatidz yang bukan musyrif atau umum)
    await sql`
      CREATE TABLE IF NOT EXISTS pengajar (
        id VARCHAR(64) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        panggilan VARCHAR(128),
        phone VARCHAR(32),
        gender VARCHAR(16) NOT NULL DEFAULT 'IKHWAN', -- 'IKHWAN' (Banin), 'AKHWAT' (Banat)
        kampus VARCHAR(32) NOT NULL DEFAULT 'BANIN',   -- 'BANIN', 'BANAT'
        marhalah VARCHAR(32) NOT NULL DEFAULT 'SEMUA', -- 'MI', 'ULA_MTS', 'SEMUA'
        mapel VARCHAR(128) DEFAULT 'Tahfidz Al-Qur''an',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Table Penugasan Penguji Ujian (Assigning Musyrif / Pengajar as Examiners)
    await sql`
      CREATE TABLE IF NOT EXISTS tahfidz_penguji (
        id VARCHAR(64) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        tipe_asal VARCHAR(32) NOT NULL, -- 'MUSYRIF' atau 'PENGAJAR'
        ref_id VARCHAR(64),            -- ID musyrif atau pengajar
        kampus VARCHAR(32) NOT NULL,    -- 'BANIN', 'BANAT'
        marhalah VARCHAR(32) NOT NULL DEFAULT 'SEMUA', -- 'MI', 'ULA_MTS', 'SEMUA'
        is_penguji_aktif BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Table Penilaian Ujian
    await sql`
      CREATE TABLE IF NOT EXISTS tahfidz_penilaian (
        id VARCHAR(64) PRIMARY KEY,
        santri_id VARCHAR(64) NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        marhalah VARCHAR(32) NOT NULL,
        kampus VARCHAR(32) NOT NULL,
        kelas VARCHAR(64) NOT NULL,
        jenis_ujian VARCHAR(16) NOT NULL, -- 'UTS', 'UAS'
        tahun_ajaran VARCHAR(32) DEFAULT '2026/2027',
        semester VARCHAR(16) DEFAULT 'Ganjil',
        selected_juz_list JSONB DEFAULT '[]'::jsonb,
        jumlah_juz INTEGER DEFAULT 0,
        total_soal INTEGER DEFAULT 10,
        rata_rata NUMERIC(5, 2) DEFAULT 0,
        predikat VARCHAR(64) DEFAULT 'Gagal',
        nilai_per_juz JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(32) DEFAULT 'DRAFT', -- 'DRAFT' (cicilan) | 'SELESAI'
        penguji_id VARCHAR(64),
        penguji_nama VARCHAR(255),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_santri_ujian UNIQUE(santri_id, jenis_ujian, tahun_ajaran, semester)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_penilaian_filter ON tahfidz_penilaian(marhalah, kampus, jenis_ujian)`;

    // 3. Table Detail Soal Penilaian
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

    // Seed santri awal jika masih kosong
    const santriCount = await sql`SELECT COUNT(*) as count FROM santri`;
    if (Number(santriCount[0]?.count) === 0) {
      const defaultSantri = [
        // Ula / MTs Banin
        { id: 's_1', nisn: '0089123401', nama: 'Muhammad Fatih Al-Habsyi', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '7A Ula/MTs', halaqah: 'Halaqah Utsman bin Affan', target_juz: 'Juz 30, Juz 29' },
        { id: 's_2', nisn: '0089123402', nama: 'Ahmad Rayhan Pratama', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '7A Ula/MTs', halaqah: 'Halaqah Abu Bakar Ash-Shiddiq', target_juz: 'Juz 30, Juz 29, Juz 28' },
        { id: 's_3', nisn: '0089123403', nama: 'Zaidan Bilal Al-Ghafiqi', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '8A Ula/MTs', halaqah: 'Halaqah Ali bin Abi Thalib', target_juz: 'Juz 1, Juz 2, Juz 3' },
        { id: 's_4', nisn: '0089123404', nama: 'Fauzan Dzaki Ar-Rasyid', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '8A Ula/MTs', halaqah: 'Halaqah Umar bin Khattab', target_juz: 'Juz 28, Juz 29' },
        { id: 's_5', nisn: '0089123405', nama: 'Hamzah Ibnu Thufail', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '9A Ula/MTs', halaqah: 'Halaqah Thariq bin Ziyad', target_juz: 'Juz 1, Juz 2, Juz 3, Juz 4, Juz 5' },
        
        // Ula / MTs Banat
        { id: 's_6', nisn: '0089123406', nama: 'Aisyah Humaira Putri', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '7B Ula/MTs', halaqah: 'Halaqah Sayyidah Khadijah', target_juz: 'Juz 30, Juz 29' },
        { id: 's_7', nisn: '0089123407', nama: 'Fatimah Az-Zahra Rahman', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '7B Ula/MTs', halaqah: 'Halaqah Sayyidah Fatimah', target_juz: 'Juz 30, Juz 29, Juz 28' },
        { id: 's_8', nisn: '0089123408', nama: 'Maryam Nabila Salsabila', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '8B Ula/MTs', halaqah: 'Halaqah Sayyidah Maryam', target_juz: 'Juz 1, Juz 2' },

        // MI Banin
        { id: 's_9', nisn: '0129123409', nama: 'Sulaiman Al-Farisi', marhalah: 'MI', kampus: 'BANIN', kelas: '5A MI', halaqah: 'Halaqah Anas bin Malik', target_juz: 'Juz 30' },
        { id: 's_10', nisn: '0129123410', nama: 'Ibrahim Khalilurrahman', marhalah: 'MI', kampus: 'BANIN', kelas: '5A MI', halaqah: 'Halaqah Abdullah bin Umar', target_juz: 'Juz 30, Juz 29' },
        { id: 's_11', nisn: '0129123411', nama: 'Umar Khalid Wijaya', marhalah: 'MI', kampus: 'BANIN', kelas: '6A MI', halaqah: 'Halaqah Khalid bin Walid', target_juz: 'Juz 29, Juz 28' },

        // MI Banat
        { id: 's_12', nisn: '0129123412', nama: 'Hafshah Nur Azizah', marhalah: 'MI', kampus: 'BANAT', kelas: '5B MI', halaqah: 'Halaqah Ummu Salamah', target_juz: 'Juz 30' },
        { id: 's_13', nisn: '0129123413', nama: 'Ruqayyah Athiyyah', marhalah: 'MI', kampus: 'BANAT', kelas: '6B MI', halaqah: 'Halaqah Asma binti Abi Bakar', target_juz: 'Juz 30, Juz 29' },
      ];

      for (const s of defaultSantri) {
        await sql`
          INSERT INTO santri (id, nisn, nama, marhalah, kampus, kelas, halaqah, target_juz)
          VALUES (${s.id}, ${s.nisn}, ${s.nama}, ${s.marhalah}, ${s.kampus}, ${s.kelas}, ${s.halaqah}, ${s.target_juz})
        `;
      }
    }
  } catch (err) {
    console.error('ensureTahfidzTables error:', err);
  }
}
