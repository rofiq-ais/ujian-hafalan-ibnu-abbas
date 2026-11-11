import React, { useState, useEffect } from 'react';
import { Marhalah, Kampus, PenilaianRecord, Santri } from './types';
import { MOCK_SANTRI, MOCK_PENILAIAN } from './data/mockData';
import { api, PengujiItem } from './services/api';
import { Navbar } from './components/Navbar';
import { ExamScoringView } from './components/ExamScoringView';
import { ReportCardView } from './components/ReportCardView';
import { MasterRecapView } from './components/MasterRecapView';
import { MasterDataView } from './components/MasterDataView';
import { RefreshCw } from 'lucide-react';

export function App() {
  const [marhalah, setMarhalah] = useState<Marhalah>('ULA_MTS');
  const [kampus, setKampus] = useState<Kampus>('BANIN');
  const [activeTab, setActiveTab] = useState<'input' | 'rapor' | 'rekap' | 'master'>('input');

  const [santriList, setSantriList] = useState<Santri[]>(MOCK_SANTRI);
  const [penilaianList, setPenilaianList] = useState<PenilaianRecord[]>(MOCK_PENILAIAN);
  const [pengujiList, setPengujiList] = useState<PengujiItem[]>([]);
  const [activePengujiNama, setActivePengujiNama] = useState<string>('Ust. Ahmad Fauzi');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial data from Neon Postgres
  const loadData = async (targetKampus = kampus, targetMarhalah = marhalah) => {
    setIsLoading(true);
    try {
      const [santriData, penilaianData, pengujiData] = await Promise.all([
        api.getSantri(),
        api.getPenilaian(),
        api.getPenguji(targetKampus, targetMarhalah),
      ]);

      if (santriData && santriData.length > 0) {
        setSantriList(santriData);
      }
      if (penilaianData && penilaianData.length > 0) {
        setPenilaianList(penilaianData);
      }
      if (pengujiData && pengujiData.length > 0) {
        setPengujiList(pengujiData);
        // If current active penguji is not in the list, set to first
        if (!pengujiData.some(p => p.nama === activePengujiNama)) {
          setActivePengujiNama(pengujiData[0].nama);
        }
      }
    } catch (err) {
      console.warn('Fallback to mock data:', err);
    } finally {
      setIsLoading(false);
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

    // 2. Persist to Neon DB
    try {
      await api.savePenilaian(record);
    } catch (err) {
      console.error('Failed to sync with Neon:', err);
    }
  };

  const handleViewRapor = (_record: PenilaianRecord) => {
    setActiveTab('rapor');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-200">
      {/* Navbar with Campus & Unit context */}
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
      />

      {/* Main Content View */}
      <main className="flex-1 pb-12">
        {isLoading && (
          <div className="max-w-7xl mx-auto px-4 py-2 text-center text-xs text-emerald-800 bg-emerald-50 border-b border-emerald-100 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Menyinkronkan data dengan database terpadu Neon Postgres...</span>
          </div>
        )}

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
          />
        )}

        {activeTab === 'rapor' && (
          <ReportCardView
            marhalah={marhalah}
            kampus={kampus}
            penilaianList={penilaianList}
          />
        )}

        {activeTab === 'rekap' && (
          <MasterRecapView
            marhalah={marhalah}
            kampus={kampus}
            penilaianList={penilaianList}
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-700">
            Sistem Evaluasi Ujian Hafalan Al-Qur'an • Ma'had Ibnu Abbas
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>MI & Ula/MTs</span>
            <span>•</span>
            <span>Kampus Banin & Banat</span>
            <span>•</span>
            <span className="font-mono text-emerald-700 font-bold">Terhubung ke Database Neon Bersama</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
