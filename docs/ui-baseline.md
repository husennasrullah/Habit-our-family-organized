# Baseline dan spesifikasi implementasi — 2026-11-12

## Bukti dan batas pemeriksaan

Source diperiksa: shell dashboard, navigasi, auth, dashboard, hooks tugas/acara/keuangan, tipe data dan service anggaran. Referensi visual berasal dari dua gambar pengguna dan mockup lama. Tidak tersedia browser automation terpasang; belum ada screenshot baseline runtime desktop/mobile. Server development berhasil berjalan setelah izin membuka port, dan HEAD `/login` menghasilkan HTTP 200. Ini hanya verifikasi respons halaman, bukan pengujian alur login atau layout visual. Server dihentikan setelah pemeriksaan.

## Struktur yang ditetapkan

Navigasi:
- Sehari-hari: Beranda, Kalender, Tugas, Jadwal Makan.
- Keluarga: Keuangan, Anak, Kenangan, Liburan, Dokumen.
- Akun: Pengaturan.
- Mobile: Beranda, Kalender, Tugas, Keuangan, Jadwal Makan. Fitur lain lewat drawer; label tidak berubah antarlayar.

Susunan dashboard tahap 3:
1. Sapaan singkat + ilustrasi keluarga 2D kecil, satu bagian pembuka.
2. Agenda hari ini dan tugas hari ini/terlambat; link tindakan ke modul terkait.
3. Ringkasan pengeluaran/anggaran bulan aktif.
4. Informasi pendukung seperti pengingat anak dan kenangan, tanpa statistik foto baru yang tidak memiliki periode.

Desktop: sidebar 240 px (80 px ketika ringkas), konten maksimum 1440 px termasuk padding, dua kolom hanya jika ruang cukup. Mobile: satu kolom, padding 16 px, bottom navigation dan safe area. Konten penting tidak bergantung pada hover.

## Kontrak data dashboard

| Informasi | Sumber | Aturan |
|---|---|---|
| Tugas hari ini | `useTasks()` | Belum done, bagian tanggal `due_date` sama dengan tanggal lokal hari ini. Kolom DB bertipe date; jangan menggesernya sebagai timestamp UTC. |
| Terlambat | `useTasks()` | Belum done, tanggal valid sebelum hari ini; tanggal kosong bukan mendesak. |
| Belum dijadwalkan | `useTasks()` | Belum done, tidak punya due_date; tampil terpisah bila diperlukan. |
| Agenda hari ini | `useEvents(from,to)` | Rentang awal/akhir hari lokal dikirim ISO; sertakan event yang sedang berlangsung dan event lintas hari. Urutkan berdasarkan waktu, potong hanya daftar tampilan. |
| Pengeluaran bulan ini | `useBudgetSummary(month,year)` | `summary.total`; respons service menjumlahkan kategori untuk bulan yang diminta. |
| Anggaran bulan ini | `useBudgets(month,year)` | Jumlah budget kategori pada bulan aktif. Tidak memakai nominal tetap Rp3 juta. |
| Sisa anggaran | Anggaran - pengeluaran | Jika total anggaran <= 0: tampilkan “Anggaran belum diatur”, tanpa persen. Selisih negatif ditulis “Melebihi anggaran” dan nominal kelebihannya. |
| Progress anggaran | Pengeluaran / anggaran | Hanya jika anggaran > 0; bar dibatasi 0–100%, label boleh >100% dan disertai status terlampaui. |
| Kenangan | `useMemories()` | Jumlah entri bukan jumlah foto. Hindari kata “baru” tanpa periode; jumlah foto memakai panjang photos jika dibutuhkan. |

Data gagal dimuat tidak boleh ditampilkan sebagai angka nol yang seolah valid. Loading, empty, error dan mutation pending harus dibedakan. Mata uang pengeluaran memiliki field currency; ringkasan API saat ini tidak mengelompokkan currency. Dashboard mengikuti konteks IDR aplikasi saat ini; dukungan multi-currency adalah pekerjaan terpisah, bukan menjumlahkan lintas kurs diam-diam.

## Fondasi visual

Palet dan ilustrasi: `ui-art-direction.md`. Implementasi awal memakai token sage, font Inter yang sudah ada, label 14 px dan caption 12 px. Focus-visible global dan reduced-motion ditambahkan. Primitive UI lama tidak diubah; `components/shared/PageHeader.tsx` dan `ContentState.tsx` menjadi wrapper untuk migrasi halaman bertahap. Modal/tab/form existing akan dimigrasikan saat modul terkait dikerjakan, agar perilaku tidak diubah serentak tanpa pemeriksaan.

## Verifikasi batch pertama

- Lint: lulus, dua warning existing `<img>` di halaman liburan.
- Typecheck: lulus setelah perubahan shell; akan diulang setelah wrapper bersama.
- HTTP `/login`: 200 pada dev server.
- Build awal gagal mengambil Google Fonts karena jaringan sandbox. Percobaan dengan izin jaringan mencapai font loader tetapi gagal `TypeError: Cannot read properties of null (reading '1')` di loader next/font Google. Build belum lulus; perlu ditangani sebelum menyatakan fondasi siap produksi.
- Pemeriksaan visual pada 375/390/768/1440 px, keyboard drawer, serta CRUD belum dilakukan di browser.

## Verifikasi lanjutan — 2026-11-13

Baseline di atas adalah catatan historis batch awal. Redesign seluruh halaman telah diterapkan dan build produksi kini lulus menggunakan font Inter lokal. Pemeriksaan final: 107 kunjungan/skenario halaman, tanpa overflow horizontal atau error runtime; 29 audit axe terpilih bersih; enam tes logika dashboard lulus. PWA manifest/service worker dan fallback offline diuji di Chrome. Screenshot dan batas fixtures vs backend nyata: `ui-redesign-qa.md`.
