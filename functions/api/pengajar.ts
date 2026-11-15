import { getDb, jsonResponse, errorResponse, Env } from './_db';

export { onRequestOptions } from './_db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const kampus = url.searchParams.get('kampus');
    const marhalah = url.searchParams.get('marhalah');

    const sql = getDb(env);

    let query;
    if (kampus && marhalah) {
      query = await sql`
        SELECT * FROM pengajar 
        WHERE (kampus = ${kampus} OR kampus = 'SEMUA')
          AND (marhalah = ${marhalah} OR marhalah = 'SEMUA')
          AND is_active = true
        ORDER BY nama ASC
      `;
    } else if (kampus) {
      query = await sql`
        SELECT * FROM pengajar 
        WHERE (kampus = ${kampus} OR kampus = 'SEMUA')
          AND is_active = true
        ORDER BY nama ASC
      `;
    } else {
      query = await sql`SELECT * FROM pengajar ORDER BY kampus ASC, nama ASC`;
    }

    return jsonResponse({
      pengajar: query.map(p => ({
        id: p.id,
        nama: p.nama,
        panggilan: p.panggilan,
        phone: p.phone,
        gender: p.gender,
        kampus: p.kampus,
        marhalah: p.marhalah,
        mapel: p.mapel,
        isActive: p.is_active,
      }))
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal mengambil data pengajar', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as any;
    const sql = getDb(env);

    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      let id = item.id;
      if (!id) {
        // Cek apakah pengajar dengan nama & kampus yang sama sudah ada agar tidak duplikat saat bulk import
        const existing = await sql`
          SELECT id FROM pengajar 
          WHERE LOWER(TRIM(nama)) = LOWER(TRIM(${item.nama})) 
            AND (kampus = ${item.kampus || 'BANIN'} OR kampus = 'SEMUA')
          LIMIT 1
        `;
        if (existing.length > 0) {
          id = existing[0].id;
        } else {
          id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
      }
      
      await sql`

        INSERT INTO pengajar (id, nama, panggilan, phone, gender, kampus, marhalah, mapel, is_active, updated_at)
        VALUES (
          ${id},
          ${item.nama},
          ${item.panggilan || item.nama},
          ${item.phone || null},
          ${item.gender || (item.kampus === 'BANAT' ? 'AKHWAT' : 'IKHWAN')},
          ${item.kampus || 'BANIN'},
          ${item.marhalah || 'SEMUA'},
          ${item.mapel || "Tahfidz Al-Qur'an"},
          ${item.isActive !== undefined ? item.isActive : true},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          nama = EXCLUDED.nama,
          panggilan = EXCLUDED.panggilan,
          phone = EXCLUDED.phone,
          gender = EXCLUDED.gender,
          kampus = EXCLUDED.kampus,
          marhalah = EXCLUDED.marhalah,
          mapel = EXCLUDED.mapel,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return jsonResponse({
      success: true,
      count: items.length,
      message: `${items.length} data pengajar berhasil disimpan`,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menyimpan data pengajar', 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('ID pengajar diperlukan', 400);

    const sql = getDb(env);
    await sql`DELETE FROM pengajar WHERE id = ${id}`;
    await sql`DELETE FROM tahfidz_penguji WHERE ref_id = ${id}`;
    return jsonResponse({ success: true, message: 'Data pengajar berhasil dihapus' });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menghapus data pengajar', 500);
  }
};

