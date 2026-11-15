import React, { useState } from 'react';
import { X, BookOpen, Calculator, Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { hitungNilaiAkhirSoal, getPredikat, getPredikatBadgeStyle } from '../utils/scoring';

interface RumusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RumusModal: React.FC<RumusModalProps> = ({ isOpen, onClose }) => {
  // Mini interactive calculator in modal
  const [testSb, setTestSb] = useState(1);
  const [testSk, setTestSk] = useState(3);
  const [testTahsin, setTestTahsin] = useState(2);

  if (!isOpen) return null;

  const sim = hitungNilaiAkhirSoal(testSb, testSk, testTahsin);
  const badge = getPredikatBadgeStyle(getPredikat(sim.nilaiAkhirSoal));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-emerald-100 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 text-emerald-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                  Standar Ma'had Ibnu Abbas
                </span>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Panduan & Rumus Penilaian Tahfidz
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-emerald-100/90 mt-2">
            Dokumentasi algoritma konversi nilai resmi untuk jenjang MI & Ula/MTs (Kampus Banin & Banat).
          </p>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-slate-800 text-xs flex-1">
          {/* 1. Parameter Penilaian */}
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                1
              </span>
              Tiga Parameter Penilaian Tiap Soal
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200">
                <span className="text-red-700 font-bold text-[10px] uppercase tracking-wider block">Bobot -1.0</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">Salah Besar (SB)</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Lupa ayat, tertukar surat/ayat, salah harakat fatal yang mengubah makna & tidak bisa diperbaiki sendiri.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-amber-700 font-bold text-[10px] uppercase tracking-wider block">Bobot -0.2 (SK / 5)</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">Salah Kecil (SK)</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Ragu sejenak lalu membetulkan sendiri tanpa bantuan penguji, atau tajwid ringan.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-indigo-700 font-bold text-[10px] uppercase tracking-wider block">Skor 0 s.d. 6</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">Tahsin & Tajwid</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Kualitas makhraj huruf, shifat huruf, mad & qashr, kelancaran tartil sesuai kaidah tajwid.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Algoritma & Rumus */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                2
              </span>
              Langkah Algoritma Perhitungan
            </h4>

            <div className="space-y-2 text-xs text-slate-700 font-sans">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="font-mono font-bold text-emerald-700 shrink-0">A.</span>
                <div>
                  <strong>Kesalahan Bernilai Ekuivalen (KBE):</strong>
                  <code className="block mt-1 font-mono text-[11px] text-emerald-900 bg-emerald-50 px-2 py-1 rounded">
                    KBE = SB + (SK / 5)
                  </code>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="font-mono font-bold text-emerald-700 shrink-0">B.</span>
                <div>
                  <strong>Nilai Dasar Soal (Batas Bawah 50):</strong>
                  <code className="block mt-1 font-mono text-[11px] text-emerald-900 bg-emerald-50 px-2 py-1 rounded">
                    Nilai Dasar = max(50, 100 - (KBE × 10))
                  </code>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="font-mono font-bold text-emerald-700 shrink-0">C.</span>
                <div>
                  <strong>Bonus Apresiasi Tahsin:</strong>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Diberikan jika santri belum mencapai nilai 70 (Nilai Dasar &lt; 70) dan kesalahan tidak fatal (KBE &lt; 4):
                  </p>
                  <ul className="mt-1 list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                    <li>Tahsin skor 0–3: <strong>+10 Poin Bonus</strong></li>
                    <li>Tahsin skor 4–6: <strong>+5 Poin Bonus</strong></li>
                  </ul>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="font-mono font-bold text-emerald-700 shrink-0">D.</span>
                <div>
                  <strong>Nilai Akhir Butir Soal:</strong>
                  <code className="block mt-1 font-mono text-[11px] text-emerald-900 bg-emerald-50 px-2 py-1 rounded">
                    Nilai Akhir = min(100, Nilai Dasar + Bonus Tahsin)
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tabel Predikat Kelulusan */}
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-2.5">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                3
              </span>
              Rentang Nilai & Predikat Resmi
            </h4>

            <div className="space-y-1">
              <div className="sm:hidden text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <span>↔</span>
                <span>Geser ke samping untuk melihat seluruh keterangan predikat</span>
              </div>
              <div 
                tabIndex={0}
                role="region"
                aria-label="Tabel Predikat Kelulusan"
                className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <table className="w-full min-w-[440px] text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-200 whitespace-nowrap">Rentang Nilai</th>
                      <th className="px-3 py-2 border-r border-slate-200 whitespace-nowrap">Predikat</th>
                      <th className="px-3 py-2 whitespace-nowrap">Kategori Kelulusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold border-r border-slate-200 whitespace-nowrap">&gt; 80.0 — 100.0</td>
                      <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap"><span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">Sempurna</span></td>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">Mumtaz / Istimewa</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold border-r border-slate-200 whitespace-nowrap">70.1 — 80.0</td>
                      <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap"><span className="px-2 py-0.5 rounded font-bold bg-teal-100 text-teal-800">Sangat Baik</span></td>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">Jayyid Jiddan (Lulus Baik)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold border-r border-slate-200 whitespace-nowrap">60.1 — 70.0</td>
                      <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap"><span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">Baik</span></td>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">Jayyid (Lulus Bersyarat)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold border-r border-slate-200 whitespace-nowrap">50.1 — 60.0</td>
                      <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap"><span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">Cukup</span></td>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">Maqbul (Mengulang Sebagian)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold border-r border-slate-200 whitespace-nowrap">&le; 50.0</td>
                      <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap"><span className="px-2 py-0.5 rounded font-bold bg-red-100 text-red-800">Gagal</span></td>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">Rosib (Mengulang Penuh)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Interactive Simulator / Calculator */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <h4 className="font-extrabold text-sm text-emerald-950">
                Kalkulator Uji Coba Rumus Langsung
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-red-800 uppercase mb-1">Salah Besar (SB):</label>
                <div className="flex items-center bg-white rounded-xl border border-red-200">
                  <button 
                    onClick={() => setTestSb(prev => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-red-600"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-sm text-red-700">{testSb}</span>
                  <button 
                    onClick={() => setTestSb(prev => prev + 1)}
                    className="px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-red-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Salah Kecil (SK):</label>
                <div className="flex items-center bg-white rounded-xl border border-amber-200">
                  <button 
                    onClick={() => setTestSk(prev => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-amber-600"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-sm text-amber-700">{testSk}</span>
                  <button 
                    onClick={() => setTestSk(prev => prev + 1)}
                    className="px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-amber-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-1">Tahsin (0-6):</label>
                <div className="flex items-center bg-white rounded-xl border border-indigo-200">
                  <button 
                    onClick={() => setTestTahsin(prev => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-indigo-600"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-sm text-indigo-700">{testTahsin}</span>
                  <button 
                    onClick={() => setTestTahsin(prev => Math.min(6, prev + 1))}
                    className="px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-indigo-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Hasil Uji Coba */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">KBE: {sim.kbe} • Nilai Dasar: {sim.nilaiDasar} {sim.bonusTahsin > 0 ? `• Bonus: +${sim.bonusTahsin}` : ''}</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  Nilai Akhir: <span className="text-emerald-700 font-mono">{sim.nilaiAkhirSoal.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase border ${badge.bg} ${badge.border}`}>
                  {getPredikat(sim.nilaiAkhirSoal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
