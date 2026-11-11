import { Santri, PenilaianRecord, Marhalah, Kampus, JenisUjian } from '../types';
import { MOCK_SANTRI, MOCK_PENILAIAN } from '../data/mockData';

export interface PengujiItem {
  id: string;
  nama: string;
  panggilan?: string;
  role: string;
}

export const api = {
  // 1. Ambil data santri
  async getSantri(marhalah?: Marhalah, kampus?: Kampus): Promise<Santri[]> {
    try {
      const params = new URLSearchParams();
      if (marhalah) params.append('marhalah', marhalah);
      if (kampus) params.append('kampus', kampus);

      const res = await fetch(`/api/santri?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch santri');
      const data = await res.json();
      return data.santri || [];
    } catch (err) {
      console.warn('API getSantri error, using local fallback:', err);
      let list = MOCK_SANTRI;
      if (marhalah && kampus) {
        list = list.filter(s => s.marhalah === marhalah && s.kampus === kampus);
      }
      return list;
    }
  },

  // 2. Tambah / Import Santri
  async saveSantri(items: Partial<Santri>[] | Partial<Santri>): Promise<{ success: boolean; count?: number }> {
    try {
      const res = await fetch('/api/santri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error('Failed to save santri');
      return await res.json();
    } catch (err) {
      console.error('API saveSantri error:', err);
      throw err;
    }
  },

  // 3. Ambil data penguji dari tabel musyrif
  async getPenguji(): Promise<PengujiItem[]> {
    try {
      const res = await fetch('/api/penguji');
      if (!res.ok) throw new Error('Failed to fetch penguji');
      const data = await res.json();
      return data.penguji || [];
    } catch (err) {
      console.warn('API getPenguji error, using fallback:', err);
      return [
        { id: '1', nama: 'Ust. Ahmad Fauzi, Lc.', role: 'PENGUJI' },
        { id: '2', nama: 'Ust. Nurul Huda, S.Pd.I.', role: 'PENGUJI' },
        { id: '3', nama: 'Ust. Ridwan Kamil, S.Th.I.', role: 'PENGUJI' },
        { id: '4', nama: 'Usth. Maryam, S.Ag.', role: 'PENGUJI' },
      ];
    }
  },

  // 4. Ambil riwayat penilaian
  async getPenilaian(marhalah?: Marhalah, kampus?: Kampus, santriId?: string, jenisUjian?: JenisUjian): Promise<PenilaianRecord[]> {
    try {
      const params = new URLSearchParams();
      if (marhalah) params.append('marhalah', marhalah);
      if (kampus) params.append('kampus', kampus);
      if (santriId) params.append('santriId', santriId);
      if (jenisUjian) params.append('jenisUjian', jenisUjian);

      const res = await fetch(`/api/penilaian?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch penilaian');
      const data = await res.json();
      return data.penilaian || [];
    } catch (err) {
      console.warn('API getPenilaian error, using local fallback:', err);
      return MOCK_PENILAIAN;
    }
  },

  // 5. Simpan penilaian (Draft cicilan atau Selesai)
  async savePenilaian(record: PenilaianRecord): Promise<{ success: boolean; id: string; message: string }> {
    try {
      const res = await fetch('/api/penilaian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error('Failed to save penilaian');
      return await res.json();
    } catch (err) {
      console.error('API savePenilaian error:', err);
      throw err;
    }
  }
};
