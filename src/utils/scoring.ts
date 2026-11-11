import { Predikat, SoalDetail, NilaiJuzSummary } from '../types';

/**
 * Menghitung Kesalahan Bernilai Ekuivalen (KBE)
 * Formula: SB + (SK / 5)
 */
export function hitungKbe(sb: number, sk: number): number {
  return Number((sb + (sk / 5)).toFixed(2));
}

/**
 * Menghitung Nilai Dasar Soal
 * Formula: max(50, 100 - (KBE * 10))
 */
export function hitungNilaiDasar(kbe: number): number {
  const nilaiDasarMurni = 100 - (kbe * 10);
  return Math.max(50, Number(nilaiDasarMurni.toFixed(1)));
}

/**
 * Menentukan Bonus Tahsin
 * Syarat: KBE < 4 dan NilaiDasar < 70
 * - Tahsin 0..3: Bonus 10
 * - Tahsin 4..6: Bonus 5
 * - Lainnya: 0
 */
export function hitungBonusTahsin(kbe: number, nilaiDasar: number, tahsin: number): number {
  if (kbe < 4 && nilaiDasar < 70) {
    if (tahsin >= 0 && tahsin <= 3) {
      return 10;
    } else if (tahsin >= 4 && tahsin <= 6) {
      return 5;
    }
  }
  return 0;
}

/**
 * Menghitung Nilai Akhir Butir Soal
 * Formula: min(100, NilaiDasar + BonusTahsin)
 */
export function hitungNilaiAkhirSoal(sb: number, sk: number, tahsin: number): {
  kbe: number;
  nilaiDasar: number;
  bonusTahsin: number;
  nilaiAkhirSoal: number;
} {
  const kbe = hitungKbe(sb, sk);
  const nilaiDasar = hitungNilaiDasar(kbe);
  const bonusTahsin = hitungBonusTahsin(kbe, nilaiDasar, tahsin);
  const nilaiAkhirSoal = Math.min(100, Number((nilaiDasar + bonusTahsin).toFixed(1)));

  return {
    kbe,
    nilaiDasar,
    bonusTahsin,
    nilaiAkhirSoal,
  };
}

/**
 * Mengubah nilai numerik menjadi predikat evaluasi
 */
export function getPredikat(nilai: number): Predikat {
  if (nilai <= 50) return 'Gagal';
  if (nilai <= 60) return 'Cukup';
  if (nilai <= 70) return 'Baik';
  if (nilai <= 80) return 'Sangat Baik';
  return 'Sempurna';
}

/**
 * Mendapatkan warna badge untuk predikat
 */
export function getPredikatBadgeStyle(predikat: Predikat): { bg: string; text: string; border: string } {
  switch (predikat) {
    case 'Gagal':
      return { bg: 'bg-red-50 text-red-700', text: 'text-red-700', border: 'border-red-200' };
    case 'Cukup':
      return { bg: 'bg-amber-50 text-amber-800', text: 'text-amber-800', border: 'border-amber-200' };
    case 'Baik':
      return { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Sangat Baik':
      return { bg: 'bg-teal-50 text-teal-700', text: 'text-teal-700', border: 'border-teal-200' };
    case 'Sempurna':
      return { bg: 'bg-emerald-50 text-emerald-800', text: 'text-emerald-800', border: 'border-emerald-200' };
  }
}

/**
 * Menghitung Agregat Ujian (Rata-rata Soal, Nilai per Juz, dan Predikat Akhir)
 */
export function hitungAgregatUjian(
  soalList: SoalDetail[],
  isUAS: boolean,
  selectedJuzList: string[]
): {
  nilaiPerJuz: NilaiJuzSummary[];
  rataRata: number;
  predikat: Predikat;
} {
  if (soalList.length === 0) {
    return { nilaiPerJuz: [], rataRata: 0, predikat: 'Gagal' };
  }

  const totalNilaiMurni = soalList.reduce((acc, curr) => acc + curr.nilaiAkhirSoal, 0);
  const rataRata = Number((totalNilaiMurni / soalList.length).toFixed(1));
  const predikat = getPredikat(rataRata);

  const nilaiPerJuz: NilaiJuzSummary[] = [];

  if (isUAS && selectedJuzList.length > 0) {
    selectedJuzList.forEach((juzName, idx) => {
      const startIndex = idx * 5;
      const soalJuz = soalList.slice(startIndex, startIndex + 5);
      if (soalJuz.length > 0) {
        const sumJuz = soalJuz.reduce((acc, curr) => acc + curr.nilaiAkhirSoal, 0);
        const avgJuz = Number((sumJuz / soalJuz.length).toFixed(1));
        nilaiPerJuz.push({
          juz: juzName,
          nilai: avgJuz,
          predikat: getPredikat(avgJuz),
        });
      }
    });
  }

  return {
    nilaiPerJuz,
    rataRata,
    predikat,
  };
}
