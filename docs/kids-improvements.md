# Menu Anak — perbaikan 2026-11-13

Review menemukan draft terbawa antar anak, validasi longgar, pembacaan vaksin yang menulis data, serta alur koreksi dan penambahan catatan yang belum lengkap. Perbaikan menyediakan CRUD profil dan empat jenis catatan, form yang terikat pada anak yang dipilih ketika dibuka, dan grafik satu ukuran per sumbu.

## Perilaku dan keputusan

- Profil: tambah, edit nama/jenis kelamin/tanggal lahir/catatan, dan hapus dengan konfirmasi. Pilihan anak menyimpan ID, sehingga profil selalu berasal dari query terbaru. Setelah profil dihapus, pilihan beralih ke profil yang masih tersedia.
- Pertumbuhan: tambah/edit/hapus tinggi atau panjang, berat, lingkar kepala, tanggal serta catatan. Minimal satu ukuran, angka positif hingga batas kolom database 999,99 dan dua desimal. Batas ini merupakan batas teknis penyimpanan, bukan klasifikasi kesehatan.
- Vaksin: tambah jadwal manual, edit/hapus, catat tanggal aktual/pemberi/fasilitas/catatan dan koreksi kembali ke belum diberikan. Data lama terisi saat membuka form. Tanggal jadwal boleh di masa depan; tanggal aktual tidak boleh di masa depan atau sebelum lahir. Tidak mengharuskan tanggal aktual setelah jadwal karena catatan aktual dapat berbeda.
- Milestone: tambah/edit/hapus judul/kategori/catatan dan tanggal aktual tercapai. Buka kembali memakai desired state `achieved:false`, bukan toggle yang rentan double click. Endpoint toggle lama tetap tersedia dengan transaksi terserialisasi.
- Kesehatan: CRUD jenis/keluhan/tanggal/dokter/obat/catatan; field opsional dapat dikosongkan. Jenis ditampilkan dalam Bahasa Indonesia.
- Semua form berupa dialog maksimal 360 px, input desktop 13 px dan sentuh 16 px, validasi native+Zod serta pesan server. Form di-unmount saat ditutup dan menyimpan identitas anak pada target; tidak ada draft bersama antar anak. Permintaan mutation menyertakan kidId sebagai variabel sehingga invalidasi cache tidak bergeser saat pilihan anak berubah. Aksi berulang ditahan saat pending. Penambahan profil/vaksin/milestone tersedia pada kondisi kosong.
- Default tanggal frontend/backend memakai WIB; tanggal DATE/timestamp dinormalisasi untuk form/label. Nama akses tombol spesifik untuk anak/catatan. Empty, error/retry, loading, konfirmasi hapus dan kegagalan mutation ditampilkan.
- Menu Anak dan API hanya tersedia bagi role admin/member, mengikuti kebijakan anggota dewasa pada plan. Sidebar/pengingat dashboard menyesuaikan; child/view_only tidak memuat data kids. Tidak mengubah hak akses modul lain.

## Ketepatan penyimpanan

Semua write menggunakan transaksi dan row lock pada profil induk, termasuk koreksi tanggal lahir dan penghapusan. ID keluarga berasal dari JWT; ID catatan harus cocok dengan ID anak pada path. Query rincian dibatasi lewat profil keluarga yang masih aktif. UPDATE tidak menggunakan GORM Save/upsert sehingga tidak menghidupkan kembali record terhapus. Penghapusan profil melakukan soft-delete rincian dan profil dalam transaksi yang sama; write bersamaan tidak menyisakan rincian aktif tanpa profil aktif.

GET vaksin hanya menghitung status terlambat pada response; tidak mengubah record atau metadata. Pencatatan vaksin dengan payload yang tidak menyertakan pemberi/catatan mempertahankan nilainya. Perubahan tanggal lahir yang melewati tanggal riwayat ditolak agar catatan tidak mendahului kelahiran. Validasi backend memeriksa enum, nama trim/panjang, tanggal kalender, urutan tanggal dan angka finite.

## Grafik dan data referensi

Grafik menampilkan satu ukuran per pilihan (panjang/tinggi, berat, lingkar kepala), dengan sumbu nilai/satuan dan jarak tanggal sebenarnya. Catatan kosong tetap berupa gap, tidak menghapus seri lain. Titik dapat dipilih atau difokuskan untuk membaca tanggal/nilai; riwayat tabel tetap tersedia. Semua catatan ditampilkan, bukan hanya enam titik terakhir.

Referensi panjang/tinggi dan berat disalin dari tabel z-score bulanan resmi WHO untuk anak laki-laki/perempuan usia 0–60 bulan:

- [WHO Weight-for-age](https://www.who.int/tools/child-growth-standards/standards/weight-for-age)
- [WHO Length/height-for-age](https://www.who.int/tools/child-growth-standards/standards/length-height-for-age)

Data statis hanya menyimpan bulan, −2 SD, median dan +2 SD yang diterbitkan. Panjang sebelum usia 24 bulan dan tinggi mulai usia 24 bulan merupakan seri terpisah; tidak menghubungkan transisi keduanya sebagai satu kurva. Posisi bulan memakai tanggal lahir ditambah bulan kalender. Garis antartitik bulanan berupa segmen linear, tanpa perhitungan z-score atau label diagnosis. Tidak mengekstrapolasi referensi di luar rentang sumber; referensi tidak digambar saat jenis kelamin kosong. Lingkar kepala saat ini hanya memakai catatan pribadi. Keterbatasan rentang terlihat di UI.

Provenance: `docs/data/who-growth-sources.json` menyimpan enam URL XLSX, header dan SHA-256 sumber (diambil 2026-11-13). Reproduksi: `python3 frontend/scripts/import-who-growth.py` dari root repo. Data output: `frontend/lib/data/who-growth.json`. Tidak menambahkan library runtime/konversi data.

Jadwal vaksin dan milestone diisi manual berdasarkan catatan keluarga. Sesi ini tidak menghasilkan rekomendasi jadwal klinis otomatis, seed medis, screen time, atau sekolah; pekerjaan tersebut dari plan lama tetap terpisah dari pembenahan hasil review.

## Wordmark Habit

Ukuran vektor diperkecil dari 106×31 menjadi 84×25 px. Jarak tagline dipadatkan agar proporsional dengan ikon rumah 34 px. Warna huruf memakai emerald #007f5b pada tema terang dan #8ce0bd pada tema gelap, dengan titik kuning yang sama. Diterapkan lewat komponen brand bersama pada sidebar/auth; ikon rumah dan launcher PWA dipertahankan.

## Verifikasi

- `go test ./...` dan `go vet ./...` lulus. Tes mencakup validasi, role HTTP dan path nested tidak valid.
- Integrasi PostgreSQL `TestKidsCRUDIsolationAndConcurrentActions` lulus pada schema temporer: CRUD/correction/clear, keluarga/anak berbeda, GET tanpa write, metadata vaksin, 20 pembaca dan 20 pencatat vaksin bersamaan, 10 request milestone desired state, larangan tanggal lahir melewati riwayat, penghapusan profil bersamaan dengan penambahan rincian. Schema dibersihkan otomatis; tidak menyentuh data keluarga asli.
- 22 tes frontend lulus, termasuk input kids, tanggal/role, data sparse dan verifikasi nilai/rentang sumber WHO. Build produksi `.next-qa` berikut lint/typecheck lulus pada 19 halaman.
- QA browser memakai fixture API di memori; script `frontend/scripts/kids-qa.cjs`. Hasil final dan screenshot pada `docs/qa/kids-modern-*` dan `kids-modal-growth-mobile.png`. 34 pemeriksaan dan 17 audit axe terarah lulus tanpa error runtime, overflow halaman atau pelanggaran pada 375/390/1024/1440 px serta tema terang/gelap. Pemeriksaan mencakup CRUD, draft antar anak, clear field, actual date, validasi dan kegagalan simpan, empty/error, role, serta ukuran wordmark. Detail pada `kids-modern-results.json`.

Tidak ada perubahan schema atau dependency runtime. Pengguna meminta commit/push biasa ke origin/main setelah verifikasi; pantau CI/CD dan periksa alur di deployment setelah pengiriman.
