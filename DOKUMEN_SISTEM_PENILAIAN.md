# DOKUMENTASI SISTEM & RUMUS PENILAIAN UJIAN HAFALAN AL-QUR'AN
**Ma'had Ibnu Abbas (MI & Ula / MTs — Kampus Banin & Banat)**

---

## 1. Lingkup & Struktur Organisasi
Sistem ini dirancang untuk mencakup seluruh unit pondok dengan hierarki sebagai berikut:

- **Marhalah (Jenjang):**
  1. `MI` (Madrasah Ibtidaiyah)
  2. `Ula / MTs` (Madrasah Tsanawiyah)
- **Kampus (Gender):**
  1. `Banin` (Putra)
  2. `Banat` (Putri)
- **Periode Akademik:**
  - Tahun Ajaran (contoh: `2026/2027`)
  - Semester: `Ganjil` / `Genap`
- **Jenis Ujian Tahfidz:**
  - `UTS` (Penilaian Tengah Semester)
  - `UAS` / `PAS` (Penilaian Akhir Semester)

---

## 2. Struktur Ujian

### A. Ujian Tengah Semester (UTS)
- **Jumlah Soal:** Standar **10 Soal** (Soal 1 s.d. 10).
- **Pengelompokan:** 
  - Sesi 1: Soal 1 – 5
  - Sesi 2: Soal 6 – 10
- **Cakupan Materi:** Target juz berjalan pada semester tersebut.

### B. Ujian Akhir Semester (UAS / PAS)
- **Pemilihan Juz:** Fleksibel / Dinamis sesuai capaian santri (memilih 1 s.d. maksimal 10 Juz dari Juz 1 s.d. Juz 30).
- **Rasio Soal:** **5 Soal per 1 Juz terpilih**.
- **Total Soal:**
  $$\text{Total Soal} = \text{Jumlah Juz Terpilih} \times 5$$
  *(Contoh: Ujian 3 Juz = 15 Soal; Ujian 10 Juz = 50 Soal)*.
- **Nilai Per Juz:** Rata-rata dari 5 soal pada juz yang bersangkutan.

---

## 3. Parameter Penilaian Tiap Soal
Setiap butir soal dinilai berdasarkan 3 parameter:

| Parameter | Singkatan | Bobot Pengurang / Nilai | Keterangan |
| :--- | :---: | :---: | :--- |
| **Salah Besar** | `SB` | $-1.0$ per kesalahan | Kesalahan fatal: lupa ayat, terlewat satu baris/ayat, tertukar surat, salah harakat/huruf yang mengubah makna secara fatal dan tidak bisa dibetulkan sendiri. |
| **Salah Kecil** | `SK` | $-0.2$ ($\frac{1}{5}$) per kesalahan | Kesalahan ringan: ragu-ragu sejenak lalu membetulkan sendiri, kesalahan tajwid ringan. |
| **Tahsin / Tajwid** | `Tahsin` | $0$ s.d. $6$ poin | Kualitas makharijul huruf, shifatul huruf, ahkamul mad wal qasr, serta kelancaran tartil. |

---

## 4. Algoritma & Rumus Matematis

### Langkah 1: Menghitung Kesalahan Bernilai Ekuivalen (KBE)
Setiap 5 kali Salah Kecil ($SK$) bernilai setara dengan 1 kali Salah Besar ($SB$):
$$\text{KBE} = \text{SB} + \left( \frac{\text{SK}}{5} \right)$$

### Langkah 2: Menghitung Nilai Dasar Soal
Setiap 1 poin KBE mengurangi 10 poin dari nilai sempurna (100). Nilai dasar memiliki batas bawah (floor) 50:
$$\text{Nilai Dasar Murni} = 100 - (\text{KBE} \times 10)$$
$$\text{Nilai Dasar} = \max(50, \text{Nilai Dasar Murni})$$

### Langkah 3: Menentukan Bonus Tahsin
Bonus tahsin diberikan sebagai apresiasi bacaan tajwid yang baik bagi santri yang belum mencapai nilai 70, asalkan kesalahan tidak terlalu banyak ($KBE < 4$):

$$\text{Bonus Tahsin} = \begin{cases} 
10, & \text{jika } \text{KBE} < 4 \text{ dan } \text{Nilai Dasar} < 70 \text{ dan } 0 \le \text{Tahsin} \le 3 \\
5, & \text{jika } \text{KBE} < 4 \text{ dan } \text{Nilai Dasar} < 70 \text{ dan } 4 \le \text{Tahsin} \le 6 \\
0, & \text{kondisi lainnya}
\end{cases}$$

### Langkah 4: Menghitung Nilai Akhir Butir Soal
$$\text{Nilai Akhir Soal} = \min(100, \text{Nilai Dasar} + \text{Bonus Tahsin})$$

---

## 5. Perhitungan Agregat & Rekapitulasi

### A. Nilai Rata-rata per Juz (Khusus UAS)
Untuk setiap juz $k$ yang terdiri dari 5 soal:
$$\text{Nilai Juz}_k = \frac{\sum_{i=1}^{5} \text{Nilai Akhir Soal}_{k, i}}{5}$$

### B. Nilai Rata-rata Akhir Santri
$$\text{Rata-rata Akhir} = \frac{\sum_{j=1}^{\text{Total Soal}} \text{Nilai Akhir Soal}_j}{\text{Total Soal}}$$

### C. Konversi Predikat & Kategori Kelulusan

| Rentang Nilai Rata-Rata | Predikat / Kategori | Status | Warna Badge |
| :---: | :---: | :---: | :---: |
| $\le 50.0$ | **Gagal** | Mengulang (Remedial Penuh) | Merah (`#DC2626`) |
| $50.1 - 60.0$ | **Cukup** | Mengulang Sebagian | Oranye / Kuning (`#F59E0B`) |
| $60.1 - 70.0$ | **Baik** | Lulus Bersyarat | Biru Muda (`#2563EB`) |
| $70.1 - 80.0$ | **Sangat Baik** | Lulus Baik | Hijau (`#10B981`) |
| $> 80.0 - 100.0$ | **Sempurna** | Mumtaz / Istimewa | Hijau Emerald Tua (`#059669`) |

---

## 6. Contoh Perhitungan Manual (Studi Kasus)

Misalkan santri diuji pada Soal 1:
- `SB` = 1
- `SK` = 3
- `Tahsin` = 2

1. **Hitung KBE:**
   $$\text{KBE} = 1 + \frac{3}{5} = 1 + 0.6 = 1.6$$
2. **Hitung Nilai Dasar:**
   $$\text{Nilai Dasar} = 100 - (1.6 \times 10) = 100 - 16 = 84$$
3. **Cek Bonus Tahsin:**
   Karena Nilai Dasar ($84$) $\ge 70$, maka **Bonus Tahsin = 0**.
4. **Nilai Akhir Soal 1:**
   $$\text{Nilai Akhir Soal} = 84 + 0 = \mathbf{84.0}$$

*Contoh Kasus dengan Bonus Tahsin:*
- `SB` = 3, `SK` = 4, `Tahsin` = 2
  - $KBE = 3 + 0.8 = 3.8$ ($KBE < 4$ terpenuhi)
  - $\text{Nilai Dasar} = 100 - 38 = 62$ ($< 70$ terpenuhi)
  - Tahsin = 2 (masuk rentang $0-3$) $\rightarrow$ **Bonus Tahsin = 10**
  - $\text{Nilai Akhir Soal} = 62 + 10 = \mathbf{72.0}$

---

## 7. Fitur Siklus Ujian & Cicilan (Progressive Saving)
1. **Fitur Cicilan (Save Progress):**
   - Penguji dapat menyimpan hasil evaluasi setiap kelipatan 5 soal (1 juz).
   - Nilai tidak hilang jika waktu ujian habis atau santri melanjutkan ujian di sesi berikutnya bersama asatidz lain.
2. **Riwayat & Load Otomatis:**
   - Sistem mendeteksi otomatis jika santri sudah memiliki rekam jejak cicilan untuk ujian berjalan.
