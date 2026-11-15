import React, { useState, useEffect } from 'react';
import { Marhalah, Kampus, PenilaianRecord, Santri, JenisUjian } from './types';
import { MOCK_SANTRI, MOCK_PENILAIAN } from './data/mockData';
import { api, PengujiItem } from './services/api';
import { Navbar } from './components/Navbar';
import { ExamScoringView } from './components/ExamScoringView';
import { ReportCardView } from './components/ReportCardView';
import { MasterRecapView } from './components/MasterRecapView';
import { MasterDataView } from './components/MasterDataView';
import { RumusModal } from './components/RumusModal';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  getCachedSantri,
  setCachedSantri,
  getCachedPenilaian,
  setCachedPenilaian,
  updateLocalPenilaianCache,
  removeLocalPenilaianCache,
  getCachedPenguji,
  setCachedPenguji,
  getSyncQueue,
  addToSyncQueue,
  processSyncQueue,
} from './utils/offlineSync';

export function App() {
  const [marhalah, setMarhalah] = useState<Marhalah>('ULA_MTS');
  const [kampus, setKampus] = useState<Kampus>('BANIN');
  const [activeTab, setActiveTab] = useState<'input' | 'rapor' | 'rekap' | 'master'>('input');
  const [showRumusModal, setShowRumusModal] = useState<boolean>(false);

  // Network & Offline Sync State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    return getSyncQueue().length;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Cache-first initial data
  const [santriList, setSantriList] = useState<Santri[]>(() => {
    const cached = getCachedSantri();
    return cached.length > 0 ? cached : MOCK_SANTRI;
  });
  const [penilaianList, setPenilaianList] = useState<PenilaianRecord[]>(() => {
    const cached = getCachedPenilaian();
    return cached.length > 0 ? cached : MOCK_PENILAIAN;
  });
  const [pengujiList, setPengujiList] = useState<PengujiItem[]>(() => {
    return getCachedPenguji();
  });
  const [activePengujiNama, setActivePengujiNama] = useState<string>('Ust. Ahmad Fauzi, Lc.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [targetEditExam, setTargetEditExam] = useState<{ santriId: string; jenisUjian: JenisUjian } | null>(null);

  // Manual & Auto Trigger Sync Queue
  const handleSyncNow = async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await processSyncQueue();
      setPendingSyncCount(res.remaining);
      if (res.processed > 0) {
        // Muat ulang data terbaru dari database setelah antrean berhasil diunggah
        await loadData(kampus, marhalah, false);
      }
    } catch (e) {
      console.warn('Sync queue error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Online / Offline Window Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Begitu koneksi pulih, sinkronkan otomatis antrean yang tertunda
      handleSyncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh count on mount
    setPendingSyncCount(getSyncQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data from Neon Postgres / sync to local cache
  const loadData = async (targetKampus = kampus, targetMarhalah = marhalah, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      if (navigator.onLine) {
        const [santriData, penilaianData, pengujiData] = await Promise.all([
          api.getSantri(),
          api.getPenilaian(),
          api.getPenguji(targetKampus, targetMarhalah),
        ]);

        if (santriData && santriData.length > 0) {
          setSantriList(santriData);
          setCachedSantri(santriData);
        }
        if (penilaianData && penilaianData.length > 0) {
          setPenilaianList(penilaianData);
          setCachedPenilaian(penilaianData);
        }
        if (pengujiData && pengujiData.length > 0) {
          setPengujiList(pengujiData);
          setCachedPenguji(pengujiData);
          if (!pengujiData.some(p => p.nama === activePengujiNama)) {
            setActivePengujiNama(pengujiData[0].nama);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal koneksi ke server, menggunakan data offline cache lokal:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(kampus, marhalah);
  }, [kampus, marhalah]);

  const handleSavePenilaian = async (record: PenilaianRecord) => {
    // 1. Optimistic UI update
    setPenilaianList(prev => {
      const idx = prev.findIndex(
        p => p.santriId === record.santriId && p.jenisUjian === record.jenisUjian
      );
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });

    // 2. Simpan seketika ke cache offline lokal (Offline-First guarantee)
    updateLocalPenilaianCache(record);

    // 3. Jika sedang offline, masukkan langsung ke antrean sinkronisasi
    if (!navigator.onLine) {
      addToSyncQueue({ type: 'penilaian', action: 'save', payload: record });
      setPendingSyncCount(getSyncQueue().length);
      return;
    }

    // 4. Jika online, coba kirim ke Neon Postgres
    try {
      await api.savePenilaian(record);
    } catch (err) {
      console.warn('Gagal sinkron langsung ke server, dialihkan ke antrean offline:', err);
      addToSyncQueue({ type: 'penilaian', action: 'save', payload: record });
      setPendingSyncCount(getSyncQueue().length);
    }
  };

  const handleEditPenilaian = (record: PenilaianRecord) => {
    setTargetEditExam({ santriId: record.santriId, jenisUjian: record.jenisUjian });
    setActiveTab('input');
  };

  const handleDeletePenilaian = async (record: PenilaianRecord) => {
    if (!window.confirm(`Yakin ingin menghapus data nilai ujian ${record.jenisUjian} untuk ${record.namaSantri}?`)) {
      return;
    }
    // Optimistic delete di UI dan cache lokal
    setPenilaianList(prev => prev.filter(p => p.id !== record.id));
    removeLocalPenilaianCache(record.id);

    if (!navigator.onLine) {
      addToSyncQueue({ type: 'penilaian', action: 'delete', payload: record });
      setPendingSyncCount(getSyncQueue().length);
      alert(`Data nilai ${record.namaSantri} dihapus dari perangkat (tersimpan dalam antrean sinkronisasi offline).`);
      return;
    }

    try {
      await api.deletePenilaian(record.id);
      alert(`Data nilai ujian ${record.namaSantri} berhasil dihapus.`);
    } catch (err: any) {
      console.warn('Gagal hapus di server, dimasukkan ke antrean offline:', err);
      addToSyncQueue({ type: 'penilaian', action: 'delete', payload: record });
      setPendingSyncCount(getSyncQueue().length);
    }
  };

  const handleViewRapor = (_record: PenilaianRecord) => {
    setActiveTab('rapor');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-200">
      {/* Navbar with Campus, Unit, and Offline/Sync Status */}
      <Navbar
        marhalah={marhalah}
        setMarhalah={setMarhalah}
        kampus={kampus}
        setKampus={setKampus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pengujiList={pengujiList}
        activePengujiNama={activePengujiNama}
        setActivePengujiNama={setActivePengujiNama}
        onOpenRumus={() => setShowRumusModal(true)}
        syncStatus={{
          isOnline,
          pendingCount: pendingSyncCount,
          isSyncing,
          onSyncNow: handleSyncNow,
        }}
      />

      {/* Main Content View with safe bottom padding for mobile navigation */}
      <main className="flex-1 pb-24 md:pb-12">
        {isLoading && (
          <div className="max-w-7xl mx-auto px-4 py-2 text-center text-xs text-emerald-800 bg-emerald-50 border-b border-emerald-100 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Menyinkronkan data dengan database terpadu Neon Postgres...</span>
          </div>
        )}

        <div key={activeTab} className="animate-fade-up">
          {activeTab === 'input' && (
            <ExamScoringView
              marhalah={marhalah}
              kampus={kampus}
              santriList={santriList}
              penilaianList={penilaianList}
              activePengujiNama={activePengujiNama}
              pengujiList={pengujiList}
              onSavePenilaian={handleSavePenilaian}
              onViewRapor={handleViewRapor}
              targetEditExam={targetEditExam}
              onClearTargetEditExam={() => setTargetEditExam(null)}
            />
          )}

          {activeTab === 'rapor' && (
            <ReportCardView
              marhalah={marhalah}
              kampus={kampus}
              penilaianList={penilaianList}
              onNavigateToInput={() => setActiveTab('input')}
              onEditPenilaian={handleEditPenilaian}
            />
          )}

          {activeTab === 'rekap' && (
            <MasterRecapView
              marhalah={marhalah}
              kampus={kampus}
              penilaianList={penilaianList}
              onEditPenilaian={handleEditPenilaian}
              onDeletePenilaian={handleDeletePenilaian}
            />
          )}

          {activeTab === 'master' && (
            <MasterDataView
              marhalah={marhalah}
              kampus={kampus}
              santriList={santriList}
              onRefresh={loadData}
            />
          )}
        </div>
      </main>


      {/* Interactive Guidelines & Formula Modal */}
      <RumusModal
        isOpen={showRumusModal}
        onClose={() => setShowRumusModal(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-extrabold text-slate-700">
            Sistem Evaluasi Ujian Hafalan Al-Qur'an • Ma'had Ibnu Abbas
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>MI & Ula / MTs</span>
            <span>•</span>
            <span>Kampus Banin & Banat</span>
            <span>•</span>
            <span className="font-mono text-emerald-700 font-bold">Terhubung ke Database Neon Postgres</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
