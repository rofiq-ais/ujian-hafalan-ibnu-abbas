import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Santri, Marhalah, Kampus } from '../types';
import {
  Users,
  Search,
  Plus,
  Upload,
  Check,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  FileSpreadsheet,
  X,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  School,
  BadgeCheck,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';

import { api, PengajarItem, PengujiItem } from '../services/api';

// Daftar opsi kelas standar: 1 MI sampai 3 Ula/MTS
export const SEMUA_OPSI_KELAS = [
  '1 MI',
  '2 MI',
  '3 MI',
  '4 MI',
  '5 MI',
  '6 MI',
  '1 Ula / MTs',
  '2 Ula / MTs',
  '3 Ula / MTs',
];

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
  const [showMasterTableMode, setShowMasterTableMode] = useState(false);

  // Modals
  const [showAddSantriModal, setShowAddSantriModal] = useState(false);
  const [showEditSantriModal, setShowEditSantriModal] = useState(false);
  const [showAddPengajarModal, setShowAddPengajarModal] = useState(false);
  const [showEditPengajarModal, setShowEditPengajarModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportPengajarModal, setShowImportPengajarModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Tambah Santri (Cukup Nama, NIS, Kelas dengan Dropdown)
  const [namaSantri, setNamaSantri] = useState('');
  const [nisnSantri, setNisnSantri] = useState('');
  const [kelasSantri, setKelasSantri] = useState(marhalah === 'MI' ? '1 MI' : '1 Ula / MTs');
  const [isCustomKelas, setIsCustomKelas] = useState(false);

  // Form Edit Santri
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [editNamaSantri, setEditNamaSantri] = useState('');
  const [editNisnSantri, setEditNisnSantri] = useState('');
  const [editKelasSantri, setEditKelasSantri] = useState('');
  const [isEditCustomKelas, setIsEditCustomKelas] = useState(false);

  // Form Tambah Pengajar
  const [namaPengajar, setNamaPengajar] = useState('');
  const [panggilanPengajar, setPanggilanPengajar] = useState('');
  const [mapelPengajar, setMapelPengajar] = useState("Tahfidz Al-Qur'an");
  const [kampusPengajar, setKampusPengajar] = useState<Kampus>(kampus);
  const [genderPengajar, setGenderPengajar] = useState<'IKHWAN' | 'AKHWAT'>(kampus === 'BANAT' ? 'AKHWAT' : 'IKHWAN');

  // Form Edit Pengajar
  const [editingPengajar, setEditingPengajar] = useState<PengajarItem | null>(null);
  const [editNamaPengajar, setEditNamaPengajar] = useState('');
  const [editPanggilanPengajar, setEditPanggilanPengajar] = useState('');
  const [editMapelPengajar, setEditMapelPengajar] = useState('');
  const [editKampusPengajar, setEditKampusPengajar] = useState<Kampus>(kampus);
  const [editGenderPengajar, setEditGenderPengajar] = useState<'IKHWAN' | 'AKHWAT'>('IKHWAN');
  const [editIsActivePengajar, setEditIsActivePengajar] = useState(true);

  // File Upload Ref Santri
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedRows, setImportedRows] = useState<any[]>([]);

  // File Upload Ref Pengajar
  const pengajarFileInputRef = useRef<HTMLInputElement>(null);
  const [importedPengajarRows, setImportedPengajarRows] = useState<any[]>([]);


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
        s.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.halaqah && s.halaqah.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [santriList, marhalah, kampus, searchTerm]);

  // Filtered Pengajar
  const filteredPengajar = useMemo(() => {
    return pengajarList.filter(p =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.panggilan && p.panggilan.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [pengajarList, searchTerm]);

  // Filtered Kandidat Penguji
  const filteredKandidat = useMemo(() => {
    return kandidatPenguji.filter(k =>
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.tipeAsal && k.tipeAsal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (k.panggilan && k.panggilan.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [kandidatPenguji, searchTerm]);

  // Handle Tambah Santri
  const handleTambahSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri.trim()) return;

    setIsSubmitting(true);
    try {
      await api.saveSantri({
        nama: namaSantri.trim(),
        nisn: nisnSantri.trim() || String(Math.floor(1000000000 + Math.random() * 9000000000)),
        kelas: kelasSantri.trim(),
        halaqah: 'Umum',
        targetJuz: 'Juz 30',
        marhalah,
        kampus,
      });

      alert(`Alhamdulillah, data santri ${namaSantri} berhasil disimpan!`);
      setShowAddSantriModal(false);
      setNamaSantri('');
      setNisnSantri('');
      setKelasSantri(marhalah === 'MI' ? '1 MI' : '1 Ula / MTs');
      setIsCustomKelas(false);
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
    if (!namaPengajar.trim()) return;

    setIsSubmitting(true);
    try {
      await api.savePengajar({
        nama: namaPengajar.trim(),
        panggilan: panggilanPengajar.trim() || namaPengajar.trim(),
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
      setKandidatPenguji(prev =>
        prev.map(k => (k.id === kandidat.id ? { ...k, isPengujiAktif: !nextStatus } : k))
      );
    }
  };

  // CSV Import file parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('File CSV kosong atau hanya berisi baris header.');
        return;
      }

      // Parse lines (skipping header)
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0]) {
          parsed.push({
            nama: parts[0],
            nisn: parts[1] || '-',
            kelas: parts[2] || (marhalah === 'MI' ? '1 MI' : '1 Ula / MTs'),
            halaqah: parts[3] || 'Umum',
            targetJuz: parts[4] || 'Juz 30',
            marhalah,
            kampus,
          });
        }
      }
      setImportedRows(parsed);

    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const templateCSV = '\uFEFFNama Santri,NIS,Kelas\nMuhammad Abdullah,2024001,1 Ula / MTs\nFatimah Azzahra,2024002,1 Ula / MTs\nIbrahim Khalil,2024003,5 MI';
    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Santri_Ibnu_Abbas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitImport = async () => {
    if (importedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      await api.saveSantri(importedRows);
      alert(`Alhamdulillah, berhasil mengimport ${importedRows.length} data santri ke sistem!`);
      setShowImportModal(false);
      setImportedRows([]);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal mengimport data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers Edit & Hapus Santri ---
  const handleOpenEditSantri = (s: Santri) => {
    setEditingSantri(s);
    setEditNamaSantri(s.nama);
    setEditNisnSantri(s.nisn);
    setEditKelasSantri(s.kelas);
    setIsEditCustomKelas(!SEMUA_OPSI_KELAS.includes(s.kelas));
    setShowEditSantriModal(true);
  };

  const handleSaveEditSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSantri || !editNamaSantri.trim()) return;

    setIsSubmitting(true);
    try {
      await api.saveSantri({
        id: editingSantri.id,
        nama: editNamaSantri.trim(),
        nisn: editNisnSantri.trim(),
        kelas: editKelasSantri.trim(),
        halaqah: editingSantri.halaqah || 'Umum',
        targetJuz: editingSantri.targetJuz || 'Juz 30',
        marhalah: editingSantri.marhalah,
        kampus: editingSantri.kampus,
      });

      alert(`Alhamdulillah, data santri "${editNamaSantri}" berhasil diperbarui!`);
      setShowEditSantriModal(false);
      setEditingSantri(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal memperbarui santri: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSantri = async (s: Santri) => {
    if (!window.confirm(`Yakin ingin menghapus data santri "${s.nama}"? Catatan riwayat ujian santri ini juga akan terhapus.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.deleteSantri(s.id);
      alert(`Data santri "${s.nama}" berhasil dihapus.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal menghapus santri: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers Edit & Hapus Pengajar ---
  const handleOpenEditPengajar = (p: PengajarItem) => {
    setEditingPengajar(p);
    setEditNamaPengajar(p.nama);
    setEditPanggilanPengajar(p.panggilan || '');
    setEditMapelPengajar(p.mapel);
    setEditKampusPengajar(p.kampus);
    setEditGenderPengajar(p.gender);
    setEditIsActivePengajar(p.isActive);
    setShowEditPengajarModal(true);
  };

  const handleSaveEditPengajar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPengajar || !editNamaPengajar.trim()) return;

    setIsSubmitting(true);
    try {
      await api.savePengajar({
        id: editingPengajar.id,
        nama: editNamaPengajar.trim(),
        panggilan: editPanggilanPengajar.trim() || editNamaPengajar.trim(),
        mapel: editMapelPengajar.trim(),
        kampus: editKampusPengajar,
        gender: editGenderPengajar,
        isActive: editIsActivePengajar,
        marhalah: editingPengajar.marhalah || 'SEMUA',
      });

      alert(`Alhamdulillah, data pengajar "${editNamaPengajar}" berhasil diperbarui!`);
      setShowEditPengajarModal(false);
      setEditingPengajar(null);
      loadExtraData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal memperbarui pengajar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePengajar = async (p: PengajarItem) => {
    if (!window.confirm(`Yakin ingin menghapus data pengajar "${p.nama}"?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.deletePengajar(p.id);
      alert(`Data pengajar "${p.nama}" berhasil dihapus.`);
      loadExtraData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal menghapus pengajar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers Import CSV Pengajar ---
  const handlePengajarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('File CSV kosong atau hanya berisi baris header.');
        return;
      }

      // Format: Nama Lengkap,Panggilan,Mata Pelajaran,Kampus,Gender,No HP
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 1 && parts[0]) {
          const rawKampus = (parts[3] || '').toUpperCase();
          const targetKampus: Kampus = rawKampus === 'BANAT' ? 'BANAT' : (rawKampus === 'BANIN' ? 'BANIN' : kampus);
          const rawGender = (parts[4] || '').toUpperCase();
          const targetGender: 'IKHWAN' | 'AKHWAT' = rawGender === 'AKHWAT' ? 'AKHWAT' : (rawGender === 'IKHWAN' ? 'IKHWAN' : (targetKampus === 'BANAT' ? 'AKHWAT' : 'IKHWAN'));

          parsed.push({
            nama: parts[0],
            panggilan: parts[1] || parts[0],
            mapel: parts[2] || "Tahfidz Al-Qur'an",
            kampus: targetKampus,
            gender: targetGender,
            phone: parts[5] || null,
            marhalah: 'SEMUA',
            isActive: true,
          });
        }
      }
      setImportedPengajarRows(parsed);

    };
    reader.readAsText(file);
  };

  const handleDownloadPengajarTemplate = () => {
    const templateCSV = '\uFEFFNama Lengkap,Nama Panggilan,Mata Pelajaran,Kampus (BANIN/BANAT),Gender (IKHWAN/AKHWAT),No HP\nUst. Ahmad Fauzi, Lc.,Ust. Fauzi,Tahfidz Al-Qur\'an,BANIN,IKHWAN,081234567890\nUsth. Sarah Mutmainnah, S.Ag.,Usth. Sarah,Tahfidz Al-Qur\'an,BANAT,AKHWAT,081234567892';
    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Asatidz_Ibnu_Abbas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitPengajarImport = async () => {
    if (importedPengajarRows.length === 0) return;
    setIsSubmitting(true);
    try {
      await api.savePengajar(importedPengajarRows);
      alert(`Alhamdulillah, berhasil mengimport ${importedPengajarRows.length} data asatidz/pengajar ke sistem!`);
      setShowImportPengajarModal(false);
      setImportedPengajarRows([]);
      loadExtraData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Gagal mengimport data pengajar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header & Sub-Tab Bar */}
      <div className="card-modern rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                Master Database
              </span>
              <span className="text-xs font-medium text-slate-500">
                {marhalah === 'MI' ? 'Madrasah Ibtidaiyah' : 'Ula / MTs'} • {kampus === 'BANIN' ? 'Kampus Banin (Putra)' : 'Kampus Banat (Putri)'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-1">
              Pusat Manajemen Data & Petugas Ujian
            </h2>
            <p className="text-xs text-slate-500">
              Kelola master santri peserta ujian, database asatidz, dan penugasan penguji resmi.
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-2">
            {subTab === 'santri' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 active:scale-95 btn-tactile"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSantriModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 btn-tactile"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tambah Santri</span>
                </button>
              </>
            )}

            {subTab === 'pengajar' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowImportPengajarModal(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 active:scale-95 btn-tactile"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">Import CSV Asatidz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPengajarModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 btn-tactile"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tambah Pengajar</span>
                </button>
              </>
            )}
          </div>

        </div>

        {/* Modern Segmented Sub-Tab Controls */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubTab('santri')}
            className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
              subTab === 'santri'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Data Santri</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              subTab === 'santri' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {filteredSantri.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pengajar')}
            className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
              subTab === 'pengajar'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="truncate">2. Asatidz KBM</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              subTab === 'pengajar' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {pengajarList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('penguji')}
            className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
              subTab === 'penguji'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">3. Tim Penguji</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              subTab === 'penguji' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {kandidatPenguji.filter(k => k.isPengujiAktif).length} Aktif
            </span>
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-200/90 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            subTab === 'santri'
              ? 'Cari nama santri, NIS, atau kelas...'
              : subTab === 'pengajar'
              ? 'Cari nama pengajar, panggilan, atau mata pelajaran...'
              : 'Cari nama calon penguji atau musyrif...'
          }
          className="w-full text-xs font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 bg-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mobile Table/Card Switcher */}
      <div className="md:hidden flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-500">
          Tampilan: {showMasterTableMode ? 'Tabel Lengkap' : 'Kartu Ringkas'}
        </span>
        <button
          type="button"
          onClick={() => setShowMasterTableMode(!showMasterTableMode)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 shadow-2xs text-slate-700 hover:bg-slate-50 active:scale-95 transition"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showMasterTableMode ? 'Beralih ke Kartu' : 'Beralih ke Tabel'}</span>
        </button>
      </div>

      {/* TAB 1: DATA SANTRI */}
      {subTab === 'santri' && (
        <div className="space-y-4">
          {filteredSantri.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="font-bold text-sm text-slate-700">Tidak ada santri yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm ? 'Coba periksa kembali kata kunci pencarian Anda.' : 'Belum ada data santri pada unit ini.'}
              </p>
            </div>
          ) : (
            <>
              {/* A. Tampilan Desktop & Mobile Table (Nama, NIS, Kelas) */}
              <div className={`${showMasterTableMode ? 'block' : 'hidden md:block'} bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden`}>
                {showMasterTableMode && (
                  <div className="md:hidden bg-amber-50 px-3.5 py-2 border-b border-amber-200/70 text-[11px] font-medium text-amber-800 flex items-center justify-between">
                    <span>↔ Geser ke samping untuk melihat kolom lengkap</span>
                  </div>
                )}
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel Data Santri">
                  <table className="w-full min-w-[560px] text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-black border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12 whitespace-nowrap">No</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Nama Santri</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">NIS</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Kelas</th>
                        <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 text-center w-24 whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSantri.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-center font-bold text-slate-400 whitespace-nowrap">{idx + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900">{s.nama}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{s.nisn}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                              {s.kelas}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3" />
                              Aktif
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSantri(s)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition active:scale-95"
                                title="Edit Data Santri"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSantri(s)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition active:scale-95"
                                title="Hapus Data Santri"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* B. Tampilan Mobile Cards (Nama, NIS, Kelas) */}
              <div className={`${showMasterTableMode ? 'hidden' : 'block md:hidden'} space-y-2.5`}>
                {filteredSantri.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                          {s.nama.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs text-slate-900 truncate">{s.nama}</h4>
                          <span className="text-[10px] font-mono text-slate-500">NIS: {s.nisn}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 shrink-0">
                        {s.kelas}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSantri(s)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 active:scale-95"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSantri(s)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </>
          )}
        </div>
      )}

      {/* TAB 2: DATA PENGAJAR */}
      {subTab === 'pengajar' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
            <p>
              💡 <strong>Data Asatidz KBM:</strong> Daftar pengajar mata pelajaran dan asatidz pembimbing Ma'had Ibnu Abbas.
            </p>
          </div>

          {filteredPengajar.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="font-bold text-sm text-slate-700">Data pengajar tidak ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop & Mobile Table */}
              <div className={`${showMasterTableMode ? 'block' : 'hidden md:block'} bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden`}>
                {showMasterTableMode && (
                  <div className="md:hidden bg-amber-50 px-3.5 py-2 border-b border-amber-200/70 text-[11px] font-medium text-amber-800 flex items-center justify-between">
                    <span>↔ Geser ke samping untuk melihat kolom lengkap</span>
                  </div>
                )}
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel Data Pengajar">
                  <table className="w-full min-w-[740px] text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-black border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12 whitespace-nowrap">No</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Nama Lengkap & Gelar</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Panggilan</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Mata Pelajaran</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Kampus & Gender</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Marhalah</th>
                        <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 text-center w-24 whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPengajar.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-center font-bold text-slate-400 whitespace-nowrap">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{p.nama}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.panggilan || '-'}</td>
                          <td className="px-4 py-3 font-bold text-emerald-800 whitespace-nowrap">{p.mapel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              p.kampus === 'BANIN' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              {p.kampus === 'BANIN' ? 'Putra (Banin)' : 'Putri (Banat)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.marhalah}</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              p.isActive
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-slate-500 bg-slate-100 border-slate-200'
                            }`}>
                              {p.isActive && <Check className="w-3 h-3" />}
                              {p.isActive ? 'Aktif' : 'Non-aktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPengajar(p)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition active:scale-95"
                                title="Edit Data Pengajar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePengajar(p)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition active:scale-95"
                                title="Hapus Data Pengajar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className={`${showMasterTableMode ? 'hidden' : 'block md:hidden'} space-y-2.5`}>
                {filteredPengajar.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-xs text-slate-900">{p.nama}</h4>
                        <span className="text-[10px] text-slate-500">Panggilan: {p.panggilan || '-'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.kampus === 'BANIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-pink-50 text-pink-800 border border-pink-200'
                      }`}>
                        {p.kampus === 'BANIN' ? 'Banin' : 'Banat'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="font-bold text-emerald-800">{p.mapel}</span>
                      <span className="text-slate-500 font-medium">Unit: {p.marhalah}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPengajar(p)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 active:scale-95"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePengajar(p)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </>
          )}
        </div>
      )}

      {/* TAB 3: PENUGASAN PENGUJI UJIAN */}
      {subTab === 'penguji' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
            <h4 className="font-black text-xs text-amber-950 flex items-center gap-1.5">
              <span>⚖️ Pengaturan Tim Penguji Resmi Ujian Tahfidz</span>
            </h4>
            <p className="leading-relaxed">
              Tentukan siapa saja asatidz yang aktif sebagai Penguji resmi. Penguji yang aktif akan otomatis muncul pada formulir input nilai ujian.
            </p>
          </div>

          {filteredKandidat.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="font-bold text-sm text-slate-700">Kandidat penguji tidak ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop & Mobile Table */}
              <div className={`${showMasterTableMode ? 'block' : 'hidden md:block'} bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden`}>
                {showMasterTableMode && (
                  <div className="md:hidden bg-amber-50 px-3.5 py-2 border-b border-amber-200/70 text-[11px] font-medium text-amber-800 flex items-center justify-between">
                    <span>↔ Geser ke samping untuk melihat kolom lengkap</span>
                  </div>
                )}
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel Tim Penguji Ujian">
                  <table className="w-full min-w-[720px] text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-black border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12 whitespace-nowrap">No</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Nama Asatidz</th>
                        <th className="px-4 py-3.5 text-center whitespace-nowrap">Asal Petugas</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Kampus</th>
                        <th className="px-4 py-3.5 text-center whitespace-nowrap">Status & Aksi Penguji</th>
                        <th className="px-4 py-3.5 text-center whitespace-nowrap">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredKandidat.map((k, idx) => (
                        <tr key={k.id} className={`hover:bg-slate-50 transition ${k.isPengujiAktif ? 'bg-emerald-50/30' : ''}`}>
                          <td className="px-4 py-3 text-center font-bold text-slate-400 whitespace-nowrap">{idx + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900">{k.nama}</div>
                            <div className="text-[10px] text-slate-400">{k.panggilan ? `Panggilan: ${k.panggilan}` : ''}</div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              k.tipeAsal === 'MUSYRIF'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {k.tipeAsal}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              k.kampus === 'BANIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-pink-50 text-pink-800 border border-pink-200'
                            }`}>
                              {k.kampus === 'BANIN' ? 'Kampus Banin (Putra)' : 'Kampus Banat (Putri)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleTogglePenguji(k)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 mx-auto active:scale-95 btn-tactile ${
                                k.isPengujiAktif
                                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
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
                          <td className="px-4 py-3 text-center text-slate-500 text-[11px] whitespace-nowrap">
                            {k.keterangan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards with Instant Toggle */}
              <div className={`${showMasterTableMode ? 'hidden' : 'block md:hidden'} space-y-2.5`}>
                {filteredKandidat.map((k, idx) => (
                  <div
                    key={k.id}
                    className={`p-3.5 rounded-2xl border transition space-y-2.5 ${
                      k.isPengujiAktif ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-xs text-slate-900">{k.nama}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                            k.tipeAsal === 'MUSYRIF' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {k.tipeAsal}
                          </span>
                          <span className="text-[10px] text-slate-500">{k.panggilan ? `(${k.panggilan})` : ''}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        k.kampus === 'BANIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-pink-50 text-pink-800 border border-pink-200'
                      }`}>
                        {k.kampus === 'BANIN' ? 'Banin' : 'Banat'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {k.isPengujiAktif ? 'Tercatat di daftar penguji' : 'Belum ditugaskan'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleTogglePenguji(k)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 active:scale-95 btn-tactile ${
                          k.isPengujiAktif
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {k.isPengujiAktif ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Penguji Aktif</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Tugaskan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL TAMBAH SANTRI */}
      {showAddSantriModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <form
            onSubmit={handleTambahSantri}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Tambah Santri Baru</h3>
                <p className="text-xs text-slate-500">
                  Unit: {marhalah === 'MI' ? 'MI' : 'Ula / MTs'} ({kampus === 'BANIN' ? 'Banin' : 'Banat'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSantriModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                <input
                  type="text"
                  required
                  value={namaSantri}
                  onChange={(e) => setNamaSantri(e.target.value)}
                  placeholder="Contoh: Muhammad Abdullah"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Santri):</label>
                <input
                  type="text"
                  value={nisnSantri}
                  onChange={(e) => setNisnSantri(e.target.value)}
                  placeholder="Contoh: 20240101 (opsional)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Kelas:</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomKelas(!isCustomKelas)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    {isCustomKelas ? '← Pilih Dropdown' : '+ Ketik Manual'}
                  </button>
                </div>

                {isCustomKelas ? (
                  <input
                    type="text"
                    required
                    value={kelasSantri}
                    onChange={(e) => setKelasSantri(e.target.value)}
                    placeholder="Contoh: 1A MI atau 7B Ula"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                  />
                ) : (
                  <select
                    value={kelasSantri}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomKelas(true);
                      } else {
                        setKelasSantri(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold text-slate-800"
                  >
                    <optgroup label="Tingkat MI (Madrasah Ibtidaiyah)">
                      <option value="1 MI">Kelas 1 MI</option>
                      <option value="2 MI">Kelas 2 MI</option>
                      <option value="3 MI">Kelas 3 MI</option>
                      <option value="4 MI">Kelas 4 MI</option>
                      <option value="5 MI">Kelas 5 MI</option>
                      <option value="6 MI">Kelas 6 MI</option>
                    </optgroup>
                    <optgroup label="Tingkat Ula / MTs">
                      <option value="1 Ula / MTs">Kelas 1 Ula / MTs</option>
                      <option value="2 Ula / MTs">Kelas 2 Ula / MTs</option>
                      <option value="3 Ula / MTs">Kelas 3 Ula / MTs</option>
                    </optgroup>
                    <option value="CUSTOM">+ Tulis Kelas Manual...</option>
                  </select>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih tingkat kelas 1 MI sampai 3 Ula/MTS.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddSantriModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 shadow-xs btn-tactile"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Santri'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH PENGAJAR */}
      {showAddPengajarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <form
            onSubmit={handleTambahPengajar}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Tambah Data Pengajar Baru</h3>
                <p className="text-xs text-slate-500">
                  Tambahkan guru / asatidz KBM Ma'had Ibnu Abbas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPengajarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={namaPengajar}
                  onChange={(e) => setNamaPengajar(e.target.value)}
                  placeholder="Contoh: Ust. Syahrul Ramadhan, Lc."
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Panggilan:</label>
                <input
                  type="text"
                  value={panggilanPengajar}
                  onChange={(e) => setPanggilanPengajar(e.target.value)}
                  placeholder="Contoh: Syahrul"
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
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
                    className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  >
                    <option value="IKHWAN">Ikhwan (Laki-laki)</option>
                    <option value="AKHWAT">Akhwat (Perempuan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddPengajarModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 shadow-xs btn-tactile"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pengajar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL IMPORT EXCEL / CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Import Data Santri dari File CSV</h3>
                <p className="text-xs text-slate-500">
                  Unit: {marhalah === 'MI' ? 'MI' : 'Ula/MTs'} {kampus === 'BANIN' ? 'Banin' : 'Banat'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportedRows([]);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Download Button */}
            <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-emerald-950">Belum punya format CSV?</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl font-black text-[11px] border border-emerald-300 transition flex items-center gap-1 btn-tactile"
              >
                <Download className="w-3 h-3" />
                <span>Unduh Template</span>
              </button>
            </div>

            {/* Drag & Drop / File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/60 hover:bg-emerald-50/30 transition cursor-pointer"
            >
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-800">Klik untuk memilih file .csv dari perangkat</p>
              <p className="text-[10px] text-slate-400 mt-1">Mendukung format Comma Separated Values (UTF-8)</p>
            </div>

            {/* Preview of Imported Rows */}
            {importedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-800">Preview: {importedRows.length} Data Santri Siap Diimport</span>
                  <button 
                    onClick={() => setImportedRows([])} 
                    className="text-slate-400 hover:text-red-600 text-[10px]"
                  >
                    Batal Pilih
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-[11px] divide-y divide-slate-200">
                  {importedRows.slice(0, 10).map((r, i) => (
                    <div key={i} className="py-1 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.nama}</span>
                      <span className="text-slate-500 font-mono">NIS: {r.nisn} • {r.kelas}</span>
                    </div>
                  ))}
                  {importedRows.length > 10 && (
                    <div className="py-1 text-center text-slate-400 text-[10px]">
                      ...dan {importedRows.length - 10} santri lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportedRows([]);
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={importedRows.length === 0 || isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 shadow-sm btn-tactile"
              >
                {isSubmitting ? 'Mengimport...' : `Simpan ${importedRows.length} Santri`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT SANTRI */}
      {showEditSantriModal && editingSantri && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <form
            onSubmit={handleSaveEditSantri}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Edit Data Santri</h3>
                <p className="text-xs text-slate-500">
                  Perbarui informasi santri {editingSantri.nama} kapanpun diperlukan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditSantriModal(false);
                  setEditingSantri(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                <input
                  type="text"
                  required
                  value={editNamaSantri}
                  onChange={(e) => setEditNamaSantri(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Santri):</label>
                <input
                  type="text"
                  value={editNisnSantri}
                  onChange={(e) => setEditNisnSantri(e.target.value)}
                  placeholder="Contoh: 20240101"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Kelas:</label>
                  <button
                    type="button"
                    onClick={() => setIsEditCustomKelas(!isEditCustomKelas)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    {isEditCustomKelas ? '← Pilih Dropdown' : '+ Ketik Manual'}
                  </button>
                </div>

                {isEditCustomKelas ? (
                  <input
                    type="text"
                    required
                    value={editKelasSantri}
                    onChange={(e) => setEditKelasSantri(e.target.value)}
                    placeholder="Contoh: 1A MI atau 7B Ula"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                  />
                ) : (
                  <select
                    value={editKelasSantri}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsEditCustomKelas(true);
                      } else {
                        setEditKelasSantri(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold text-slate-800"
                  >
                    {editKelasSantri && !SEMUA_OPSI_KELAS.includes(editKelasSantri) && (
                      <option value={editKelasSantri}>{editKelasSantri} (Saat ini)</option>
                    )}
                    <optgroup label="Tingkat MI (Madrasah Ibtidaiyah)">
                      <option value="1 MI">Kelas 1 MI</option>
                      <option value="2 MI">Kelas 2 MI</option>
                      <option value="3 MI">Kelas 3 MI</option>
                      <option value="4 MI">Kelas 4 MI</option>
                      <option value="5 MI">Kelas 5 MI</option>
                      <option value="6 MI">Kelas 6 MI</option>
                    </optgroup>
                    <optgroup label="Tingkat Ula / MTs">
                      <option value="1 Ula / MTs">Kelas 1 Ula / MTs</option>
                      <option value="2 Ula / MTs">Kelas 2 Ula / MTs</option>
                      <option value="3 Ula / MTs">Kelas 3 Ula / MTs</option>
                    </optgroup>
                    <option value="CUSTOM">+ Tulis Kelas Manual...</option>
                  </select>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih tingkat kelas 1 MI sampai 3 Ula/MTS.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowEditSantriModal(false);
                  setEditingSantri(null);
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 shadow-xs btn-tactile"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDIT PENGAJAR */}
      {showEditPengajarModal && editingPengajar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <form
            onSubmit={handleSaveEditPengajar}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Edit Data Pengajar / Asatidz</h3>
                <p className="text-xs text-slate-500">
                  Perbarui profil asatidz {editingPengajar.nama}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditPengajarModal(false);
                  setEditingPengajar(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={editNamaPengajar}
                  onChange={(e) => setEditNamaPengajar(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Panggilan:</label>
                <input
                  type="text"
                  value={editPanggilanPengajar}
                  onChange={(e) => setEditPanggilanPengajar(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                <input
                  type="text"
                  required
                  value={editMapelPengajar}
                  onChange={(e) => setEditMapelPengajar(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kampus Bertugas:</label>
                  <select
                    value={editKampusPengajar}
                    onChange={(e) => setEditKampusPengajar(e.target.value as Kampus)}
                    className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  >
                    <option value="BANIN">Kampus Banin (Putra)</option>
                    <option value="BANAT">Kampus Banat (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <select
                    value={editGenderPengajar}
                    onChange={(e) => setEditGenderPengajar(e.target.value as any)}
                    className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  >
                    <option value="IKHWAN">Ikhwan</option>
                    <option value="AKHWAT">Akhwat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Pengajar:</label>
                <select
                  value={editIsActivePengajar ? 'true' : 'false'}
                  onChange={(e) => setEditIsActivePengajar(e.target.value === 'true')}
                  className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                >
                  <option value="true">Aktif Mengajar</option>
                  <option value="false">Non-aktif / Cuti</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowEditPengajarModal(false);
                  setEditingPengajar(null);
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 shadow-xs btn-tactile"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL IMPORT EXCEL / CSV ASATIDZAH KBM */}
      {showImportPengajarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Import Data Asatidz dari File CSV</h3>
                <p className="text-xs text-slate-500">
                  Tambahkan daftar asatidz & pengajar KBM secara massal dari Excel / CSV.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportPengajarModal(false);
                  setImportedPengajarRows([]);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Download Button */}
            <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-emerald-950">Belum punya format CSV Asatidz?</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadPengajarTemplate}
                className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl font-black text-[11px] border border-emerald-300 transition flex items-center gap-1 btn-tactile"
              >
                <Download className="w-3 h-3" />
                <span>Unduh Template Asatidz</span>
              </button>
            </div>

            {/* Drag & Drop / File Input */}
            <input
              type="file"
              ref={pengajarFileInputRef}
              onChange={handlePengajarFileUpload}
              accept=".csv"
              className="hidden"
            />

            <div 
              onClick={() => pengajarFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/60 hover:bg-emerald-50/30 transition cursor-pointer"
            >
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-800">Klik untuk memilih file CSV Asatidz dari perangkat</p>
              <p className="text-[10px] text-slate-400 mt-1">Kolom: Nama Lengkap, Panggilan, Mapel, Kampus, Gender, No HP</p>
            </div>

            {/* Preview of Imported Pengajar Rows */}
            {importedPengajarRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-800">Preview: {importedPengajarRows.length} Asatidz Siap Diimport</span>
                  <button 
                    onClick={() => setImportedPengajarRows([])} 
                    className="text-slate-400 hover:text-red-600 text-[10px]"
                  >
                    Batal Pilih
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-[11px] divide-y divide-slate-200">
                  {importedPengajarRows.slice(0, 10).map((r, i) => (
                    <div key={i} className="py-1 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.nama}</span>
                      <span className="text-slate-500">{r.mapel} • {r.kampus}</span>
                    </div>
                  ))}
                  {importedPengajarRows.length > 10 && (
                    <div className="py-1 text-center text-slate-400 text-[10px]">
                      ...dan {importedPengajarRows.length - 10} pengajar lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowImportPengajarModal(false);
                  setImportedPengajarRows([]);
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCommitPengajarImport}
                disabled={importedPengajarRows.length === 0 || isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 shadow-sm btn-tactile"
              >
                {isSubmitting ? 'Mengimport...' : `Simpan ${importedPengajarRows.length} Pengajar`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

