import React, { useState, useEffect, useMemo } from 'react';
import { Santri, Marhalah, Kampus, JenisUjian, SoalDetail, PenilaianRecord } from '../types';
import { hitungNilaiAkhirSoal, getPredikat, hitungAgregatUjian, getPredikatBadgeStyle } from '../utils/scoring';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Info,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

import { PengujiItem } from '../services/api';

interface ExamScoringViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  santriList: Santri[];
  penilaianList: PenilaianRecord[];
  activePengujiNama?: string;
  pengujiList?: PengujiItem[];
  onSavePenilaian: (record: PenilaianRecord) => void;
  onViewRapor: (record: PenilaianRecord) => void;
}

export const ExamScoringView: React.FC<ExamScoringViewProps> = ({
  marhalah,
  kampus,
  santriList,
  penilaianList,
  activePengujiNama = 'Ust. Ahmad Fauzi',
  pengujiList = [],
  onSavePenilaian,
  onViewRapor,
}) => {
  // Filter santri sesuai konteks Marhalah & Kampus
  const filteredSantri = useMemo(() => {
    return santriList.filter(s => s.marhalah === marhalah && s.kampus === kampus);
  }, [santriList, marhalah, kampus]);

  // Form setup states
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [selectedPenguji, setSelectedPenguji] = useState<string>(activePengujiNama);
  const [jenisUjian, setJenisUjian] = useState<JenisUjian>('UAS');
  const [selectedJuz, setSelectedJuz] = useState<string[]>(['Juz 30', 'Juz 29']);

  // Sync selectedPenguji if activePengujiNama changes
  useEffect(() => {
    if (activePengujiNama) {
      setSelectedPenguji(activePengujiNama);
    }
  }, [activePengujiNama]);

  // Wizard state: 0 = setup, 1..totalSoal = scoring soal, totalSoal+1 = finish
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Soal scores state
  const [soalList, setSoalList] = useState<SoalDetail[]>([]);

  // Selected student object
  const currentSantri = useMemo(() => {
    return filteredSantri.find(s => s.id === selectedSantriId);
  }, [filteredSantri, selectedSantriId]);

  // Auto-select first student if available and none selected
  useEffect(() => {
    if (filteredSantri.length > 0 && (!selectedSantriId || !filteredSantri.some(s => s.id === selectedSantriId))) {
      setSelectedSantriId(filteredSantri[0].id);
    }
  }, [filteredSantri, selectedSantriId]);

  // When santri or exam type changes, check if there's an existing draft/record
  useEffect(() => {
    if (!selectedSantriId) return;

    const existingRecord = penilaianList.find(
      p => p.santriId === selectedSantriId && p.jenisUjian === jenisUjian
    );

    if (existingRecord) {
      if (existingRecord.jenisUjian === 'UAS' && existingRecord.selectedJuzList.length > 0) {
        setSelectedJuz(existingRecord.selectedJuzList);
      }
      setSoalList(existingRecord.soal);
      setToastMessage({
        title: 'Data Cicilan Dimuat',
        desc: `Ditemukan data tersimpan untuk ${existingRecord.namaSantri} (${existingRecord.status === 'DRAFT' ? 'Status: Draft Cicilan' : 'Status: Selesai'}).`,
        type: 'info'
      });
    } else {
      initNewQuestions();
    }
  }, [selectedSantriId, jenisUjian]);

  const initNewQuestions = () => {
    const total = jenisUjian === 'UAS' ? selectedJuz.length * 5 : 10;
    const initial: SoalDetail[] = [];

    for (let i = 1; i <= total; i++) {
      let juzLabel = undefined;
      if (jenisUjian === 'UAS') {
        const juzIdx = Math.floor((i - 1) / 5);
        juzLabel = selectedJuz[juzIdx] || `Juz ${juzIdx + 1}`;
      }
      initial.push({
        nomorSoal: i,
        juzLabel,
        sb: 0,
        sk: 0,
        tahsin: 2,
        kbe: 0,
        nilaiDasar: 100,
        bonusTahsin: 0,
        nilaiAkhirSoal: 100,
      });
    }
    setSoalList(initial);
  };

  const handleJuzToggle = (juz: string) => {
    if (selectedJuz.includes(juz)) {
      setSelectedJuz(selectedJuz.filter(j => j !== juz));
    } else {
      if (selectedJuz.length >= 10) {
        setToastMessage({
          title: 'Batas Maksimal Tercapai',
          desc: 'Maksimal hanya dapat memilih 10 Juz dalam sekali ujian.',
          type: 'warning'
        });
        return;
      }
      setSelectedJuz([...selectedJuz, juz]);
    }
  };

  const handleStartExam = () => {
    if (!currentSantri) {
      setToastMessage({ title: 'Pilih Santri', desc: 'Silakan pilih nama santri terlebih dahulu.', type: 'warning' });
      return;
    }
    if (jenisUjian === 'UAS' && selectedJuz.length === 0) {
      setToastMessage({ title: 'Pilih Juz', desc: 'Centang minimal 1 Juz yang akan diujikan.', type: 'warning' });
      return;
    }

    // Ensure questions match current config
    const targetTotal = jenisUjian === 'UAS' ? selectedJuz.length * 5 : 10;
    if (soalList.length !== targetTotal) {
      initNewQuestions();
    }

    setCurrentStep(1);
  };

  // Adjust score for current question
  const updateScore = (index: number, field: 'sb' | 'sk' | 'tahsin', delta: number) => {
    setSoalList(prev => {
      const next = [...prev];
      const cur = { ...next[index] };

      let nextVal = cur[field] + delta;
      if (field === 'sb' || field === 'sk') {
        nextVal = Math.max(0, nextVal);
      } else if (field === 'tahsin') {
        nextVal = Math.max(0, Math.min(6, nextVal));
      }

      cur[field] = nextVal;
      const calc = hitungNilaiAkhirSoal(cur.sb, cur.sk, cur.tahsin);
      cur.kbe = calc.kbe;
      cur.nilaiDasar = calc.nilaiDasar;
      cur.bonusTahsin = calc.bonusTahsin;
      cur.nilaiAkhirSoal = calc.nilaiAkhirSoal;

      next[index] = cur;
      return next;
    });
  };

  const totalQuestions = jenisUjian === 'UAS' ? selectedJuz.length * 5 : 10;
  const currentSoalIndex = currentStep - 1;
  const currentSoal = soalList[currentSoalIndex];

  // Save Progress (Cicilan)
  const handleSaveProgress = () => {
    if (!currentSantri) return;

    const agregat = hitungAgregatUjian(soalList, jenisUjian === 'UAS', selectedJuz);
    const record: PenilaianRecord = {
      id: `eval-${Date.now()}`,
      santriId: currentSantri.id,
      namaSantri: currentSantri.nama,
      nisn: currentSantri.nisn,
      kelas: currentSantri.kelas,
      marhalah,
      kampus,
      jenisUjian,
      tahunAjaran: '2026/2027',
      semester: 'Ganjil',
      selectedJuzList: jenisUjian === 'UAS' ? selectedJuz : [],
      jumlahJuz: jenisUjian === 'UAS' ? selectedJuz.length : 0,
      totalSoal: totalQuestions,
      soal: soalList,
      nilaiPerJuz: agregat.nilaiPerJuz,
      rataRata: agregat.rataRata,
      predikat: agregat.predikat,
      status: 'DRAFT',
      pengujiNama: selectedPenguji || activePengujiNama || 'Ust. Penguji',
      updatedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    };

    onSavePenilaian(record);
    setToastMessage({
      title: 'Progress Cicilan Tersimpan!',
      desc: `Nilai hingga Soal ${currentStep} (${currentSoal?.juzLabel || 'UTS'}) berhasil disimpan. Anda dapat melanjutkan kapan saja.`,
      type: 'success'
    });
  };

  // Final Submit
  const handleFinalSubmit = () => {
    if (!currentSantri) return;

    const agregat = hitungAgregatUjian(soalList, jenisUjian === 'UAS', selectedJuz);
    const record: PenilaianRecord = {
      id: `eval-${Date.now()}`,
      santriId: currentSantri.id,
      namaSantri: currentSantri.nama,
      nisn: currentSantri.nisn,
      kelas: currentSantri.kelas,
      marhalah,
      kampus,
      jenisUjian,
      tahunAjaran: '2026/2027',
      semester: 'Ganjil',
      selectedJuzList: jenisUjian === 'UAS' ? selectedJuz : [],
      jumlahJuz: jenisUjian === 'UAS' ? selectedJuz.length : 0,
      totalSoal: totalQuestions,
      soal: soalList,
      nilaiPerJuz: agregat.nilaiPerJuz,
      rataRata: agregat.rataRata,
      predikat: agregat.predikat,
      status: 'SELESAI',
      pengujiNama: selectedPenguji || activePengujiNama || 'Ust. Penguji',
      updatedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    };

    onSavePenilaian(record);
    setToastMessage({
      title: 'Alhamdulillah! Ujian Selesai',
      desc: `Seluruh penilaian ${currentSantri.nama} berhasil tersimpan ke sistem. Rata-rata akhir: ${agregat.rataRata} (${agregat.predikat}).`,
      type: 'success'
    });
    setCurrentStep(0);
  };

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 transition-all animate-in slide-in-from-top-2 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : toastMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : toastMessage.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-sm">{toastMessage.title}</p>
            <p className="mt-0.5 opacity-90">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold px-2 py-1 rounded-md hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 0: PENGATURAN AWAL & PILIH SANTRI */}
      {currentStep === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Form Penguji Ujian Lisan
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Persiapan Evaluasi Hafalan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih santri yang akan diuji dan atur juz yang akan dievaluasi.
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs text-slate-400 block">Unit Terpilih:</span>
                <span className="text-sm font-bold text-slate-800">
                  {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} ({kampus === 'BANIN' ? 'Banin' : 'Banat'})
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* 0. Identitas Penguji yang Menyimak */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  Ust
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-emerald-950 tracking-wider">
                    Asatidz / Penguji yang Menyimak:
                  </label>
                  <p className="text-[11px] text-emerald-700">
                    Nilai ujian santri akan resmi terdata disimak oleh penguji ini.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedPenguji}
                  onChange={(e) => setSelectedPenguji(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                >
                  {pengujiList.length > 0 ? (
                    pengujiList.map(p => (
                      <option key={p.id} value={p.nama}>
                        {p.nama} {p.tipeAsal ? `(${p.tipeAsal})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value={selectedPenguji}>{selectedPenguji}</option>
                  )}
                </select>
              </div>
            </div>

            {/* 1. Jenis Ujian */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Jenis Ujian:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    jenisUjian === 'UTS'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="jenisUjian"
                    value="UTS"
                    checked={jenisUjian === 'UTS'}
                    onChange={() => setJenisUjian('UTS')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">UTS (Tengah Semester)</span>
                    <span className="block text-xs text-slate-500">Standar 10 Soal Evaluasi Hafalan</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    jenisUjian === 'UAS'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="jenisUjian"
                    value="UAS"
                    checked={jenisUjian === 'UAS'}
                    onChange={() => setJenisUjian('UAS')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">UAS / PAS (Akhir Semester)</span>
                    <span className="block text-xs text-slate-500">Dinamis 1–10 Juz (5 Soal per Juz)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Pilih Santri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Nama Santri:
                </label>
                <select
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {filteredSantri.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} — {s.kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  NISN:
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentSantri?.nisn || '-'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Info Halaqah & Target Santri */}
            {currentSantri && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Halaqah:</span>
                  <span className="text-slate-600">{currentSantri.halaqah || 'Umum'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-800">Target Kurikulum:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                    {currentSantri.targetJuz || 'Juz 30'}
                  </span>
                </div>
              </div>
            )}

            {/* 3. Khusus UAS: Checklist Juz (Juz 1 s/d 30) */}
            {jenisUjian === 'UAS' && (
              <div className="p-4 sm:p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                      Pilih Juz yang Diujikan (Maks. 10 Juz):
                    </h3>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5">
                      Setiap 1 juz terdiri dari 5 butir soal hafalan.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
                    {selectedJuz.length} Juz ({selectedJuz.length * 5} Soal)
                  </span>
                </div>

                {/* Grid Checklist Juz 30 s/d 1 */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 p-2 bg-white rounded-xl border border-emerald-200/80 max-h-48 overflow-y-auto">
                  {Array.from({ length: 30 }, (_, i) => 30 - i).map(juzNum => {
                    const juzName = `Juz ${juzNum}`;
                    const isChecked = selectedJuz.includes(juzName);
                    return (
                      <button
                        key={juzNum}
                        type="button"
                        onClick={() => handleJuzToggle(juzName)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        Juz {juzNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tombol Mulai Ujian */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleStartExam}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Mulai / Buka Lembar Penilaian</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1..N: LEMBAR PENILAIAN PER SOAL (WIZARD PENGUJI) */}
      {currentStep >= 1 && currentStep <= totalQuestions && currentSoal && (
        <div className="space-y-4">
          {/* Header Soal & Navigation Pill */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400">Santri yang Diuji:</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {currentSantri?.nama} ({currentSantri?.kelas})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                >
                  Pengaturan
                </button>
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Cicilan</span>
                </button>
              </div>
            </div>

            {/* Quick Navigation Pills: Lompat Juz / Kelompok Soal */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Navigasi Soal / Juz:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {jenisUjian === 'UAS'
                  ? selectedJuz.map((juzName, idx) => {
                      const start = idx * 5 + 1;
                      const end = start + 4;
                      const isActive = currentStep >= start && currentStep <= end;
                      return (
                        <button
                          key={juzName}
                          type="button"
                          onClick={() => setCurrentStep(start)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          {juzName} {isActive ? '⚡' : ''}
                        </button>
                      );
                    })
                  : (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          currentStep >= 1 && currentStep <= 5
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        Soal 1–5
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(6)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          currentStep >= 6 && currentStep <= 10
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        Soal 6–10
                      </button>
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* CARD SOAL UTAMA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Banner Nomor Soal */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest block">
                  {currentSoal.juzLabel ? `${currentSoal.juzLabel} • Butir Soal` : 'Ujian Tengah Semester'}
                </span>
                <h4 className="text-lg font-black tracking-tight">
                  Soal ke-{currentStep} dari {totalQuestions}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Nilai Soal Ini</span>
                <span className="text-2xl font-black">{currentSoal.nilaiAkhirSoal.toFixed(1)}</span>
              </div>
            </div>

            {/* Input Counter SB, SK, Tahsin */}
            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Salah Besar (SB) */}
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-red-900 uppercase tracking-wider">
                      Salah Besar (SB)
                    </span>
                    <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      -1.0 / salah
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Lupa ayat / tertukar ayat & harakat fatal.</p>

                  <div className="flex items-center justify-between bg-white rounded-xl border border-red-200 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sb', -1)}
                      className="px-4 py-2.5 text-lg font-black text-slate-600 hover:bg-red-100 hover:text-red-700 transition"
                    >
                      -
                    </button>
                    <span className="text-xl font-black text-red-700 font-mono">
                      {currentSoal.sb}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sb', +1)}
                      className="px-4 py-2.5 text-lg font-black text-slate-600 hover:bg-red-100 hover:text-red-700 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2. Salah Kecil (SK) */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                      Salah Kecil (SK)
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      -0.2 (SK/5)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Ragu sejenak lalu membetulkan sendiri.</p>

                  <div className="flex items-center justify-between bg-white rounded-xl border border-amber-200 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sk', -1)}
                      className="px-4 py-2.5 text-lg font-black text-slate-600 hover:bg-amber-100 hover:text-amber-700 transition"
                    >
                      -
                    </button>
                    <span className="text-xl font-black text-amber-700 font-mono">
                      {currentSoal.sk}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sk', +1)}
                      className="px-4 py-2.5 text-lg font-black text-slate-600 hover:bg-amber-100 hover:text-amber-700 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Tahsin / Tajwid (0-6) */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                      Tahsin / Tajwid
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      Skor 0 s.d. 6
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Makharijul huruf & shifatul huruf.</p>

                  <div className="flex items-center justify-between bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'tahsin', -1)}
                      className="px-4 py-2.5 text-lg font-black text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition"
                    >
                      -
                    </button>
                    <span className="text-xl font-black text-indigo-700 font-mono">
                      {currentSoal.tahsin}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'tahsin', +1)}
                      className="px-4 py-2.5 text-lg font-black text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Rincian Live Calculation Soal Ini */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">KBE (SB + SK/5):</span>
                  <span className="font-extrabold text-slate-800 text-sm font-mono">
                    {currentSoal.kbe.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nilai Dasar (Min 50):</span>
                  <span className="font-extrabold text-slate-800 text-sm font-mono">
                    {currentSoal.nilaiDasar.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bonus Tahsin:</span>
                  <span className="font-extrabold text-emerald-700 text-sm font-mono">
                    +{currentSoal.bonusTahsin}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Predikat Soal:</span>
                  <span className="font-extrabold text-emerald-800 text-sm">
                    {getPredikat(currentSoal.nilaiAkhirSoal)}
                  </span>
                </div>
              </div>

              {/* Navigasi Bawah */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {/* Tombol Simpan Cicilan setiap kelipatan 5 atau kapan saja */}
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Progress (Cicilan)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <span>{currentStep === totalQuestions ? 'Review & Selesai' : 'Soal Selanjutnya'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP FINISH: REVIEW AKHIR SELURUH NILAI & SIMPAN PERMANEN */}
      {currentStep > totalQuestions && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-200/70 px-2.5 py-0.5 rounded-full">
                  Konfirmasi Akhir
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Ringkasan Nilai Ujian Hafalan
                </h3>
                <p className="text-xs text-slate-500">
                  {currentSantri?.nama} — {currentSantri?.kelas} ({jenisUjian})
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Banner Skor Akhir */}
            {(() => {
              const agregat = hitungAgregatUjian(soalList, jenisUjian === 'UAS', selectedJuz);
              const badge = getPredikatBadgeStyle(agregat.predikat);
              return (
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                      Rata-Rata Akhir Keseluruhan:
                    </span>
                    <div className="text-4xl font-black text-emerald-800 mt-1">
                      {agregat.rataRata.toFixed(1)}
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 block mb-1">
                      Predikat Capaian:
                    </span>
                    <span className={`inline-block px-4 py-1.5 rounded-full font-black text-sm uppercase border ${badge.bg} ${badge.border}`}>
                      {agregat.predikat}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Tabel Review Seluruh Butir Soal */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-center">No</th>
                    <th className="px-3 py-2">Sesi / Juz</th>
                    <th className="px-3 py-2 text-center text-red-600">SB (-1)</th>
                    <th className="px-3 py-2 text-center text-amber-600">SK (-0.2)</th>
                    <th className="px-3 py-2 text-center text-indigo-600">Tahsin</th>
                    <th className="px-3 py-2 text-center font-bold">KBE</th>
                    <th className="px-3 py-2 text-center font-bold bg-slate-200/60">Nilai Akhir</th>
                    <th className="px-3 py-2 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {soalList.map((s, idx) => (
                    <tr key={s.nomorSoal} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{s.juzLabel || 'UTS'}</td>
                      <td className="px-3 py-2 text-center font-mono text-red-600 font-bold">{s.sb}</td>
                      <td className="px-3 py-2 text-center font-mono text-amber-600 font-bold">{s.sk}</td>
                      <td className="px-3 py-2 text-center font-mono text-indigo-600 font-bold">{s.tahsin}</td>
                      <td className="px-3 py-2 text-center font-mono text-slate-600">{s.kbe.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-mono font-black text-slate-900 bg-slate-50">
                        {s.nilaiAkhirSoal.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-[11px]">
                        {getPredikat(s.nilaiAkhirSoal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tombol Aksi Akhir */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(totalQuestions)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Kembali Edit Soal
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Final ke Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
