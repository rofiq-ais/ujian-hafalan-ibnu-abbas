import { getDb, jsonResponse, errorResponse, Env } from './_db';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const sql = getDb(env);
    const list = await sql`
      SELECT id, name, nickname, role, phone 
      FROM musyrif 
      WHERE "isActive" = true 
      ORDER BY name ASC
    `;

    return jsonResponse({
      penguji: list.map(m => ({
        id: m.id,
        nama: m.name,
        panggilan: m.nickname,
        role: m.role,
      }))
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Gagal mengambil data penguji', 500);
  }
};
