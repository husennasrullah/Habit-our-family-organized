# Riset kandidat fitur Habit — 2026-11-17

> **Status: diarsipkan / ditunda atas arahan pengguna.** Seluruh delapan ide disimpan sebagai referensi, bukan roadmap aktif atau persetujuan implementasi. Lanjutkan pembahasan atau pengerjaan hanya jika pengguna memberi arahan baru.

Scope: pengguna meminta riset internet dan penjabaran sebelum implementasi. Belum ada fitur dipilih atau perubahan aplikasi.

## Temuan resmi

- FamilyWall: kalender, belanja, keuangan, album, messenger dan lokasi; Premium juga jadwal berulang, sinkron kalender eksternal dan meal planner ke daftar belanja. https://support.familywall.com/en/support/solutions/articles/47001013681-about-familywall dan https://support.familywall.com/en/support/solutions/articles/47001239196-what-is-included-in-familywall-premium-
- Joon: orang tua memberi quest, anak menandai selesai, orang tua meninjau, reward digunakan merawat pet virtual. https://www.joonapp.io/user-manual/how-joon-works
- Finch: penyelesaian goal menghasilkan energi/batu virtual dan membantu pet tumbuh. Ini referensi gamifikasi aplikasi kebiasaan personal, bukan aplikasi organizer keluarga. https://help.finchcare.com/hc/en-us/articles/37779940291213-Creating-and-Completing-Goals
- Paired: pertanyaan harian, kuis pasangan dan paket pertanyaan untuk memulai percakapan. Ini referensi aplikasi pasangan; adaptasi untuk anak/seluruh keluarga merupakan usulan Habit. https://support.paired.com/en/articles/164632-what-is-paired
- Greenlight: chores dengan pembagian penghasilan ke kategori tabungan/pengeluaran. Referensi insentif; tidak mengusulkan integrasi perbankan pada Habit. https://help.greenlight.com/hc/en-us/articles/50527840580379-How-do-I-pay-my-child-per-chore-and-split-the-earnings

## Kandidat adaptasi untuk Habit

1. Kebun Keluarga: misi bersama bertema kebersamaan, kontribusi anggota menumbuhkan kebun virtual; tujuan kooperatif, bukan leaderboard baru. Kompleksitas menengah–tinggi: ledger kontribusi, koreksi/idempotensi, periode WIB dan aset visual. Mengambil prinsip gamifikasi Joon/Finch; bentuk kebun bersama adalah ide adaptasi, bukan klaim fitur mereka.
2. Cerita Hari Ini: satu pertanyaan ramah keluarga per hari, jawaban teks singkat dan tanggapan apresiasi; riwayat dapat disimpan sebagai Kenangan melalui tindakan eksplisit. Kompleksitas menengah. Tidak mewajibkan semua menjawab untuk membuka jawaban dan tidak memberi skor emosi. Rekomendasi pertama karena menambah interaksi keluarga di luar pengelolaan jadwal/tugas.
3. Tukar Poin: katalog hadiah pengalaman yang ditentukan keluarga dan pengajuan penukaran dengan persetujuan admin. Kompleksitas menengah–tinggi; poin leaderboard mingguan existing bukan saldo belanja, perlu ledger terpisah agar reopen/delete/dua penukaran bersamaan tetap benar. Inspirasi insentif Joon/Greenlight, tanpa transfer uang.
4. Menu ke Belanja: bahan resep terstruktur menjadi draft belanja mingguan yang ditinjau sebelum disimpan. Kompleksitas menengah; perlu unit/jumlah/porsi dan deduplikasi. Referensi langsung FamilyWall. Impor resep web/OCR bukan scope awal.

Penilaian kecocokan/kompleksitas adalah pertimbangan desain, bukan hasil uji pengguna atau estimasi durasi terverifikasi. Tagline/audiens keluarga, keputusan tab Liburan dan penundaan monetisasi tetap dipertahankan. Next steps: pengguna memilih satu arah, kemudian susun scope implementasi.

## Putaran kedua — ide alternatif

Pengguna meminta ide lain; belum memilih atau mengizinkan implementasi fitur tertentu.

- Tangkap Jadwal: tempel teks pengumuman atau unggah screenshot menjadi draft acara/tugas, review tanggal/anggota lalu simpan. Inspirasi Skylight Magic Import: https://skylight.zendesk.com/hc/en-us/articles/39335538450587-Import-Calendar-Events . Integrasi WhatsApp langsung bukan scope; ekstraksi AI/OCR memerlukan provider dan biaya yang dipilih saat perencanaan. Rekomendasi kedua untuk manfaat praktis dan demonstrasi yang kuat.
- Cari Waktu Bersama: anggota menandai ketersediaan, Habit mengusulkan irisan waktu, voting pilihan lalu admin membuat acara. Inspirasi TimeTree Share Available Dates yang membagikan gambar ketersediaan; pencarian irisan dan voting adalah adaptasi Habit: https://support.timetreeapp.com/hc/en-us/articles/40309380548761-I-want-to-share-my-available-schedule-with-others . Kalender kosong tidak otomatis berarti bersedia.
- Cerita Bulan Ini: draft album digital dari Kenangan bulan terpilih, pengguna memilih foto dan caption, lalu ekspor PDF. Inspirasi saran photobook bulanan FamilyAlbum: https://family-album.com/photobooks . Versi awal dapat memakai template tanpa AI; tidak menyimpulkan peristiwa pribadi dari data keuangan/kesehatan.
- Giliran Rumah: jadwal tugas berulang dengan rotasi anggota dan tukar giliran yang disetujui penerima. Inspirasi pembagian beban dan jadwal otomatis Sweepy: https://sweepy.com/ . Rotasi/tukar merupakan adaptasi, penyeimbangan tidak diasumsikan adil dari jumlah tugas saja.

Kompleksitas relatif: Tangkap Jadwal tinggi; Cari Waktu Bersama sedang; Cerita Bulan Ini sedang; Giliran Rumah sedang–tinggi. Belum ada estimasi waktu terverifikasi, implementasi atau penambahan dependency.

## Keputusan pengguna — 2026-11-17

Pengguna meminta semua ide disimpan dahulu. Tidak ada fitur yang dipilih untuk diimplementasikan. Rekomendasi pada catatan riset adalah pertimbangan saat eksplorasi, bukan keputusan produk.
