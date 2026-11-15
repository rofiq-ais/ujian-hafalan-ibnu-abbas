import React, { useState, useMemo, useEffect } from 'react';
import { PenilaianRecord, Marhalah, Kampus } from '../types';
import { getPredikatBadgeStyle, getPredikat } from '../utils/scoring';
import {
  Printer,
  Search,
  FileText,
  CheckCircle2,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  School,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  Calendar,
  UserCheck,
  Edit3
} from 'lucide-react';

interface ReportCardViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  penilaianList: PenilaianRecord[];
  onNavigateToInput?: () => void;
  onEditPenilaian?: (record: PenilaianRecord) => void;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({
  marhalah,
  kampus,
  penilaianList,
  onNavigateToInput,
  onEditPenilaian,
}) => {

  // Filter sesuai unit aktif
  const unitRecords = useMemo(() => {
    return penilaianList.filter(
      p => p.marhalah === marhalah && p.kampus === kampus
    );
  }, [penilaianList, marhalah, kampus]);

  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    unitRecords[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedWA, setCopiedWA] = useState(false);
  const [showMobileTableMode, setShowMobileTableMode] = useState(false);

  // Sinkronkan selectedRecordId saat unit atau data berubah
  useEffect(() => {
    if (unitRecords.length > 0) {
      if (!selectedRecordId || !unitRecords.some(r => r.id === selectedRecordId)) {
        setSelectedRecordId(unitRecords[0].id);
      }
    } else {
      setSelectedRecordId('');
    }
  }, [unitRecords, selectedRecordId]);

  // Filtered dropdown / selector
  const searchedRecords = useMemo(() => {
    if (!searchTerm.trim()) return unitRecords;
    const q = searchTerm.toLowerCase();
    return unitRecords.filter(r =>
      r.namaSantri.toLowerCase().includes(q) ||
      r.nisn.includes(q) ||
      r.kelas.toLowerCase().includes(q)
    );
  }, [unitRecords, searchTerm]);

  const activeRecord = unitRecords.find(r => r.id === selectedRecordId) || unitRecords[0];

  // Indeks aktif dalam searchedRecords untuk navigasi Previous/Next
  const currentFilteredIndex = useMemo(() => {
    if (!activeRecord) return -1;
    return searchedRecords.findIndex(r => r.id === activeRecord.id);
  }, [searchedRecords, activeRecord]);

  const handlePrevSantri = () => {
    if (currentFilteredIndex > 0) {
      setSelectedRecordId(searchedRecords[currentFilteredIndex - 1].id);
    }
  };

  const handleNextSantri = () => {
    if (currentFilteredIndex >= 0 && currentFilteredIndex < searchedRecords.length - 1) {
      setSelectedRecordId(searchedRecords[currentFilteredIndex + 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getUnitFullTitle = () => {
    const marhalahStr = marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Pendidikan Kesetaraan Ula / MTs';
    const kampusStr = kampus === 'BANIN' ? 'Kampus Banin (Putra)' : 'Kampus Banat (Putri)';
    return `${marhalahStr} Ibnu Abbas — ${kampusStr}`;
  };

  // Generate WhatsApp message for wali santri
  const handleCopyWhatsApp = () => {
    if (!activeRecord) return;

    const waText = `*LAPORAN HASIL EVALUASI UJIAN HAFALAN AL-QUR'AN*
*MA'HAD IBNU ABBAS*
Unit: ${marhalah === 'MI' ? 'MI' : 'Ula / MTs'} (${kampus === 'BANIN' ? 'Banin' : 'Banat'})
T.A. ${activeRecord.tahunAjaran} • Semester ${activeRecord.semester}

*Biodata Santri:*
• Nama: *${activeRecord.namaSantri}*
• Kelas: ${activeRecord.kelas}
• NISN: ${activeRecord.nisn}
• Jenis Ujian: *${activeRecord.jenisUjian === 'UAS' ? 'UAS / PAS' : 'UTS / PTS'}*
• Penguji: ${activeRecord.pengujiNama}

*Capaian Evaluasi:*
• Cakupan: ${activeRecord.jenisUjian === 'UAS' ? (activeRecord.selectedJuzList.join(', ') || '-') : '10 Soal Standar UTS'}
• Rata-rata Nilai: *${activeRecord.rataRata.toFixed(1)}*
• Predikat: *${activeRecord.predikat.toUpperCase()}*

_Semoga ananda senantiasa istiqomah dalam menjaga dan mengamalkan kalamullah. Baarakallaahu fiikum._

*Pimpinan & Tim Tahfidz Ma'had Ibnu Abbas*`;

    navigator.clipboard.writeText(waText).then(() => {
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 3000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-5 no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                Dokumen Resmi & Cetak A4
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {unitRecords.length} Santri Teruji
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Lembar Rapor Ujian Hafalan
            </h2>
            <p className="text-xs text-slate-500">
              Unit: {marhalah === 'MI' ? 'MI' : 'Ula / MTs'} • {kampus === 'BANIN' ? 'Kampus Banin (Putra)' : 'Kampus Banat (Putri)'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onEditPenilaian && activeRecord && (
              <button
                type="button"
                onClick={() => onEditPenilaian(activeRecord)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs btn-tactile"
                title="Edit nilai ujian santri ini kapanpun"
              >
                <Edit3 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">Edit Nilai</span>
              </button>
            )}

            <button
              onClick={handleCopyWhatsApp}
              disabled={!activeRecord}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 disabled:opacity-50 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs btn-tactile"
              title="Salin ringkasan rapor siap kirim via WhatsApp ke wali santri"
            >

              {copiedWA ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-emerald-700 truncate">Tersalin ke WA!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">Kirim WA</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={!activeRecord}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 btn-tactile"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span className="truncate">Cetak Rapor (A4)</span>
            </button>
          </div>
        </div>

        {/* Search & Select Bar with Fast Navigator */}
        {unitRecords.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari santri teruji..."
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Select Dropdown */}
            <div className="flex-1 min-w-0">
              <select
                value={activeRecord?.id || ''}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
              >
                {searchedRecords.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.namaSantri} — {r.kelas} ({r.jenisUjian}) • Rata-rata: {r.rataRata.toFixed(1)} ({r.predikat})
                  </option>
                ))}
              </select>
            </div>

            {/* Prev / Next Fast Navigator Buttons */}
            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePrevSantri}
                disabled={currentFilteredIndex <= 0}
                className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition btn-tactile"
                title="Santri sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-500 px-1 font-mono">
                {currentFilteredIndex >= 0 ? `${currentFilteredIndex + 1}/${searchedRecords.length}` : '-'}
              </span>
              <button
                type="button"
                onClick={handleNextSantri}
                disabled={currentFilteredIndex < 0 || currentFilteredIndex >= searchedRecords.length - 1}
                className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition btn-tactile"
                title="Santri selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {!activeRecord ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-sm text-slate-400 no-print space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <FileText className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-black text-base text-slate-800">Belum Ada Lembar Evaluasi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Belum ada data ujian yang tersimpan untuk unit{' '}
            <strong className="text-slate-700">
              {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} ({kampus === 'BANIN' ? 'Banin' : 'Banat'})
            </strong>. Silakan masukkan nilai santri terlebih dahulu.
          </p>
          {onNavigateToInput && (
            <div className="pt-2">
              <button
                onClick={onNavigateToInput}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-2 shadow-sm btn-tactile"
              >
                <span>Input Nilai Ujian Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* LEMBAR RAPOR RESMI (SIMULASI KERTAS A4 ELEGAN & PRINT READY) */
        <div className="bg-white rounded-3xl shadow-md border border-slate-200/90 p-4 sm:p-10 print:p-0 print:border-none print:shadow-none print:rounded-none text-slate-900 transition-all">
          
          {/* Bismillah Header */}
          <div className="text-center mb-3 sm:mb-4">
            <span className="font-serif text-emerald-950 font-bold text-xl sm:text-2xl tracking-wider block">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
          </div>

          {/* KOP SURAT RESMI */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white font-black text-xl sm:text-2xl flex flex-col items-center justify-center shrink-0 border-2 border-emerald-950 shadow-xs print:border-black print:text-black print:bg-white">
                <span>IA</span>
                <span className="text-[7px] tracking-widest uppercase font-mono opacity-80">Tahfidz</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif leading-tight">
                  MA'HAD IBNU ABBAS
                </h2>
                <h3 className="text-xs sm:text-sm font-black text-emerald-800 uppercase tracking-wide leading-tight mt-0.5">
                  {getUnitFullTitle()}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                  Jl. Pesantren Ibnu Abbas No. 1 • Tahun Ajaran {activeRecord.tahunAjaran} • Semester {activeRecord.semester}
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-300 text-center">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                LEMBAR EVALUASI & RAPOR UJIAN HAFALAN AL-QUR'AN
              </h4>
              <span className="inline-block mt-1 px-3 py-0.5 bg-slate-100 text-slate-800 text-[10px] sm:text-[11px] font-black rounded-full uppercase tracking-wider border border-slate-200">
                {activeRecord.jenisUjian === 'UAS' ? 'Penilaian Akhir Semester (PAS / UAS)' : 'Penilaian Tengah Semester (PTS / UTS)'}
              </span>
            </div>
          </div>

          {/* BIODATA SANTRI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3.5 sm:p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs mb-5 print:bg-slate-50">
            <div>
              <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Nama Santri:</span>
              <span className="font-black text-slate-900 text-xs sm:text-sm block truncate" title={activeRecord.namaSantri}>
                {activeRecord.namaSantri}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">NISN:</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{activeRecord.nisn}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Kelas:</span>
              <span className="font-bold text-slate-800 text-xs">{activeRecord.kelas}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Penguji:</span>
              <span className="font-bold text-slate-800 text-xs block truncate" title={activeRecord.pengujiNama}>
                {activeRecord.pengujiNama}
              </span>
            </div>

            {activeRecord.jenisUjian === 'UAS' && (
              <>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Juz yang Diujikan:</span>
                  <span className="font-black text-emerald-800 text-xs">
                    {activeRecord.selectedJuzList.join(', ') || '-'} ({activeRecord.jumlahJuz} Juz)
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Tanggal Ujian:</span>
                  <span className="font-medium text-slate-700 text-xs">{activeRecord.updatedAt}</span>
                </div>
              </>
            )}
          </div>

          {/* RINGKASAN NILAI PER JUZ (KHUSUS UAS) */}
          {activeRecord.jenisUjian === 'UAS' && activeRecord.nilaiPerJuz && activeRecord.nilaiPerJuz.length > 0 && (
            <div className="mb-5 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 print:bg-transparent">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-950 block mb-2">
                📌 Ringkasan Capaian per Juz:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeRecord.nilaiPerJuz.map((juzItem) => {
                  return (
                    <div
                      key={juzItem.juz}
                      className="p-2.5 sm:p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="text-xs font-black text-slate-800 block">{juzItem.juz}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase">{juzItem.predikat}</span>
                      </div>
                      <span className="text-sm sm:text-base font-black text-emerald-800 font-mono">
                        {juzItem.nilai.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABEL RINCIAN NILAI BUTIR SOAL */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Rincian Evaluasi Butir Soal:
              </span>

              {/* Toggle tampilan kartu vs tabel di layar HP */}
              <div className="sm:hidden no-print">
                <button
                  type="button"
                  onClick={() => setShowMobileTableMode(!showMobileTableMode)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-700 bg-slate-50 flex items-center gap-1 active:scale-95"
                >
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span>{showMobileTableMode ? 'Tampilan Ringkas' : 'Tabel Lengkap'}</span>
                </button>
              </div>
            </div>

            {/* A. TAMPILAN RESMI TABEL (Desktop & Print Selalu Ditampilkan, di HP jika showMobileTableMode = true) */}
            <div className={`${showMobileTableMode ? 'block' : 'hidden sm:block'} print:block space-y-1.5`}>
              {showMobileTableMode && (
                <div className="sm:hidden text-[10px] text-slate-500 font-medium flex items-center gap-1 px-1">
                  <span>↔</span>
                  <span>Geser ke samping untuk melihat seluruh kolom tabel</span>
                </div>
              )}
              <div 
                tabIndex={0}
                role="region"
                aria-label="Tabel Rincian Soal Rapor"
                className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <table className="w-full min-w-[560px] text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 uppercase font-black border-b border-slate-200 print:bg-slate-100">
                    <tr>
                      <th className="px-2.5 py-2.5 text-center border-r border-slate-200 w-10">No</th>
                      <th className="px-3.5 py-2.5 border-r border-slate-200">Keterangan / Juz</th>
                      <th className="px-2.5 py-2.5 text-center text-red-600 border-r border-slate-200 whitespace-nowrap">SB (-1.0)</th>
                      <th className="px-2.5 py-2.5 text-center text-amber-600 border-r border-slate-200 whitespace-nowrap">SK (-0.2)</th>
                      <th className="px-2.5 py-2.5 text-center text-indigo-600 border-r border-slate-200 whitespace-nowrap">Tahsin</th>
                      <th className="px-2.5 py-2.5 text-center border-r border-slate-200">KBE</th>
                      <th className="px-3.5 py-2.5 text-center font-black bg-slate-200/60 border-r border-slate-200 whitespace-nowrap">
                        Nilai Akhir
                      </th>
                      <th className="px-3 py-2.5 text-center">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeRecord.soal.map((s, idx) => (
                      <tr key={s.nomorSoal} className="hover:bg-slate-50 transition">
                        <td className="px-2.5 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="px-3.5 py-2 font-semibold text-slate-800 border-r border-slate-200">
                          Soal {idx + 1} {s.juzLabel ? `(${s.juzLabel})` : ''}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono text-red-600 font-bold border-r border-slate-200">
                          {s.sb}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono text-amber-600 font-bold border-r border-slate-200">
                          {s.sk}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono text-indigo-600 font-bold border-r border-slate-200">
                          {s.tahsin}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono text-slate-600 border-r border-slate-200">
                          {s.kbe.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2 text-center font-mono font-black text-slate-900 bg-slate-50 border-r border-slate-200">
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
            </div>

            {/* B. TAMPILAN KARTU BUTIR SOAL DI MOBILE (Sangat rapi, ramah jempol, tidak gepeng) */}
            <div className={`${showMobileTableMode ? 'hidden' : 'block sm:hidden'} print:hidden space-y-2.5`}>
              {activeRecord.soal.map((s, idx) => {
                const pred = getPredikat(s.nilaiAkhirSoal);
                const badgeStyle = getPredikatBadgeStyle(pred);
                return (
                  <div
                    key={s.nomorSoal}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-xs text-slate-800">
                          Soal {idx + 1} {s.juzLabel ? `• ${s.juzLabel}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {s.nilaiAkhirSoal.toFixed(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${badgeStyle.bg} ${badgeStyle.border}`}>
                          {pred}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown metrics in 4 compact pills */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono text-[11px]">
                      <div className="p-1.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-sans font-bold">SB (-1)</span>
                        <span className={`font-bold ${s.sb > 0 ? 'text-red-600' : 'text-slate-600'}`}>{s.sb}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-sans font-bold">SK (-0.2)</span>
                        <span className={`font-bold ${s.sk > 0 ? 'text-amber-600' : 'text-slate-600'}`}>{s.sk}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-sans font-bold">Tahsin</span>
                        <span className="font-bold text-indigo-600">{s.tahsin}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-sans font-bold">KBE</span>
                        <span className="font-bold text-slate-700">{s.kbe.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KOTAK RATA-RATA AKHIR & PREDIKAT */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:bg-transparent print:border-black">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
                Rata-Rata Akhir Evaluasi:
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono mt-0.5 print:text-black">
                {activeRecord.rataRata.toFixed(1)}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-950 block mb-1">
                Predikat & Kategori Kelulusan:
              </span>
              <span className={`inline-block px-4 py-1.5 rounded-full font-black text-xs uppercase border shadow-2xs ${
                getPredikatBadgeStyle(activeRecord.predikat).bg
              } ${getPredikatBadgeStyle(activeRecord.predikat).border}`}>
                {activeRecord.predikat}
              </span>
            </div>
          </div>

          {/* TANDA TANGAN RESMI */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-4 text-xs text-center border-t border-slate-200 print:break-inside-avoid">
            <div>
              <p className="text-slate-500 mb-14 sm:mb-16">Penguji Tahfidz,</p>
              <p className="font-black text-slate-900 underline underline-offset-4 text-xs sm:text-sm">
                {activeRecord.pengujiNama}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Asatidz Penguji</p>
            </div>

            <div>
              <p className="text-slate-500 mb-14 sm:mb-16 leading-tight">
                Mengetahui,<br />Koordinator Tahfidz Al-Qur'an,
              </p>
              <p className="font-black text-slate-900 underline underline-offset-4 text-xs sm:text-sm">
                Ust. Dr. Muhammad Ihsan, Lc., M.A.
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Koordinator Bidang Al-Qur'an</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
