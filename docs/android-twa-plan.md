# Rencana proyek Android TWA — Habit

Tanggal: 16 November 2026. Status: **rencana, belum implementasi Android**.

Tujuan: menghadirkan Habit sebagai aplikasi Android yang dapat dipasang, menggunakan PWA di **https://habit.senlabs.web.id**, tanpa membangun ulang antarmuka dan backend. Tahap pertama menghasilkan APK untuk pengujian; tahap berikutnya AAB untuk Google Play setelah persyaratan rilis terpenuhi. Dokumen ini tidak mengubah domain, kredensial, signing, atau konfigurasi production.

## 1. Keputusan arsitektur

- Gunakan **Trusted Web Activity (TWA)** dengan **Bubblewrap CLI**, bukan WebView buatan sendiri.
- Source tetap satu monorepo. Tambahkan proyek `android/` saat implementasi; dependency dan pipeline Android terpisah dari `frontend/`, `backend/`, serta `landing/`.
- TWA membuka origin aplikasi, bukan landing page. URL awal `/dashboard`; pengguna tanpa sesi mengikuti alur login yang sudah ada.
- Next.js frontend tetap memakai output `standalone` dan berjalan di server. TWA tidak membutuhkan static export atau memasukkan bundle Next.js ke APK.
- Backend Go, database, storage, JWT, isolasi keluarga dan aturan tanggal WIB tetap menjadi sumber data yang sama.
- Browser Android yang mendukung TWA merender aplikasi. Digital Asset Links (DAL) membuktikan hubungan aplikasi Android dengan origin web. Verifikasi gagal berarti dapat muncul Custom Tab dengan toolbar; kondisi ini harus terdeteksi dalam QA.
- Pembaruan konten/fitur web mengikuti deployment web. Perubahan wrapper, manifest Android, ikon launcher, signing, izin atau SDK tertentu tetap membutuhkan build dan distribusi Android baru.

Sumber: [panduan TWA Android](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2).

## 2. Dasar yang tersedia dan hal yang belum terbukti

| Bagian | Temuan source repo | Tindak lanjut |
| --- | --- | --- |
| Manifest PWA | `frontend/public/manifest.json`: nama Habit, id/start_url `/dashboard`, scope `/`, standalone, portrait-primary, bahasa Indonesia | Periksa respons manifest dan aset pada deployment HTTPS |
| Identitas | Ikon v3 192/512, maskable 192/512; emerald `#007F5B`, cream `#FAF8F2` | Turunkan ikon Android/adaptive dan splash; review bentuk aman launcher |
| Offline | `frontend/next.config.mjs` memakai navigasi/API NetworkOnly dan fallback `offline.html` | Uji perangkat; jangan menjanjikan baca/tulis data keluarga offline |
| Notifikasi | Web Push/VAPID, service worker dan `frontend/lib/pushNotification.ts` tersedia | Uji izin, pengiriman nyata, klik notifikasi dan berhenti berlangganan pada TWA |
| Google OAuth | Alur web melalui backend, kembali ke `/auth/callback`; halaman callback membersihkan query kredensial dari history | Uji lintas-origin, cancel, kembali ke aplikasi dan sesi; jangan log URL callback berisi token |
| Sesi | Refresh dan logout tersedia di aplikasi web | Uji cold start, refresh kedaluwarsa, logout dan pergantian akun pada perangkat |
| Penghapusan akun | Pada peninjauan ini belum ditemukan alur penghapusan akun menyeluruh; menghapus anggota/keluar keluarga bukan menghapus akun | Konfirmasi desain dan implementasi sebelum pengajuan Play yang memerlukannya |
| Android | Belum ada proyek TWA, signing atau bukti uji Android dalam pekerjaan ini | Kerjakan fase A–D di bawah |

Temuan adalah review source, bukan hasil uji production atau bukti aplikasi sudah memenuhi persyaratan Google Play.

## 3. Ruang lingkup versi pertama

Termasuk:

- Launcher Habit, splash, warna status/navigation bar, dan akses web dalam TWA terverifikasi.
- Login email/password, Google OAuth, onboarding, keluarga dan seluruh menu web yang sudah tersedia.
- Navigasi Back, keyboard, safe area, unggah foto/file dan unduh dokumen.
- Tautan HTTPS ke halaman Habit dengan perilaku login/izin yang benar; URL privat tidak boleh melewati otorisasi server.
- Web Push yang sudah ada, sejauh didukung browser/perangkat dan lolos pengujian nyata.
- Offline fallback yang jelas, pemulihan koneksi dan penanganan API/storage bermasalah.
- APK pengujian, AAB rilis, catatan versi dan panduan build/update.

Ditunda: widget Android, biometrik native, kalender sistem Android, reminder/alarm native terjadwal, background service, native camera khusus, iOS, Play Billing dan monetisasi. Integrasi tanggal di kalender internal Habit tetap mengikuti fitur existing, bukan otomatis sinkron ke kalender sistem. TWA sendiri tidak menyediakan semua fitur native tersebut.

Tidak membuat scheduler reminder baru hanya karena wrapper Android tersedia. Notifikasi yang diuji mengikuti pemicu backend yang memang sudah diimplementasikan.

## 4. Identitas dan struktur yang diusulkan

| Parameter | Usulan | Status |
| --- | --- | --- |
| Nama tampil | Habit | Mengikuti brand |
| Application ID | `id.web.senlabs.habit` | Usulan; finalkan kepemilikan dan ketersediaan sebelum rilis pertama |
| Host | `habit.senlabs.web.id` | Mengikuti domain aplikasi |
| Manifest URL | `https://habit.senlabs.web.id/manifest.json` | Verifikasi saat implementasi |
| Start URL | `https://habit.senlabs.web.id/dashboard` | Mengikuti manifest |
| Version name/code awal | `1.0.0` / `1` | Usulan; versionCode harus naik untuk pembaruan |
| Minimum Android / target SDK | Tentukan dari toolchain terpilih dan persyaratan Play yang berlaku saat rilis | Jangan mengambil angka usang dari tutorial |

Struktur **rencana**, belum dibuat:

```text
android/
  README.md                    # setup, build, signing, troubleshooting
  package.json                 # Bubblewrap CLI versi terkunci
  package-lock.json
  twa-manifest.json            # konfigurasi wrapper, tanpa secret
  app/                         # proyek Android hasil Bubblewrap, direview dan ditrack
  gradle/                      # Gradle wrapper; track wrapper scripts/JAR/properties
  gradlew
  gradlew.bat
  build.gradle                 # beserta settings/properties non-secret sesuai generator
  scripts/                     # validasi konfigurasi dan fingerprint, bila diperlukan
  .gitignore                   # SDK lokal, build, keystore dan secret
frontend/public/.well-known/
  assetlinks.json              # hanya dibuat setelah package dan fingerprint final valid
.github/workflows/
  android.yml                  # build/QA Android, ditambahkan saat implementasi
```

Daftar file generated menyesuaikan versi Bubblewrap aktual. Jangan menambahkan JSON DAL dengan placeholder ke public production. Jika butuh staging, gunakan origin staging dan application ID terpisah, bukan menonaktifkan verifikasi DAL pada build rilis.

## 5. Tahapan dan kriteria selesai

### Fase A — Audit PWA dan persiapan (perkiraan 0,5–1 hari)

- [ ] Periksa HTTPS, manifest, start URL, ikon/maskable, service worker, offline fallback dan response/cache header deployment.
- [ ] Petakan origin frontend, API, Google OAuth dan storage. API yang hanya di-fetch tidak otomatis perlu dijadikan origin navigasi TWA.
- [ ] Periksa middleware/proxy agar `/.well-known/assetlinks.json` nantinya publik tanpa login, respons JSON HTTP 200 langsung, tanpa redirect atau fallback HTML.
- [ ] Tetapkan application ID dan owner signing; inventaris akun Play Console dan perangkat Android yang tersedia.
- [ ] Tentukan versi Bubblewrap, Node, JDK, SDK dan Gradle yang kompatibel; kunci versinya untuk reproduksibilitas. Tidak memasang toolchain dalam task perencanaan ini.
- [ ] Bedakan kekurangan yang menghalangi APK uji dan yang menghalangi rilis Play.

**Selesai ketika:** daftar kesiapan aktual tersedia, identitas awal konsisten, dan toolchain serta perangkat uji diketahui.

### Fase B — Proyek TWA dan APK awal (perkiraan 0,5–1 hari)

- [ ] Buat proyek `android/` dengan Bubblewrap berdasarkan manifest production yang telah diperiksa.
- [ ] Set host, start URL, nama, warna, ikon, orientasi dan versi sesuai rencana; tinjau default generator.
- [ ] Buat signing khusus uji; simpan keystore di luar Git. Jangan gunakan fingerprint debug/uji untuk production tanpa alasan distribusi yang jelas.
- [ ] Sajikan DAL yang cocok pada origin pengujian; jika menguji production, gunakan fingerprint sertifikat distribusi yang memang disetujui, bukan kunci debug umum.
- [ ] Build APK, verifikasi signature dengan tool Android, install pada emulator/perangkat.
- [ ] Pastikan DAL benar-benar lolos: halaman Habit terbuka sebagai TWA tanpa toolbar browser. Jangan memakai flag bypass verifikasi untuk acceptance test.

**Selesai ketika:** APK dapat dipasang dan memuat Habit sebagai TWA terverifikasi, baik saat belum login maupun sudah login. APK awal belum dinyatakan siap Play Store.

### Fase C — Pengujian alur nyata (perkiraan 1–3 hari)

- [ ] Jalankan matriks pengujian pada bagian 7 menggunakan akun/keluarga uji.
- [ ] Perbaiki hanya masalah web/wrapper yang terbukti menghalangi alur Android.
- [ ] Ulangi regresi frontend/backend yang terdampak; catat versi OS, browser/provider, APK dan fingerprint.
- [ ] Pisahkan hasil emulator, perangkat fisik dan layanan simulasi. Pengiriman push dan OAuth nyata tidak dianggap lolos hanya dari mock.

**Selesai ketika:** alur utama stabil pada perangkat fisik, tidak ada masalah kritis akses/sesi/data, dan keterbatasan perangkat tercatat.

### Fase D — Signing rilis, CI dan paket distribusi (perkiraan 0,5–1,5 hari)

- [ ] Tetapkan upload key dan Play App Signing; simpan password/keystore di secret store atau lokasi lokal aman, backup terpisah.
- [ ] Untuk instalasi dari Google Play, masukkan **fingerprint sertifikat app signing milik Play**, bukan hanya upload certificate, ke DAL. Untuk APK di luar Play, cocokkan sertifikat yang benar-benar menandatangani APK itu.
- [ ] Bila Play Internal App Sharing memakai sertifikat lain, gunakan fingerprint kanal tersebut hanya pada origin/konfigurasi pengujian yang sesuai; jangan mengira sama dengan internal testing track biasa.
- [ ] Buat AAB signed dan APK uji; verifikasi application ID, versionCode, signature serta host tidak mengarah ke localhost/staging.
- [ ] Tambah workflow independen `android.yml`: dependency terkunci, toolchain dipin, validasi config/DAL dan build; perubahan Android saja tidak membangun ulang server web/backend.
- [ ] PR dapat menjalankan pemeriksaan/build tanpa secret rilis. Signing rilis hanya dari sumber tepercaya; tidak mengekspos secret pada fork atau log.
- [ ] Simpan APK/AAB/mapping relevan sebagai artefak CI, bukan Git; dokumentasikan checksum dan versi.
- [ ] Publikasi Play terpisah dari build. Tidak otomatis mengunggah/merilis ke production pada setiap push main.

**Selesai ketika:** build dapat direproduksi dan artefak signed tersedia dengan panduan distribusi/update. Pekerjaan ini tidak menjamin persetujuan Play.

Sumber signing: [Android App Signing](https://developer.android.com/studio/publish/app-signing).

### Fase E — Kesiapan dan distribusi Google Play (durasi eksternal terpisah)

- [ ] Verifikasi akun developer dan persyaratan yang tampil pada akun Play Console aktual.
- [ ] Periksa target API/SDK dan kebijakan yang berlaku pada tanggal pengajuan; perbarui toolchain jika perlu.
- [ ] Siapkan nama/deskripsi, ikon listing, feature graphic, screenshot asli, kontak dukungan, kebijakan privasi publik dan URL permintaan penghapusan akun yang benar-benar bekerja.
- [ ] Lengkapi Data safety, kategori, content rating, target audience serta deklarasi izin berdasarkan perilaku nyata aplikasi, backend dan SDK/provider terkait. Adanya fitur anak tidak otomatis berarti target audience aplikasi adalah anak; tetapkan sasaran penggunaan sebenarnya.
- [ ] Tuntaskan alur penghapusan akun dari dalam aplikasi dan jalur web permintaan penghapusan. Rancang perlakuan data bersama keluarga, last-admin, sesi aktif, file, retensi/backups dan pengecualian yang dijelaskan; jangan menghapus data anggota lain secara buta.
- [ ] Siapkan akun reviewer yang bisa masuk dan melihat fitur tanpa OTP/undangan buntu, dengan data contoh saja.
- [ ] Unggah AAB ke internal testing, uji instalasi dan DAL dari build yang benar-benar didistribusikan Play.
- [ ] Jalankan closed testing bila diwajibkan akun. Menurut panduan yang diperiksa 16 November 2026, akun personal yang dibuat setelah 13 November 2023 memerlukan minimal 12 tester opted-in terus-menerus selama 14 hari sebelum mengajukan akses production; kondisi akun belum diketahui.
- [ ] Review pre-launch report, ajukan akses production/release sesuai proses akun, lalu rollout bertahap dan pantau error/feedback.

Sumber: [persyaratan penghapusan akun](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en), [pengujian akun personal](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en). Kebijakan harus diperiksa kembali saat pengajuan; durasi review dan persetujuan tidak berada dalam kendali tim implementasi.

## 6. Digital Asset Links dan signing

Lokasi wajib pada origin yang dibuka:

```text
https://habit.senlabs.web.id/.well-known/assetlinks.json
```

Bentuk **contoh dokumentasi**, bukan file siap deploy:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "APPLICATION_ID_FINAL",
      "sha256_cert_fingerprints": ["SHA256_SERTIFIKAT_DISTRIBUSI_SEBENARNYA"]
    }
  }
]
```

Fingerprint sertifikat bersifat publik; password dan private key tidak. Catat asal setiap fingerprint: debug/staging, sideload rilis, Play App Signing atau kanal pengujian lain. Jangan mempercayai semua sertifikat demi menghilangkan toolbar. Jangan memperluas trust ke domain pihak ketiga seperti halaman Google. Jika navigasi keluar dari origin tepercaya menampilkan UI browser, itu dapat menjadi perilaku normal; yang harus diuji adalah kembalinya alur ke Habit dan sesi yang benar.

Backend/API tidak diberi trust navigasi tanpa kebutuhan. Bila OAuth memakai host API berbeda, petakan rute dan perilakunya dahulu. Otorisasi API tetap JWT dan pembatasan keluarga; DAL bukan pengganti autentikasi.

Sumber tambahan: [Android App Links](https://developer.android.com/training/app-links/about).

## 7. Matriks acceptance test

| Area | Skenario minimum | Hasil yang diterima |
| --- | --- | --- |
| Instalasi | Install bersih, buka launcher, background/resume, cold start, update versi | Tidak crash; brand benar; update memakai package/signature sama dan versionCode naik |
| Verifikasi origin | APK uji dan instalasi melalui Play; DAL positif dan kegagalan terkontrol di staging | Trust cocok dengan sertifikat distribusi; kegagalan dikenali, bukan ditutupi bypass |
| Auth | Email login, Google login/cancel, refresh token expired, logout, ganti akun, restart | Tidak loop; callback kembali benar; akun/keluarga lama tidak muncul kembali setelah logout |
| Navigasi | Back Android, dialog/lightbox/form, link luar, deep link saat logged out | Alur masuk akal; tidak melewati izin; URL tujuan privat dibuka hanya setelah auth yang valid |
| Semua menu | Beranda, Kalender, Tugas, Keuangan, Anak, Kenangan, Makan, Liburan/detail, Dokumen, Pengaturan | Render dan alur utama sesuai web, role dan isolasi keluarga tetap berlaku |
| File | Pilih galeri/kamera jika didukung picker, upload multi-foto, preview, unduh/buka dokumen privat | Izin sesuai kebutuhan; sukses/gagal jelas; file privat tetap dilindungi; perilaku unduh nyata diverifikasi |
| Notifikasi | Izin allow/deny, subscribe/unsubscribe, foreground/background, klik notifikasi, logout/ganti akun | Pengiriman nyata terbukti pada perangkat; link tepat; langganan tidak membocorkan informasi akun lama |
| Koneksi | Airplane mode, koneksi putus saat simpan/upload, online kembali, server/storage error | Fallback/pesan jelas; tidak mengaku tersimpan; retry tidak merusak atau menggandakan data |
| UI | Keyboard terbuka, gesture/navigation bar, notch/safe area, light/dark, font sistem besar | Tombol utama tetap terjangkau, konten tidak tertutup dan dapat discroll |
| Tanggal | Zona perangkat UTC/WIB/lain, pergantian hari, acara all-day dan lintas hari | Perilaku WIB existing tidak berubah |
| Distribusi | Provider TWA berbeda/tidak tersedia, install PWA dan APK bersamaan | Fallback didokumentasikan; tidak mengasumsikan sesi/data browser terisolasi atau selalu sama |
| Akun/data | Jalur penghapusan dari aplikasi dan web, last-admin, revocation sesi dan cleanup file | Lulus sebelum pengajuan Play yang memerlukan; data bersama ditangani sesuai desain |

Target minimum QA: satu emulator dengan API target yang dipilih, perangkat fisik Android 13+ untuk perilaku izin notifikasi, serta perangkat/versi lain yang mewakili dukungan minimum. Catat browser/provider TWA dan versinya. Mematikan proses, Doze, penghemat baterai dan force-stop perlu dibedakan; jangan menjanjikan notifikasi selalu tiba tepat waktu.

TWA memakai penyimpanan/konteks browser/provider; jangan berasumsi uninstall wrapper otomatis membersihkan semua sesi web. Uji dan dokumentasikan perilaku logout pada konfigurasi yang benar-benar dipakai.

## 8. Estimasi dan dependensi

Estimasi berikut adalah perkiraan untuk satu developer, bukan SLA:

| Hasil | Perkiraan | Syarat |
| --- | --- | --- |
| APK awal terverifikasi (A–B) | 1–2 hari kerja | Toolchain, signing uji, akses konfigurasi origin dan perangkat tersedia |
| APK beta yang telah diuji + pipeline/artefak (A–D) | Sekitar 3–7 hari kerja | Tidak ada perubahan besar pada auth/file/push; pengujian fisik tersedia |
| Perbaikan kesiapan Play di web/backend | Estimasi ulang setelah audit | Terutama penghapusan akun/data bersama dan dokumen kebijakan |
| Closed testing/review Play | Waktu kalender tambahan | Bergantung tipe akun, tester dan proses Google; tidak termasuk estimasi coding |

Estimasi percakapan sebelumnya 2–5 hari merupakan kisaran awal untuk wrapper dan uji dasar; bukan komitmen aplikasi sudah disetujui Play. Integrasi eksternal, perangkat dan kekurangan kesiapan Play dapat memperpanjang pekerjaan.

Informasi yang dibutuhkan sebelum tahap terkait:

1. Konfirmasi application ID sebelum pendaftaran/rilis pertama; nama Habit mengikuti brand yang ada.
2. Pilihan target awal: APK beta internal lalu Play internal testing (rekomendasi urutan).
3. Ketersediaan perangkat Android nyata, akun uji dan akses deploy origin untuk DAL.
4. Pemilik/lokasi backup signing dan akun Play Console (personal/organisasi, lama/baru); jangan kirim password/private key lewat chat atau Git.
5. Kontak dukungan, domain kebijakan privasi/penghapusan akun dan kebijakan data bersama sebelum Play production.

Hal-hal tersebut tidak menghalangi penyusunan rencana ini. Tidak membuat kredensial, mendaftarkan package di Play, atau memasang dependency Android pada task ini.

## 9. Pembaruan dan rollback

- Web: deploy/rollback melalui pipeline aplikasi existing; smoke test TWA sesudah deploy karena Android memakai web yang sama. Fitur web tidak boleh bergantung pada wrapper terbaru tanpa fallback.
- Android: simpan release notes, versionCode dan fingerprint; hotfix melalui build baru dengan versionCode lebih tinggi. Jangan mengandalkan downgrade APK untuk rollback.
- DAL: publikasikan fingerprint distribusi yang benar sebelum rollout. Perubahan key/package/domain memerlukan rencana migrasi; jangan menghapus fingerprint yang masih dipakai pengguna aktif secara mendadak.
- CI: perubahan `android/**` memicu build Android; perubahan web terkait PWA/auth memicu QA web dan evaluasi smoke test Android. Artefak signing dan publikasi tidak dicampurkan dengan build PR biasa.

## 10. Definition of done dan langkah pertama

**Beta internal selesai:** proyek Android dapat dibangun ulang, APK signed terverifikasi DAL, alur inti pada perangkat fisik lolos, risiko/keterbatasan terdokumentasi, artefak dan signing tidak bocor ke Git.

**Rilis Play selesai:** beta selesai, kesiapan akun/data/listing terpenuhi, AAB diuji melalui Play, proses testing/review yang relevan selesai dan distribusi dikonfirmasi. Memiliki AAB saja belum berarti rilis selesai.

**Langkah pertama implementasi:** fase A, kemudian fase B untuk APK awal. Proyek Android dan perubahan production belum dimulai; monetisasi tetap ditunda. Checklist di dokumen ini seluruhnya pending sampai ada bukti implementasi/QA.
