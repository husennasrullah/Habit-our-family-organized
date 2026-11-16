# Pembenahan Kenangan — 2026-11-16

Kenangan memakai galeri dengan kartu foto/cerita, ringkasan album, pencarian judul/cerita, filter tahun dari data aktual, bulan dan favorit. Detail dialog menampilkan cerita penuh, termasuk jurnal tanpa foto; semua foto dapat diperbesar di lightbox. Form tambah/edit maksimal 360 px, memakai tema aplikasi, tanggal WIB, validasi Zod, preview file dan reset saat dibuka ulang. Semua foto dimuat untuk edit, thumbnail memakai API autentikasi, dan hasil hapus diambil ulang. Tombol mutasi hanya tersedia untuk admin/member; API menerapkan kebijakan yang sama. Role lain tetap dapat membaca foto/cerita keluarga.

## File dan konsistensi

- Foto baru hanya JPG/PNG/WebP dengan ekstensi dan signature/MIME sesuai. Maksimal 8 MB per foto, 40 MB per batch, 20 foto per kenangan termasuk record menunggu pembersihan. Header MIME klien tidak dipercaya. Batas request global 50 MB tetap berlaku.
- Akses selalu melalui proxy bearer, `private, no-store` dan `nosniff`; object key tidak dikirim dalam JSON. File lama di-sniff dan dibatasi saat dibaca. Foto lama dengan format lain atau lebih dari 8 MB ditolak saat dibaca; file aslinya tidak dikonversi/dihapus otomatis.
- Pembacaan foto memakai API bersama dengan refresh token. Request dibatalkan ketika view berubah; blob URL dibersihkan saat unmount/perubahan identitas. Error memiliki aksi coba lagi, bukan spinner tanpa akhir.
- Mutasi mengunci baris induk. Update menggunakan field eksplisit tanpa Save snapshot, sehingga metadata/favorit tidak saling menimpa atau menghidupkan jurnal terhapus. Nested photo ID harus cocok dengan ID kenangan dan keluarga JWT.
- Migrasi tambahan `015_memory_cleanup.sql` menambahkan penanda penghapusan jurnal/foto serta unggahan belum selesai; startup AutoMigrate juga mengenali kolom baru. Tidak mengubah migrasi lama.
- Upload memvalidasi seluruh batch dahulu, menyimpan record upload pending, lalu mengunggah dan mengaktifkan batch dalam transaksi yang mengunci induk. Jika gagal, mencoba menghapus seluruh batch baru. Pembersihan yang gagal tetap tercatat dan dapat dihapus ulang dari form edit. Record yang belum aktif tidak memiliki URL baca. Penanda upload dan penghapusan terpisah agar upload tidak mengaktifkan kembali foto yang sedang dihapus.
- Hapus menyimpan penanda sebelum menyentuh storage. Akses berhenti dan item tetap terlihat untuk retry jika storage/DB gagal. Metadata foto baru dihapus setelah storage berhasil. Penyelesaian berulang terhadap tombstone keluarga yang sama aman. Ini bukan transaksi atomik lintas database dan storage; crash memerlukan retry yang terlihat di UI.
- Form tidak ditutup sebelum foto berhasil. Jika jurnal berhasil tetapi upload gagal, ID jurnal dipertahankan dan file pilihan tetap tersedia untuk retry tanpa membuat jurnal baru. Kehilangan respons jaringan setelah server berhasil bukan jaminan idempotensi upload; periksa foto tersimpan sebelum mengulang pada kondisi tersebut.

## Verifikasi

- Tes backend dan go vet; integrasi PostgreSQL sementara dengan schema terisolasi: metadata/tanggal, family isolation, parent mismatch, private URL/object-key redaction, baca foto, update metadata/favorit bersamaan, upload bersamaan/urutan, rollback batch, cleanup gagal/retry, blok baca saat pending, hapus ulang dan pencegahan resurrection. SQL migrasi dijalankan dua kali.
- Tes frontend mencakup validasi metadata/tanggal, limit file/batch/album dan pergantian tanggal WIB. Build produksi, lint dan typecheck mengikuti pemeriksaan proyek.
- QA browser lulus 22 pemeriksaan dan lima audit axe terarah tanpa pelanggaran/error runtime/overflow pada 375/390/768/1440 px terang/gelap. Memakai API fixture, bukan data keluarga asli. Hasil dan screenshot di `docs/qa/memories-modern-*`; skrip reproduksi `frontend/scripts/memories-qa.cjs` memakai Chrome dan axe-core yang tersedia di lingkungan QA.

Tidak menambah dependency runtime, mengubah env/data keluarga asli, atau menerapkan migrasi ke database aplikasi lokal. Provider cloud/PWA perangkat fisik belum diuji. Bucket provider tetap harus privat; perubahan aplikasi tidak mencabut public policy atau URL publik lama. Timeline, tag anggota, editor rich text dan fitur “hari ini tahun lalu” tidak ditambahkan dalam pembenahan ini.
