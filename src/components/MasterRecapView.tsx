import React, { useState, useMemo } from 'react';
import { PenilaianRecord, Marhalah, Kampus, JenisUjian } from '../types';
import { getPredikatBadgeStyle } from '../utils/scoring';
import { Printer, Download, Filter, BarChart, CheckCircle2, Clock } from 'lucide-react';

interface MasterRecapViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  penilaianList: PenilaianRecord[];
}

export const MasterRecapView: React.FC<MasterRecapViewProps> = ({
  marhalah,
  kampus,
  penilaianList,
}) => {
  const [filterJenisUjian, setFilterJenisUjian] = useState<JenisUjian>('UAS');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');

  // Filter records
  const filteredList = useMemo(() => {
    return penilaianList.filter(p => {
      const matchUnit = p.marhalah === marhalah && p.kampus === kampus;
      const matchUjian = p.jenisUjian === filterJenisUjian;
      const matchKelas = filterKelas === 'ALL' || p.kelas.includes(filterKelas);
      return matchUnit && matchUjian && matchKelas;
    });
  }, [penilaianList, marhalah, kampus, filterJenisUjian, filterKelas]);

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
    if (filteredList.length === 0) return { count: 0, selesai: 0, avg: 0, passRate: 0 };
    const selesai = filteredList.filter(p => p.status === 'SELESAI');
    const totalScore = filteredList.reduce((acc, p) => acc + p.rataRata, 0);
    const avg = Number((totalScore / filteredList.length).toFixed(1));
    const passed = filteredList.filter(p => p.predikat !== 'Gagal' && p.predikat !== 'Cukup').length;
    const passRate = Math.round((passed / filteredList.length) * 100);

    return {
      count: filteredList.length,
      selesai: selesai.length,
      avg,
      passRate,
    };
  }, [filteredList]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportMock = () => {
    alert("Fitur Export Excel: Data rekapitulasi nilai akan diunduh dalam format .xlsx siap olah.");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Filter Bar (No Print) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Rekapitulasi Penilaian Hafalan Masal
            </h2>
            <p className="text-xs text-slate-500">
              {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} — Kampus {kampus === 'BANIN' ? 'Banin (Putra)' : 'Banat (Putri)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMock}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap (A4)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Jenis Ujian:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterJenisUjian('UTS')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                  filterJenisUjian === 'UTS'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                UTS (Tengah Semester)
              </button>
              <button
                type="button"
                onClick={() => setFilterJenisUjian('UAS')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                  filterJenisUjian === 'UAS'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                UAS (Akhir Semester)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Filter Kelas:
            </label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Kelas di Unit Ini</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards (No Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Santri Teruji</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.count} Santri</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Status Selesai</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.selesai} Selesai</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Rata-Rata Kelas</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.avg}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Kelulusan Baik+</span>
          <span className="text-2xl font-black text-teal-700 mt-1 block">{stats.passRate}%</span>
        </div>
      </div>

      {/* TABEL REKAPITULASI (PRINT READY) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:p-0 print:border-none print:shadow-none print-shadow-none">
        
        {/* Kop Cetak Rekap */}
        <div className="print-only mb-6 border-b-2 border-slate-900 pb-3">
          <h2 className="text-xl font-black uppercase text-center">
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
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12 border-r border-slate-200">No</th>
                  <th className="px-3 py-2.5 border-r border-slate-200">Nama Santri</th>
                  <th className="px-3 py-2.5 border-r border-slate-200">NISN</th>
                  <th className="px-3 py-2.5 text-center border-r border-slate-200">Kelas</th>
                  <th className="px-3 py-2.5 text-center border-r border-slate-200">
                    {filterJenisUjian === 'UAS' ? 'Juz Diujikan' : 'Materi Ujian'}
                  </th>
                  <th className="px-3 py-2.5 text-center border-r border-slate-200 no-print">Status</th>
                  <th className="px-3 py-2.5 text-center font-black bg-slate-200/60 border-r border-slate-200">
                    Rata-Rata
                  </th>
                  <th className="px-3 py-2.5 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item, idx) => {
                  const badge = getPredikatBadgeStyle(item.predikat);
                  const isDraft = item.status === 'DRAFT';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 border-r border-slate-200">
                        {item.namaSantri}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600 border-r border-slate-200">
                        {item.nisn}
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-slate-700 border-r border-slate-200">
                        {item.kelas}
                      </td>
                      <td className="px-3 py-2 text-center border-r border-slate-200">
                        {filterJenisUjian === 'UAS'
                          ? item.selectedJuzList.length > 0
                            ? `${item.jumlahJuz} Juz (${item.selectedJuzList.join(', ')})`
                            : '-'
                          : '10 Soal Standar'}
                      </td>
                      <td className="px-3 py-2 text-center border-r border-slate-200 no-print">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isDraft ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isDraft ? 'Cicilan' : 'Selesai'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-black text-slate-900 bg-slate-50 border-r border-slate-200">
                        {item.rataRata.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-[10px] uppercase">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md border ${badge.bg} ${badge.border}`}>
                          {item.predikat}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tanda Tangan Rekap (Print Only) */}
        <div className="print-only mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-xs text-center print-break-inside-avoid">
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
