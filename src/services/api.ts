import { Santri, PenilaianRecord, Marhalah, Kampus, JenisUjian } from '../types';
import { MOCK_SANTRI, MOCK_PENILAIAN } from '../data/mockData';

export interface PengujiItem {
  id: string;
  refId?: string;
  nama: string;
  panggilan?: string;
  tipeAsal?: 'MUSYRIF' | 'PENGAJAR';
  kampus?: Kampus;
  marhalah?: string;
  isPengujiAktif?: boolean;
  keterangan?: string;
  role?: string;
}

export interface PengajarItem {
  id: string;
  nama: string;
  panggilan?: string;
  phone?: string;
  gender: 'IKHWAN' | 'AKHWAT';
  kampus: Kampus;
  marhalah: string;
  mapel: string;
  isActive: boolean;
}

async function handleResponse<T>(res: Response, defaultError: string): Promise<T> {
  if (!res.ok) {
    let msg = defaultError;
    try {
      const data = await res.json();
      if (data && data.error) {
        msg = data.error;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) msg = text.slice(0, 200);
      } catch {
        // ignore
      }
    }
    throw new Error(msg);
  }
  return await res.json();
}

export const api = {
  // 1. Data Santri
  async getSantri(marhalah?: Marhalah, kampus?: Kampus): Promise<Santri[]> {
    try {
      const params = new URLSearchParams();
      if (marhalah) params.append('marhalah', marhalah);
      if (kampus) params.append('kampus', kampus);

      const res = await fetch(`/api/santri?${params.toString()}`);
      const data = await handleResponse<{ santri: Santri[] }>(res, 'Gagal mengambil data santri');
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

  async saveSantri(items: Partial<Santri>[] | Partial<Santri>): Promise<{ success: boolean; count?: number }> {
    try {
      const res = await fetch('/api/santri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      return await handleResponse<{ success: boolean; count?: number }>(res, 'Gagal menyimpan data santri');
    } catch (err) {
      console.error('API saveSantri error:', err);
      throw err;
    }
  },

  // 2. Data Pengajar
  async getPengajar(kampus?: Kampus, marhalah?: Marhalah): Promise<PengajarItem[]> {
    try {
      const params = new URLSearchParams();
      if (kampus) params.append('kampus', kampus);
      if (marhalah) params.append('marhalah', marhalah);

      const res = await fetch(`/api/pengajar?${params.toString()}`);
      const data = await handleResponse<{ pengajar: PengajarItem[] }>(res, 'Gagal mengambil data pengajar');
      return data.pengajar || [];
    } catch (err) {
      console.warn('API getPengajar error:', err);
      return [];
    }
  },

  async savePengajar(data: Partial<PengajarItem>): Promise<{ success: boolean; id?: string }> {
    try {
      const res = await fetch('/api/pengajar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<{ success: boolean; id?: string }>(res, 'Gagal menyimpan data pengajar');
    } catch (err) {
      console.error('API savePengajar error:', err);
      throw err;
    }
  },

  // 3. Penguji & Kandidat Setting
  async getPenguji(kampus?: Kampus, marhalah?: Marhalah): Promise<PengujiItem[]> {
    try {
      const params = new URLSearchParams();
      if (kampus) params.append('kampus', kampus);
      if (marhalah) params.append('marhalah', marhalah);

      const res = await fetch(`/api/penguji?${params.toString()}`);
      const data = await handleResponse<{ penguji: PengujiItem[] }>(res, 'Gagal mengambil daftar penguji');
      return data.penguji || [];
    } catch (err) {
      console.warn('API getPenguji error, using fallback:', err);
      return [
        { id: '1', nama: 'Ust. Ahmad Fauzi, Lc.', role: 'PENGUJI' },
        { id: '2', nama: 'Ust. Nurul Huda, S.Pd.I.', role: 'PENGUJI' },
      ];
    }
  },

  async getKandidatPenguji(): Promise<PengujiItem[]> {
    try {
      const res = await fetch('/api/penguji?forSettings=true');
      const data = await handleResponse<{ kandidat: PengujiItem[] }>(res, 'Gagal mengambil kandidat penguji');
      return data.kandidat || [];
    } catch (err) {
      console.warn('API getKandidatPenguji error:', err);
      return [];
    }
  },

  async setPengujiStatus(item: {
    refId: string;
    nama: string;
    tipeAsal: 'MUSYRIF' | 'PENGAJAR';
    kampus: Kampus;
    marhalah?: string;
    isPengujiAktif: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/penguji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return await handleResponse<{ success: boolean; message: string }>(res, 'Gagal memperbarui status penguji');
    } catch (err) {
      console.error('API setPengujiStatus error:', err);
      throw err;
    }
  },

  // 4. Riwayat & Simpan Penilaian
  async getPenilaian(marhalah?: Marhalah, kampus?: Kampus, santriId?: string, jenisUjian?: JenisUjian): Promise<PenilaianRecord[]> {
    try {
      const params = new URLSearchParams();
      if (marhalah) params.append('marhalah', marhalah);
      if (kampus) params.append('kampus', kampus);
      if (santriId) params.append('santriId', santriId);
      if (jenisUjian) params.append('jenisUjian', jenisUjian);

      const res = await fetch(`/api/penilaian?${params.toString()}`);
      const data = await handleResponse<{ penilaian: PenilaianRecord[] }>(res, 'Gagal mengambil riwayat penilaian');
      return data.penilaian || [];
    } catch (err) {
      console.warn('API getPenilaian error, using local fallback:', err);
      return MOCK_PENILAIAN;
    }
  },

  async savePenilaian(record: PenilaianRecord): Promise<{ success: boolean; id: string; message: string }> {
    try {
      const res = await fetch('/api/penilaian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return await handleResponse<{ success: boolean; id: string; message: string }>(res, 'Gagal menyimpan penilaian');
    } catch (err) {
      console.error('API savePenilaian error:', err);
      throw err;
    }
  }
};
