import { getDb, jsonResponse, errorResponse, Env } from './_db';

export { onRequestOptions } from './_db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const marhalah = url.searchParams.get('marhalah');
    const kampus = url.searchParams.get('kampus');
    const santriId = url.searchParams.get('santriId');
    const jenisUjian = url.searchParams.get('jenisUjian');

    const sql = getDb(env);

    let rows;
    if (santriId && jenisUjian) {
      rows = await sql`
        SELECT p.*, s.nama as santri_nama, s.nisn as santri_nisn, s.kelas as santri_kelas
        FROM tahfidz_penilaian p
        JOIN santri s ON s.id = p.santri_id
        WHERE p.santri_id = ${santriId} AND p.jenis_ujian = ${jenisUjian}
        ORDER BY p.updated_at DESC
      `;
    } else if (marhalah && kampus) {
      rows = await sql`
        SELECT p.*, s.nama as santri_nama, s.nisn as santri_nisn, s.kelas as santri_kelas
        FROM tahfidz_penilaian p
        JOIN santri s ON s.id = p.santri_id
        WHERE p.marhalah = ${marhalah} AND p.kampus = ${kampus}
        ORDER BY p.updated_at DESC
      `;
    } else {
      rows = await sql`
        SELECT p.*, s.nama as santri_nama, s.nisn as santri_nisn, s.kelas as santri_kelas
        FROM tahfidz_penilaian p
        JOIN santri s ON s.id = p.santri_id
        ORDER BY p.updated_at DESC
      `;
    }

    if (rows.length === 0) {
      return jsonResponse({ penilaian: [] });
    }

    const penilaianIds = rows.map(r => r.id);
    const soals = await sql`
      SELECT * FROM tahfidz_soal_detail 
      WHERE penilaian_id = ANY(${penilaianIds})
      ORDER BY nomor_soal ASC
    `;

    // Group soals by penilaian_id
    const soalMap = new Map<string, any[]>();
    for (const s of soals) {
      if (!soalMap.has(s.penilaian_id)) {
        soalMap.set(s.penilaian_id, []);
      }
      soalMap.get(s.penilaian_id)!.push({
        nomorSoal: s.nomor_soal,
        juzLabel: s.juz_label,
        sb: s.sb,
        sk: s.sk,
        tahsin: s.tahsin,
        kbe: Number(s.kbe),
        nilaiDasar: Number(s.nilai_dasar),
        bonusTahsin: s.bonus_tahsin,
        nilaiAkhirSoal: Number(s.nilai_akhir_soal),
      });
    }

    const result = rows.map(r => ({
      id: r.id,
      santriId: r.santri_id,
      namaSantri: r.santri_nama,
      nisn: r.santri_nisn,
      kelas: r.kelas,
      marhalah: r.marhalah,
      kampus: r.kampus,
      jenisUjian: r.jenis_ujian,
      tahunAjaran: r.tahun_ajaran,
      semester: r.semester,
      selectedJuzList: r.selected_juz_list || [],
      jumlahJuz: r.jumlah_juz,
      totalSoal: r.total_soal,
      rataRata: Number(r.rata_rata),
      predikat: r.predikat,
      nilaiPerJuz: r.nilai_per_juz || [],
      status: r.status,
      pengujiNama: r.penguji_nama || 'Asatidz Penguji',
      updatedAt: new Date(r.updated_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      soal: soalMap.get(r.id) || [],
    }));

    return jsonResponse({ penilaian: result });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal mengambil data penilaian', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.json() as any;
    const sql = getDb(env);

    const id = data.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const selectedJuzJson = JSON.stringify(data.selectedJuzList || []);
    const nilaiPerJuzJson = JSON.stringify(data.nilaiPerJuz || []);

    // 1. Upsert penilaian
    await sql`
      INSERT INTO tahfidz_penilaian (
        id, santri_id, marhalah, kampus, kelas, jenis_ujian,
        tahun_ajaran, semester, selected_juz_list, jumlah_juz,
        total_soal, rata_rata, predikat, nilai_per_juz,
        status, penguji_nama, updated_at
      )
      VALUES (
        ${id},
        ${data.santriId},
        ${data.marhalah},
        ${data.kampus},
        ${data.kelas},
        ${data.jenisUjian},
        ${data.tahunAjaran || '2026/2027'},
        ${data.semester || 'Ganjil'},
        ${selectedJuzJson}::jsonb,
        ${data.jumlahJuz || 0},
        ${data.totalSoal || 10},
        ${data.rataRata || 0},
        ${data.predikat || 'Gagal'},
        ${nilaiPerJuzJson}::jsonb,
        ${data.status || 'DRAFT'},
        ${data.pengujiNama || 'Asatidz Penguji'},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (santri_id, jenis_ujian, tahun_ajaran, semester) DO UPDATE SET
        selected_juz_list = EXCLUDED.selected_juz_list,
        jumlah_juz = EXCLUDED.jumlah_juz,
        total_soal = EXCLUDED.total_soal,
        rata_rata = EXCLUDED.rata_rata,
        predikat = EXCLUDED.predikat,
        nilai_per_juz = EXCLUDED.nilai_per_juz,
        status = EXCLUDED.status,
        penguji_nama = EXCLUDED.penguji_nama,
        updated_at = CURRENT_TIMESTAMP
    `;

    // Fetch the target id (in case it was an update of an existing record)
    const active = await sql`
      SELECT id FROM tahfidz_penilaian 
      WHERE santri_id = ${data.santriId} AND jenis_ujian = ${data.jenisUjian}
      LIMIT 1
    `;
    const targetId = active[0]?.id || id;

    // 2. Refresh soal detail
    await sql`DELETE FROM tahfidz_soal_detail WHERE penilaian_id = ${targetId}`;

    if (Array.isArray(data.soal) && data.soal.length > 0) {
      for (const s of data.soal) {
        const sId = `sd_${targetId}_${s.nomorSoal}`;
        await sql`
          INSERT INTO tahfidz_soal_detail (
            id, penilaian_id, nomor_soal, juz_label,
            sb, sk, tahsin, kbe, nilai_dasar, bonus_tahsin, nilai_akhir_soal
          )
          VALUES (
            ${sId},
            ${targetId},
            ${s.nomorSoal},
            ${s.juzLabel || null},
            ${s.sb || 0},
            ${s.sk || 0},
            ${s.tahsin || 0},
            ${s.kbe || 0},
            ${s.nilaiDasar || 100},
            ${s.bonusTahsin || 0},
            ${s.nilaiAkhirSoal || 100}
          )
        `;
      }
    }

    return jsonResponse({
      success: true,
      id: targetId,
      message: data.status === 'DRAFT' ? 'Progress cicilan berhasil disimpan ke Neon' : 'Nilai ujian final berhasil disimpan ke Neon',
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menyimpan penilaian', 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('ID penilaian diperlukan', 400);

    const sql = getDb(env);
    await sql`DELETE FROM tahfidz_penilaian WHERE id = ${id}`;
    return jsonResponse({ success: true, message: 'Data penilaian berhasil dihapus' });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menghapus penilaian', 500);
  }
};

