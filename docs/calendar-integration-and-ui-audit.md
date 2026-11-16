# Keselarasan UI dan kalender lintas modul — 2026-11-16

## Tampilan bersama

Audit meliputi Beranda, Kalender, Tugas, Jadwal Makan, Keuangan, Anak, Kenangan, Dokumen, Pengaturan, Liburan dan detail Liburan. Judul utama 20 px dan font/token warna aplikasi dipertahankan bersama, termasuk sapaan Beranda. Aksi header memakai skala, jarak, radius dan tinggi yang konsisten; tab Liburan memakai emerald seperti menu lain. Form kalender/liburan diringkas ke 360 px, mengikuti form modul lain. Panel cerita, preview dan riwayat tetap lebih luas sesuai isinya. Label/input dialog memakai foreground/background tema; ukuran input desktop 13 px dan mobile 16 px, kontrol touch tetap cukup besar. Kartu tabungan tercapai memiliki warna gelap yang terbaca.

Menu dengan data bertanggal memiliki akses “Lihat kalender”. Jadwal Makan membawa hari terpilih dan Keuangan membawa periode yang sedang dibuka. Tanggal pada kartu tugas, target tabungan, Kenangan serta catatan anak menyediakan tautan langsung ke kalender. Detail Liburan juga mempunyai akses kalender perjalanan.

## Pemetaan tanggal

| Modul | Data yang masuk kalender | Tampilan awal |
| --- | --- | --- |
| Kalender | Acara manual, waktu mulai/selesai | Agenda |
| Tugas | Tenggat, termasuk status aktual tugas selesai | Agenda |
| Jadwal Makan | Tanggal tiap masakan, dengan label sarapan/siang/malam | Agenda |
| Liburan | Rentang tanggal inklusif dan kegiatan pada tanggal/jam itinerary | Agenda |
| Anak | Ulang tahun, jadwal vaksin dan tanggal pemberian aktual | Agenda |
| Tabungan | Tenggat target dengan status tercapai/belum | Agenda |
| Keuangan | Tanggal pengeluaran dan periode alokasi anggaran bulanan | Catatan opsional |
| Biaya Liburan | Tanggal transaksi perjalanan | Catatan opsional |
| Kenangan | Tanggal momen, tanpa membaca/menyalin file foto | Catatan opsional |
| Anak | Tanggal pertumbuhan, kesehatan dan milestone tercapai | Catatan opsional |
| Pengaturan | Ulang tahun anggota berdasarkan tanggal lahir | Agenda |
| Dokumen | Belum mempunyai tanggal kedaluwarsa/jadwal bisnis | Tidak membuat agenda dari waktu upload |

Tanggal sistem `created_at`/`updated_at` bukan jadwal baru. Tidak mengarang tenggat dokumen, tanggal untuk tugas tanpa tenggat, milestone belum tercapai atau jam makan tertentu. Jadwal vaksin yang sudah diberikan memakai tanggal aktual; jika jadwal awal berbeda, kedua tanggal tetap dapat ditelusuri. Ulang tahun dihasilkan untuk tahun yang diminta, tidak sebelum kelahiran. Profil anak yang terhubung dengan anggota tidak menggandakan ulang tahun. Tanggal 29 Februari tampil pada tahun kabisat; tidak dipindahkan diam-diam ke hari lain.

## Cara integrasi

`GET /events?include_sources=true&from=...&to=...` menggabungkan acara tersimpan dan proyeksi read-only dari data modul. Kalender menggunakan seluruh hasil untuk filter; Beranda memilih kategori agenda. Parameter lama tanpa `include_sources` tetap mengembalikan acara tersimpan. Rentang integrasi divalidasi maksimal 366 hari; UI mengambil rentang bulan/minggu/hari yang sedang dibuka.

Tidak ada salinan event baru, migrasi schema, backfill data atau proses sinkronisasi tulis lintas modul. Perubahan tanggal/status dan penghapusan terlihat pada pembacaan berikutnya. Mutation cache menginvalidasi query kalender setelah operasi modul; membuka kembali kalender mengambil data baru, dan kalender aktif diperbarui setiap 60 detik untuk perubahan dari perangkat lain. Ini bukan klaim broadcast WebSocket baru untuk semua modul.

Liburan lama sudah mempunyai `event_id`: event tersebut disisihkan dari hasil gabungan dan digantikan proyeksi Liburan supaya tidak duplikat. Acara terkait Liburan tidak bisa diubah/dihapus melalui API acara manual; perubahan dilakukan melalui sumber Liburan. Perjalanan dibatalkan dan rincian dari induk terhapus tidak tampil sebagai agenda aktif. Transaksi perjalanan tetap merupakan catatan historis.

Entri gabungan mempunyai ID stabil, kategori sumber, status, URL sumber dan penanda read-only. Klik membuka detail dengan tautan “Buka menu asal”, bukan form edit acara. Tautan memilih tanggal/tab/anak yang tepat dan menyorot record jika tersedia; Kenangan membuka cerita penuh. Field metadata proyeksi memakai `gorm:"-"` dan tidak disimpan ke tabel events.

Semua query memakai `family_id` dari autentikasi, termasuk join profil anak dan perjalanan. Anak/kesehatan serta keuangan pada feed dibatasi admin/member; pilihan kategori UI mengikuti role. Ulang tahun anggota dan data modul yang memang dapat dibaca bersama tetap tersedia. Tidak menerima role/family dari input pengguna.

## Ketepatan tanggal dan waktu

- Kalender, label jam, default hari bisnis, periode Beranda serta filter minggu tugas mengikuti WIB, walaupun perangkat memakai UTC, Amerika atau Jepang.
- DATE PostgreSQL diperlakukan sebagai hari kalender; offset timestamp tidak menggeser label tanggal lahir, tenggat atau perjalanan.
- Acara sepanjang hari menyimpan awal 00:00 sampai 23:59:59 WIB. Form dapat berganti tanggal/waktu tanpa menyisakan nilai datetime pada input date, dan menolak tanggal mustahil atau waktu selesai sebelum mulai.
- Acara manual memvalidasi judul/deskripsi, tipe, waktu dan pengingat; waktu disimpan sebagai instant UTC. Query membandingkan timestamp instants, sehingga offset berbeda tidak dibandingkan secara leksikografis.
- Kegiatan Liburan memakai tanggal eksplisit atau turunan hari perjalanan dan jam yang memang tersimpan di sumber. Vaksin terlambat menampilkan status berdasarkan tanggal saat dibaca.

## Verifikasi dan batas

Tes backend dan `go vet` lulus dengan PostgreSQL sementara/schema terisolasi: semua sumber, family isolation, role, deduplikasi ulang tahun/Liburan, tanggal terencana/aktual vaksin, perpindahan tenggat, penghapusan sumber, offset waktu, tahun kabisat serta penolakan edit event terkait Liburan. 29 tes frontend lulus, mencakup tanggal all-day, kronologi form, kalender pada beberapa zona perangkat dan filter minggu WIB. Build produksi 19 halaman berikut lint/typecheck lulus; alur browser juga diulang pada build produksi lokal.

QA Chrome dengan API fixture: 88 kombinasi halaman × viewport × tema (11 halaman, 375/390/768/1440 px, terang/gelap), dilanjutkan alur sumber/form/error/zona waktu hingga 108 pemeriksaan render/navigasi. Sebanyak 31 audit axe terarah pada konten/dialog bersih, tanpa runtime error atau overflow. Bukti: `docs/qa/unified-calendar-results.json` dan screenshot `unified-*`; reproduksi melalui `frontend/scripts/unified-calendar-qa.cjs`. Mode `HABIT_QA_FLOW_ONLY=1` mempertahankan matriks yang sudah lulus dan mengulang alur interaksi; jangan digunakan jika perubahan baru memengaruhi matriks halaman.

Tidak menambah dependency runtime. Tool browser sementara berada di `/tmp`. Tidak mengubah env/data keluarga asli atau melakukan deployment ke server. Pengujian provider cloud, Google OAuth, notifikasi/perangkat fisik dan verifikasi production berada di luar audit ini. Fitur recurring manual dan reminder pengiriman yang masih pending pada plan lama tidak diklaim selesai.
