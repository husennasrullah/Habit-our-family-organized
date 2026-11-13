# Arah Visual HABIT — Minimalis dengan Ilustrasi 2D

> Revisi aktif 2026-11-13: pengguna memberikan referensi dashboard baru dan meminta sidebar/button diperbaiki, header topbar dihapus, font diganti serta UI diperkecil. Acuan aktif sekarang `dashboard-reference-refresh.md`: emerald, latar putih kebiruan, Plus Jakarta Sans, banner keluarga berwarna dan layout lebih padat. Spesifikasi sage di bawah menjadi catatan batch sebelumnya.

Tanggal: 2026-11-12
Status: preferensi pengguna tercatat; palet dan spesifikasi berikut adalah pilihan awal untuk implementasi/review.

## Referensi dan keputusan

Pengguna memberikan dua referensi: dashboard desktop Elearn dan aplikasi mobile Lingua. Preferensi eksplisit: tampilan simpel/minimalis dan ilustrasi gambar bergaya pencil art / 2D. Warna boleh ditentukan sendiri, tidak harus mengikuti referensi.

Ambil dari referensi desktop: ruang kosong, panel terang, sidebar ringan, susunan informasi teratur, serta karakter gambar tangan dengan garis gelap dan warna terbatas. Ambil dari referensi mobile: satu kolom yang mudah dipindai, kartu ringkas, tombol utama jelas, dan ilustrasi yang memberi karakter.

Adaptasikan untuk manajemen keluarga. Isi edukasi, grafik, promosi premium, gradient ungu neon, dan dekorasi perangkat pada referensi tidak otomatis menjadi bagian HABIT. Ukuran teks di screenshot bukan ukuran yang harus ditiru.

## Palet awal — sage dan kertas hangat

| Peran | Warna | Pemakaian |
|---|---|---|
| Latar | `#F6F5F1` | Kanvas aplikasi |
| Permukaan | `#FFFFFF` | Kartu, form, panel |
| Teks utama / tinta | `#293831` | Judul, isi, garis ilustrasi |
| Teks sekunder | `#5A635D` | Keterangan dan label pendukung |
| Primary | `#426653` | Tombol utama dan aksi aktif |
| Primary hover | `#345242` | Hover/pressed |
| Primary lembut | `#EAF0E8` | Navigasi aktif dan highlight ringan |
| Border | `#E3E7E0` | Pemisah halus |
| Peach | `#F4D9C9` | Aksen ilustrasi dan latar kategori |
| Lavender | `#E6E0F1` | Aksen ilustrasi dan kategori sekunder |

Mayoritas permukaan tetap netral. Peach/lavender adalah aksen, bukan teks kecil di atas putih. Warna error/warning/success tetap memiliki makna tersendiri dan label teks. Verifikasi kontras pasangan warna pada implementasi; tabel ini bukan klaim aksesibilitas yang telah diuji. Logo HABIT diperbarui pada 2026-11-13 atas permintaan eksplisit pengguna, menjadi monogram H/rumah sage–ivory. Spesifikasi dan aset: `logo.md`.

## Layout dan komponen

- Desktop: sidebar ringan sekitar 224–240 px, area utama lapang, kolom tambahan hanya untuk informasi yang relevan.
- Mobile: satu kolom; urutan tindakan penting mendahului ringkasan tambahan. Bottom navigation tetap jelas.
- Kartu: radius 16–20 px, border tipis atau shadow sangat ringan; hindari kartu di dalam kartu tanpa kebutuhan.
- Spacing berbasis 4 px: padding utama 16 px di mobile dan 24–32 px di desktop; gap antarbagian 24–32 px.
- Gunakan font Inter yang sudah ada untuk isi/judul; isi 15–16 px, label 13–14 px, caption minimum 12 px, heading 24–30 px. Bobot 400/500/600/700; hindari font-black pada hampir semua elemen.
- Tombol utama solid sage; tombol sekunder netral. Hindari gradient mencolok dan animasi dekoratif berulang.
- Ikon navigasi/aksi memakai Lucide dengan ketebalan konsisten. Ikon utilitas tetap sederhana, terpisah dari ilustrasi karakter.
- Dashboard tetap berorientasi agenda dan tindakan. Jika memakai banner ilustrasi, gabungkan dengan sapaan/ringkasan singkat, bukan menambah satu lapis pembuka lagi.

## Sistem ilustrasi

Gaya: editorial 2D, garis pensil/tinta tipis dengan sedikit variasi organik, bentuk sederhana, tekstur kertas/pensil ringan, warna datar yang redup. Karakter hangat dan ekspresif dengan detail wajah secukupnya. Bukan 3D, foto, emoji besar, atau gambar dengan banyak detail dekoratif.

Gunakan satu bahasa visual: ketebalan garis, proporsi karakter, arah bayangan, tekstur, dan palet seragam. Keluarga ditampilkan secara inklusif; ilustrasi tidak menentukan peran pengguna atau menggantikan foto profil mereka.

Penempatan awal:
1. Beranda: satu adegan kecil keluarga merencanakan hari; konten/aksi tetap dominan, gambar tidak mendorong agenda keluar layar pertama pada mobile.
2. Auth/onboarding: ilustrasi keluarga utama yang lebih besar di desktop dan versi ringkas di mobile.
3. Empty state: vignette kecil sesuai konteks (kalender, buku kenangan, kotak dokumen, tas liburan), bersama penjelasan dan aksi berikutnya.

Jangan menaruh ilustrasi di setiap kartu statistik, baris data, atau form. Ilustrasi dekoratif memakai alt kosong; informasi penting tetap berupa teks HTML. Gambar tidak memuat tulisan UI atau tombol. Gunakan latar transparan bila dibutuhkan, dimensi intrinsik, dan ukuran file yang sesuai perangkat.

Produksi aset dilakukan pada tahap implementasi yang membutuhkan gambar, dengan generator gambar sesuai skill `imagegen` jika tersedia. Mulai dari satu ilustrasi untuk menetapkan gaya, lalu turunkan aset lain dengan referensi yang sama. Jangan menganggap file clipboard di `/tmp` sebagai aset permanen; spesifikasi ini menjadi catatan referensi di repo. Belum ada aset yang dibuat pada sesi ini.

## Kriteria review visual

- Terasa sederhana dan konsisten antara desktop/mobile.
- Agenda dan tindakan tetap mudah ditemukan; ilustrasi mendukung konteks.
- Ilustrasi benar-benar bergaya gambar tangan/2D dan konsisten antarmodul.
- Teks tetap nyaman dibaca, fokus keyboard jelas, target sentuh memadai.
- Kondisi kosong/loading/error mengikuti karakter yang sama tanpa mengorbankan kejelasan.

Langkah berikutnya: baseline dan penetapan spesifikasi tahap 1, kemudian fondasi UI. Hasil dashboard pertama menjadi titik review warna, kepadatan, dan gaya ilustrasi sebelum diterapkan ke seluruh modul.

Pembaruan implementasi 2026-11-13: teks sekunder dipergelap setelah audit kontras pada permukaan sage; ilustrasi keluarga dan empat empty state sudah tersedia. Lihat `illustrations.md` dan `ui-redesign-qa.md`.
