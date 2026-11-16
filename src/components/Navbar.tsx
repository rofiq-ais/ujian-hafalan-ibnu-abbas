import React, { useState } from 'react';
import { Marhalah, Kampus } from '../types';
import {
  BookOpen,
  Users,
  FileText,
  BarChart3,
  School,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  SlidersHorizontal,
  CheckCircle2,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import { PengujiItem } from '../services/api';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow?: () => Promise<void> | void;
}

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
  onOpenRumus?: () => void;
  syncStatus?: SyncStatus;
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
  onOpenRumus,
  syncStatus,
}) => {
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);

  const navItems = [
    { id: 'input', label: 'Input Nilai', icon: BookOpen, desc: 'Lembar Ujian Lisan' },
    { id: 'rapor', label: 'Rapor Santri', icon: FileText, desc: 'Cetak & Bagikan Rapor' },
    { id: 'rekap', label: 'Rekapitulasi', icon: BarChart3, desc: 'Rekap Nilai Masal' },
    { id: 'master', label: 'Data Master', icon: Users, desc: 'Santri, Asatidz & Penguji' },
  ] as const;

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs no-print backdrop-blur-md bg-white/95">
        {/* Top Islamic & Context Ribbon (Desktop View) */}
        <div className="hidden md:block bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-emerald-100 text-xs px-4 py-2 border-b border-emerald-900/60">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Institution & Arabic Blessing */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                <School className="w-3.5 h-3.5 text-emerald-400" />
                <span className="tracking-tight">Ma'had Ibnu Abbas</span>
              </span>
              <span className="text-emerald-600">•</span>
              <span className="text-emerald-300/80 font-serif tracking-wider text-[11px]">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
              <span className="text-emerald-600">•</span>
              <span className="text-emerald-400/80 text-[11px]">
                T.A. 2026/2027 (Ganjil)
              </span>
            </div>

            {/* Right: Quick Switchers, Sync Status & Help (Desktop) */}
            <div className="flex items-center gap-3">
              {/* Sync / Offline Status Badge (Desktop) */}
              {syncStatus && (
                <div className="flex items-center">
                  {!syncStatus.isOnline ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 text-red-200 border border-red-700/80 text-[11px] font-bold">
                      <WifiOff className="w-3.5 h-3.5 text-red-400" />
                      <span>Mode Offline</span>
                      {syncStatus.pendingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-800 text-white font-mono text-[10px]">
                          {syncStatus.pendingCount}
                        </span>
                      )}
                    </span>
                  ) : syncStatus.isSyncing ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-900/80 text-teal-200 border border-teal-700/80 text-[11px] font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-300" />
                      <span>Menyinkronkan...</span>
                    </span>
                  ) : syncStatus.pendingCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => syncStatus.onSyncNow && syncStatus.onSyncNow()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 text-[11px] font-black transition active:scale-95 shadow-xs"
                      title="Ada data offline yang belum tersinkron. Klik untuk sinkronkan sekarang."
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Sinkronkan ({syncStatus.pendingCount})</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Online • Tersinkron</span>
                    </span>
                  )}
                </div>
              )}

              {/* Marhalah Switcher */}
              <div className="flex items-center bg-emerald-900/80 p-0.5 rounded-lg border border-emerald-800/80">
                <button
                  type="button"
                  onClick={() => setMarhalah('MI')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                    marhalah === 'MI'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                  title="Madrasah Ibtidaiyah"
                >
                  MI
                </button>
                <button
                  type="button"
                  onClick={() => setMarhalah('ULA_MTS')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                    marhalah === 'ULA_MTS'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                  title="Ula / MTs"
                >
                  Ula / MTs
                </button>
              </div>

              {/* Kampus Switcher */}
              <div className="flex items-center bg-emerald-900/80 p-0.5 rounded-lg border border-emerald-800/80">
                <button
                  type="button"
                  onClick={() => setKampus('BANIN')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                    kampus === 'BANIN'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                  title="Kampus Banin (Putra)"
                >
                  Banin
                </button>
                <button
                  type="button"
                  onClick={() => setKampus('BANAT')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                    kampus === 'BANAT'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                  title="Kampus Banat (Putri)"
                >
                  Banat
                </button>
              </div>

              {/* Help & Rumus Button */}
              {onOpenRumus && (
                <button
                  type="button"
                  onClick={onOpenRumus}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white text-[11px] font-bold border border-emerald-700 transition"
                  title="Buka Panduan & Rumus Penilaian Resmi"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Rumus & Panduan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-3 gap-2">
            
            {/* Logo & Application Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 font-black text-sm sm:text-base tracking-tight shrink-0 border border-emerald-500/30">
                IA
              </div>
              <div className="min-w-0">
                {/* On mobile: Compact clean branding */}
                <div className="md:hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-slate-900 tracking-tight">Ibnu Abbas</span>
                    <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100/90 px-1.5 py-0.2 rounded-md">Tahfidz</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContextDrawerOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-700 font-bold mt-0.5 leading-tight group text-left"
                    title="Ubah Sesi Ujian"
                  >
                    <span className="text-emerald-700 font-extrabold">{marhalah === 'MI' ? 'MI' : 'Ula/MTs'}</span>
                    <span>•</span>
                    <span>{kampus === 'BANIN' ? 'Banin (Putra)' : 'Banat (Putri)'}</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-700 transition" />
                  </button>
                </div>

                {/* On desktop: Full title */}
                <div className="hidden md:block">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black text-slate-900 tracking-tight">
                      Evaluasi Ujian Hafalan
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 whitespace-nowrap">
                      {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} • {kampus === 'BANIN' ? 'Banin (Putra)' : 'Banat (Putri)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ma'had Ibnu Abbas • Sistem Evaluasi Terpadu
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Menu Utama Desktop">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all relative ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Desktop Active Penguji Pill */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Penguji Menyimak:</span>
                {pengujiList.length > 0 && setActivePengujiNama ? (
                  <select
                    value={activePengujiNama}
                    onChange={(e) => setActivePengujiNama(e.target.value)}
                    className="bg-slate-50 hover:bg-white text-slate-800 text-xs font-black rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[160px] truncate"
                  >
                    {pengujiList.map(p => (
                      <option key={p.id} value={p.nama}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-700 block truncate max-w-[150px]">
                    {activePengujiNama || 'Ust. Penguji'}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Header Right Action: Sync Status & Rumus */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {syncStatus && (
                <>
                  {!syncStatus.isOnline ? (
                    <span
                      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-200 text-[11px] font-black whitespace-nowrap shrink-0"
                      title="Perangkat sedang offline"
                    >
                      <WifiOff className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Offline</span>
                      {syncStatus.pendingCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[9px] font-mono">
                          {syncStatus.pendingCount}
                        </span>
                      )}
                    </span>
                  ) : syncStatus.isSyncing ? (
                    <span className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-black whitespace-nowrap shrink-0">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600 shrink-0" />
                      <span>Sync</span>
                    </span>
                  ) : syncStatus.pendingCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => syncStatus.onSyncNow && syncStatus.onSyncNow()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 text-amber-950 text-[11px] font-black shadow-xs active:scale-95 transition whitespace-nowrap shrink-0"
                      title="Klik untuk menyinkronkan data offline"
                    >
                      <CloudUpload className="w-3.5 h-3.5 shrink-0" />
                      <span>Sync ({syncStatus.pendingCount})</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold whitespace-nowrap shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="hidden xs:inline">Online</span>
                    </span>
                  )}
                </>
              )}

              {onOpenRumus && (
                <button
                  type="button"
                  onClick={onOpenRumus}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 active:scale-95 transition text-xs font-bold whitespace-nowrap shrink-0"
                  title="Buka panduan rumus & kalkulator"
                  aria-label="Buka panduan rumus"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-extrabold whitespace-nowrap">Rumus</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Context / Settings Drawer (MODAL SHEET) - PLACED OUTSIDE <header> TO AVOID BACKDROP-FILTER CONTAINING BLOCK TRAP */}
      {contextDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setContextDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full max-h-[85dvh] flex flex-col shadow-2xl border-t sm:border border-slate-200 mx-auto overflow-hidden animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Pengaturan Sesi Ujian</h3>
                  <p className="text-[10px] text-slate-500">Pilih Penguji, Marhalah, dan Kampus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContextDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs active:scale-95"
                aria-label="Tutup pengaturan sesi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-800">
              {/* 1. Penguji yang Menyimak */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider">
                  👤 Asatidz / Penguji yang Menyimak:
                </label>
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                  <p className="text-[10px] text-emerald-800">
                    Nilai ujian santri akan resmi tercatat disimak oleh penguji terpilih:
                  </p>
                  {pengujiList.length > 0 && setActivePengujiNama ? (
                    <select
                      value={activePengujiNama}
                      onChange={(e) => setActivePengujiNama(e.target.value)}
                      className="w-full bg-white text-slate-900 text-xs font-black rounded-xl p-2.5 border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    >
                      {pengujiList.map(p => (
                        <option key={p.id} value={p.nama}>
                          {p.nama} {p.tipeAsal ? `(${p.tipeAsal})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-300 text-xs font-bold text-slate-800">
                      {activePengujiNama || 'Ust. Penguji'}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Pindah Marhalah (Jenjang) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  🏫 Pindah Marhalah (Jenjang):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMarhalah('MI');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      marhalah === 'MI'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Madrasah Ibtidaiyah</span>
                      {marhalah === 'MI' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] block opacity-70 mt-0.5">Jenjang MI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMarhalah('ULA_MTS');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      marhalah === 'ULA_MTS'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Ula / MTs</span>
                      {marhalah === 'ULA_MTS' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] block opacity-70 mt-0.5">Tingkat Tsanawiyah</span>
                  </button>
                </div>
              </div>

              {/* 3. Pindah Gender / Kampus */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  🕌 Pindah Kampus & Gender:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setKampus('BANIN');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      kampus === 'BANIN'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Banin (Putra)</span>
                      {kampus === 'BANIN' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="text-[10px] block opacity-70 mt-0.5">Santri Putra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKampus('BANAT');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      kampus === 'BANAT'
                        ? 'border-pink-500 bg-pink-50 text-pink-950 font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Banat (Putri)</span>
                      {kampus === 'BANAT' && <CheckCircle2 className="w-4 h-4 text-pink-600" />}
                    </div>
                    <span className="text-[10px] block opacity-70 mt-0.5">Santri Putri</span>
                  </button>
                </div>
              </div>

              {/* Status Koneksi & Sinkronisasi Database */}
              {syncStatus && (
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      🌐 Status Sinkronisasi:
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      !syncStatus.isOnline
                        ? 'bg-red-100 text-red-800'
                        : syncStatus.pendingCount > 0
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        !syncStatus.isOnline ? 'bg-red-500' : syncStatus.pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {!syncStatus.isOnline ? 'Offline' : syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} Pending` : 'Tersinkron'}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {!syncStatus.isOnline
                      ? 'Koneksi internet terputus. Penilaian tetap aman tersimpan offline di perangkat ini dan akan otomatis diunggah saat online kembali.'
                      : syncStatus.pendingCount > 0
                      ? `Terdapat ${syncStatus.pendingCount} penilaian offline yang menunggu diunggah ke Neon Postgres.`
                      : 'Semua penilaian telah sinkron dengan database terpadu Neon Postgres.'}
                  </p>

                  {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
                    <button
                      type="button"
                      disabled={syncStatus.isSyncing}
                      onClick={() => syncStatus.onSyncNow && syncStatus.onSyncNow()}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 shadow-xs"
                    >
                      {syncStatus.isSyncing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyinkronkan Antrean...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>Sinkronkan Sekarang ({syncStatus.pendingCount})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* 4. Quick Access Rumus Penilaian */}
              {onOpenRumus && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContextDrawerOpen(false);
                      onOpenRumus();
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black border border-emerald-200 flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-700" />
                    <span>Buka Panduan & Rumus Penilaian</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setContextDrawerOpen(false)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Terapkan & Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Mobile Bottom Navigation Bar (4 Tab Utama + 1 Tombol Sesi Penguji/Marhalah/Gender) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1.5 py-1.5 flex items-center justify-around no-print"
        aria-label="Navigasi Bawah Ponsel"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
                isActive
                  ? 'text-emerald-700 font-extrabold'
                  : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                isActive ? 'bg-emerald-100 text-emerald-800 scale-110' : 'text-slate-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">{item.label}</span>
            </button>
          );
        })}

        {/* 5. Tombol Sesi (Penguji, Marhalah, Gender) - Membuka Bottom Sheet langsung dari posisi jempol! */}
        <button
          type="button"
          onClick={() => setContextDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] relative active:scale-95 ${
            contextDrawerOpen
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
          title="Pengaturan Sesi (Penguji, Marhalah, Gender)"
        >
          <div className={`p-1 rounded-lg transition-all ${
            contextDrawerOpen ? 'bg-emerald-100 text-emerald-800 scale-110' : 'text-slate-500'
          }`}>
            <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-extrabold text-emerald-800">Sesi</span>
          <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </button>
      </nav>
    </>
  );
};
