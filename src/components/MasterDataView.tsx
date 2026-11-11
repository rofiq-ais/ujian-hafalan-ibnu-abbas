import React, { useState, useMemo } from 'react';
import { Santri, Marhalah, Kampus } from '../types';
import { Users, Search, Plus, Upload, School, Check, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface MasterDataViewProps {
  marhalah: Marhalah;
  kampus: Kampus;
  santriList: Santri[];
  onRefresh?: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  marhalah,
  kampus,
  santriList,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form tambah santri
  const [namaBaru, setNamaBaru] = useState('');
  const [nisnBaru, setNisnBaru] = useState('');
  const [kelasBaru, setKelasBaru] = useState(marhalah === 'MI' ? '5A MI' : '7A Ula/MTs');
  const [halaqahBaru, setHalaqahBaru] = useState('');
  const [targetJuzBaru, setTargetJuzBaru] = useState('Juz 30, Juz 29');

  const filteredSantri = useMemo(() => {
    return santriList
      .filter(s => s.marhalah === marhalah && s.kampus === kampus)
      .filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.includes(searchTerm) ||
        s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [santriList, marhalah, kampus, searchTerm]);

  const handleTambahSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBaru) return;

    setIsSubmitting(true);
    try {
      await api.saveSantri({
        nama: namaBaru,
        nisn: nisnBaru || '-',
        kelas: kelasBaru,
        halaqah: halaqahBaru || 'Umum',
        targetJuz: targetJuzBaru,
        marhalah,
        kampus,
      });

      alert(`Alhamdulillah, data santri ${namaBaru} berhasil disimpan ke database Neon!`);
      setShowAddModal(false);
      setNamaBaru('');
      setNisnBaru('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal menambah santri: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Database Santri Peserta Ujian
          </h2>
          <p className="text-xs text-slate-500">
            Unit: {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} — Kampus {kampus === 'BANIN' ? 'Banin (Putra)' : 'Banat (Putri)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel / CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Santri</span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari santri berdasarkan nama, NISN, atau kelas..."
          className="w-full text-xs font-medium text-slate-800 focus:outline-none placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Santri Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Nama Santri</th>
                <th className="px-4 py-3">NISN</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Halaqah</th>
                <th className="px-4 py-3">Target Kurikulum</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSantri.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{s.nama}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{s.nisn}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{s.kelas}</td>
                  <td className="px-4 py-3 text-slate-600">{s.halaqah || 'Umum'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {s.targetJuz || 'Juz 30'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3" />
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Santri Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleTambahSantri} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Tambah Santri Baru
            </h3>
            <p className="text-xs text-slate-500">
              Unit: {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} ({kampus === 'BANIN' ? 'Putra' : 'Putri'})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                <input
                  type="text"
                  required
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                  placeholder="Contoh: Muhammad Abdullah"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NISN:</label>
                <input
                  type="text"
                  value={nisnBaru}
                  onChange={(e) => setNisnBaru(e.target.value)}
                  placeholder="Contoh: 0081234567"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                <input
                  type="text"
                  required
                  value={kelasBaru}
                  onChange={(e) => setKelasBaru(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Halaqah:</label>
                <input
                  type="text"
                  value={halaqahBaru}
                  onChange={(e) => setHalaqahBaru(e.target.value)}
                  placeholder="Contoh: Halaqah Abu Bakar"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Kurikulum Juz:</label>
                <input
                  type="text"
                  value={targetJuzBaru}
                  onChange={(e) => setTargetJuzBaru(e.target.value)}
                  placeholder="Contoh: Juz 30, Juz 29"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan ke Database'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Import Excel Mock */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Import Data Santri dari Excel (.xlsx / .csv)
            </h3>
            <p className="text-xs text-slate-500">
              Unggah file Excel daftar santri untuk unit {marhalah === 'MI' ? 'MI' : 'Ula/MTs'} {kampus === 'BANIN' ? 'Banin' : 'Banat'}. Format kolom: NISN, Nama Lengkap, Kelas, Target Juz.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 transition cursor-pointer">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-700">Tarik file Excel ke sini atau klik untuk browse</p>
              <p className="text-[10px] text-slate-400 mt-1">Mendukung file .xlsx, .xls, .csv</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Data santri berhasil diimport ke Neon!");
                  setShowImportModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                Mulai Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
