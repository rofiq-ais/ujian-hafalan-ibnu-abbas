import React from 'react';
import { Marhalah, Kampus } from '../types';
import { BookOpen, Users, FileText, BarChart3, School, UserCheck } from 'lucide-react';
import { PengujiItem } from '../services/api';

interface NavbarProps {
  marhalah: Marhalah;
  setMarhalah: (m: Marhalah) => void;
  kampus: Kampus;
  setKampus: (k: Kampus) => void;
  activeTab: 'input' | 'rapor' | 'rekap' | 'master';
  setActiveTab: (tab: 'input' | 'rapor' | 'rekap' | 'master') => void;
  pengujiList?: PengujiItem[];
  activePengujiNama?: string;
  setActivePengujiNama?: (nama: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  marhalah,
  setMarhalah,
  kampus,
  setKampus,
  activeTab,
  setActiveTab,
  pengujiList = [],
  activePengujiNama,
  setActivePengujiNama,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Banner Context Switcher */}
      <div className="bg-emerald-950 text-emerald-100 text-xs px-4 py-2 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
              <School className="w-3.5 h-3.5" />
              Ma'had Ibnu Abbas
            </span>
            <span className="text-emerald-500">•</span>
            <span className="text-emerald-300/80">T.A. 2026/2027 (Semester Ganjil)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Switcher Marhalah */}
            <div className="flex items-center bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-800">
              <button
                type="button"
                onClick={() => setMarhalah('MI')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  marhalah === 'MI'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                MI
              </button>
              <button
                type="button"
                onClick={() => setMarhalah('ULA_MTS')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  marhalah === 'ULA_MTS'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                Ula / MTs
              </button>
            </div>

            {/* Switcher Kampus */}
            <div className="flex items-center bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-800">
              <button
                type="button"
                onClick={() => setKampus('BANIN')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  kampus === 'BANIN'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                Banin (Putra)
              </button>
              <button
                type="button"
                onClick={() => setKampus('BANAT')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  kampus === 'BANAT'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                Banat (Putri)
              </button>
            </div>

            {/* Penguji Active Selector (Loaded from shared musyrif table!) */}
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-200 text-[11px] pl-2 border-l border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {pengujiList.length > 0 && setActivePengujiNama ? (
                <select
                  value={activePengujiNama}
                  onChange={(e) => setActivePengujiNama(e.target.value)}
                  className="bg-emerald-900 text-emerald-100 text-[11px] font-semibold rounded px-1.5 py-0.5 border border-emerald-700 focus:outline-none"
                >
                  {pengujiList.map(p => (
                    <option key={p.id} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-medium">{activePengujiNama || 'Ust. Penguji'}</span>
              )}
              <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded text-[10px] text-emerald-300 font-mono">Penguji</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header & Nav Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 font-bold text-lg">
              IA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Evaluasi Ujian Hafalan Al-Qur'an
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} - Kampus {kampus === 'BANIN' ? 'Banin' : 'Banat'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistem Penilaian Ujian Tahfidz Terpadu Ma'had Ibnu Abbas
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'input'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Input Nilai Ujian
            </button>

            <button
              onClick={() => setActiveTab('rapor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'rapor'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Rapor Santri
            </button>

            <button
              onClick={() => setActiveTab('rekap')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'rekap'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Rekapitulasi Masal
            </button>

            <button
              onClick={() => setActiveTab('master')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'master'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Data Santri
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
