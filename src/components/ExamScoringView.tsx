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
  Award,
  Search,
  Check,
  Star,
  Clock,
  Edit3,
  HelpCircle,
  TrendingUp,
  User,
  Eye,
  Home,
  Users
} from 'lucide-react';
import { PengujiItem } from '../services/api';
import { triggerHaptic } from '../utils/haptics';
import { saveActiveExamDraft, getActiveExamDraft, clearActiveExamDraft } from '../utils/offlineSync';


interface ExamScoringViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  santriList: Santri[];
  penilaianList: PenilaianRecord[];
  activePengujiNama?: string;
  pengujiList?: PengujiItem[];
  onSavePenilaian: (record: PenilaianRecord) => void;
  onViewRapor: (record: PenilaianRecord) => void;
  targetEditExam?: { santriId: string; jenisUjian: JenisUjian } | null;
  onClearTargetEditExam?: () => void;
}

export const ExamScoringView: React.FC<ExamScoringViewProps> = ({
  marhalah,
  kampus,
  santriList,
  penilaianList,
  activePengujiNama = 'Ust. Ahmad Fauzi, Lc.',
  pengujiList = [],
  onSavePenilaian,
  onViewRapor,
  targetEditExam,
  onClearTargetEditExam,
}) => {
  // Filter santri sesuai konteks Marhalah & Kampus
  const filteredSantri = useMemo(() => {
    return santriList.filter(s => s.marhalah === marhalah && s.kampus === kampus);
  }, [santriList, marhalah, kampus]);

  // Form setup states
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [santriSearch, setSantriSearch] = useState<string>('');
  const [selectedPenguji, setSelectedPenguji] = useState<string>(activePengujiNama);
  const [jenisUjian, setJenisUjian] = useState<JenisUjian>('UAS');
  const [selectedJuz, setSelectedJuz] = useState<string[]>(['Juz 30', 'Juz 29']);
  const [showReviewTableMode, setShowReviewTableMode] = useState<boolean>(false);

  // Handle incoming targetEditExam
  useEffect(() => {
    if (targetEditExam) {
      setSelectedSantriId(targetEditExam.santriId);
      setJenisUjian(targetEditExam.jenisUjian);
      setCurrentStep(0);
      if (onClearTargetEditExam) {
        onClearTargetEditExam();
      }
    }
  }, [targetEditExam, onClearTargetEditExam]);


  // Sync selectedPenguji if activePengujiNama changes
  useEffect(() => {
    if (activePengujiNama) {
      setSelectedPenguji(activePengujiNama);
    }
  }, [activePengujiNama]);

  // Wizard state: 0 = setup, 1..totalSoal = scoring soal, totalSoal+1 = finish review
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

  // Filtered santri options based on search
  const searchedSantriList = useMemo(() => {
    if (!santriSearch.trim()) return filteredSantri;
    const q = santriSearch.toLowerCase();
    return filteredSantri.filter(s => 
      s.nama.toLowerCase().includes(q) || 
      s.nisn.includes(q) || 
      s.kelas.toLowerCase().includes(q)
    );
  }, [filteredSantri, santriSearch]);

  // Check if current santri already has a saved record
  const existingRecord = useMemo(() => {
    if (!selectedSantriId) return null;
    return penilaianList.find(
      p => p.santriId === selectedSantriId && p.jenisUjian === jenisUjian
    ) || null;
  }, [penilaianList, selectedSantriId, jenisUjian]);

  // Active local draft state for UI banner & recovery
  const activeDraft = useMemo(() => {
    if (!selectedSantriId) return null;
    return getActiveExamDraft(selectedSantriId, jenisUjian);
  }, [selectedSantriId, jenisUjian, currentStep]);

  // When santri or exam type changes, check if there's an existing draft/record
  useEffect(() => {
    if (!selectedSantriId) return;

    // Check localStorage draft first (prioritas jika ujian terputus di tengah jalan)
    const draft = getActiveExamDraft(selectedSantriId, jenisUjian);
    if (draft && Array.isArray(draft.soalList) && draft.soalList.length > 0) {
      if (draft.selectedJuz && Array.isArray(draft.selectedJuz) && draft.selectedJuz.length > 0) {
        setSelectedJuz(draft.selectedJuz);
      }
      if (draft.selectedPenguji) {
        setSelectedPenguji(draft.selectedPenguji);
      }
      setSoalList(draft.soalList);
      return;
    }

    if (existingRecord) {
      if (existingRecord.jenisUjian === 'UAS' && existingRecord.selectedJuzList.length > 0) {
        setSelectedJuz(existingRecord.selectedJuzList);
      }
      setSoalList(existingRecord.soal);
    } else {
      initNewQuestions();
    }
  }, [selectedSantriId, jenisUjian, existingRecord]);

  // Auto-save draft ke localStorage setiap ada perubahan nilai atau navigasi step
  useEffect(() => {
    if (!selectedSantriId || currentStep === 0 || soalList.length === 0) return;
    saveActiveExamDraft(selectedSantriId, jenisUjian, {
      santriId: selectedSantriId,
      jenisUjian,
      selectedJuz,
      selectedPenguji,
      soalList,
      currentStep,
    });
  }, [selectedSantriId, jenisUjian, selectedJuz, selectedPenguji, soalList, currentStep]);

  const initNewQuestions = () => {
    const total = jenisUjian === 'UAS' ? Math.max(5, selectedJuz.length * 5) : 10;
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
      if (selectedJuz.length === 1) {
        triggerHaptic('warning');
        setToastMessage({
          title: 'Minimal 1 Juz',
          desc: 'Ujian UAS membutuhkan minimal 1 Juz hafalan.',
          type: 'warning'
        });
        return;
      }
      triggerHaptic('light');
      setSelectedJuz(selectedJuz.filter(j => j !== juz));
    } else {
      if (selectedJuz.length >= 10) {
        triggerHaptic('warning');
        setToastMessage({
          title: 'Batas Maksimal',
          desc: 'Maksimal 10 Juz dalam satu siklus ujian (maksimal 50 butir soal).',
          type: 'warning'
        });
        return;
      }
      triggerHaptic('light');
      setSelectedJuz([...selectedJuz, juz]);
    }
  };

  // Quick preset shortcuts for Juz
  const handleJuzPreset = (type: 'juz30' | 'juz29_30' | 'juz28_30' | 'juz1_3') => {
    triggerHaptic('light');
    if (type === 'juz30') setSelectedJuz(['Juz 30']);
    else if (type === 'juz29_30') setSelectedJuz(['Juz 30', 'Juz 29']);
    else if (type === 'juz28_30') setSelectedJuz(['Juz 30', 'Juz 29', 'Juz 28']);
    else if (type === 'juz1_3') setSelectedJuz(['Juz 1', 'Juz 2', 'Juz 3']);
  };

  const handleStartExam = () => {
    if (!currentSantri) {
      triggerHaptic('warning');
      setToastMessage({ title: 'Pilih Santri', desc: 'Silakan pilih santri yang akan diuji terlebih dahulu.', type: 'warning' });
      return;
    }
    if (jenisUjian === 'UAS' && selectedJuz.length === 0) {
      triggerHaptic('warning');
      setToastMessage({ title: 'Pilih Juz', desc: 'Centang minimal 1 Juz yang akan diujikan.', type: 'warning' });
      return;
    }

    triggerHaptic('light');
    const targetTotal = jenisUjian === 'UAS' ? selectedJuz.length * 5 : 10;
    if (soalList.length !== targetTotal) {
      initNewQuestions();
    }

    // Jika ada draf aktif dengan step > 0, lanjutkan ke step tersebut
    if (activeDraft && typeof activeDraft.currentStep === 'number' && activeDraft.currentStep > 0) {
      setCurrentStep(activeDraft.currentStep);
    } else {
      setCurrentStep(1);
    }
  };

  // Adjust score for current question
  const updateScore = (index: number, field: 'sb' | 'sk' | 'tahsin', delta: number) => {
    if (field === 'sb') {
      triggerHaptic(delta > 0 ? 'medium' : 'light');
    } else {
      triggerHaptic('light');
    }
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

  // Set direct preset score for current question
  const setQuickScorePreset = (index: number, type: 'mumtaz' | 'lancar_baik' | 'reset') => {
    if (type === 'reset') {
      triggerHaptic('heavy');
    } else {
      triggerHaptic('light');
    }
    setSoalList(prev => {
      const next = [...prev];
      const cur = { ...next[index] };

      if (type === 'mumtaz') {
        cur.sb = 0;
        cur.sk = 0;
        cur.tahsin = 6;
      } else if (type === 'lancar_baik') {
        cur.sb = 0;
        cur.sk = 1;
        cur.tahsin = 2;
      } else if (type === 'reset') {
        cur.sb = 0;
        cur.sk = 0;
        cur.tahsin = 2;
      }

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
  const handleSaveProgress = (returnToHome: boolean = false) => {
    if (!currentSantri) return;

    const agregat = hitungAgregatUjian(soalList, jenisUjian === 'UAS', selectedJuz);
    const record: PenilaianRecord = {
      id: existingRecord?.id || `eval-${Date.now()}`,
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
    clearActiveExamDraft(currentSantri.id, jenisUjian);
    triggerHaptic('success');
    setToastMessage({
      title: 'Progress Cicilan Tersimpan!',
      desc: returnToHome
        ? `Nilai ${currentSantri.nama} hingga Soal ${currentStep} aman tersimpan. Silakan pilih santri berikutnya untuk diuji.`
        : `Nilai hingga Soal ${currentStep} (${currentSoal?.juzLabel || 'UTS'}) aman tersimpan. Anda atau asatidz lain dapat melanjutkan kapan saja.`,
      type: 'success'
    });

    if (returnToHome) {
      setCurrentStep(0);
    }
  };

  // Final Submit
  const handleFinalSubmit = () => {
    if (!currentSantri) return;

    const agregat = hitungAgregatUjian(soalList, jenisUjian === 'UAS', selectedJuz);
    const record: PenilaianRecord = {
      id: existingRecord?.id || `eval-${Date.now()}`,
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
    clearActiveExamDraft(currentSantri.id, jenisUjian);
    triggerHaptic('success');
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

  // Current question progress %
  const progressPercent = totalQuestions > 0 ? Math.round((currentStep / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl shadow-lg border flex items-start gap-3 transition-all animate-in slide-in-from-top-2 z-20 ${
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
            <p className="mt-0.5 opacity-90 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold px-2 py-1 rounded-md hover:bg-black/5 active:scale-95"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP INDICATOR BREADCRUMB */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setCurrentStep(0);
          }}
          className={`flex items-center gap-2 sm:gap-3 p-1 rounded-xl transition-all ${
            currentStep === 0
              ? 'cursor-default'
              : 'hover:bg-slate-100/90 active:scale-95 cursor-pointer text-slate-700'
          }`}
          title="Klik untuk kembali ke Persiapan Ujian & Ganti Santri"
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
            currentStep === 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
          }`}>
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-bold ${currentStep === 0 ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
            Persiapan Ujian
          </span>
        </button>

        <div className="w-6 sm:w-12 h-0.5 bg-slate-200"></div>

        <button
          type="button"
          onClick={() => {
            if (currentStep > totalQuestions) {
              triggerHaptic('light');
              setCurrentStep(totalQuestions);
            }
          }}
          className={`flex items-center gap-2 sm:gap-3 p-1 rounded-xl transition-all ${
            currentStep >= 1 && currentStep <= totalQuestions
              ? 'cursor-default'
              : currentStep > totalQuestions
              ? 'hover:bg-slate-100/90 active:scale-95 cursor-pointer text-slate-700'
              : 'cursor-default text-slate-400'
          }`}
          title="Penilaian Butir Soal"
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
            currentStep >= 1 && currentStep <= totalQuestions
              ? 'bg-emerald-600 text-white shadow-xs'
              : currentStep > totalQuestions
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-400'
          }`}>
            2
          </div>
          <span className={`text-xs font-bold ${
            currentStep >= 1 && currentStep <= totalQuestions ? 'text-slate-900' : 'text-slate-500'
          }`}>
            Penilaian Soal
          </span>
        </button>

        <div className="w-6 sm:w-12 h-0.5 bg-slate-200"></div>

        <div className="flex items-center gap-2 sm:gap-3 p-1">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
            currentStep > totalQuestions ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
          }`}>
            3
          </div>
          <span className={`text-xs font-bold ${currentStep > totalQuestions ? 'text-slate-900' : 'text-slate-500'}`}>
            Review & Simpan
          </span>
        </div>
      </div>

      {/* STEP 0: PERSIAPAN & PILIH SANTRI */}
      {currentStep === 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-block">
                  Tahfidz Oral Examination
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  Persiapan Ujian Lisan Santri
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan santri yang akan diuji, jenis evaluasi, serta cakupan juz hafalan.
                </p>
              </div>
              <div className="hidden sm:block bg-white/80 p-2.5 rounded-xl border border-emerald-100 shrink-0 text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Unit Ujian:</span>
                <span className="text-xs font-extrabold text-emerald-950">
                  {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} • {kampus === 'BANIN' ? 'Banin' : 'Banat'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* 1. Penguji yang Menyimak */}
            <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200">
                  Ust
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Asatidz / Penguji yang Menyimak:
                  </label>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {selectedPenguji || activePengujiNama || 'Ust. Penguji'}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedPenguji}
                  onChange={(e) => setSelectedPenguji(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
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

            {/* 2. Jenis Ujian: UTS vs UAS */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Pilih Jenis Ujian Tahfidz:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisUjian('UTS')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    jenisUjian === 'UTS'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900">
                      Penilaian Tengah Semester (UTS)
                    </span>
                    {jenisUjian === 'UTS' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Standar 10 butir soal (Sesi 1: Soal 1–5, Sesi 2: Soal 6–10).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisUjian('UAS')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    jenisUjian === 'UAS'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900">
                      Penilaian Akhir Semester (UAS / PAS)
                    </span>
                    {jenisUjian === 'UAS' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Dinamis 1–10 Juz sesuai capaian santri (5 Soal per 1 Juz).
                  </p>
                </button>
              </div>
            </div>

            {/* 3. Pilih Santri dengan Search / Filter Cepat */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Pilih Nama Santri Peserta Ujian:
              </label>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={santriSearch}
                  onChange={(e) => setSantriSearch(e.target.value)}
                  placeholder="Ketik nama santri atau kelas untuk memfilter daftar..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Santri Select Grid / List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/40">
                {searchedSantriList.map((s) => {
                  const isSelected = s.id === selectedSantriId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSantriId(s.id)}
                      className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-xs truncate">{s.nama}</p>
                        <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          Kelas: {s.kelas} • NIS: {s.nisn}
                        </p>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0">
                          {s.kelas}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Santri Detail Preview Card */}
              {currentSantri && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 border border-emerald-200/90 shadow-2xs mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {currentSantri.nama.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Santri Terpilih:</span>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">{currentSantri.nama}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-700">NIS: {currentSantri.nisn}</span>
                        <span>•</span>
                        <span className="font-extrabold text-emerald-800">{currentSantri.kelas}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                      {currentSantri.targetJuz || 'Juz 30'}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Cicilan / Nilai Tersimpan Ditemukan (Diletakkan tepat di bawah kartu Santri Terpilih) */}
              {existingRecord && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/90 flex items-start gap-3 text-xs text-amber-950 mt-2 shadow-2xs">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-amber-950">
                        Data {existingRecord.status === 'DRAFT' ? 'Cicilan Ujian' : 'Ujian Tersimpan'} Ditemukan
                      </span>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border ${
                        existingRecord.status === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-200 text-amber-900 border-amber-300'
                      }`}>
                        {existingRecord.status === 'DRAFT' ? 'Draft Cicilan' : 'Selesai'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">
                      Santri <strong>{existingRecord.namaSantri}</strong> memiliki rekaman ujian pada {existingRecord.updatedAt} oleh {existingRecord.pengujiNama}. Rata-rata sementara: <strong className="text-emerald-800 font-mono font-black">{existingRecord.rataRata.toFixed(1)}</strong> ({existingRecord.predikat}).
                    </p>
                  </div>
                </div>
              )}

              {/* Status Draf Ujian Berjalan Lokal (Offline Auto-Draft Protection) */}
              {activeDraft && typeof activeDraft.currentStep === 'number' && activeDraft.currentStep > 0 && (
                <div className="p-4 rounded-2xl bg-teal-50/95 border border-teal-300 flex items-start gap-3 text-xs text-teal-950 mt-2 shadow-2xs animate-fade-in">
                  <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-teal-950">
                        Draf Ujian Berjalan Tersimpan di Perangkat Ini
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-200 text-teal-900 border border-teal-300">
                        Soal {activeDraft.currentStep} Tersimpan
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">
                      Sesi ujian untuk <strong>{currentSantri?.nama}</strong> tersimpan aman di memori offline perangkat ini. Anda dapat melanjutkan pengujian tanpa mengulang dari awal.
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setCurrentStep(activeDraft.currentStep);
                        }}
                        className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 transition"
                      >
                        Lanjutkan dari Soal {activeDraft.currentStep}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('heavy');
                          clearActiveExamDraft(selectedSantriId, jenisUjian);
                          initNewQuestions();
                          setToastMessage({
                            title: 'Draf Dihapus',
                            desc: 'Draf ujian lokal telah dibersihkan.',
                            type: 'info'
                          });
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold active:scale-95 transition"
                      >
                        Reset / Buang Draf
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Khusus UAS: Checklist Juz (Juz 1 s/d 30) */}
            {jenisUjian === 'UAS' && (
              <div className="p-4 sm:p-5 bg-emerald-50/60 rounded-3xl border border-emerald-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      Pilih Juz yang Diujikan (Maks. 10 Juz):
                    </h3>
                    <p className="text-[11px] text-emerald-800/80">
                      Setiap 1 juz terdiri dari 5 butir soal hafalan.
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs self-start sm:self-auto">
                    {selectedJuz.length} Juz Dipilih • {selectedJuz.length * 5} Butir Soal
                  </span>
                </div>

                {/* Quick Presets for Juz Selection */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 self-center mr-1">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleJuzPreset('juz30')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 shadow-2xs"
                  >
                    Juz 30 (5 Soal)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJuzPreset('juz29_30')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 shadow-2xs"
                  >
                    Juz 30 & 29 (10 Soal)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJuzPreset('juz28_30')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 shadow-2xs"
                  >
                    Juz 28–30 (15 Soal)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJuzPreset('juz1_3')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 shadow-2xs"
                  >
                    Juz 1–3 (15 Soal)
                  </button>
                </div>

                {/* Grid Checklist Juz 30 s/d 1 */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 p-2.5 bg-white rounded-2xl border border-emerald-200/90 max-h-52 overflow-y-auto">
                  {Array.from({ length: 30 }, (_, i) => 30 - i).map(juzNum => {
                    const juzName = `Juz ${juzNum}`;
                    const isChecked = selectedJuz.includes(juzName);
                    return (
                      <button
                        key={juzNum}
                        type="button"
                        onClick={() => handleJuzToggle(juzName)}
                        className={`py-2 px-1 rounded-xl text-xs font-black border transition-all text-center ${
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

            {/* Tombol Mulai / Edit Ujian */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              {existingRecord && (
                <button
                  type="button"
                  onClick={() => {
                    handleStartExam();
                    setCurrentStep(totalQuestions + 1);
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-black rounded-2xl border border-slate-300 transition-all flex items-center justify-center gap-2 active:scale-95 btn-tactile"
                >
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <span>Review & Langsung Ubah Butir Soal</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleStartExam}
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 btn-tactile"
              >
                <span>{existingRecord ? 'Edit Mulai dari Soal 1' : 'Mulai / Buka Lembar Penilaian'}</span>
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Santri yang Diuji:</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {currentSantri?.nama}
                  <span className="text-xs font-semibold text-slate-500 ml-2">
                    ({currentSantri?.kelas})
                  </span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCurrentStep(0);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 btn-tactile border border-slate-200"
                  title="Kembali ke Beranda / Persiapan Ujian untuk pilih santri lain"
                >
                  <Home className="w-3.5 h-3.5 text-slate-600" />
                  <span>Beranda / Ganti Santri</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProgress(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 btn-tactile"
                  title="Simpan cicilan nilai santri ini lalu kembali ke beranda untuk santri berikutnya"
                >
                  <Save className="w-3.5 h-3.5 text-amber-700" />
                  <span>Simpan & Ganti Santri</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>Progress Soal ({currentStep} dari {totalQuestions})</span>
                <span className="text-emerald-700">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Navigation Pills: Lompat Juz / Kelompok Soal */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Navigasi Cepat Butir Soal:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {soalList.map((s, idx) => {
                  const num = idx + 1;
                  const isCurrent = currentStep === num;
                  const hasErrors = s.sb > 0 || s.sk > 0;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setCurrentStep(num);
                      }}
                      className={`min-w-[34px] h-[34px] rounded-xl text-xs font-black flex items-center justify-center transition-all border shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm scale-105'
                          : hasErrors
                          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                      }`}
                      title={`Soal ${num}: Nilai ${s.nilaiAkhirSoal}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD SOAL UTAMA - DIBERI ANIMASI HALUS SETIAP GANTI SOAL */}
          <div key={currentStep} className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden animate-fade-up">
            {/* Banner Nomor Soal */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">
                  {currentSoal.juzLabel ? `${currentSoal.juzLabel} • Butir Soal` : 'Ujian Tengah Semester (UTS)'}
                </span>
                <h4 className="text-lg sm:text-xl font-black tracking-tight">
                  Soal ke-{currentStep} dari {totalQuestions}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Nilai Soal Ini</span>
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {currentSoal.nilaiAkhirSoal.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Quick Scoring Preset Toolbar (Mumtaz, Lancar, Reset) */}
            <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500">Preset Cepat:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickScorePreset(currentSoalIndex, 'mumtaz')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-black transition flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lancar Sempurna (100)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickScorePreset(currentSoalIndex, 'lancar_baik')}
                  className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg text-xs font-bold transition active:scale-95"
                >
                  Lancar Baik (98)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickScorePreset(currentSoalIndex, 'reset')}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Input Counter SB, SK, Tahsin */}
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                {/* 1. Salah Besar (SB) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Salah Besar (SB)
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                      -1.0 per salah
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Lupa ayat, tertukar baris/ayat, atau harakat fatal yang mengubah makna.
                  </p>

                  <div className="flex items-center justify-between bg-slate-50/70 rounded-2xl p-1.5 border border-slate-200/70 mt-3">
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sb', -1)}
                      className="w-12 h-12 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-lg font-bold flex items-center justify-center shadow-2xs btn-tactile active:scale-90"
                      aria-label="Kurangi Salah Besar"
                    >
                      −
                    </button>
                    <div className="text-center px-4">
                      <span key={currentSoal.sb} className={`text-3xl font-black font-mono tracking-tight animate-pop inline-block ${
                        currentSoal.sb > 0 ? 'text-rose-600' : 'text-slate-800'
                      }`}>
                        {currentSoal.sb}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sb', +1)}
                      className="w-12 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-lg font-bold flex items-center justify-center shadow-xs btn-tactile active:scale-90"
                      aria-label="Tambah Salah Besar"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2. Salah Kecil (SK) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Salah Kecil (SK)
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                      -0.2 (5 SK = 1 SB)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ragu sejenak lalu membetulkan sendiri, atau tajwid ringan.
                  </p>

                  <div className="flex items-center justify-between bg-slate-50/70 rounded-2xl p-1.5 border border-slate-200/70 mt-3">
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sk', -1)}
                      className="w-12 h-12 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-lg font-bold flex items-center justify-center shadow-2xs btn-tactile active:scale-90"
                      aria-label="Kurangi Salah Kecil"
                    >
                      −
                    </button>
                    <div className="text-center px-4">
                      <span key={currentSoal.sk} className={`text-3xl font-black font-mono tracking-tight animate-pop inline-block ${
                        currentSoal.sk > 0 ? 'text-amber-600' : 'text-slate-800'
                      }`}>
                        {currentSoal.sk}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'sk', +1)}
                      className="w-12 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-lg font-bold flex items-center justify-center shadow-xs btn-tactile active:scale-90"
                      aria-label="Tambah Salah Kecil"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Tahsin / Tajwid (0-6) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tahsin / Tajwid
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                      Skor 0 s.d. 6
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Makhraj huruf, sifat huruf, kelancaran tartil sesuai kaidah.
                  </p>

                  <div className="flex items-center justify-between bg-slate-50/70 rounded-2xl p-1.5 border border-slate-200/70 mt-3">
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'tahsin', -1)}
                      className="w-12 h-12 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-lg font-bold flex items-center justify-center shadow-2xs btn-tactile active:scale-90"
                      aria-label="Kurangi Skor Tahsin"
                    >
                      −
                    </button>
                    <div className="text-center px-4">
                      <span key={currentSoal.tahsin} className="text-3xl font-black font-mono tracking-tight text-emerald-800 animate-pop inline-block">
                        {currentSoal.tahsin}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateScore(currentSoalIndex, 'tahsin', +1)}
                      className="w-12 h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-bold flex items-center justify-center shadow-xs btn-tactile active:scale-90"
                      aria-label="Tambah Skor Tahsin"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Tombol Navigasi Soal (Diposisikan langsung di bawah input skor) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                {/* Sisi Kiri: Kembali ke Beranda & Soal Sebelumnya */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCurrentStep(0);
                    }}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5 active:scale-95 btn-tactile"
                    title="Kembali ke Beranda / Persiapan Ujian"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Beranda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCurrentStep(prev => Math.max(1, prev - 1));
                    }}
                    disabled={currentStep === 1}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 active:scale-95 btn-tactile"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Sebelumnya</span>
                  </button>
                </div>

                {/* Sisi Kanan: Simpan Sementara (Cicilan) & Soal Selanjutnya */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveProgress(true)}
                    className="w-full sm:w-auto px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition flex items-center justify-center gap-2 active:scale-95 btn-tactile"
                    title="Simpan cicilan nilai santri ini lalu kembali ke beranda untuk santri lainnya"
                  >
                    <Save className="w-4 h-4 text-amber-700" />
                    <span>Simpan & Ganti Santri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCurrentStep(prev => prev + 1);
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/15 transition flex items-center justify-center gap-2 active:scale-95 btn-tactile"
                  >
                    <span>{currentStep === totalQuestions ? 'Review Seluruh Nilai' : 'Soal Selanjutnya'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rincian Live Calculation Soal Ini (Hasil Sementara) */}
              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">KBE (SB + SK/5):</span>
                  <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
                    {currentSoal.kbe.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Nilai Dasar:</span>
                  <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
                    {currentSoal.nilaiDasar.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Bonus Tahsin:</span>
                  <span className="font-bold text-emerald-800 text-sm font-mono mt-0.5 block">
                    +{currentSoal.bonusTahsin}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Predikat Soal:</span>
                  <span className="font-bold text-emerald-900 text-sm mt-0.5 block">
                    {getPredikat(currentSoal.nilaiAkhirSoal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP FINISH: REVIEW AKHIR SELURUH NILAI & SIMPAN PERMANEN */}
      {currentStep > totalQuestions && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-200/70 px-2.5 py-0.5 rounded-full inline-block">
                  Tahap Konfirmasi Akhir
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
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
                <div className="p-5 rounded-3xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      Rata-Rata Akhir Keseluruhan:
                    </span>
                    <div className="text-4xl font-black text-emerald-800 mt-1 font-mono">
                      {agregat.rataRata.toFixed(1)}
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block mb-1">
                      Predikat Capaian:
                    </span>
                    <span className={`inline-block px-4 py-1.5 rounded-full font-black text-sm uppercase border ${badge.bg} ${badge.border}`}>
                      {agregat.predikat}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Header Bagian Rincian Butir Soal + Toggle Mode Tampilan Mobile */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Rincian Nilai Seluruh Butir Soal ({soalList.length} Soal):
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Periksa kembali nilai per butir soal sebelum menyimpan permanen.
                </span>
              </div>

              {/* Mobile View Switcher (Tampilan Kartu vs Tabel Lengkap) */}
              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowReviewTableMode(!showReviewTableMode);
                  }}
                  className="px-2.5 py-1 rounded-xl border border-slate-300 text-[11px] font-bold text-slate-700 bg-slate-50 flex items-center gap-1.5 active:scale-95 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{showReviewTableMode ? 'Mode Kartu Ringkas' : 'Mode Tabel Lengkap'}</span>
                </button>
              </div>
            </div>

            {/* A. TAMPILAN RESMI TABEL (Desktop selalu tampil, Mobile jika showReviewTableMode = true) */}
            <div className={`${showReviewTableMode ? 'block' : 'hidden sm:block'} space-y-1.5`}>
              {showReviewTableMode && (
                <div className="sm:hidden text-[10px] text-slate-500 font-medium flex items-center gap-1 px-1">
                  <span>↔</span>
                  <span>Geser ke samping untuk melihat seluruh 9 kolom evaluasi</span>
                </div>
              )}
              <div 
                tabIndex={0}
                role="region"
                aria-label="Tabel Review Butir Soal Ujian"
                className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <table className="w-full min-w-[660px] text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-12 border-r border-slate-200 whitespace-nowrap">No</th>
                      <th className="px-3.5 py-2.5 border-r border-slate-200 whitespace-nowrap">Sesi / Cakupan Juz</th>
                      <th className="px-3 py-2.5 text-center text-red-600 border-r border-slate-200 whitespace-nowrap">SB (-1)</th>
                      <th className="px-3 py-2.5 text-center text-amber-600 border-r border-slate-200 whitespace-nowrap">SK (-0.2)</th>
                      <th className="px-3 py-2.5 text-center text-indigo-600 border-r border-slate-200 whitespace-nowrap">Tahsin</th>
                      <th className="px-3 py-2.5 text-center font-bold border-r border-slate-200 whitespace-nowrap">KBE</th>
                      <th className="px-3.5 py-2.5 text-center font-black bg-slate-200/60 border-r border-slate-200 whitespace-nowrap">Nilai Akhir</th>
                      <th className="px-3.5 py-2.5 text-center border-r border-slate-200 whitespace-nowrap">Predikat</th>
                      <th className="px-3.5 py-2.5 text-center w-24 whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {soalList.map((s, idx) => (
                      <tr key={s.nomorSoal} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200 whitespace-nowrap">{idx + 1}</td>
                        <td className="px-3.5 py-2 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">Soal {idx + 1} {s.juzLabel ? `(${s.juzLabel})` : ''}</td>
                        <td className="px-3 py-2 text-center font-mono text-red-600 font-bold border-r border-slate-200 whitespace-nowrap">{s.sb}</td>
                        <td className="px-3 py-2 text-center font-mono text-amber-600 font-bold border-r border-slate-200 whitespace-nowrap">{s.sk}</td>
                        <td className="px-3 py-2 text-center font-mono text-indigo-600 font-bold border-r border-slate-200 whitespace-nowrap">{s.tahsin}</td>
                        <td className="px-3 py-2 text-center font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">{s.kbe.toFixed(2)}</td>
                        <td className="px-3.5 py-2 text-center font-mono font-black text-slate-900 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                          {s.nilaiAkhirSoal.toFixed(1)}
                        </td>
                        <td className="px-3.5 py-2 text-center font-bold text-[11px] border-r border-slate-200 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {getPredikat(s.nilaiAkhirSoal)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setCurrentStep(idx + 1);
                            }}
                            className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[10px] font-black transition flex items-center gap-1 mx-auto active:scale-95"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B. TAMPILAN KARTU REVIEW RAMAH MOBILE (Sangat rapi, ramah jempol & tidak gepeng di HP) */}
            <div className={`${showReviewTableMode ? 'hidden' : 'block sm:hidden'} space-y-2.5`}>
              {soalList.map((s, idx) => {
                const pred = getPredikat(s.nilaiAkhirSoal);
                const badge = getPredikatBadgeStyle(pred);
                return (
                  <div
                    key={s.nomorSoal}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">
                            Soal {idx + 1} {s.juzLabel ? `• ${s.juzLabel}` : ''}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-1.5">
                        <span className="text-base font-black text-slate-900 font-mono">
                          {s.nilaiAkhirSoal.toFixed(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.border}`}>
                          {pred}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown SB, SK, Tahsin, KBE */}
                    <div className="grid grid-cols-4 gap-1.5 p-2 bg-white rounded-xl border border-slate-200 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-red-600 block">SB</span>
                        <span className="font-mono font-black text-xs text-red-700">{s.sb}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-amber-600 block">SK</span>
                        <span className="font-mono font-black text-xs text-amber-700">{s.sk}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-indigo-600 block">Tahsin</span>
                        <span className="font-mono font-black text-xs text-indigo-700">{s.tahsin}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">KBE</span>
                        <span className="font-mono font-black text-xs text-slate-700">{s.kbe.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setCurrentStep(idx + 1);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center gap-1.5 active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Koreksi / Ubah Skor Soal Ini</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tombol Aksi Akhir */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCurrentStep(0);
                  }}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-95 flex items-center justify-center gap-1.5 btn-tactile"
                  title="Kembali ke Beranda / Persiapan Ujian"
                >
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>Beranda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCurrentStep(totalQuestions);
                  }}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-95 flex items-center justify-center gap-1.5 btn-tactile"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Edit Soal Terakhir</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-95 btn-tactile"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Final ke Database Terpadu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
