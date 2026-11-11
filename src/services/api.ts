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

export const api = {
  // 1. Data Santri
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

  // 2. Data Pengajar
  async getPengajar(kampus?: Kampus, marhalah?: Marhalah): Promise<PengajarItem[]> {
    try {
      const params = new URLSearchParams();
      if (kampus) params.append('kampus', kampus);
      if (marhalah) params.append('marhalah', marhalah);

      const res = await fetch(`/api/pengajar?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch pengajar');
      const data = await res.json();
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
      if (!res.ok) throw new Error('Failed to save pengajar');
      return await res.json();
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
      if (!res.ok) throw new Error('Failed to fetch penguji');
      const data = await res.json();
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
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
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
      if (!res.ok) throw new Error('Failed to update penguji status');
      return await res.json();
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
      if (!res.ok) throw new Error('Failed to fetch penilaian');
      const data = await res.json();
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
      if (!res.ok) throw new Error('Failed to save penilaian');
      return await res.json();
    } catch (err) {
      console.error('API savePenilaian error:', err);
      throw err;
    }
  }
};
