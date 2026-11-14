# Aplikasi Ujian Hafalan Ibnu Abbas

Aplikasi Manajemen & Penilaian Ujian Hafalan Al-Qur'an (Tahfidz) untuk santri Kuttab & Ma'had Ibnu Abbas.

---

## 🌟 Fitur Utama

- **Penilaian Ujian Real-time**:
  - Penilaian per soal (Salah Besar, Salah Kecil, Tahsin/Kelancaran).
  - Kalkulasi otomatis nilai akhir dan predikat (Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, Rasib).
  - Modal panduan & simulasi rumus penilaian ujian.
- **Rapor Hafalan Santri**:
  - Tampilan siap cetak / PDF rapor hasil ujian hafalan.
  - Catatan dan tanda tangan penguji otomatis.
- **Rekapitulasi Nilai (Master Rekap)**:
  - Ringkasan nilai seluruh santri per marhalah dan kelas.
  - Export data ke Excel / CSV untuk administrasi pondok.
- **Master Data**:
  - Manajemen Santri (NISN, Nama, Marhalah, Kampus, Kelas, Target Juz).
  - Manajemen Pengajar & Penguji Ujian (Banin & Banat, MI & Ula/MTs).
- **Backend & Database Terpadu**:
  - Cloudflare Pages Functions (`/functions/api/`).
  - Database PostgreSQL via Neon Serverless.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Cloudflare Pages Functions
- **Database**: PostgreSQL (Neon Serverless)
- **Deployment**: Cloudflare Pages

---

## 🚀 Menjalankan Secara Lokal

1. **Clone repository**:
   ```bash
   git clone https://github.com/rofiq-ais/ujian-hafalan-ibnu-abbas.git
   cd ujian-hafalan-ibnu-abbas
   ```

2. **Install dependensi**:
   ```bash
   npm install
   # atau
   bun install
   ```

3. **Konfigurasi Environment Variables**:
   Salin `.env.example` ke `.env` dan isi connection string Neon database Anda:
   ```env
   DATABASE_URL=postgresql://user:password@ep-example.neon.tech/dbname?sslmode=require
   ```

4. **Jalankan local server**:
   ```bash
   npm run dev
   # atau
   bun run dev
   ```

5. **Build untuk produksi**:
   ```bash
   npm run build
   ```

---

## ☁️ Deploy ke Cloudflare Pages

1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Klik **Create application** > Tab **Pages** > **Connect to Git**.
3. Pilih repository `rofiq-ais/ujian-hafalan-ibnu-abbas`.
4. Pengaturan Build:
   - **Framework preset**: `Vite` (atau `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Tambahkan Environment Variable:
   - `DATABASE_URL`: Isi dengan connection string Neon Postgres Anda.
6. Klik **Save and Deploy**.
