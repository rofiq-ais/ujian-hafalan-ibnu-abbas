import { getDb, jsonResponse, errorResponse, Env } from './_db';

export { onRequestOptions } from './_db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const marhalah = url.searchParams.get('marhalah');
    const kampus = url.searchParams.get('kampus');
    const search = url.searchParams.get('search');

    const sql = getDb(env);

    let query;
    if (marhalah && kampus) {
      if (search) {
        query = await sql`
          SELECT * FROM santri 
          WHERE marhalah = ${marhalah} AND kampus = ${kampus}
            AND (nama ILIKE ${'%' + search + '%'} OR nisn ILIKE ${'%' + search + '%'} OR kelas ILIKE ${'%' + search + '%'})
          ORDER BY kelas ASC, nama ASC
        `;
      } else {
        query = await sql`
          SELECT * FROM santri 
          WHERE marhalah = ${marhalah} AND kampus = ${kampus}
          ORDER BY kelas ASC, nama ASC
        `;
      }
    } else {
      query = await sql`SELECT * FROM santri ORDER BY marhalah ASC, kelas ASC, nama ASC`;
    }

    // Map to frontend interface format
    const santriList = query.map(s => ({
      id: s.id,
      nisn: s.nisn,
      nama: s.nama,
      marhalah: s.marhalah,
      kampus: s.kampus,
      kelas: s.kelas,
      halaqah: s.halaqah,
      targetJuz: s.target_juz,
    }));

    return jsonResponse({ santri: santriList });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal mengambil data santri', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as any;
    const sql = getDb(env);

    // Support single santri or bulk array
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      const id = item.id || `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await sql`
        INSERT INTO santri (id, nisn, nama, marhalah, kampus, kelas, halaqah, target_juz, updated_at)
        VALUES (
          ${id},
          ${item.nisn || '-'},
          ${item.nama},
          ${item.marhalah},
          ${item.kampus},
          ${item.kelas},
          ${item.halaqah || 'Umum'},
          ${item.targetJuz || item.target_juz || 'Juz 30'},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          nisn = EXCLUDED.nisn,
          nama = EXCLUDED.nama,
          kelas = EXCLUDED.kelas,
          halaqah = EXCLUDED.halaqah,
          target_juz = EXCLUDED.target_juz,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return jsonResponse({ success: true, count: items.length });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menyimpan data santri', 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('ID santri diperlukan', 400);

    const sql = getDb(env);
    await sql`DELETE FROM santri WHERE id = ${id}`;
    return jsonResponse({ success: true, message: 'Data santri berhasil dihapus' });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menghapus data santri', 500);
  }
};

