import React, { useState, useMemo } from 'react';
import { PenilaianRecord, Marhalah, Kampus, JenisUjian } from '../types';
import { getPredikatBadgeStyle } from '../utils/scoring';
import {
  Printer,
  Download,
  Filter,
  BarChart,
  CheckCircle2,
  Clock,
  Search,
  School,
  TrendingUp,
  Award,
  Users,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';

interface MasterRecapViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  penilaianList: PenilaianRecord[];
  onEditPenilaian?: (record: PenilaianRecord) => void;
  onDeletePenilaian?: (record: PenilaianRecord) => void;
}

export const MasterRecapView: React.FC<MasterRecapViewProps> = ({
  marhalah,
  kampus,
  penilaianList,
  onEditPenilaian,
  onDeletePenilaian,
}) => {

  const [filterJenisUjian, setFilterJenisUjian] = useState<JenisUjian>('UAS');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SELESAI' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileTableMode, setShowMobileTableMode] = useState<boolean>(false);

  // Filter records
  const filteredList = useMemo(() => {
    return penilaianList.filter(p => {
      const matchUnit = p.marhalah === marhalah && p.kampus === kampus;
      const matchUjian = p.jenisUjian === filterJenisUjian;
      const matchKelas = filterKelas === 'ALL' || p.kelas.includes(filterKelas);
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
      const matchSearch =
        p.namaSantri.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nisn.includes(searchQuery) ||
        p.kelas.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUnit && matchUjian && matchKelas && matchStatus && matchSearch;
    });
  }, [penilaianList, marhalah, kampus, filterJenisUjian, filterKelas, filterStatus, searchQuery]);

  // Unique classes for filter
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    penilaianList
      .filter(p => p.marhalah === marhalah && p.kampus === kampus)
      .forEach(p => classes.add(p.kelas));
    return Array.from(classes);
  }, [penilaianList, marhalah, kampus]);

  // Statistics
  const stats = useMemo(() => {
    if (filteredList.length === 0) return { count: 0, selesai: 0, draft: 0, avg: 0, passRate: 0 };
    const selesai = filteredList.filter(p => p.status === 'SELESAI');
    const draft = filteredList.filter(p => p.status === 'DRAFT');
    const totalScore = filteredList.reduce((acc, p) => acc + p.rataRata, 0);
    const avg = Number((totalScore / filteredList.length).toFixed(1));
    const passed = filteredList.filter(p => p.predikat !== 'Gagal' && p.predikat !== 'Cukup').length;
    const passRate = Math.round((passed / filteredList.length) * 100);

    return {
      count: filteredList.length,
      selesai: selesai.length,
      draft: draft.length,
      avg,
      passRate,
    };
  }, [filteredList]);

  const handlePrint = () => {
    window.print();
  };

  // Real Working CSV / Excel Export
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert("Tidak ada data untuk diexport dengan filter saat ini.");
      return;
    }

    const headers = [
      'No',
      'Nama Santri',
      'NISN',
      'Kelas',
      'Marhalah',
      'Kampus',
      'Jenis Ujian',
      'Materi / Juz',
      'Total Soal',
      'Rata-Rata Nilai',
      'Predikat',
      'Status Ujian',
      'Penguji',
      'Tanggal Diperbarui'
    ];

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      `"${item.namaSantri.replace(/"/g, '""')}"`,
      `'${item.nisn}`,
      `"${item.kelas}"`,
      item.marhalah,
      item.kampus,
      item.jenisUjian,
      `"${item.jenisUjian === 'UAS' ? item.selectedJuzList.join(', ') : '10 Soal UTS'}"`,
      item.totalSoal,
      item.rataRata.toFixed(1),
      item.predikat,
      item.status,
      `"${item.pengujiNama}"`,
      `"${item.updatedAt}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Ujian_Tahfidz_${marhalah}_${kampus}_${filterJenisUjian}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header & Filter Bar (No Print) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-block">
              Master Recap & Statistics
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Rekapitulasi Penilaian Hafalan Masal
            </h2>
            <p className="text-xs text-slate-500">
              {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} — Kampus {kampus === 'BANIN' ? 'Banin (Putra)' : 'Banat (Putri)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-300 transition flex items-center gap-1.5 active:scale-95"
              title="Unduh file Excel (.csv) siap olah"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap (A4)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
              Jenis Ujian:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterJenisUjian('UTS')}
                className={`flex-1 py-2 rounded-xl text-xs font-black border transition ${
                  filterJenisUjian === 'UTS'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                UTS
              </button>
              <button
                type="button"
                onClick={() => setFilterJenisUjian('UAS')}
                className={`flex-1 py-2 rounded-xl text-xs font-black border transition ${
                  filterJenisUjian === 'UAS'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                UAS / PAS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
              Filter Kelas:
            </label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
              Cari Nama Santri:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama atau NISN..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (No Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Santri Teruji</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.count} Santri</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Status Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.selesai} Selesai</span>
          <span className="text-[10px] text-amber-700 font-bold block mt-0.5">{stats.draft} Cicilan Masih Draft</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Rata-Rata Angkatan</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stats.avg}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase">Tingkat Lulus Baik+</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl font-black text-teal-700 mt-1 block font-mono">{stats.passRate}%</span>
        </div>
      </div>

      {/* TABEL REKAPITULASI (PRINT READY) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Kop Cetak Rekap */}
        <div className="print-only mb-6 border-b-2 border-slate-900 pb-3">
          <h2 className="text-xl font-black uppercase text-center tracking-tight">
            REKAPITULASI EVALUASI HASIL UJIAN HAFALAN AL-QUR'AN
          </h2>
          <p className="text-xs text-center font-bold text-slate-700 mt-1">
            MA'HAD IBNU ABBAS — {marhalah === 'MI' ? 'MADRASAH IBTIDAIYAH' : 'ULA / MTS'} ({kampus === 'BANIN' ? 'KAMPUS BANIN' : 'KAMPUS BANAT'})
          </p>
          <p className="text-[10px] text-center text-slate-500">
            Tahun Ajaran 2026/2027 • Jenis Evaluasi: {filterJenisUjian === 'UAS' ? 'Penilaian Akhir Semester (UAS)' : 'Penilaian Tengah Semester (UTS)'}
          </p>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada rekapitulasi data untuk filter yang dipilih.
          </div>
        ) : (
          <>
            {/* Mobile View Mode Switcher Header */}
            <div className="sm:hidden flex items-center justify-between pb-3 border-b border-slate-100 no-print mb-3">
              <span className="text-xs font-black text-slate-800">
                Data Rekap ({filteredList.length} Santri)
              </span>
              <button
                type="button"
                onClick={() => setShowMobileTableMode(!showMobileTableMode)}
                className="px-2.5 py-1 rounded-xl border border-slate-300 text-[11px] font-bold text-slate-700 bg-slate-50 flex items-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>{showMobileTableMode ? 'Mode Kartu Ringkas' : 'Mode Tabel Lengkap'}</span>
              </button>
            </div>

            {/* Desktop Table View / Mobile Full Table View */}
            <div className={`${showMobileTableMode ? 'block' : 'hidden sm:block'} space-y-1.5`}>
              {showMobileTableMode && (
                <div className="sm:hidden text-[10px] text-slate-500 font-medium flex items-center gap-1 px-1 no-print">
                  <span>↔</span>
                  <span>Geser ke samping untuk melihat seluruh kolom data rekap</span>
                </div>
              )}
              <div 
                tabIndex={0}
                role="region"
                aria-label="Tabel Rekapitulasi Nilai Santri"
                className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <table className="w-full min-w-[780px] text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-3 text-center w-12 border-r border-slate-200 whitespace-nowrap">No</th>
                      <th className="px-3.5 py-3 border-r border-slate-200 whitespace-nowrap">Nama Santri</th>
                      <th className="px-3.5 py-3 border-r border-slate-200 whitespace-nowrap">NISN</th>
                      <th className="px-3.5 py-3 text-center border-r border-slate-200 whitespace-nowrap">Kelas</th>
                      <th className="px-3.5 py-3 text-center border-r border-slate-200 whitespace-nowrap">
                        {filterJenisUjian === 'UAS' ? 'Juz Diujikan' : 'Materi Ujian'}
                      </th>
                      <th className="px-3.5 py-3 text-center border-r border-slate-200 whitespace-nowrap no-print">Status</th>
                      <th className="px-3.5 py-3 text-center font-black bg-slate-200/60 border-r border-slate-200 whitespace-nowrap">
                        Rata-Rata
                      </th>
                      <th className="px-3.5 py-3 text-center border-r border-slate-200 whitespace-nowrap">Predikat</th>
                      <th className="px-3.5 py-3 text-center no-print w-28 whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((item, idx) => {
                      const badge = getPredikatBadgeStyle(item.predikat);
                      const isDraft = item.status === 'DRAFT';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="px-3.5 py-2.5 text-center font-bold text-slate-400 border-r border-slate-200 whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            {item.namaSantri}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                            {item.nisn}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">
                            {item.kelas}
                          </td>
                          <td className="px-3.5 py-2.5 text-center border-r border-slate-200 whitespace-nowrap">
                            {filterJenisUjian === 'UAS'
                              ? item.selectedJuzList.length > 0
                                ? `${item.jumlahJuz} Juz (${item.selectedJuzList.join(', ')})`
                                : '-'
                              : '10 Soal Standar'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center border-r border-slate-200 whitespace-nowrap no-print">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isDraft ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {isDraft ? 'Cicilan' : 'Selesai'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-black text-slate-900 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                            {item.rataRata.toFixed(1)}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-bold text-[10px] uppercase border-r border-slate-200 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md border ${badge.bg} ${badge.border}`}>
                              {item.predikat}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center no-print whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {onEditPenilaian && (
                                <button
                                  type="button"
                                  onClick={() => onEditPenilaian(item)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black border border-emerald-300 transition flex items-center gap-1 active:scale-95"
                                  title="Edit Nilai Ujian Kapanpun"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {onDeletePenilaian && (
                                <button
                                  type="button"
                                  onClick={() => onDeletePenilaian(item)}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition active:scale-95"
                                  title="Hapus Nilai Ujian Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List View (No horizontal squish on phone screens!) */}
            <div className={`${showMobileTableMode ? 'hidden' : 'block sm:hidden'} space-y-3 no-print`}>
              {filteredList.map((item, idx) => {
                const badge = getPredikatBadgeStyle(item.predikat);
                const isDraft = item.status === 'DRAFT';
                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                        <h4 className="font-black text-sm text-slate-900">{item.namaSantri}</h4>
                        <p className="text-[11px] text-slate-500">Kelas {item.kelas} • NISN: {item.nisn}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900 font-mono block">
                          {item.rataRata.toFixed(1)}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.border}`}>
                          {item.predikat}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {filterJenisUjian === 'UAS' ? `${item.jumlahJuz} Juz (${item.selectedJuzList.join(', ')})` : 'UTS (10 Soal)'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black mr-1 ${
                          isDraft ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {isDraft ? 'Cicilan' : 'Selesai'}
                        </span>
                        {onEditPenilaian && (
                          <button
                            type="button"
                            onClick={() => onEditPenilaian(item)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Nilai</span>
                          </button>
                        )}
                        {onDeletePenilaian && (
                          <button
                            type="button"
                            onClick={() => onDeletePenilaian(item)}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </>
        )}

        {/* Tanda Tangan Rekap (Print Only) */}
        <div className="print-only mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-xs text-center print-break-inside-avoid">
          <div>
            <p className="text-slate-500 mb-16">Mengetahui,<br />Kepala Marhalah,</p>
            <p className="font-extrabold text-slate-900 underline underline-offset-4">
              Ust. Abdullah Syakir, M.Pd.
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-16">Koordinator Tahfidz Al-Qur'an,</p>
            <p className="font-extrabold text-slate-900 underline underline-offset-4">
              Ust. Dr. Muhammad Ihsan, Lc., M.A.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
