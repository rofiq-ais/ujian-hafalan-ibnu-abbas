export type Marhalah = 'MI' | 'ULA_MTS';
export type Kampus = 'BANIN' | 'BANAT';
export type JenisUjian = 'UTS' | 'UAS';

export type Predikat = 'Gagal' | 'Cukup' | 'Baik' | 'Sangat Baik' | 'Sempurna';

export interface Santri {
  id: string;
  nisn: string;
  nama: string;
  marhalah: Marhalah;
  kampus: Kampus;
  kelas: string;
  halaqah?: string;
  targetJuz?: string;
}

export interface SoalDetail {
  nomorSoal: number;
  juzLabel?: string;
  sb: number;       // Salah Besar (-1.0)
  sk: number;       // Salah Kecil (-0.2)
  tahsin: number;   // Skor Tahsin (0-6)
  kbe: number;      // sb + sk/5
  nilaiDasar: number;
  bonusTahsin: number;
  nilaiAkhirSoal: number;
}

export interface NilaiJuzSummary {
  juz: string;
  nilai: number;
  predikat: Predikat;
}

export interface PenilaianRecord {
  id: string;
  santriId: string;
  namaSantri: string;
  nisn: string;
  kelas: string;
  marhalah: Marhalah;
  kampus: Kampus;
  jenisUjian: JenisUjian;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  selectedJuzList: string[]; // e.g. ["Juz 30", "Juz 29"]
  jumlahJuz: number;
  totalSoal: number;
  soal: SoalDetail[];
  nilaiPerJuz: NilaiJuzSummary[];
  rataRata: number;
  predikat: Predikat;
  status: 'DRAFT' | 'SELESAI'; // Untuk cicilan vs simpan final
  pengujiNama: string;
  updatedAt: string;
}

export interface UserProfile {
  nama: string;
  role: 'PENGUJI' | 'ADMIN_MARHALAH' | 'SUPERADMIN';
  marhalahAktif: Marhalah;
  kampusAktif: Kampus;
  tahunAjaranAktif: string;
  semesterAktif: 'Ganjil' | 'Genap';
}
