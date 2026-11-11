import React, { useState } from 'react';
import { PenilaianRecord, Marhalah, Kampus } from '../types';
import { getPredikatBadgeStyle, getPredikat } from '../utils/scoring';
import { Printer, Search, FileText, CheckCircle2, Award, Calendar, UserCheck } from 'lucide-react';

interface ReportCardViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  penilaianList: PenilaianRecord[];
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({
  marhalah,
  kampus,
  penilaianList,
}) => {
  // Filter sesuai unit
  const unitRecords = penilaianList.filter(
    p => p.marhalah === marhalah && p.kampus === kampus
  );

  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    unitRecords[0]?.id || ''
  );

  const activeRecord = unitRecords.find(r => r.id === selectedRecordId) || unitRecords[0];

  const handlePrint = () => {
    window.print();
  };

  const getUnitFullTitle = () => {
    const marhalahStr = marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Pendidikan Kesetaraan Ula / MTs';
    const kampusStr = kampus === 'BANIN' ? 'Kampus Banin (Putra)' : 'Kampus Banat (Putri)';
    return `${marhalahStr} Ibnu Abbas — ${kampusStr}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 no-print flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            Pilih Rapor Santri:
          </label>
          <select
            value={selectedRecordId}
            onChange={(e) => setSelectedRecordId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {unitRecords.map(r => (
              <option key={r.id} value={r.id}>
                {r.namaSantri} — {r.kelas} ({r.jenisUjian}) • Nilai: {r.rataRata} ({r.predikat})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto pt-2 sm:pt-5">
          <button
            onClick={handlePrint}
            disabled={!activeRecord}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor (A4 / PDF)</span>
          </button>
        </div>
      </div>

      {!activeRecord ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm text-slate-400 no-print">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-bold text-sm text-slate-600">Belum ada data evaluasi di unit ini</p>
          <p className="text-xs text-slate-400 mt-1">Silakan lakukan input nilai ujian melalui tab "Input Nilai Ujian".</p>
        </div>
      ) : (
        /* LEMBAR RAPOR RESMI (PRINT READY) */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 print:p-0 print:border-none print:shadow-none print-shadow-none text-slate-900">
          
          {/* KOP SURAT RESMI */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shrink-0 border border-emerald-800">
                IA
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif">
                  MA'HAD IBNU ABBAS
                </h2>
                <h3 className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wide">
                  {getUnitFullTitle()}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Jl. Pesantren Ibnu Abbas No. 1 • Tahun Ajaran {activeRecord.tahunAjaran} • Semester {activeRecord.semester}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <h4 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                LEMBAR EVALUASI & RAPOR UJIAN HAFALAN AL-QUR'AN
              </h4>
              <span className="inline-block mt-0.5 px-3 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                {activeRecord.jenisUjian === 'UAS' ? 'Penilaian Akhir Semester (PAS / UAS)' : 'Penilaian Tengah Semester (PTS / UTS)'}
              </span>
            </div>
          </div>

          {/* BIODATA SANTRI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Santri:</span>
              <span className="font-extrabold text-slate-900 text-sm">{activeRecord.namaSantri}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">NISN:</span>
              <span className="font-mono font-bold text-slate-800">{activeRecord.nisn}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kelas / Jenjang:</span>
              <span className="font-bold text-slate-800">{activeRecord.kelas}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Penguji:</span>
              <span className="font-bold text-slate-800">{activeRecord.pengujiNama}</span>
            </div>

            {activeRecord.jenisUjian === 'UAS' && (
              <>
                <div className="col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Juz yang Diujikan:</span>
                  <span className="font-bold text-emerald-800">
                    {activeRecord.selectedJuzList.join(', ') || '-'} ({activeRecord.jumlahJuz} Juz)
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Ujian:</span>
                  <span className="font-medium text-slate-700">{activeRecord.updatedAt}</span>
                </div>
              </>
            )}
          </div>

          {/* RINGKASAN NILAI PER JUZ (KHUSUS UAS) */}
          {activeRecord.jenisUjian === 'UAS' && activeRecord.nilaiPerJuz && activeRecord.nilaiPerJuz.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 print:bg-transparent">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 block mb-2.5">
                📌 Ringkasan Capaian per Juz:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {activeRecord.nilaiPerJuz.map((juzItem) => {
                  const badge = getPredikatBadgeStyle(juzItem.predikat);
                  return (
                    <div
                      key={juzItem.juz}
                      className="p-2.5 bg-white rounded-lg border border-emerald-200/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">{juzItem.juz}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{juzItem.predikat}</span>
                      </div>
                      <span className="text-base font-black text-emerald-800 font-mono">
                        {juzItem.nilai.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABEL RINCIAN NILAI BUTIR SOAL */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200 print:bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-center border-r border-slate-200 w-12">No</th>
                  <th className="px-3 py-2 border-r border-slate-200">Keterangan / Juz</th>
                  <th className="px-3 py-2 text-center text-red-600 border-r border-slate-200">SB (-1.0)</th>
                  <th className="px-3 py-2 text-center text-amber-600 border-r border-slate-200">SK (-0.2)</th>
                  <th className="px-3 py-2 text-center text-indigo-600 border-r border-slate-200">Tahsin</th>
                  <th className="px-3 py-2 text-center border-r border-slate-200">KBE</th>
                  <th className="px-3 py-2 text-center font-black bg-slate-200/60 border-r border-slate-200">
                    Nilai
                  </th>
                  <th className="px-3 py-2 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRecord.soal.map((s, idx) => (
                  <tr key={s.nomorSoal} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-200">
                      Soal {idx + 1} {s.juzLabel ? `(${s.juzLabel})` : ''}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-red-600 font-bold border-r border-slate-200">
                      {s.sb}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-amber-600 font-bold border-r border-slate-200">
                      {s.sk}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-indigo-600 font-bold border-r border-slate-200">
                      {s.tahsin}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-slate-600 border-r border-slate-200">
                      {s.kbe.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-black text-slate-900 bg-slate-50 border-r border-slate-200">
                      {s.nilaiAkhirSoal.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-[10px] uppercase text-slate-700">
                      {getPredikat(s.nilaiAkhirSoal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KOTAK RATA-RATA AKHIR & PREDIKAT */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 flex items-center justify-between mb-8 print:bg-transparent print:border-slate-800">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                Rata-Rata Akhir Ujian:
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono mt-0.5 print:text-black">
                {activeRecord.rataRata.toFixed(1)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block mb-1">
                Kategori Kelulusan:
              </span>
              <span className={`inline-block px-4 py-1.5 rounded-full font-black text-xs uppercase border ${
                getPredikatBadgeStyle(activeRecord.predikat).bg
              } ${getPredikatBadgeStyle(activeRecord.predikat).border}`}>
                {activeRecord.predikat}
              </span>
            </div>
          </div>

          {/* TANDA TANGAN RESMI */}
          <div className="grid grid-cols-2 gap-8 pt-4 text-xs text-center border-t border-slate-200 print-break-inside-avoid">
            <div>
              <p className="text-slate-500 mb-16">Penguji Tahfidz,</p>
              <p className="font-extrabold text-slate-900 underline underline-offset-4">
                {activeRecord.pengujiNama}
              </p>
              <p className="text-[10px] text-slate-400">Asatidz Penguji</p>
            </div>

            <div>
              <p className="text-slate-500 mb-16">
                Mengetahui,<br />Koordinator Tahfidz Marhalah,
              </p>
              <p className="font-extrabold text-slate-900 underline underline-offset-4">
                Ust. Dr. Muhammad Ihsan, Lc., M.A.
              </p>
              <p className="text-[10px] text-slate-400">Koordinator Bidang Al-Qur'an</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
