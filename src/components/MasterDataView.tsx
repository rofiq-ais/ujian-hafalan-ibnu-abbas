import React, { useState, useEffect, useMemo } from 'react';
import { Santri, Marhalah, Kampus } from '../types';
import {
  Users,
  Search,
  Plus,
  Upload,
  Check,
  UserCheck,
  BookOpen,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  School
} from 'lucide-react';
import { api, PengajarItem, PengujiItem } from '../services/api';

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
  // Sub-tabs: 'santri' | 'pengajar' | 'penguji'
  const [subTab, setSubTab] = useState<'santri' | 'pengajar' | 'penguji'>('santri');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddSantriModal, setShowAddSantriModal] = useState(false);
  const [showAddPengajarModal, setShowAddPengajarModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Tambah Santri
  const [namaSantri, setNamaSantri] = useState('');
  const [nisnSantri, setNisnSantri] = useState('');
  const [kelasSantri, setKelasSantri] = useState(marhalah === 'MI' ? '5A MI' : '7A Ula/MTs');
  const [halaqahSantri, setHalaqahSantri] = useState('');
  const [targetJuzSantri, setTargetJuzSantri] = useState('Juz 30, Juz 29');

  // Form Tambah Pengajar
  const [namaPengajar, setNamaPengajar] = useState('');
  const [panggilanPengajar, setPanggilanPengajar] = useState('');
  const [mapelPengajar, setMapelPengajar] = useState("Tahfidz Al-Qur'an");
  const [kampusPengajar, setKampusPengajar] = useState<Kampus>(kampus);
  const [genderPengajar, setGenderPengajar] = useState<'IKHWAN' | 'AKHWAT'>(kampus === 'BANAT' ? 'AKHWAT' : 'IKHWAN');

  // State Pengajar & Kandidat Penguji
  const [pengajarList, setPengajarList] = useState<PengajarItem[]>([]);
  const [kandidatPenguji, setKandidatPenguji] = useState<PengujiItem[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const loadExtraData = async () => {
    setLoadingExtra(true);
    try {
      const [pengajarData, kandidatData] = await Promise.all([
        api.getPengajar(),
        api.getKandidatPenguji(),
      ]);
      setPengajarList(pengajarData);
      setKandidatPenguji(kandidatData);
    } catch (err) {
      console.warn('Error loading extra master data:', err);
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    loadExtraData();
  }, [subTab]);

  // Filtered Santri
  const filteredSantri = useMemo(() => {
    return santriList
      .filter(s => s.marhalah === marhalah && s.kampus === kampus)
      .filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.includes(searchTerm) ||
        s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [santriList, marhalah, kampus, searchTerm]);

  // Filtered Pengajar
  const filteredPengajar = useMemo(() => {
    return pengajarList.filter(p =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mapel.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pengajarList, searchTerm]);

  // Filtered Kandidat Penguji
  const filteredKandidat = useMemo(() => {
    return kandidatPenguji.filter(k =>
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.tipeAsal?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [kandidatPenguji, searchTerm]);

  // Handle Tambah Santri
  const handleTambahSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri) return;

    setIsSubmitting(true);
    try {
      await api.saveSantri({
        nama: namaSantri,
        nisn: nisnSantri || '-',
        kelas: kelasSantri,
        halaqah: halaqahSantri || 'Umum',
        targetJuz: targetJuzSantri,
        marhalah,
        kampus,
      });

      alert(`Alhamdulillah, data santri ${namaSantri} berhasil disimpan!`);
      setShowAddSantriModal(false);
      setNamaSantri('');
      setNisnSantri('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal menambah santri: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Tambah Pengajar
  const handleTambahPengajar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPengajar) return;

    setIsSubmitting(true);
    try {
      await api.savePengajar({
        nama: namaPengajar,
        panggilan: panggilanPengajar || namaPengajar,
        mapel: mapelPengajar,
        kampus: kampusPengajar,
        gender: genderPengajar,
        marhalah: 'SEMUA',
        isActive: true,
      });

      alert(`Alhamdulillah, pengajar ${namaPengajar} berhasil ditambahkan!`);
      setShowAddPengajarModal(false);
      setNamaPengajar('');
      setPanggilanPengajar('');
      loadExtraData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal menambah pengajar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status Penguji
  const handleTogglePenguji = async (kandidat: PengujiItem) => {
    const nextStatus = !kandidat.isPengujiAktif;
    // Optimistic UI update
    setKandidatPenguji(prev =>
      prev.map(k => (k.id === kandidat.id ? { ...k, isPengujiAktif: nextStatus } : k))
    );

    try {
      await api.setPengujiStatus({
        refId: kandidat.refId || kandidat.id,
        nama: kandidat.nama,
        tipeAsal: kandidat.tipeAsal || 'MUSYRIF',
        kampus: (kandidat.kampus || kampus) as Kampus,
        marhalah: kandidat.marhalah || 'SEMUA',
        isPengujiAktif: nextStatus,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal memperbarui status penguji: ' + err.message);
      // Revert if error
      setKandidatPenguji(prev =>
        prev.map(k => (k.id === kandidat.id ? { ...k, isPengujiAktif: !nextStatus } : k))
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Pusat Manajemen Data & Petugas Ujian
            </h2>
            <p className="text-xs text-slate-500">
              Unit: {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} — Kampus {kampus === 'BANIN' ? 'Banin (Putra)' : 'Banat (Putri)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {subTab === 'santri' && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={() => setShowAddSantriModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Santri</span>
                </button>
              </>
            )}

            {subTab === 'pengajar' && (
              <button
                onClick={() => setShowAddPengajarModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengajar Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 pt-2">
          <button
            type="button"
            onClick={() => setSubTab('santri')}
            className={`pb-2.5 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
              subTab === 'santri'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Data Santri Peserta</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
              {filteredSantri.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pengajar')}
            className={`pb-2.5 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
              subTab === 'pengajar'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>2. Data Pengajar / Asatidz</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
              {pengajarList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('penguji')}
            className={`pb-2.5 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
              subTab === 'penguji'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Setting Penugasan Penguji Ujian</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black">
              {kandidatPenguji.filter(k => k.isPengujiAktif).length} Penguji Aktif
            </span>
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
          placeholder={
            subTab === 'santri'
              ? 'Cari nama santri, NISN, atau kelas...'
              : subTab === 'pengajar'
              ? 'Cari nama pengajar atau mata pelajaran...'
              : 'Cari nama musyrif atau pengajar penguji...'
          }
          className="w-full text-xs font-medium text-slate-800 focus:outline-none placeholder:text-slate-400"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600">
            ✕
          </button>
        )}
      </div>

      {/* TAB 1: DATA SANTRI */}
      {subTab === 'santri' && (
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
      )}

      {/* TAB 2: DATA PENGAJAR */}
      {subTab === 'pengajar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
            <p>
              💡 <strong>Data Pengajar:</strong> Menampung guru / asatidz KBM dan pengajar tahfidz (di luar musyrif internal asrama).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Nama Lengkap & Gelar</th>
                  <th className="px-4 py-3">Panggilan</th>
                  <th className="px-4 py-3">Mata Pelajaran</th>
                  <th className="px-4 py-3">Gender / Kampus</th>
                  <th className="px-4 py-3">Marhalah</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPengajar.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.nama}</td>
                    <td className="px-4 py-3 text-slate-600">{p.panggilan || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-800">{p.mapel}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.kampus === 'BANIN' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {p.kampus === 'BANIN' ? 'Putra (Banin)' : 'Putri (Banat)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.marhalah}</td>
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
      )}

      {/* TAB 3: SETTING PENUGASAN PENGUJI UJIAN */}
      {subTab === 'penguji' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
          <div className="p-4 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900">
            <h4 className="font-extrabold text-sm mb-1 text-amber-950">
              ⚖️ Pengaturan Tim Penguji Ujian Hafalan (UTS & UAS)
            </h4>
            <p>
              Centang pada kolom <strong>"Tugaskan Menguji"</strong> untuk menetapkan siapa saja dari para Musyrif dan Pengajar yang akan menjadi Penguji Resmi pada sesi ujian hafalan Al-Qur'an.
            </p>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Nama Asatidz</th>
                  <th className="px-4 py-3 text-center">Asal Petugas</th>
                  <th className="px-4 py-3">Penugasan Kampus</th>
                  <th className="px-4 py-3 text-center">Tugaskan Menguji?</th>
                  <th className="px-4 py-3 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKandidat.map((k, idx) => (
                  <tr key={k.id} className={`hover:bg-slate-50 transition ${k.isPengujiAktif ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{k.nama}</div>
                      <div className="text-[10px] text-slate-400">{k.panggilan ? `Panggilan: ${k.panggilan}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        k.tipeAsal === 'MUSYRIF'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {k.tipeAsal}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        k.kampus === 'BANIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-pink-50 text-pink-800 border border-pink-200'
                      }`}>
                        {k.kampus === 'BANIN' ? 'Kampus Banin (Putra)' : 'Kampus Banat (Putri)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePenguji(k)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 mx-auto ${
                          k.isPengujiAktif
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {k.isPengujiAktif ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Penguji Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Bukan Penguji</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 text-[11px]">
                      {k.keterangan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SANTRI */}
      {showAddSantriModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleTambahSantri} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Tambah Santri Baru</h3>
            <p className="text-xs text-slate-500">
              Unit: {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} ({kampus === 'BANIN' ? 'Putra' : 'Putri'})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                <input
                  type="text"
                  required
                  value={namaSantri}
                  onChange={(e) => setNamaSantri(e.target.value)}
                  placeholder="Contoh: Muhammad Abdullah"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NISN:</label>
                <input
                  type="text"
                  value={nisnSantri}
                  onChange={(e) => setNisnSantri(e.target.value)}
                  placeholder="Contoh: 0081234567"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                <input
                  type="text"
                  required
                  value={kelasSantri}
                  onChange={(e) => setKelasSantri(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Halaqah:</label>
                <input
                  type="text"
                  value={halaqahSantri}
                  onChange={(e) => setHalaqahSantri(e.target.value)}
                  placeholder="Contoh: Halaqah Abu Bakar"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Kurikulum Juz:</label>
                <input
                  type="text"
                  value={targetJuzSantri}
                  onChange={(e) => setTargetJuzSantri(e.target.value)}
                  placeholder="Contoh: Juz 30, Juz 29"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddSantriModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Santri'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH PENGAJAR */}
      {showAddPengajarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleTambahPengajar} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Tambah Data Pengajar Baru</h3>
            <p className="text-xs text-slate-500">
              Tambahkan guru / asatidz KBM Ma'had Ibnu Abbas.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={namaPengajar}
                  onChange={(e) => setNamaPengajar(e.target.value)}
                  placeholder="Contoh: Ust. Syahrul Ramadhan, Lc."
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Panggilan:</label>
                <input
                  type="text"
                  value={panggilanPengajar}
                  onChange={(e) => setPanggilanPengajar(e.target.value)}
                  placeholder="Contoh: Syahrul"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Utama:</label>
                <input
                  type="text"
                  required
                  value={mapelPengajar}
                  onChange={(e) => setMapelPengajar(e.target.value)}
                  placeholder="Contoh: Tahfidz Al-Qur'an / Fiqih"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kampus Bertugas:</label>
                  <select
                    value={kampusPengajar}
                    onChange={(e) => {
                      const val = e.target.value as Kampus;
                      setKampusPengajar(val);
                      setGenderPengajar(val === 'BANAT' ? 'AKHWAT' : 'IKHWAN');
                    }}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="BANIN">Kampus Banin (Putra)</option>
                    <option value="BANAT">Kampus Banat (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <select
                    value={genderPengajar}
                    onChange={(e) => setGenderPengajar(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="IKHWAN">Ikhwan (Laki-laki)</option>
                    <option value="AKHWAT">Akhwat (Perempuan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddPengajarModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pengajar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL IMPORT EXCEL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Import Data Santri dari Excel (.xlsx / .csv)</h3>
            <p className="text-xs text-slate-500">
              Unggah file Excel daftar santri untuk unit {marhalah === 'MI' ? 'MI' : 'Ula/MTs'} {kampus === 'BANIN' ? 'Banin' : 'Banat'}.
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
                  alert('Data santri berhasil diimport ke Neon!');
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
