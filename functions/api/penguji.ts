import { getDb, jsonResponse, errorResponse, Env } from './_db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const kampus = url.searchParams.get('kampus');
    const marhalah = url.searchParams.get('marhalah');
    const forSettings = url.searchParams.get('forSettings') === 'true';

    const sql = getDb(env);

    // 1. Ambil daftar penguji yang sudah di-assign di tabel tahfidz_penguji
    const assignedRows = await sql`
      SELECT * FROM tahfidz_penguji 
      ORDER BY nama ASC
    `;

    // 2. Ambil data Musyrif (dari tabel musyrif yang ada)
    const musyrifList = await sql`
      SELECT id, name, nickname, role, phone 
      FROM musyrif 
      WHERE "isActive" = true 
      ORDER BY name ASC
    `;

    // 3. Ambil data Pengajar (dari tabel pengajar)
    const pengajarList = await sql`
      SELECT * FROM pengajar 
      WHERE is_active = true 
      ORDER BY nama ASC
    `;

    // Gabungkan kandidat musyrif dan pengajar
    const assignedMap = new Map<string, any>();
    for (const a of assignedRows) {
      assignedMap.set(`${a.tipe_asal}_${a.ref_id}`, a);
    }

    const kandidat: any[] = [];

    // Format Musyrif
    for (const m of musyrifList) {
      const key = `MUSYRIF_${m.id}`;
      const assigned = assignedMap.get(key);
      kandidat.push({
        id: `m_${m.id}`,
        refId: m.id,
        nama: m.name,
        panggilan: m.nickname,
        tipeAsal: 'MUSYRIF',
        kampus: assigned ? assigned.kampus : 'BANIN', // Default musyrif saat ini Banin
        marhalah: assigned ? assigned.marhalah : 'SEMUA',
        isPengujiAktif: assigned ? assigned.is_penguji_aktif : false,
        keterangan: 'Musyrif Asrama',
      });
    }

    // Format Pengajar
    for (const p of pengajarList) {
      const key = `PENGAJAR_${p.id}`;
      const assigned = assignedMap.get(key);
      kandidat.push({
        id: `p_${p.id}`,
        refId: p.id,
        nama: p.nama,
        panggilan: p.panggilan,
        tipeAsal: 'PENGAJAR',
        kampus: assigned ? assigned.kampus : p.kampus,
        marhalah: assigned ? assigned.marhalah : p.marhalah,
        isPengujiAktif: assigned ? assigned.is_penguji_aktif : (p.is_active && !assignedMap.has(key)),
        keterangan: `Pengajar ${p.mapel || ''}`,
      });
    }

    // Jika dipanggil untuk form ujian (bukan halaman setting admin),
    // kembalikan penguji yang aktif dan sesuai kampus
    let activePenguji = kandidat.filter(k => k.isPengujiAktif);

    if (kampus) {
      activePenguji = activePenguji.filter(k => k.kampus === kampus || k.kampus === 'SEMUA');
    }
    if (marhalah) {
      activePenguji = activePenguji.filter(k => k.marhalah === marhalah || k.marhalah === 'SEMUA');
    }

    // Jika belum ada penguji aktif yang di-setting sama sekali, beri fallback dari semua musyrif & pengajar yang sesuai
    if (activePenguji.length === 0) {
      activePenguji = kandidat.filter(k => !kampus || k.kampus === kampus || k.kampus === 'SEMUA');
    }

    return jsonResponse({
      penguji: activePenguji,
      kandidat: forSettings ? kandidat : undefined,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal mengambil data penguji', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as any;
    const sql = getDb(env);

    // Body: { refId, nama, tipeAsal, kampus, marhalah, isPengujiAktif }
    const id = `tp_${body.tipeAsal.toLowerCase()}_${body.refId}`;

    await sql`
      INSERT INTO tahfidz_penguji (
        id, nama, tipe_asal, ref_id, kampus, marhalah, is_penguji_aktif, created_at
      )
      VALUES (
        ${id},
        ${body.nama},
        ${body.tipeAsal},
        ${body.refId},
        ${body.kampus || 'BANIN'},
        ${body.marhalah || 'SEMUA'},
        ${body.isPengujiAktif},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        kampus = EXCLUDED.kampus,
        marhalah = EXCLUDED.marhalah,
        is_penguji_aktif = EXCLUDED.is_penguji_aktif
    `;

    return jsonResponse({ success: true, message: 'Status penugasan penguji berhasil diperbarui' });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal memperbarui status penguji', 500);
  }
};
