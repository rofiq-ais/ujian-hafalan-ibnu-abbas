import { Santri, PenilaianRecord } from '../types';

export const MOCK_SANTRI: Santri[] = [
  // ULA / MTS BANIN
  { id: 's_1', nisn: '0089123401', nama: 'Muhammad Fatih Al-Habsyi', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '7A Ula/MTs', halaqah: 'Halaqah Utsman bin Affan', targetJuz: 'Juz 30, Juz 29' },
  { id: 's_2', nisn: '0089123402', nama: 'Ahmad Rayhan Pratama', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '7A Ula/MTs', halaqah: 'Halaqah Abu Bakar Ash-Shiddiq', targetJuz: 'Juz 30, Juz 29, Juz 28' },
  { id: 's_3', nisn: '0089123403', nama: 'Zaidan Bilal Al-Ghafiqi', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '8A Ula/MTs', halaqah: 'Halaqah Ali bin Abi Thalib', targetJuz: 'Juz 1, Juz 2, Juz 3' },
  { id: 's_4', nisn: '0089123404', nama: 'Fauzan Dzaki Ar-Rasyid', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '8A Ula/MTs', halaqah: 'Halaqah Umar bin Khattab', targetJuz: 'Juz 28, Juz 29' },
  { id: 's_5', nisn: '0089123405', nama: 'Hamzah Ibnu Thufail', marhalah: 'ULA_MTS', kampus: 'BANIN', kelas: '9A Ula/MTs', halaqah: 'Halaqah Thariq bin Ziyad', targetJuz: 'Juz 1, Juz 2, Juz 3, Juz 4, Juz 5' },

  // ULA / MTS BANAT
  { id: 's_6', nisn: '0089123406', nama: 'Aisyah Humaira Putri', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '7B Ula/MTs', halaqah: 'Halaqah Sayyidah Khadijah', targetJuz: 'Juz 30, Juz 29' },
  { id: 's_7', nisn: '0089123407', nama: 'Fatimah Az-Zahra Rahman', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '7B Ula/MTs', halaqah: 'Halaqah Sayyidah Fatimah', targetJuz: 'Juz 30, Juz 29, Juz 28' },
  { id: 's_8', nisn: '0089123408', nama: 'Maryam Nabila Salsabila', marhalah: 'ULA_MTS', kampus: 'BANAT', kelas: '8B Ula/MTs', halaqah: 'Halaqah Sayyidah Maryam', targetJuz: 'Juz 1, Juz 2' },

  // MI BANIN
  { id: 's_9', nisn: '0129123409', nama: 'Sulaiman Al-Farisi', marhalah: 'MI', kampus: 'BANIN', kelas: '5A MI', halaqah: 'Halaqah Anas bin Malik', targetJuz: 'Juz 30' },
  { id: 's_10', nisn: '0129123410', nama: 'Ibrahim Khalilurrahman', marhalah: 'MI', kampus: 'BANIN', kelas: '5A MI', halaqah: 'Halaqah Abdullah bin Umar', targetJuz: 'Juz 30, Juz 29' },
  { id: 's_11', nisn: '0129123411', nama: 'Umar Khalid Wijaya', marhalah: 'MI', kampus: 'BANIN', kelas: '6A MI', halaqah: 'Halaqah Khalid bin Walid', targetJuz: 'Juz 29, Juz 28' },

  // MI BANAT
  { id: 's_12', nisn: '0129123412', nama: 'Hafshah Nur Azizah', marhalah: 'MI', kampus: 'BANAT', kelas: '5B MI', halaqah: 'Halaqah Ummu Salamah', targetJuz: 'Juz 30' },
  { id: 's_13', nisn: '0129123413', nama: 'Ruqayyah Athiyyah', marhalah: 'MI', kampus: 'BANAT', kelas: '6B MI', halaqah: 'Halaqah Asma binti Abi Bakar', targetJuz: 'Juz 30, Juz 29' },
];

export const MOCK_PENILAIAN: PenilaianRecord[] = [
  {
    id: 'eval_1',
    santriId: 's_1',
    namaSantri: 'Muhammad Fatih Al-Habsyi',
    nisn: '0089123401',
    kelas: '7A Ula/MTs',
    marhalah: 'ULA_MTS',
    kampus: 'BANIN',
    jenisUjian: 'UAS',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    selectedJuzList: ['Juz 30', 'Juz 29'],
    jumlahJuz: 2,
    totalSoal: 10,
    status: 'SELESAI',
    pengujiNama: 'Ust. Ahmad Fauzi, Lc.',
    updatedAt: '2026-11-08 09:30',
    rataRata: 87.2,
    predikat: 'Sempurna',
    nilaiPerJuz: [
      { juz: 'Juz 30', nilai: 88.0, predikat: 'Sempurna' },
      { juz: 'Juz 29', nilai: 86.4, predikat: 'Sempurna' },
    ],
    soal: [
      { nomorSoal: 1, juzLabel: 'Juz 30', sb: 0, sk: 2, tahsin: 1, kbe: 0.4, nilaiDasar: 96, bonusTahsin: 0, nilaiAkhirSoal: 96 },
      { nomorSoal: 2, juzLabel: 'Juz 30', sb: 1, sk: 1, tahsin: 2, kbe: 1.2, nilaiDasar: 88, bonusTahsin: 0, nilaiAkhirSoal: 88 },
      { nomorSoal: 3, juzLabel: 'Juz 30', sb: 0, sk: 4, tahsin: 3, kbe: 0.8, nilaiDasar: 92, bonusTahsin: 0, nilaiAkhirSoal: 92 },
      { nomorSoal: 4, juzLabel: 'Juz 30', sb: 1, sk: 3, tahsin: 2, kbe: 1.6, nilaiDasar: 84, bonusTahsin: 0, nilaiAkhirSoal: 84 },
      { nomorSoal: 5, juzLabel: 'Juz 30', sb: 1, sk: 5, tahsin: 1, kbe: 2.0, nilaiDasar: 80, bonusTahsin: 0, nilaiAkhirSoal: 80 },
      { nomorSoal: 6, juzLabel: 'Juz 29', sb: 0, sk: 3, tahsin: 2, kbe: 0.6, nilaiDasar: 94, bonusTahsin: 0, nilaiAkhirSoal: 94 },
      { nomorSoal: 7, juzLabel: 'Juz 29', sb: 1, sk: 2, tahsin: 3, kbe: 1.4, nilaiDasar: 86, bonusTahsin: 0, nilaiAkhirSoal: 86 },
      { nomorSoal: 8, juzLabel: 'Juz 29', sb: 2, sk: 1, tahsin: 2, kbe: 2.2, nilaiDasar: 78, bonusTahsin: 0, nilaiAkhirSoal: 78 },
      { nomorSoal: 9, juzLabel: 'Juz 29', sb: 1, sk: 0, tahsin: 1, kbe: 1.0, nilaiDasar: 90, bonusTahsin: 0, nilaiAkhirSoal: 90 },
      { nomorSoal: 10, juzLabel: 'Juz 29', sb: 1, sk: 3, tahsin: 2, kbe: 1.6, nilaiDasar: 84, bonusTahsin: 0, nilaiAkhirSoal: 84 },
    ]
  },
  {
    id: 'eval_2',
    santriId: 's_2',
    namaSantri: 'Ahmad Rayhan Pratama',
    nisn: '0089123402',
    kelas: '7A Ula/MTs',
    marhalah: 'ULA_MTS',
    kampus: 'BANIN',
    jenisUjian: 'UTS',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    selectedJuzList: [],
    jumlahJuz: 0,
    totalSoal: 10,
    status: 'SELESAI',
    pengujiNama: 'Ust. Nurul Huda, S.Pd.I.',
    updatedAt: '2026-11-09 10:15',
    rataRata: 74.5,
    predikat: 'Sangat Baik',
    nilaiPerJuz: [],
    soal: [
      { nomorSoal: 1, sb: 1, sk: 2, tahsin: 2, kbe: 1.4, nilaiDasar: 86, bonusTahsin: 0, nilaiAkhirSoal: 86 },
      { nomorSoal: 2, sb: 2, sk: 1, tahsin: 3, kbe: 2.2, nilaiDasar: 78, bonusTahsin: 0, nilaiAkhirSoal: 78 },
      { nomorSoal: 3, sb: 3, sk: 2, tahsin: 1, kbe: 3.4, nilaiDasar: 66, bonusTahsin: 10, nilaiAkhirSoal: 76 },
      { nomorSoal: 4, sb: 2, sk: 4, tahsin: 2, kbe: 2.8, nilaiDasar: 72, bonusTahsin: 0, nilaiAkhirSoal: 72 },
      { nomorSoal: 5, sb: 1, sk: 3, tahsin: 3, kbe: 1.6, nilaiDasar: 84, bonusTahsin: 0, nilaiAkhirSoal: 84 },
      { nomorSoal: 6, sb: 3, sk: 1, tahsin: 2, kbe: 3.2, nilaiDasar: 68, bonusTahsin: 10, nilaiAkhirSoal: 78 },
      { nomorSoal: 7, sb: 4, sk: 2, tahsin: 3, kbe: 4.4, nilaiDasar: 56, bonusTahsin: 0, nilaiAkhirSoal: 56 },
      { nomorSoal: 8, sb: 2, sk: 0, tahsin: 2, kbe: 2.0, nilaiDasar: 80, bonusTahsin: 0, nilaiAkhirSoal: 80 },
      { nomorSoal: 9, sb: 3, sk: 3, tahsin: 1, kbe: 3.6, nilaiDasar: 64, bonusTahsin: 10, nilaiAkhirSoal: 74 },
      { nomorSoal: 10, sb: 4, sk: 1, tahsin: 2, kbe: 4.2, nilaiDasar: 58, bonusTahsin: 0, nilaiAkhirSoal: 58 },
    ]
  },
  {
    id: 'eval_3',
    santriId: 's_6',
    namaSantri: 'Aisyah Humaira Putri',
    nisn: '0089123406',
    kelas: '7B Ula/MTs',
    marhalah: 'ULA_MTS',
    kampus: 'BANAT',
    jenisUjian: 'UAS',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    selectedJuzList: ['Juz 30', 'Juz 29'],
    jumlahJuz: 2,
    totalSoal: 10,
    status: 'DRAFT', // Cicilan baru selesai Juz 30 (5 soal pertama)
    pengujiNama: 'Usth. Maryam S.Ag.',
    updatedAt: '2026-11-10 14:00',
    rataRata: 93.6,
    predikat: 'Sempurna',
    nilaiPerJuz: [
      { juz: 'Juz 30', nilai: 93.6, predikat: 'Sempurna' }
    ],
    soal: [
      { nomorSoal: 1, juzLabel: 'Juz 30', sb: 0, sk: 1, tahsin: 1, kbe: 0.2, nilaiDasar: 98, bonusTahsin: 0, nilaiAkhirSoal: 98 },
      { nomorSoal: 2, juzLabel: 'Juz 30', sb: 0, sk: 2, tahsin: 2, kbe: 0.4, nilaiDasar: 96, bonusTahsin: 0, nilaiAkhirSoal: 96 },
      { nomorSoal: 3, juzLabel: 'Juz 30', sb: 1, sk: 0, tahsin: 2, kbe: 1.0, nilaiDasar: 90, bonusTahsin: 0, nilaiAkhirSoal: 90 },
      { nomorSoal: 4, juzLabel: 'Juz 30', sb: 0, sk: 3, tahsin: 1, kbe: 0.6, nilaiDasar: 94, bonusTahsin: 0, nilaiAkhirSoal: 94 },
      { nomorSoal: 5, juzLabel: 'Juz 30', sb: 1, sk: 1, tahsin: 2, kbe: 1.2, nilaiDasar: 88, bonusTahsin: 0, nilaiAkhirSoal: 88 },
      { nomorSoal: 6, juzLabel: 'Juz 29', sb: 0, sk: 0, tahsin: 0, kbe: 0, nilaiDasar: 100, bonusTahsin: 0, nilaiAkhirSoal: 0 },
      { nomorSoal: 7, juzLabel: 'Juz 29', sb: 0, sk: 0, tahsin: 0, kbe: 0, nilaiDasar: 100, bonusTahsin: 0, nilaiAkhirSoal: 0 },
      { nomorSoal: 8, juzLabel: 'Juz 29', sb: 0, sk: 0, tahsin: 0, kbe: 0, nilaiDasar: 100, bonusTahsin: 0, nilaiAkhirSoal: 0 },
      { nomorSoal: 9, juzLabel: 'Juz 29', sb: 0, sk: 0, tahsin: 0, kbe: 0, nilaiDasar: 100, bonusTahsin: 0, nilaiAkhirSoal: 0 },
      { nomorSoal: 10, juzLabel: 'Juz 29', sb: 0, sk: 0, tahsin: 0, kbe: 0, nilaiDasar: 100, bonusTahsin: 0, nilaiAkhirSoal: 0 },
    ]
  },
  {
    id: 'eval_4',
    santriId: 's_9',
    namaSantri: 'Sulaiman Al-Farisi',
    nisn: '0129123409',
    kelas: '5A MI',
    marhalah: 'MI',
    kampus: 'BANIN',
    jenisUjian: 'UAS',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    selectedJuzList: ['Juz 30'],
    jumlahJuz: 1,
    totalSoal: 5,
    status: 'SELESAI',
    pengujiNama: 'Ust. Ridwan Kamil, S.Th.I.',
    updatedAt: '2026-11-10 11:20',
    rataRata: 82.4,
    predikat: 'Sempurna',
    nilaiPerJuz: [
      { juz: 'Juz 30', nilai: 82.4, predikat: 'Sempurna' }
    ],
    soal: [
      { nomorSoal: 1, juzLabel: 'Juz 30', sb: 1, sk: 2, tahsin: 2, kbe: 1.4, nilaiDasar: 86, bonusTahsin: 0, nilaiAkhirSoal: 86 },
      { nomorSoal: 2, juzLabel: 'Juz 30', sb: 2, sk: 0, tahsin: 3, kbe: 2.0, nilaiDasar: 80, bonusTahsin: 0, nilaiAkhirSoal: 80 },
      { nomorSoal: 3, juzLabel: 'Juz 30', sb: 1, sk: 4, tahsin: 2, kbe: 1.8, nilaiDasar: 82, bonusTahsin: 0, nilaiAkhirSoal: 82 },
      { nomorSoal: 4, juzLabel: 'Juz 30', sb: 2, sk: 2, tahsin: 2, kbe: 2.4, nilaiDasar: 76, bonusTahsin: 0, nilaiAkhirSoal: 76 },
      { nomorSoal: 5, juzLabel: 'Juz 30', sb: 1, sk: 1, tahsin: 1, kbe: 1.2, nilaiDasar: 88, bonusTahsin: 0, nilaiAkhirSoal: 88 },
    ]
  }
];
