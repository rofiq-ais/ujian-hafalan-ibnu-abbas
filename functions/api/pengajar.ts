import { getDb, jsonResponse, errorResponse, Env } from './_db';

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

    const id = body.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    await sql`
      INSERT INTO pengajar (id, nama, panggilan, phone, gender, kampus, marhalah, mapel, is_active, updated_at)
      VALUES (
        ${id},
        ${body.nama},
        ${body.panggilan || body.nama},
        ${body.phone || null},
        ${body.gender || (body.kampus === 'BANAT' ? 'AKHWAT' : 'IKHWAN')},
        ${body.kampus || 'BANIN'},
        ${body.marhalah || 'SEMUA'},
        ${body.mapel || "Tahfidz Al-Qur'an"},
        ${body.isActive !== undefined ? body.isActive : true},
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

    return jsonResponse({ success: true, id, message: 'Data pengajar berhasil disimpan' });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal menyimpan data pengajar', 500);
  }
};
