# Family Hub — Agent Guide

Dokumen ini adalah panduan kerja untuk agent/AI yang mengimplementasikan project Family Hub. **Baca seluruh dokumen ini sebelum memulai pengerjaan task apapun — khususnya section Status & Next Steps di bawah.**

> ⚠️ **ATURAN WAJIB AGENT:**
> 1. **Selalu baca `agents.md` di awal setiap sesi** sebelum mengerjakan apapun.
> 2. **Selalu update `agents.md` setiap selesai mengerjakan sesuatu** — sekecil apapun perubahannya.
> 3. Update minimal mencakup: file yang diubah, keputusan teknis penting, status terbaru, dan next steps.
> 4. Update dilakukan **sebelum** menutup sesi / melaporkan task selesai ke user.

---

## 🚦 STATUS TERKINI & NEXT STEPS
> Selalu update section ini setiap akhir sesi kerja.
> **Last updated:** 2026-11-14 (Pembenahan Dokumen dan storage via env)

### Pembenahan Dokumen dan storage via env — 2026-11-14
- Pengguna meminta storage dinamis via env sekaligus seluruh temuan review Dokumen dibenahi, kemudian meminta commit/push ke origin setelah selesai.
- Factory storage.NewClient bersama untuk memories/documents/trips memilih minio/s3/r2/disabled. Endpoint host atau URL HTTP(S), region, session token, addressing style dan auto-create bucket melalui env. Default MinIO lokal/Compose existing dipertahankan, cloud tidak mewarisi endpoint/credentials lokal. Compose production meneruskan seluruh konfigurasi; tanpa dependency baru. API cloud native non-S3 belum didukung adapter.
- Dokumen: route API dan sidebar dibatasi admin/member; list/query/update/delete tetap terfilter keluarga JWT. Baca/unduh melalui proxy JWT privat/no-store/nosniff, tanpa public URL/object key di list. Validasi PDF/JPEG/PNG/WebP dengan signature/MIME dan ekstensi, 1 byte–10 MB, trim/panjang nama/tag serta enum kategori. Edit metadata dan capabilities enkripsi ditambahkan.
- Enkripsi opsional AES-256-GCM dengan nonce acak dan object-key AAD memakai DOCUMENT_ENCRYPTION_KEY 64 hex. Kunci salah/ciphertext diubah ditolak; file lama tidak dienkripsi otomatis. Kunci tidak dibuat/disimpan di repo atau diubah pada env nyata. Bucket/prefix dokumen tetap harus private pada provider; API tidak mencabut public policy lama.
- Hapus menyimpan tombstone/pending sebelum storage dihapus, akses baca berhenti, kegagalan terlihat dan dapat dicoba ulang; finalisasi idempoten. Tidak mengklaim transaksi atomik lintas DB/storage. Upload gagal menyimpan metadata mencoba cleanup; kegagalan cleanup dicatat tanpa credential.
- Frontend: banner/kartu ringkas, form upload/edit maksimum 360 px dengan kategori/tag/sensitif, drag-drop/file picker, validasi/error/loading/pending, pencarian debounce, preview PDF/gambar dan unduh blob melalui API refresh-token, dialog hapus/retry cleanup, target touch 44 px dan tema terang/gelap.
- File utama: config/main/storage, handler/service/repository/model Dokumen, migrasi tambahan 013_document_metadata.sql, halaman documents/types/Sidebar/globals, env contoh/Compose, tes backend, script QA, docs/storage.md, RUNNING/deployment, family-hub-plan.md serta bukti docs/qa/documents-modern-*.
- Verifikasi: go test ./... dan go vet ./... lulus; tes integrasi PostgreSQL schema temporer mencakup lifecycle/plain+encrypted/family isolation/tamper/wrong key/pending cleanup/idempotent retry serta migrasi SQL 013 dua kali. Tes SDK S3 mock HTTP mencakup tiga provider, upload/read/delete/presign, session token dan R2 region auto; config MinIO/cloud dan role API dites. Compose config MinIO/S3/R2 tervalidasi tanpa mencetak secret. 22 tes frontend dan build produksi 19 halaman/lint/typecheck lulus. Browser fixture: 27 pemeriksaan, enam audit axe terarah bersih, tanpa error runtime/overflow pada 375/390/768/1440 px; screenshot direview.
- Batas: provider cloud/perangkat PWA fisik belum diuji dengan credentials nyata. Tidak memindahkan file, mengubah env/data keluarga asli, menerapkan migrasi ke DB aplikasi lokal atau menambah kontak darurat/catatan. Panduan cutover mempertahankan key/path dan backup ada di docs/storage.md.
- Pengiriman: commit/push biasa origin/main sesuai permintaan pengguna; generated sw/workbox tidak disertakan. Next steps: pantau CI/CD, verifikasi deployment dengan bucket private, pilih provider melalui env bila ingin pindah, dan aktifkan DOCUMENT_ENCRYPTION_KEY di server jika memerlukan dokumen sensitif.

### Review menu Dokumen — 2026-11-14
- Pengguna meminta pemeriksaan menu Dokumen. Membaca halaman documents, types, handler/service/repository/model/storage, middleware/routes dan Task 8.1–8.2. Review source tanpa mutasi data, browser/API, build atau tes runtime baru.
- Tersedia upload satu file, daftar kartu, pencarian judul/tag, filter kategori, buka tautan file dan hapus dengan konfirmasi. Query list/get/delete terfilter keluarga JWT; belum menemukan indikasi query lintas keluarga pada modul ini.
- UI upload hanya mengirim file/title sehingga semua unggahan UI menjadi other; tidak ada form kategori/tag/judul, edit metadata, drag-drop, preview khusus atau kontrol unduh eksplisit. Tombol hapus hanya 24 px; pesan gagal upload generik dan pencarian mengirim request setiap ketikan.
- Backend belum memvalidasi isi/MIME/ekstensi/ukuran file per dokumen, enum kategori atau trim/panjang metadata; hanya batas request global 50 MB. Content-Type mempercayai header klien. is_encrypted hanya kolom/default false, tidak ada enkripsi aplikasi atau dekripsi di alur dokumen.
- Rute dokumen hanya auth tanpa RequireRole: child/view_only yang memiliki JWT keluarga dapat membaca/upload/hapus, berbeda dengan kebijakan role di plan. PublicURL didahulukan bila dikonfigurasi sehingga tautan permanen mungkin digunakan untuk dokumen privat; fallback presigned 15 menit, error signing diabaikan dan tidak ada refresh URL saat klik. Keterjangkauan host storage dari perangkat belum diuji.
- Delete mengabaikan kegagalan penghapusan object lalu soft-delete metadata, dapat menyisakan file; jika object berhasil dihapus tetapi delete DB gagal, record tetap tampil dengan file hilang. Upload mencoba cleanup jika create DB gagal, tetapi error cleanup juga diabaikan.
- Tidak menemukan tes khusus modul dokumen; QA bersama mencakup halaman/empty state, bukan bukti upload/download/storage nyata. File diubah hanya agents.md; belum commit/push. Next steps: hak akses dan akses file privat, validasi/ketepatan storage, kemudian form kategori/edit/unduh dan UX ringkas sesuai arahan pengguna.

### Pembaruan login dan registrasi PWA — 2026-11-14
- Pengguna meminta tampilan login/registrasi PWA lebih menarik karena mobile hanya menampilkan form putih, lalu meminta push ke origin setelah selesai.
- Layout auth bersama memakai panel emerald, latar cream, ilustrasi keluarga existing, aksen amber dan kartu form membulat. Cerita/ilustrasi kini terlihat di mobile; desktop dua kolom. Safe area atas/bawah, scroll alami, ukuran input 16 px dan kontrol tema tersedia. Onboarding mengikuti layout yang sama.
- Login/registrasi: copy baru, input/tombol bersama, nama akses toggle password mengikuti status, aria-invalid/describedby menghubungkan pesan validasi, error server mendukung tema gelap, URL Google memiliki fallback API lokal. Tidak mengubah alur autentikasi/backend/schema/dependency.
- File: frontend/app/(auth)/layout.tsx, login/page.tsx, register/page.tsx, app/globals.css; script frontend/scripts/auth-welcome-qa.cjs dan docs/qa/auth-welcome-*.
- Verifikasi: build produksi 19 halaman berikut lint/typecheck lulus; browser Chrome 32 pemeriksaan login/register/onboarding pada 360/390/768/1440 px terang/gelap, ilustrasi/warna heading/tanpa overflow, validasi dan toggle password lulus tanpa error runtime. Screenshot mobile/desktop direview. Tidak menguji login/registrasi akun nyata atau perangkat PWA fisik.
- Pengiriman: commit/push biasa origin/main sesuai permintaan pengguna. Next steps: pantau CI/CD dan review tampilan login/registrasi pada PWA deployment. Generated build/worker tidak disertakan.

### Pembacaan konteks proyek — 2026-11-14
- Membaca agents.md, AGENT.md, README, rencana utama, struktur file, package frontend, entry point/rute backend, provider frontend, API client dan navigasi.
- Memahami Habit sebagai PWA keluarga dengan Next.js 14/TypeScript dan Go/Fiber/GORM; aturan utama mencakup isolasi keluarga melalui JWT, migrasi tambahan, pengerjaan sesuai scope dan pembaruan panduan setiap selesai bekerja.
- Status terbaru tetap penerapan brand Habit v3 pada 2026-11-13. Sejumlah status historis/checkbox rencana belum sinkron; cocokkan dengan catatan terbaru dan source sebelum implementasi.
- Working tree bersih sebelum pencatatan ini. File diubah hanya agents.md; tidak menjalankan aplikasi/tes/build atau mengubah fitur/data. Next steps: mengikuti arahan task berikutnya dari pengguna; tidak commit/push.

### Penerapan logo Habit v3 di seluruh lini — 2026-11-13
- Pengguna menyetujui Hadir Bersama, meminta penerapan seluruh lini termasuk PWA dan tulisan tab browser, lalu meminta langsung push origin setelah selesai. Menggunakan aset SVG pilihan utama dan proporsi ringkas yang sudah direview.
- UI: HabitMark native vector 40 px dipakai Sidebar/auth desktop/mobile, wordmark 84×25 px dengan titik i satu warna agar fokus amber di simbol; emerald #007F5B / dark mint #93E2BF. Branding nama di login/register/install prompt/Apple/manifest menjadi Habit. Root title kini Habit — Keluarga lebih dekat, applicationName dan deskripsi selaras. Offline memakai lockup SVG terang/gelap dan judul Habit — Sedang offline.
- Platform: generator brand-icons kini berbasis SVG v3, PNG 16/32/48/180/192/512, favicon ICO 16/32/48, maskable 192/512, SVG offline dan badge notifikasi putih transparan 96 px. Semua referensi aktif v2 di runtime diganti ke v3; aset lama dipertahankan sebagai arsip. Manifest versi 20261113-hadir3, id/start_url /dashboard tetap agar identitas instalasi tidak berganti. Sw-push/favicon juga revalidate; updateViaCache none tetap dipakai. Pembaruan launcher yang sudah terpasang mengikuti browser/OS.
- Verifikasi: 22 tes frontend lulus; build produksi .next-qa/lint/typecheck 19 halaman lulus. PNG/ICO/badge dan maskable lulus (radius 74.98/199.51 px di dalam batas 76.8/204.8). Browser: 16 pemeriksaan lulus tanpa error runtime/overflow, mencakup brand/title login/register/onboarding 390/1440, tema gelap, metadata Apple/favicon, manifest/HTTP/cache, sidebar/banner install, push handler simulasi dan worker produksi/offline (HTTP 200 dari worker, logo selesai dimuat). Detail akhir pada docs/qa/brand-v3-results.json dan brand-v3-assets.json.
- File utama: components/brand/HabitMark+HabitWordmark, Sidebar/auth/root metadata/login/register, globals, manifest/offline/sw-push, InstallPrompt/ServiceWorkerRegistration, next.config, ikon dan favicon; generator/QA baru serta alias logo-qa/pwa-qa, docs/logo/design-system dan paket desain docs/brand/habit-v3. Tidak ada perubahan backend/schema/dependency runtime. Generated sw/workbox tidak disertakan dalam pengiriman.
- Pengiriman: commit dan push biasa origin/main sesuai permintaan pengguna. Next steps: pantau CI/CD dan review brand/launcher PWA di deployment.

### Desain logo Habit Hadir Bersama — 2026-11-13
- Pengguna secara eksplisit memakai skill SVG Logo Designer dan meminta pembuatan ulang logo berdasarkan nilai aplikasi serta nama Habit. Membaca skill, overview plan, dokumentasi logo/design system dan outline wordmark aktif. Kesimpulan brand: kebiasaan kecil yang membuat keluarga lebih terhubung dan keseharian lebih teratur.
- Pilihan utama Hadir Bersama: H membulat dengan dua sisi yang saling merangkul dan satu titik amber sebagai pusat perhatian bersama; emerald aktif #007F5B, amber #F5B942, forest/cream. Lettering bulat-tebal dipertahankan untuk kontinuitas, lebih rendah dari simbol pada lockup; titik i mengikuti tinta pada kombinasi agar aksen terpusat di simbol. Alternatif Ritme Rumah dan Tumbuh Bersama disertakan sebagai pembanding.
- File baru frontend/scripts/design-habit-logo-v3.cjs, folder docs/brand/habit-v3 (25 SVG produksi, dua board SVG/PNG, PNG utama/launcher/simbol, README/manifest/validation), ZIP docs/brand/habit-v3-logo-package.zip. Script memakai Sharp existing; tidak menambah dependency. Semua logo berupa geometri/outline mandiri, tanpa font eksternal atau raster di SVG.
- Validasi: seluruh 27 SVG berhasil dirender, title/desc tersedia, tidak ada script/foreignObject/embedded bitmap; sumber PWA foreground berada di lingkar aman diameter 80%. Pratinjau terang/gelap, komposisi dan simbol 16/24/34/64 px diperiksa. Hasil docs/brand/habit-v3/validation.json.
- Status: paket desain selesai, belum mengganti logo aktif/metadata/favicon/PWA, belum commit/push. Scope sesi ini pembuatan dan penyajian desain. Next steps: iterasi atau penerapan aset ketika diminta pengguna; active app tetap versi brand yang sudah terkirim sebelumnya.

### Pengiriman pembenahan menu Anak dan wordmark — 2026-11-13
- Pengguna meminta push setelah semua perbaikan selesai. Cakupan backend/frontend kids, penyesuaian Habit, tes, data WHO/provenance, rencana, dokumentasi dan bukti QA. Branch main dan origin/main sinkron sebelum pengiriman; diff whitespace bersih.
- Verifikasi final: go test/vet, integrasi PostgreSQL schema temporer, 22 tes frontend, build produksi/lint/typecheck 19 halaman, 34 pemeriksaan browser dan 17 audit axe lulus. Tidak menyertakan environment, cache/build atau generated sw/workbox.
- Commit dan push biasa ke origin/main tanpa force. Next steps: pantau CI/CD dan review di deployment. Tidak menambahkan auto-jadwal vaksin/seed medis, screen time/sekolah atau migrasi schema pada scope ini.

### Pembenahan menu Anak dan proporsi wordmark — 2026-11-13
- Pengguna meminta semua temuan diperbaiki sekaligus, lalu meminta wordmark Habit diperkecil/diselaraskan warna dan commit/push ke origin setelah selesai. Implementasi backend/frontend dan verifikasi final selesai; pengguna telah meminta commit/push ke origin.
- Backend: CRUD profil/growth/vaccine/milestone/health, validasi trim/panjang/enum/tanggal/numerik, tanggal aktual tidak mendahului lahir/di masa depan; jadwal boleh di masa depan. Seluruh write mengunci profil dalam transaksi; nested record harus cocok dengan path anak dan keluarga JWT. GET vaksin tidak menulis DB; mark given mempertahankan metadata omitted; milestone memiliki endpoint desired-state idempoten. Soft-delete profil+rincian atomik, tidak ada Save yang menghidupkan record terhapus, koreksi lahir melewati riwayat ditolak. Role API dibatasi admin/member, UI/sidebar/pengingat dashboard selaras.
- Frontend: form modal 360 px untuk tambah/edit semua entitas, konfirmasi hapus, tanggal vaksin aktual/pemberi/catatan, lingkar kepala, obat/catatan kesehatan. Target form dan mutation mengikat kidId, form reset saat ditutup dan selectedId berasal dari query terbaru. Semua tab punya tambah/error/loading/empty; pending mencegah aksi ganda. Tanggal default WIB, label Indonesia, tombol bernama spesifik. Jadwal vaksin/milestone diisi manual; tidak menambahkan auto-jadwal klinis atau seed medis/screen time/sekolah.
- Grafik: pilihan panjang/tinggi/berat/lingkar kepala, sumbu nilai dan tanggal aktual, gap sparse tidak menghilangkan seri. Referensi WHO statis 0–60 bulan untuk tinggi/panjang dan berat laki-laki/perempuan, enam XLSX resmi dengan provenance SHA-256 di docs/data/who-growth-sources.json; panjang/tinggi dipisah pada 24 bulan, tidak ada extrapolation/diagnosis. Detail docs/kids-improvements.md; plan Task 7.1–7.2 diselaraskan tanpa menandai fitur di luar scope selesai.
- Wordmark bersama 84×25 px menggantikan 106×31; tagline lebih rapat, huruf emerald #007f5b / dark #8ce0bd, titik kuning tetap. Ikon rumah/PWA tidak diganti. File frontend brand/globals/Sidebar/auth melalui komponen bersama.
- Verifikasi: go test ./... dan go vet lulus; PostgreSQL schema temporer lulus untuk CRUD/clear/isolation, GET tanpa write, 20 GET+20 given serentak, 10 achievement idempoten dan delete+insert bersamaan, tanpa mutasi data asli. 22 tes frontend dan build produksi 19 halaman/lint/typecheck lulus. QA browser fixture final: 34 pemeriksaan dan 17 audit axe terarah lulus tanpa error runtime/overflow/pelanggaran, pada 375/390/1024/1440 px serta tema terang/gelap dan lima form. Temuan nested-interactive SVG diperbaiki dengan role group; label grafik memakai lebar aktual agar tidak membesar/terpotong dan kartu anak mobile diberi lebar minimum. Bukti docs/qa/kids-modern-results.json.
- File utama services/repositories/handlers kids, routes main, tests, halaman kids/dashboard, hooks/useKids, components/kids, lib/kids dan data WHO, brand/globals/Sidebar, script QA/import, dokumentasi/plan. Tidak mengubah schema/dependency runtime. Next steps: pantau CI/CD dan verifikasi alur di deployment setelah commit/push biasa origin/main sesuai permintaan.

### Review menu Anak — 2026-11-13
- Pengguna meminta pemeriksaan menu Anak. Membaca halaman kids, hooks/types, service/repository/model/handler/routes, migrasi 006, seed, pengingat dashboard dan Task 7.1–7.2. Review source, tanpa browser/API/mutasi data atau tes runtime baru; belum mengubah fitur.
- Tersedia tambah profil, daftar anak, empat tab pertumbuhan/vaksin/milestone/kesehatan, catatan tinggi/berat dan grafik enam titik terakhir, tandai vaksin dan toggle milestone. API punya edit/hapus profil tetapi UI belum ada. CRUD rincian belum lengkap; UI tidak memiliki tambah vaksin/milestone, backend tidak membuat jadwal/checklist saat profil baru dibuat (seed hanya contoh vaksin anak demo).
- Prioritas ketepatan: GetVaccines melakukan Save seluruh record ketika GET mengubah status terlambat, mengabaikan error dan tanpa lock/conditional update; snapshot lama dapat menimpa status/tanggal vaksin given yang disimpan bersamaan. MarkVaccineGiven juga menimpa given_by/notes dengan string kosong dari request UI. Toggle milestone read-modify-save tanpa lock dan UI tidak menonaktifkan saat pending/menampilkan error mutation.
- Form pertumbuhan/kesehatan tidak reset setelah simpan/batal atau ganti anak; state dan visibilitas dibagi lintas anak, sementara mutation memakai kidId aktif. Draft anak A bisa tersimpan ke anak B. Form tambah anak juga tidak reset saat batal; selectedKid menyimpan object snapshot.
- Validasi: create profil hanya cek kosong, update tanpa cek nama/tanggal/gender, growth dapat kosong semua/negatif/nol; vaksin/milestone/health belum memvalidasi field wajib/enum/tanggal di service meski DTO bertag validate (handler hanya BodyParser). Tanggal default frontend memakai UTC toISOString; penandaan vaksin langsung memakai tanggal hari ini tanpa form tanggal aktual/pemberi/catatan. Tanggal vaksin/milestone dirender mentah dan bisa berupa timestamp.
- Grafik: jika satu catatan tidak punya tinggi atau berat, seluruh seri terkait tidak digambar; masing-masing seri memakai skala min/max sendiri tanpa sumbu nilai, jarak tanggal dibuat rata. Ini grafik catatan pribadi, belum referensi WHO yang disebut plan. Lingkar kepala/obat/catatan ada di API/model tetapi belum terlayani lengkap di UI.
- Isolasi keluarga diperiksa lewat profil induk sebelum mengakses rincian; tidak menyimpulkan kebocoran lintas keluarga. Namun handler given/toggle mengabaikan kid_id path dan memeriksa keluarga record saja, sehingga record anak lain dalam keluarga yang sama bisa berubah melalui path anak yang tidak cocok. Hak akses route hanya auth; perlu menyelaraskan kebijakan role bila akun child seharusnya dibatasi.
- Tidak menemukan tes khusus kids pada tes backend/frontend yang diperiksa; QA bersama memuat halaman dengan fixture, bukan bukti alur mutasi menu Anak. Nama akses pilihan anak generik Berikutnya. File diubah hanya agents.md. Next steps: benahi ketepatan simpan/konkurensi dan validasi dahulu, lalu lengkapi CRUD/form vaksin-milestone, grafik dan UX sesuai scope berikutnya; belum commit/push review ini.

### Pengiriman Jadwal Makan dan wordmark Habit — 2026-11-13
- Pengguna meminta push ke origin setelah perbaikan dan QA dinyatakan lulus. Branch main dan origin/main sinkron sebelum pengiriman; diff whitespace bersih.
- Cakupan: perbaikan meal/push backend, frontend dan wordmark referensi, tes, rencana, dokumentasi serta bukti QA. Tidak menyertakan environment, cache/build atau generated sw/workbox.
- Verifikasi sebelumnya: tes/vet backend, integrasi PostgreSQL schema temporer, enam file tes frontend, build/lint/typecheck, 23 pemeriksaan browser dan sembilan audit axe lulus. Tidak menjalankan ulang pengujian karena perubahan berikutnya hanya dokumentasi pengiriman.
- Pengiriman dengan commit dan push biasa ke origin/main tanpa force. Next steps: pantau CI/CD dan verifikasi di deployment, termasuk push pada perangkat nyata yang belum diuji lokal.

### Pembenahan Jadwal Makan dan wordmark Habit — 2026-11-13
- Pengguna menyetujui semua temuan review untuk diperbaiki sekaligus, kemudian meminta tulisan Habit mengikuti gambar referensi. Akses penuh ditegaskan untuk menyelesaikan pekerjaan proyek ini; belum ada permintaan commit/push pada batch ini.
- Backend meal: validasi nama trim/panjang, tanggal/rentang/waktu makan/catatan/URL HTTP(S), edit tanggal dan waktu makan, normalisasi DATE PostgreSQL lama, UPDATE terfilter keluarga yang tidak menghidupkan record terhapus. Frontend memakai form native+Zod, clear catatan/resep, blok tautan legacy tidak aman, modal 360 px, input ringkas/touch-safe, nama akses kartu/dialog, Hari Ini mereset hari mobile, dan pesan gagal simpan server.
- Push: client API bersama/refresh token, rollback subscription baru saat POST gagal, kedua kunci VAPID wajib tersedia, status tersimpan dipulihkan via endpoint status milik anggota JWT, kontrol nonaktifkan dan panduan izin. Upsert atomik membatasi keluarga/anggota dan menolak transfer pemilik, unsubscribe terfilter; validasi provider HTTPS Google/Mozilla/Apple/Windows dan kunci P-256/auth. Scheduler memvalidasi ulang data legacy, tanpa redirect, timeout 15 detik, tanpa log endpoint/token, membersihkan 404/410. WIB eksplisit dan payload JSON menggabungkan semua masakan per slot.
- Wordmark: komponen vektor HabitWordmark mengikuti bentuk huruf membulat tebal, hijau gelap dan titik kuning pada referensi pengguna; diterapkan di sidebar dan auth desktop/mobile, huruf terang untuk tema gelap. Tidak mengubah ikon rumah/PWA atau menambah font/dependency.
- Verifikasi: go test ./... dan go vet ./... lulus; integrasi PostgreSQL schema temporer lulus untuk CRUD/clear/pindah slot/family isolation/stale update, 10 upsert serentak, kepemilikan anggota, unsubscribe/resubscribe. Enam file tes frontend dan build produksi 19 halaman berikut lint/typecheck lulus. Browser fixture: 23 pemeriksaan dan sembilan audit axe terarah lulus tanpa error runtime/overflow/pelanggaran; mencakup CRUD/error/empty, validasi, alur push simulasi, layar 375/390/1024/1440 serta halaman/dialog terang/gelap. Hasil final pada docs/qa/meals-modern-results.json.
- File utama: services/repositories/handlers/model terkait meal/push, scheduler, route status baru, halaman meals, lib/mealPlans dan pushNotification, komponen brand, Sidebar/auth/globals/types, tes dan script QA. Dokumentasi docs/meal-plan-improvements.md dan meal-plan-feature.md diselaraskan. Tidak mengubah schema atau data keluarga asli; schema QA dibersihkan otomatis, generated sw/workbox tidak disertakan.
- Next steps: review hasil pengguna; pengiriman push ke perangkat nyata belum diuji. Belum commit/push/deploy.

### Review menu Jadwal Makan — 2026-11-13
- Pengguna meminta pemeriksaan dan laporan. Membaca halaman meals, hooks/API/types terkait, service/repository/model/handler/routes meal dan push, scheduler, service worker, serta meal-plan-feature.md. Review berdasarkan source; tidak menjalankan browser/API atau mengirim push baru.
- Tersedia grid mingguan desktop, pilihan hari mobile, tiga waktu makan, beberapa masakan per slot, CRUD/catatan/link resep dan tombol aktivasi notifikasi. CRUD meal mengambil keluarga dari JWT; query baca/hapus terfilter keluarga, update membaca record terfilter sebelum Save.
- Prioritas: subscribeToPush tidak memeriksa HTTP status dan mengembalikan sukses saat VAPID kosong; fetch melewati refresh token API bersama. Status subscription tidak dipulihkan saat mount dan belum ada kontrol nonaktifkan. Payload scheduler menimpa masakan pada slot sama sehingga hanya satu tampil.
- Push unsubscribe menghapus berdasarkan endpoint saja tanpa family/member JWT. Subscribe hanya memvalidasi endpoint tidak kosong; endpoint/key perlu validasi, terutama karena scheduler melakukan request keluar. Error kirim memakai sub.Endpoint[:30] yang dapat panic untuk endpoint pendek; subscription 404/410 tidak dibersihkan.
- Validasi meal belum trim nama, parse tanggal/rentang atau batasi skema URL resep; input type=url bukan bagian form sehingga tombol simpan tidak memicu validasi native. Edit belum bisa memindah tanggal/waktu makan. Tombol Minggu Ini pada mobile tidak mereset hari terpilih ke hari ini; nama akses kartu hanya Buka. Modal masih max-w-md (448 px), berbeda dari modal ringkas modul terbaru.
- Tidak menemukan tes khusus meal/push pada direktori tes yang diperiksa; QA bersama memuat halaman dan memeriksa dialog, bukan bukti pengiriman notifikasi nyata. Docker sudah menetapkan TZ=Asia/Jakarta; scheduler di luar Docker mengikuti zona host. Plan meal lama masih pending meski implementasi tersedia.
- File yang diubah sesi review hanya agents.md. Next steps: benahi isolasi/validasi push dan ketepatan status notifikasi, agregasi masakan, validasi meal, lalu UX jadwal/modal; implementasi menunggu arahan pengguna.

### Pembenahan menu Tugas dan pengiriman — 2026-11-13
- Pengguna menyetujui seluruh perbaikan hasil review, lalu meminta push ke origin setelah selesai. Backend: TaskField membedakan omitted/null untuk anggota dan tenggat, validasi judul trim/status/poin integer 0–1000/tanggal/anggota keluarga, serta row lock yang menyatukan update/complete/delete. Complete bersifat idempoten.
- Model Task menambahkan completed_at dan migrasi tambahan 012_task_completion.sql; startup AutoMigrate menambah kolom dan backfill saat pertama kali diperkenalkan. Leaderboard memakai completed_at pada minggu WIB Senin 00:00 hingga Senin berikutnya. Metadata edit tidak mengubah waktu selesai; membuka kembali menghapus completed_at, selesai lagi mencatat waktu baru. Data lama memakai updated_at sebagai perkiraan karena waktu selesai asli belum tersedia; tidak mengubah migrasi lama.
- Frontend: halaman tasks, TaskCard/TaskModal/Leaderboard, helper tasks dan types/styles. Ringkasan tugas aktif/hari ini/terlambat/selesai mencakup seluruh keluarga; pencarian+filter anggota/tenggat untuk papan. Kartu/ceklis/modal lebih ringkas, aksi mulai/selesai/buka kembali langsung, modal tambah selalu reset, tanggal edit dinormalisasi, validasi poin/tanggal, serta error anggota/leaderboard, fallback avatar ke inisial dan grafik poin nol aman.
- Tes: go test ./... dan go vet lulus; integrasi PostgreSQL Task pada schema temporer lulus (clear field, anggota asing/family isolation, 10 complete serentak, metadata tugas lama, buka kembali/hapus, migrasi SQL idempoten/backfill). Schema pengujian dibersihkan otomatis; tidak memutasi tugas keluarga asli atau menerapkan migrasi ke database aplikasi lokal sesi ini.
- Frontend: 17 tes dan build produksi .next-qa/lint/typecheck 19 halaman lulus. Browser fixture: 17 pemeriksaan pada 1440/1024/390/375 px, tanpa overflow/error runtime; sembilan audit axe terarah bersih. Memeriksa filter, mulai/selesai/buka kembali, tanggal, clear anggota/tenggat, reset/validasi modal, create/edit/delete, gagal simpan serta empty/error. Temuan kontras awal terjadi pada toast yang sedang fade saat audit; pemeriksaan ulang memakai toggle tema aplikasi dan menunggu animasi selesai lulus. Bukti docs/qa/tasks-modern-* dan tasks-modal-*; script frontend/scripts/tasks-qa.cjs.
- File backend utama: model/task.go, services/task_service.go dan task_test.go, repositories/task_repo.go, handlers/task_handler.go, database/migrate.go serta migrations/012_task_completion.sql. Tidak menambah dependency runtime. Tidak mengimplementasikan jadwal tugas berulang atau broadcast WebSocket baru.
- Pengiriman: commit dan push biasa ke origin/main sesuai permintaan. Next steps: pantau CI/CD; startup backend baru menerapkan penambahan kolom/backfill, lalu review fitur di deployment.

### Review menu Tugas — 2026-11-13
- Pengguna meminta pemeriksaan menu Tugas. Membaca halaman tasks, TaskCard/TaskModal/Leaderboard, hooks dan service/repository/model/routes backend serta Task 4.1–4.2 pada plan. Tidak mengubah fitur atau data; review berdasarkan source, belum pengujian browser/API baru.
- Fitur tersedia: papan pending/in_progress/done, tab status mobile, filter anggota, CRUD tugas, tandai selesai, tenggat/terlambat, poin dan leaderboard mingguan. Tampilan masih berupa kartu tinggi dengan tombol ceklis dominan dan belum memiliki ringkasan, pencarian atau filter tenggat.
- Temuan utama: update AssignedTo/DueDate memakai pointer sehingga nilai null yang dikirim UI untuk menghapus penanggung jawab/tenggat diabaikan; input tanggal edit diisi due_date mentah yang dapat berbentuk timestamp PostgreSQL dan tidak cocok dengan input date. Leaderboard memakai updated_at, bukan waktu penyelesaian, sehingga edit tugas selesai lama dapat menghitungnya ke minggu sekarang.
- Validasi backend belum mencakup anggota assigned_to dalam keluarga JWT, enum status, rentang poin, judul trim atau format tanggal. Query tugas sendiri sudah membatasi family_id. Tidak menguji akses lintas keluarga.
- UX tambahan: TaskModal di-reset saat task berubah, tetapi membuka ulang modal tambah setelah ditutup tidak selalu mereset isian; error members/leaderboard belum ditampilkan, avatar leaderboard tanpa fallback jika URL rusak; pembagi grafik nol ketika semua poin nol. Perubahan pending ke in_progress dilakukan melalui modal edit, belum aksi langsung di kartu.
- Next steps yang direkomendasikan: benahi ketepatan edit/validasi/poin dahulu, lalu modernisasi ringkasan/filter/kartu/modal mengikuti kalender. Menunggu arahan implementasi; sesi ini hanya memperbarui agents.md, belum commit/push.

### Fallback foto profil Pengaturan — 2026-11-13
- Pengguna melaporkan foto profil tidak muncul, meminta gambar default bila belum diatur, dan meminta push setelah selesai. Modernisasi kalender sebelumnya sudah terkirim ke origin/main pada be752e7.
- File frontend/app/(dashboard)/settings/page.tsx: komponen ProfileAvatar dipakai bersama pada Profil Saya dan daftar anggota. URL kosong/spasi atau gagal dimuat memakai aset lokal default sesuai peran anak/dewasa. Foto valid tetap dipakai. Image memakai unoptimized agar foto eksternal seperti Google dan aset default dilayani langsung tanpa ketergantungan konfigurasi host/optimizer.
- Verifikasi: lint dan TypeScript lulus; QA browser dengan API fixture memeriksa empat skenario (kosong, rusak, spasi, valid) pada profil dan anggota dewasa/anak, semua gambar selesai dimuat tanpa error runtime. Script frontend/scripts/settings-avatar-qa.cjs; bukti docs/qa/settings-avatar-{results.json,fallback.png}. Tidak mengubah data/backend/dependency.
- Pengiriman: commit dan push biasa ke origin/main sesuai permintaan pengguna. Next steps: pantau CI/CD dan review Pengaturan di deployment.

### Modernisasi kalender dan pengiriman — 2026-11-13
- Pengguna meminta tampilan kalender lebih modern, kemudian menyetujui penyimpanan dan push ke origin/main.
- File: halaman calendar, CalendarHeader/MonthView/EventBadge/DayView/WeekView, TimeGrid baru, calendarUtils, globals.css, tes dan script QA. Toolbar menjadi navigasi ringkas dengan segmented view; kalender bulanan memiliki tanggal terpilih, badge pastel, panel agenda di desktop dan indikator titik serta panel di bawah pada mobile. Form tambah/edit/hapus dan hook API tetap digunakan.
- Grid hari/minggu bersama memisahkan acara sepanjang hari, memotong acara lintas tengah malam sesuai tanggal, menempatkan acara bersamaan pada kolom terpisah, menyediakan slot jam lewat keyboard dan scroll awal pukul 07.00. Grid mingguan dapat digeser mendatar pada HP. Warna dan kontras mode gelap diperbaiki.
- Verifikasi: 15 tes frontend lulus; build produksi terisolasi .next-qa termasuk lint/typecheck 19 halaman; browser fixture 11 pemeriksaan pada 1440/390/375 px tanpa overflow/error runtime dan sembilan audit axe terarah tanpa pelanggaran. Memeriksa pilih tanggal, tanggal form tambah, view bulan/minggu/hari, acara bersamaan/seharian, empty/error state. Bukti docs/qa/calendar-modern-*; script frontend/scripts/calendar-qa.cjs. Tidak mengubah data keluarga/backend/schema; QA memakai API fixture, belum uji mutasi API nyata.
- Pengiriman: commit perubahan kalender beserta panduan, rencana dan bukti QA; push biasa ke origin/main tanpa force. Next steps: pantau CI/CD dan review tampilan kalender di deployment.

### Pengiriman pembenahan menu Liburan — 2026-11-13
- Pengguna meminta pembaruan panduan agent serta commit dan push perubahan Liburan ke origin. Panduan resmi repo menggunakan nama `agents.md`; tidak membuat file duplikat `agent.md`.
- Cakupan pengiriman: service/repository/handler/routes backend, validasi dan tes trip, halaman detail/komponen/hooks/types/helper/styles frontend, tes frontend dan family-trip-planner-plan.md. Tidak menyertakan environment, cache build atau artefak PWA hasil build.
- Verifikasi implementasi sebelumnya: go test ./..., npm run test, build produksi frontend berikut lint/typecheck lulus; diff whitespace bersih. QA browser/API/storage dan integrasi PostgreSQL khusus Liburan belum dilakukan dan tetap dicatat sebagai tindak lanjut.
- Target origin/main dengan push biasa tanpa force. Next steps: pantau CI/CD, lalu verifikasi alur Liburan di deployment dan database pengujian terisolasi.

### Lanjutan implementasi menu Liburan — 2026-11-13
- Melanjutkan perubahan belum di-commit: service/repository/handler/routes Trips, halaman detail, hooks/types, komponen ItineraryBoard/TripBudgetSummary/TripExpensesPanel dan helper trips.
- Penyimpanan trip+kalender serta itinerary+rincian biaya memakai transaksi; validasi keluarga/anggota perjalanan, tanggal/jam/nominal, update field kosong/nol, edit pengeluaran, pembagian rata/custom/tanpa pembagian dan pelunasan telah tersedia. Bentrok kegiatan ditampilkan sebagai peringatan; tanggal transaksi boleh di luar perjalanan untuk uang muka/reservasi.
- Lanjutan sesi ini: memperbaiki lint, normalisasi tanggal itinerary hasil PostgreSQL, filter hari setelah kegiatan dihapus, modal ringkas maksimal 360 px termasuk form pengeluaran yang dapat discroll, menolak upload bila storage tidak tersedia. Liburan dibatalkan tidak membuat event; akhir kalender memakai 23:59:59 WIB hari pulang agar tidak tampil sehari lebih lama.
- Tes baru: backend trip_validation_test.go (tanggal/hari/jam, normalisasi, budget invalid/duplikat, pembayar, jumlah pembagian, pembulatan, kalender); frontend tests/trips.test.cjs (alokasi, bentrok, tanggal lintas tahun, budget kosong, pelunasan).
- Verifikasi: npm run test dan build produksi terisolasi .next-qa (19 halaman, lint/typecheck) lulus; go test ./... lulus. Tes PostgreSQL bersyarat tidak dijalankan tanpa HABIT_TEST_DATABASE_URL; browser/API/storage langsung belum diverifikasi sesi ini. Tidak ada migrasi atau mutasi data keluarga.
- Next steps: review tampilan dan alur Liburan di browser serta uji transaksi/family isolation dengan database pengujian terisolasi sebelum pengiriman. Belum commit/push.

### Review menu Liburan — 2026-11-13
- Pengguna meminta pemeriksaan menu Liburan setelah pembenahan Keuangan. Membaca daftar/detail trips, hooks, service/repository/handler/routes trip; tidak mengubah fitur/database atau menjalankan mutasi pengujian.
- Fitur tersedia: CRUD/status perjalanan, anggota, itinerary harian dan rincian estimasi biaya, checklist packing, pengeluaran/pembayar, dokumen/tiket, serta integrasi event kalender. API split bill/update expense tersedia tetapi UI detail belum memuat pembagian/pelunasan atau edit pengeluaran.
- Temuan prioritas: AddItineraryBudget/DeleteItineraryBudget menerima familyID tetapi hanya memeriksa itinerary+trip, belum memeriksa trip milik keluarga JWT. MemberIDs dan PaidBy/Splits juga perlu validasi keanggotaan keluarga/perjalanan. Temuan berdasarkan source, tanpa mencoba akses data keluarga lain.
- Penyimpanan/edit itinerary dan rincian budget di frontend memakai beberapa request; perubahan nominal menghapus lalu membuat rincian baru, sehingga dapat tersimpan sebagian/hilang jika request berikutnya gagal. Pembuatan event kalender dan trip juga terpisah, error kalender diabaikan.
- Tanggal pengeluaran default memakai UTC toISOString; backend belum memvalidasi urutan/rentang tanggal, hari itinerary, jam dan bentrok secara memadai. UpdateTrip hanya menerima budget >0 dan teks nonkosong sehingga sejumlah field tidak bisa dikosongkan/reset0. Ringkasan pengeluaran masih memakai angka0 untuk budget belum diatur.
- Rekomendasi: family isolation dan transaksi atomik dahulu, kemudian validasi tanggal/nominal, ringkasan estimasi-vs-aktual yang jelas, UI split bill/pelunasan/edit, serta modal/ceklis ringkas seperti Keuangan. Next step menunggu arahan pengguna untuk implementasi; file yang diubah sesi review ini hanya agents.md.

### Pengiriman pembenahan Keuangan — 2026-11-13
- Pengguna meminta commit dan push pembenahan Keuangan ke origin/main, termasuk migrasi tambahan 011, API/ledger/checkout, tampilan/modal ringkas, tes, dokumentasi dan bukti QA.
- Branch lokal dan origin/main sinkron sebelum commit. Verifikasi sebelumnya tercatat di bawah; diff whitespace lulus. Menggunakan push biasa tanpa force. Next step: pantau CI/CD dan review fitur di deployment setelah pembaruan tersedia.

### Implementasi pembenahan Keuangan — 2026-11-13
- Pengguna menyetujui seluruh perbaikan hasil review; kemudian meminta modal dan ceklis diperkecil. Implementasi mencakup empat tab sejajar, anggaran dari kosong, summary anggaran/pengeluaran/sisa, checkout belanja atomik, riwayat setoran/koreksi, tanggal lokal, validasi nominal dan konkurensi saldo.
- Backend: migrasi tambahan 011 (`financial_goal_entries`, `shopping_items.expense_id`), model/AutoMigrate, services/repos/handlers/routes. Row lock untuk goal dan item belanja; anggaran memakai advisory lock per keluarga/kategori/periode. Semua ID keluarga/anggota berasal dari JWT. CI mengaktifkan PostgreSQL integration tests via HABIT_TEST_DATABASE_URL.
- Frontend: halaman budget, BudgetModal/GoalHistoryModal baru, modal/list/goal card dan hooks/type bersama, helper/tes finance. Dialog maksimum 360 px, input desktop 13 px/36 px; lingkaran ceklis 20 px dengan hit area terpisah 36/44 px. Bukti/pembatasan rinci: `docs/finance-improvements.md`.
- Migrasi SQL 011 diterapkan ke database pengembangan lokal; backend lama diganti build baru `/tmp/habit-finance-api`, log `/tmp/habit-finance-api.log`, health localhost:8080 lulus. Data QA memakai keluarga/schema temporer dan telah dibersihkan; tidak mengubah transaksi keluarga asli.
- Verifikasi: build produksi frontend 19 halaman/lint/typecheck; sembilan tes frontend; backend build/vet/go test; tes integrasi PostgreSQL (20 setoran bersamaan, checkout bersamaan, ledger, family isolation) lulus. Browser 28 pemeriksaan dan 15 audit axe terpilih bersih. Curl API nyata 16 pemeriksaan lulus. Belum commit/push; perubahan `agents.md` dari review sebelumnya dipertahankan.
- Implementasi, review bukti, dan dokumentasi selesai. Next step: review pengguna pada localhost:3000/budget; belum commit/push. Pemasukan/rekening/ekspor/transaksi rutin tidak ditambahkan pada scope pembenahan ini.

### Review fitur Keuangan — 2026-11-13
- Pengguna meminta penilaian fitur, bukan implementasi. Membaca halaman budget, ExpenseModal/BudgetProgress/ShoppingList/GoalCard, hooks budget/goals dan backend service/repository/model terkait. Tidak mengubah kode fitur atau data; tidak menjalankan pengujian runtime baru.
- Fitur aktif: CRUD pengeluaran, filter kategori/bulan, summary, budget kategori dan indikator kelebihan, checklist belanja, target tabungan/tambah dana.
- Temuan: budget baru hanya dapat dibuat pada kategori yang sudah muncul di budgets/actuals; keadaan awal kosong tidak punya tombol membuat anggaran. Navigasi dua tingkat dan label Target Budget/Target Keluarga berpotensi membingungkan. Belanja belum terhubung ke pencatatan nominal transaksi; belum ada pemasukan/saldo dan riwayat setoran target pada alur yang ditinjau.
- Temuan kode: default tanggal pengeluaran memakai UTC toISOString (bisa berbeda tanggal lokal); AddFund memakai read-modify-save tanpa operasi atomik (risiko lost update setoran bersamaan); status target tercapai tidak otomatis kembali false ketika target dinaikkan; update nominal pengeluaran belum memeriksa positif di service.
- Rekomendasi urutan: benahi alur anggaran kosong dan ketepatan data dahulu, lalu ringkasan pengeluaran/anggaran/sisa, navigasi Pengeluaran/Anggaran/Tabungan/Belanja, dan integrasi belanja ke pengeluaran. Fitur pemasukan, transaksi rutin, laporan/ekspor sebagai pengembangan berikutnya. Next step menunggu arahan implementasi pengguna.

### Pengiriman pembaruan tampilan dan PWA — 2026-11-13
- Pengguna meminta batch lanjutan dikirim ke origin/main: lebar Liburan/Pengaturan, skala seragam semua menu, wordmark lebih tebal, cache ikon PWA, dan latar cream.
- Verifikasi tercatat pada bagian di bawah: build/lint/typecheck, pemeriksaan browser dan PWA lulus. Commit dan push biasa ke origin/main, tanpa force push; bukti QA/dokumentasi disertakan. Next step: pantau CI/CD dan review instalasi PWA setelah versi baru tersedia.

### Latar light cream tipis — 2026-11-13
- Pengguna meminta mencoba latar light cream tipis setelah menanyakan warna latar sebelumnya.
- `globals.css`: token background 43 44% 97%, app-shell gradient cream #FCFAF5/#FAF8F2/#F8F9F2. Kartu tetap putih, aksen emerald dan dark theme tetap dipertahankan. Manifest background_color dan latar offline diselaraskan #FAF8F2.
- `logo-qa.cjs` diperluas untuk memeriksa wordmark 24px/800 dan warna canvas light. Verifikasi visual lulus pada dev: canvas cream dan wordmark 24 px/800; lima pemeriksaan logo tanpa error, empat ikon manifest HTTP 200. Perubahan sebelumnya dipertahankan, belum commit/push batch ini.

### Wordmark sidebar dan pembaruan ikon PWA — 2026-11-13
- Pengguna meminta tulisan Habit lebih bulky dan melaporkan ikon PWA belum memakai logo terbaru.
- `globals.css`: wordmark 24 px/800 dengan stroke tipis 0.3 px, tracking -0.9 px; tagline tetap ringan.
- Manifest sudah memakai logo v2 yang sama dengan sidebar. Memperbaiki jalur pembaruan: URL manifest/ikon/Apple diberi versi, id eksplisit `/dashboard` mempertahankan identitas berdasarkan start_url lama; manifest dikeluarkan dari precache dan memakai NetworkOnly, manifest/sw HTTP no-cache, registration updateViaCache none.
- File: root layout, manifest, next.config, ServiceWorkerRegistration, globals.css, dan pemeriksaan PWA. Build produksi 19 halaman/lint/typecheck lulus sebelum perubahan warna cream; pemeriksaan browser/logo lulus. PWA pada standalone produksi dengan manifest/offline terbaru lulus: HTTP no-cache, id stabil, ikon berversi, worker mengontrol halaman, fallback offline HTTP 200. Perubahan batch sebelumnya dipertahankan; belum commit/push batch lanjutan.
- Ikon aplikasi yang sudah terpasang dikelola browser/OS; kode tidak dapat memaksa pembaruan ikon launcher saat itu juga. Next step: verifikasi manifest/worker/offline dan review ikon setelah pembaruan instalasi.

### Skala seragam seluruh menu — 2026-11-13
- Pengguna meminta ukuran font dan tampilan semua menu diperkecil dan diseragamkan dengan dashboard.
- `tailwind.config.ts`: caption 11 px, teks/label 13 px, subjudul 15–17 px, judul 20 px. `PageHeader` memakai judul 20 px di desktop/mobile. Button standar 36 px, pointer coarse tetap minimum 44 px. ContentState lebih ringkas.
- Normalisasi padding kartu/dialog 20–24 menjadi 16 px, gap bagian 20–24 menjadi 16 px, empty state dan tombol tambah dipadatkan di seluruh halaman selain dashboard dan komponen modul. Detail Liburan mengikuti lebar main. Data dan alur fitur dipertahankan.
- Server dev localhost:3000 direstart karena masih menyajikan font token lama (22 px); sesudah restart CSS yang dilayani sudah 20 px. Build menggunakan `.next-qa` agar terisolasi dari dev.
- Build produksi 19 halaman, lint dan TypeScript lulus. Pemeriksaan terarah 20 skenario (10 menu termasuk detail Liburan × mobile/desktop) lulus: judul 20 px, lebar mengikuti main, tanpa overflow/error runtime. Bukti `docs/qa/compact-*`; regresi dashboard/reference 46 pemeriksaan dan delapan audit axe terpilih juga lulus tanpa error/overflow/pelanggaran. Belum commit/push untuk batch ini.

### Lebar halaman Liburan dan Pengaturan — 2026-11-13
- Pengguna melaporkan konten kedua menu berkumpul di tengah. Penyebab: wrapper Liburan `max-w-6xl mx-auto` (1152 px) dan Pengaturan `max-w-2xl mx-auto` (672 px).
- Mengubah wrapper di `frontend/app/(dashboard)/trips/page.tsx` dan `frontend/app/(dashboard)/settings/page.tsx` menjadi `w-full min-w-0`, mengikuti lebar dan gutter `.app-main` yang sama dengan halaman lain. Batas lebar dialog tetap dipertahankan.
- Verifikasi browser dengan data simulasi: enam pemeriksaan pada 390/1228/1920 px lulus; tepi konten tepat pada gutter main, tanpa overflow/error runtime. Bukti `docs/qa/full-width-results.json` dan `full-width-{trips,settings}-1228.png`. Diff whitespace lulus. Perubahan ini belum commit/push; redesign sebelumnya sudah terkirim pada commit `a20d3a6` ke origin/main.
- Next step: review hasil visual pengguna; tidak ada perubahan backend atau alur fitur.

### Pengiriman redesign ke origin — 2026-11-13
- Pengguna meminta seluruh pekerjaan redesign yang sudah selesai dikirim ke origin.
- Target: branch `main`, remote `origin`; mencakup redesign semua menu, logo/aset, font, perbaikan PWA, offset sidebar, dokumentasi dan bukti QA. Generated build/cache dan berkas environment tidak disertakan.
- Verifikasi sebelumnya: build/lint/typecheck, enam tes logika, 46 pemeriksaan browser dan delapan audit axe terpilih lulus. Pengiriman dilakukan dengan commit lalu push biasa, tanpa force push. Next step: pantau hasil CI/CD dan review tampilan setelah pembaruan.

### Perbaikan konten tertutup sidebar — 2026-11-13
- Pengguna melaporkan dashboard masuk ke bawah sidebar dan terpotong di kanan pada browser lokal.
- `frontend/app/(dashboard)/layout.tsx` dan `globals.css`: offset desktop dan padding main dipindahkan dari rangkaian utility menjadi aturan `.app-content`/`.app-main` eksplisit, 208 px saat terbuka/80 px saat ringkas; mobile tanpa offset. Main memakai border-box dan min-width 0.
- `frontend/scripts/ui-qa.cjs`: menambahkan assertion geometri kiri/kanan banner dan viewport 1228x620 sesuai screenshot pengguna. Screenshot hasil: `docs/qa/reference-dashboard-1228x620.png`.
- Verifikasi ulang lulus: TypeScript, diff whitespace, 46 pemeriksaan browser tanpa overflow/error, dan delapan audit axe terpilih tanpa pelanggaran. Pada 1228x620 konten mulai x232 (208 px sidebar + 24 px gutter) dan berakhir x1204. Belum commit/deploy; perubahan sebelumnya dipertahankan.

### Revisi visual berdasarkan referensi terbaru — 2026-11-13
- Pengguna menyatakan sidebar/button/dashboard sebelumnya kurang sesuai, memberikan screenshot referensi baru, meminta header ganda di topbar dihapus pada setiap menu, serta font dan skala tampilan bawaan diperkecil.
- Acuan terbaru: `docs/design-reference/dashboard-nov13.png`; detail implementasi/prompt di `docs/dashboard-reference-refresh.md`. Arah ini menggantikan sage/kertas hangat yang sebelumnya dipakai.
- Implementasi: sidebar 208/80 px dengan nav aktif emerald, profil dan dekorasi; topbar tanpa judul/caption Ruang keluarga, pengingat tugas aktual dan menu akun; dashboard banner keluarga baru, shortcut pastel, dua kartu agenda/tugas dan strip Sekilas keluarga.
- Font Plus Jakarta Sans variable lokal + OFL menggantikan Inter aktif. Body 13 px, token sm 13/base14, PageHeader dan tombol/jarak dikompakkan; media query untuk desktop pendek, tanpa CSS zoom. User mengizinkan perbaikan primitive Button lewat permintaan eksplisit tombol.
- File utama: halaman dashboard, Sidebar/Topbar/BottomNav/layout, root layout, globals.css/tailwind.config, ThemeToggle, PageHeader, Button, navigation, manifest/offline, font/aset dan dokumentasi. Tidak mengubah backend/schema atau menambah dependency runtime.
- Verifikasi lulus: build produksi 19 halaman, lint/typecheck, enam tes logika; 45 pemeriksaan browser tanpa error dan delapan audit axe terpilih tanpa pelanggaran. Termasuk 20 pemeriksaan menu satu h1, desktop 1040x600/1366x768/1440x900, mobile, drawer, collapse dan popover. Hasil/screenshot: `docs/qa/reference-*`. PWA manifest/worker/offline juga lulus pada sesi ini.
- Perubahan sesi sebelumnya dipertahankan. Implementasi dan verifikasi revisi selesai; belum commit/deploy. Next step: review visual pengguna pada localhost:3000; integrasi backend nyata/perangkat fisik dapat diperiksa pada lingkungan deployment.

### Logo HABIT v2 — 2026-11-13
- Permintaan eksplisit pengguna: menyarankan dan mengganti logo. Dipilih monogram H yang menyatu dengan atap rumah, sage–ivory, selaras dengan redesign. Dibuat dengan built-in imagegen; sumber/prompt: `docs/logo.md` dan `docs/brand/`.
- Aset baru `frontend/public/icons/habit-mark-v2.png`, favicon PNG 32/48, Apple 180, PWA 192/512, dan maskable 192/512. `frontend/app/favicon.ico` diganti dengan ICO multiukuran 16/32/48. URL aset berversi mencegah ketergantungan pada cache URL logo lama; aset lama/avatarnya dipertahankan.
- Pemakaian diperbarui: Sidebar, auth layout desktop/mobile, root metadata, manifest/shortcut PWA, InstallPrompt, sw-push dan offline.html. Dokumentasi arah visual/design system/ilustrasi diselaraskan. Tidak mengubah dependency, backend atau schema.
- Script reproduksi: `frontend/scripts/generate-brand-icons.cjs`; pemeriksaan browser terarah: `frontend/scripts/logo-qa.cjs`.
- Verifikasi: dimensi 8 PNG dan ICO valid; radius simbol maskable 0.314 (192 px) dan 0.312 (512 px), di dalam batas 0.4. Build produksi/lint/typecheck lulus; 5 pemeriksaan browser logo desktop/mobile/light/dark tanpa error, semua 4 ikon manifest HTTP 200, favicon HTTP 200. PWA manifest/worker/offline diuji ulang dan lulus.
- Bukti: `docs/qa/logo-results.json`, screenshot `logo-login-*`, `logo-dashboard-1440.png`, dan `pwa-results.json`. Generated sw/workbox dibersihkan dari diff setelah build; perubahan working tree redesign sebelumnya dipertahankan. Belum commit/deploy. Next step: review visual pengguna jika ingin varian logo berikutnya.

### Pembacaan konteks — 2026-11-13
- Membaca struktur proyek, dokumentasi Markdown, dan source inti backend/frontend untuk memahami arsitektur, fitur, serta progres redesign.
- File yang diubah pada sesi ini hanya `agents.md`, untuk mencatat pembacaan; perubahan working tree yang sudah ada dipertahankan.
- Acuan status terbaru tetap catatan batch redesign 2026-11-12 dan `docs/ui-redesign-roadmap.md`; status pada README dan rencana lama tidak selalu sinkron dengan implementasi.
- Tidak menjalankan aplikasi, build, atau tes pada sesi pembacaan ini. Next step implementasi tetap menyelesaikan verifikasi fondasi tahap 2, kemudian dashboard/ilustrasi tahap 3 sesuai scope yang diminta pengguna berikutnya.

### Pemeriksaan rencana dashboard dan perubahan belum commit — 2026-11-13
- Memeriksa `dashboard-redesign-plan.md`, diff tracked/untracked, serta source navigasi dan dashboard. Plan lama masih seluruhnya pending dan telah digantikan roadmap terbaru; halaman dashboard/auth tidak memiliki diff pada batch saat ini.
- Batch belum commit berisi fondasi sage, shell/navigasi, wrapper bersama yang belum dipakai halaman, dan dokumentasi. Tidak ada perubahan staged. Commit terakhir `0b75ede` adalah perbaikan penyimpanan budget itinerary.
- Verifikasi ulang: `npm run lint` lulus dengan dua warning img existing di trips; `npx --no-install tsc --noEmit --incremental false` lulus. Build dan browser QA tidak dijalankan ulang.
- Temuan source: metrik dashboard lama masih memakai denominator Rp3 juta/fallback 40%, tugas mendesak berdasarkan keberadaan due_date, dan jumlah entri kenangan sebagai foto baru. Drawer belum menyinkronkan scroll lock saat breakpoint berubah dan background belum inert saat drawer terbuka; perlu verifikasi/perbaikan pada tahap 2.
- File yang diubah dalam pemeriksaan ini hanya `agents.md`. Next step tetap merapikan/verifikasi fondasi tahap 2 sebelum implementasi dashboard tahap 3; belum melakukan commit.

### Fokus Aktif — Redesign UI/UX HABIT
- Pengguna mengizinkan penyelesaian **seluruh** roadmap pada 2026-11-13, tanpa review/izin ulang antartahap, serta akses penuh hanya untuk pekerjaan terkait proyek ini.
- Tahap 1–7 selesai untuk implementasi dan QA frontend lokal; hasil final serta batas integrasi nyata dicatat di `docs/ui-redesign-qa.md`.
- Shell/navigasi sage, header/state/dialog bersama, focus/scroll lock drawer, tema terang/gelap dengan kontrol aktif, dan font Inter lokal sudah diterapkan. Font mono memakai Geist Mono lokal existing. Tidak ada dependency runtime atau perubahan schema/backend.
- Dashboard baru memakai tanggal lokal untuk tugas/agenda, anggaran kategori aktual, error/loading/empty/pending terpisah, serta satu ilustrasi keluarga 2D. Ilustrasi empty state tersedia untuk kalender, album, dokumen, dan liburan.
- Seluruh modul memakai fondasi yang sama. Tugas: filter anggota dan status mobile, tidak ada progress/kategori buatan. Makan: tampilan harian di HP dan mingguan desktop. Keuangan/target, liburan/detail, anak, kenangan, dokumen, pengaturan dan auth diperbarui.
- Modal per modul memakai `ModalFrame` dengan portal, nama dialog, Escape, focus trap, inert background, dan pengembalian fokus. Label form dan nama tombol ikon diperbaiki, aksi tersedia tanpa hover, hapus memakai konfirmasi.
- Font Inter resmi dan lisensinya disimpan di `frontend/app/fonts/`; gambar built-in imagegen disimpan di `frontend/public/illustrations/`. Prompt dan inventaris aset: `docs/illustrations.md`.
- Perbaikan terkait yang ditemukan: pending foto pada edit kenangan kini diteruskan ke upload, fungsi upload tak terpakai di modal dihapus, devtools query menjadi opt-in agar tidak menutupi bottom nav, metadata PWA memakai sage.
- Verifikasi final: lint tanpa warning/error, typecheck dan build produksi lulus (19 halaman), enam tes logika lulus. Browser: 107 pemeriksaan tanpa error runtime/overflow; 29 audit axe terpilih (22 halaman/tema + 7 dialog) bersih. Screenshot/JSON ada di `docs/qa/`.
- File yang diubah mencakup seluruh halaman dashboard/auth, komponen modul/layout, `globals.css`, root layout/providers, `tailwind.config.ts`, manifest, `package.json`, CI, dokumentasi. File baru: helper/tes dashboard, komponen bersama, font/lisensi lokal dan ilustrasi.
- PWA tambahan: `ServiceWorkerRegistration.tsx`, `offline.html`, `next.config.mjs`; worker eksplisit untuk App Router, import handler push existing, fallback offline dan API network-only. Manifest tanpa error, worker mengontrol halaman, offline fallback HTTP 200 dari worker terverifikasi di Chrome. `NEXT_BUILD_DIR` mengisolasi QA dari server dev lain; generated sw/workbox dikembalikan ke kondisi awal setelah verifikasi.
- Script QA tersimpan di `frontend/scripts/ui-qa.cjs` dan `pwa-qa.cjs`; tooling QA hanya di `/tmp`, bukan dependency runtime.
- Perubahan working tree awal dipertahankan; belum membuat commit, push, atau deployment. Next step opsional: review hasil dan smoke test integrasi backend/Google OAuth/push pada deployment serta perangkat fisik.

### ✅ Sudah Selesai (semua fase)

| Fase | Deskripsi | Status |
|---|---|---|
| Fase 0 | Design system, wireframe, frontend plan | ✅ |
| Fase 1 | Setup repo, backend Golang, frontend Next.js | ✅ |
| Fase 2 | Auth (email/password + Google OAuth), Family management | ✅ |
| Fase 3 | Calendar API + halaman Calendar (3 view, WebSocket real-time) | ✅ |
| Fase 4 | Task/Chore API + halaman Tasks (kanban 3 kolom) | ✅ |
| Fase 5 | Budget API + halaman Budget | ✅ |
| Fase 6 | Memory API + halaman Memories | ✅ |
| Fase 7 | Kids Tracker API + halaman Kids | ✅ |
| Fase 8 | Documents API + halaman Documents | ✅ |
| Fase 9 | Home Dashboard (widget real-data), PWA lengkap | ✅ |
| UI Redesign | Seluruh tampilan frontend disesuaikan dengan mockup di `docs/ui-ux/` | ✅ |
| Fitur Jadwal Makanan | Meal plan grid 7×3, push notification jam 04:00 | ✅ |
| Fix Auth Loop | Loop reload & UNAUTHORIZED error setelah token expired | ✅ |
| Bug fixes & ngrok dev | CORS, refresh token, foto proxy, meal plan display | ✅ |
| Fase 10 — Deployment | Dockerfile, docker-compose.prod.yml, GitHub Actions CI/CD | ✅ |

### 🔄 Perubahan Penting yang Sudah Dilakukan (sesi terakhir)

#### Pembenahan Dokumen dan storage via env — 2026-11-14
- Provider factory/konfigurasi deployment, API Dokumen privat dan enkripsi, CRUD metadata/UI, migrasi 013, tes serta dokumentasi selesai; detail dan batas verifikasi pada STATUS TERKINI. Pengiriman origin/main diminta pengguna.


#### Review menu Dokumen — 2026-11-14
- Hanya agents.md diperbarui dengan temuan source tentang upload/kategori, role, privasi/URL, validasi dan konsistensi hapus; fitur belum diubah.


#### Pembaruan login dan registrasi PWA — 2026-11-14
- Layout/header emerald dan ilustrasi mobile, kartu form, tema gelap, validasi aksesibel dan QA auth diperbarui; detail pada STATUS TERKINI. Pengiriman origin/main diminta pengguna.


#### Pembaruan login dan registrasi PWA — 2026-11-14
- Pengguna meminta tampilan login/registrasi PWA lebih menarik karena mobile hanya menampilkan form putih, lalu meminta push ke origin setelah selesai.
- Layout auth bersama memakai panel emerald, latar cream, ilustrasi keluarga existing, aksen amber dan kartu form membulat. Cerita/ilustrasi kini terlihat di mobile; desktop dua kolom. Safe area atas/bawah, scroll alami, ukuran input 16 px dan kontrol tema tersedia. Onboarding mengikuti layout yang sama.
- Login/registrasi: copy baru, input/tombol bersama, nama akses toggle password mengikuti status, aria-invalid/describedby menghubungkan pesan validasi, error server mendukung tema gelap, URL Google memiliki fallback API lokal. Tidak mengubah alur autentikasi/backend/schema/dependency.
- File: frontend/app/(auth)/layout.tsx, login/page.tsx, register/page.tsx, app/globals.css; script frontend/scripts/auth-welcome-qa.cjs dan docs/qa/auth-welcome-*.
- Verifikasi: build produksi 19 halaman berikut lint/typecheck lulus; browser Chrome 32 pemeriksaan login/register/onboarding pada 360/390/768/1440 px terang/gelap, ilustrasi/warna heading/tanpa overflow, validasi dan toggle password lulus tanpa error runtime. Screenshot mobile/desktop direview. Tidak menguji login/registrasi akun nyata atau perangkat PWA fisik.
- Pengiriman: commit/push biasa origin/main sesuai permintaan pengguna. Next steps: pantau CI/CD dan review tampilan login/registrasi pada PWA deployment. Generated build/worker tidak disertakan.

### Pembacaan konteks proyek — 2026-11-14
- Hanya agents.md diperbarui untuk mencatat pembacaan konteks, aturan kerja dan status terbaru; belum ada perubahan implementasi.

#### Penerapan Habit Hadir Bersama v3 — 2026-11-13
- Simbol/wordmark diselaraskan di UI, judul tab dan nama brand diperbarui, favicon/Apple/PWA/shortcut/offline/push/badge memakai v3. Build/lint/typecheck, 22 tes, validasi aset dan 16 pemeriksaan browser/PWA lulus. Detail file pada STATUS TERKINI dan docs/logo.md; commit/push sesuai permintaan pengguna.

#### CRUD Anak dan proporsi/warna Habit — 2026-11-13
- Melengkapi profil dan empat catatan, transaksi/validasi/family+child isolation, form/grafik/role UI dan tes/QA. Wordmark 84×25 emerald. Detail file/status/verifikasi pada STATUS TERKINI dan docs/kids-improvements.md; commit/push biasa sesuai permintaan pengguna.

#### Jadwal Makan dan wordmark referensi — 2026-11-13
- Memperbaiki meal/push backend, halaman/form/helper frontend dan tes/QA; wordmark vektor dipakai sidebar/auth. Detail file, keputusan, verifikasi dan batas pengujian tercatat pada STATUS TERKINI serta docs/meal-plan-improvements.md. Belum commit/push.

#### Fix Google OAuth Missing Refresh Token — 2026-09-02
- **Root Cause:** Pada endpoint `/auth/google/callback` di backend, `GoogleCallback` handler hanya menyertakan `token` (access token) di redirect URL dan tidak memasang cookie `refresh_token` maupun mengirimnya ke URL. Akibatnya saat frontend redirect/reload atau mount `AuthSync`/interceptor 401, refresh token tidak ditemukan di `localStorage` maupun cookie.
- **Fix Backend:** [`backend/internal/handlers/auth_handler.go`](backend/internal/handlers/auth_handler.go) sekarang memanggil `setRefreshCookie(c, resp.RefreshToken)` dan menyertakan `&refresh_token=` pada redirect URL frontend.
- **Fix Frontend:** [`frontend/app/auth/callback/page.tsx`](frontend/app/auth/callback/page.tsx) menangkap parameter `refresh_token` dari query URL, menyimpannya ke `localStorage`, dan mengoperkannya ke `setAuth(user, token, refreshToken)`.

#### Fix Lint Unused Import — 2026-09-02
- `frontend/app/(dashboard)/dashboard/page.tsx` — Hapus unused import `ShieldCheck` dari `lucide-react` yang menyebabkan error ESLint saat production build / CI.
- Verifikasi `npm run lint` dan `npm run build` berhasil 100%.

#### Dashboard Redesign & Layout Alignment — 2026-09-02
- `frontend/app/(dashboard)/dashboard/page.tsx` — Full redesign mengikuti `docs/redesign/habit-dashboard-redesign.html`:
  - Hero section banner "Family Command Center" dengan background radial gradients & ilustrasi emoji.
  - 4 Summary Cards (Tugas, Acara, Sisa Anggaran dengan bar progress, Kenangan) dengan efek circle accent.
  - Left column: Tugas Utama dengan interactive quick complete check & priority tag, Pengeluaran Bulan Ini dengan categorical progress bars.
  - Right column: Mini Calendar bulanan navigasi interaktif, Reminder Vaksin list dengan status pills, Family Pulse widget yang menampilkan progress aktivitas anggota keluarga real-time.
  - Tips Harian banner di bagian bawah dengan rotasi harian.
- `frontend/components/layout/Sidebar.tsx` — Tambah quote card box "Keluarga yang terorganisir, hidup yang lebih bahagia 💚 🪴" di bagian bawah sidebar desktop.
- `frontend/app/(dashboard)/layout.tsx` — Sesuaikan background `#F6F8FB` & padding `lg:p-8` agar konsisten dengan mockup.

#### Fix Google OAuth Callback 404 — 2026-09-02
- **Root cause:** `app/(auth)/callback/page.tsx` di Next.js App Router resolve ke URL `/callback` (bukan `/auth/callback`) karena route group `(auth)` tidak menambah prefix URL. Backend redirect ke `/auth/callback` → 404.
- **Fix:** Pindah halaman callback dari `app/(auth)/callback/page.tsx` → `app/auth/callback/page.tsx` (di luar route group). URL sekarang benar: `/auth/callback`.
- Bonus: halaman callback tidak lagi dibungkus auth layout (split layout), cukup full-screen loading spinner.

#### Auth Pages Redesign — 2026-09-02
- `frontend/app/(auth)/layout.tsx` — split layout baru: sisi kiri branding (hero copy, ilustrasi dummy emoji, tagline, background gradient), sisi kanan form. Mobile: logo saja, layout single column
- `frontend/app/(auth)/login/page.tsx` — redesign: heading baru, input dengan icon (Mail/Lock), show/hide password toggle, tombol gradient teal, tombol Google lebih clean
- `frontend/app/(auth)/register/page.tsx` — redesign seragam dengan login: icon per field (User/Mail/Lock), show/hide password untuk kedua field password, hapus Card/CardContent shadcn
- `frontend/app/(auth)/onboarding/page.tsx` — redesign: heading baru, pilihan mode pakai border rounded-2xl dengan hover color, form create/join pakai input bergaya sama, tombol kembali inline (ArrowLeft), warna aksen teal (create) dan purple (join)

#### Halaman Settings — 2026-09-02
- `frontend/app/(dashboard)/settings/page.tsx` — halaman baru: profil user (nama, email, role, auth provider), info keluarga (nama + kode undangan dengan tombol copy), daftar anggota keluarga (avatar, nama, email, badge role), tombol logout. React Query fetch `/family` dan `/family/members`. Skeleton loading state. Dark mode support.
- Route `/settings` sudah terdaftar di sidebar (`Sidebar.tsx`) dan middleware (`middleware.ts`) — tidak ada perubahan diperlukan

#### Google OAuth — Production Setup — 2026-09-02
- `.env.example` (root) — tambah komentar instruksi redirect URI Google Cloud Console + note bahwa `GOOGLE_REDIRECT_URL` & `FRONTEND_BASE_URL` otomatis dari `BACKEND_URL`/`FRONTEND_URL`
- `docs/deployment.md` — tambah section **§3 Setup Google OAuth** (langkah buat credentials, authorized redirect URI, GitHub Secrets, `.env` VPS). Tambah `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` ke tabel GitHub Secrets. Renumber section 3→4→5→6→7 menjadi 4→5→6→7→8
- `.github/workflows/cd.yml` — inject `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` sebagai env di step deploy SSH. Script deploy sekarang auto-update nilai di `.env` VPS via `sed -i` setiap kali CD berjalan

#### Fase 10 — Deployment Setup — 2026-09-02
- `frontend/Dockerfile` — multi-stage build (deps → builder → runner), Node 20 Alpine, standalone output
- `frontend/next.config.mjs` — tambah `output: "standalone"` untuk Docker
- `frontend/.dockerignore` — exclude node_modules, .next, .env
- `backend/Dockerfile` — tambah `-ldflags="-s -w"` (ukuran binary lebih kecil), hapus copy `.env` ke image, tambah HEALTHCHECK
- `backend/.dockerignore` — exclude .env, .idea, migrations, bin
- `docker-compose.prod.yml` — production stack: postgres, redis, minio, backend, frontend (tanpa Nginx — pakai reverse proxy eksternal)
- `.env.example` — update dengan semua env vars production
- `.github/workflows/ci.yml` — CI: lint + typecheck + build + test (backend Go + frontend Next.js)
- `.github/workflows/cd.yml` — CD: build & push Docker image ke GHCR, deploy ke VPS via SSH
- `docs/deployment.md` — panduan lengkap: setup VPS, GitHub Secrets, jalankan production, troubleshooting

#### Logo User Custom — 2026-09-01
- `frontend/public/icons/assets-habit/` — tambah `logo-user-ayah.png`, `logo-user-ibu.png`, `logo-user-anak.png`
- `frontend/components/layout/Sidebar.tsx` — fallback avatar pakai icon custom: `child` → `logo-user-anak`, lainnya → `logo-user-ayah`
- `frontend/components/layout/Topbar.tsx` — sama, ganti initials fallback ke icon custom

#### Sidebar Collapsible (Icon-only mode) — 2026-09-01
- `frontend/stores/uiStore.ts` — tambah state `sidebarCollapsed` + action `toggleCollapsed`
- `frontend/components/layout/Sidebar.tsx` — width `w-64` ↔ `w-16` saat collapsed; logo title disembunyikan; nav label disembunyikan (icon only + tooltip); tombol `PanelLeftClose/Open` di header desktop; user info collapsed = avatar only
- `frontend/app/(dashboard)/layout.tsx` — wrap dalam `DashboardContent` yang baca `sidebarCollapsed`; padding kiri `lg:pl-64` ↔ `lg:pl-16` dengan CSS transition

#### Dark Mode — Full Audit Semua Halaman — 2026-09-01
- `frontend/package.json` — install `next-themes`
- `frontend/app/providers.tsx` — wrap dengan `ThemeProvider` (attribute="class", defaultTheme="system")
- `frontend/components/layout/Topbar.tsx` — tombol toggle Sun/Moon via `useTheme`
- `frontend/app/globals.css` — `dark:` variant pada `body`, `h1-h6`, `.card`
- `frontend/components/layout/Sidebar.tsx` — `dark:bg-neutral-900`, border, nav items
- `frontend/components/layout/BottomNav.tsx` — `dark:bg-neutral-900`, border
- `frontend/app/(dashboard)/layout.tsx` — `dark:bg-neutral-950`
- `frontend/app/(dashboard)/dashboard/page.tsx` — StatCard, semua cards, MiniCalendar
- `frontend/app/(dashboard)/tasks/page.tsx` — kanban cards, empty state, progress bar
- `frontend/app/(dashboard)/budget/page.tsx` — cards, tabs, filter chips, modal input
- `frontend/app/(dashboard)/memories/page.tsx` — filter pills, empty state
- `frontend/app/(dashboard)/documents/page.tsx` — search input, filter chips, cards, info bar
- `frontend/app/(dashboard)/kids/page.tsx` — semua tab (growth/vaccines/milestones/health), forms, sidebar list
- `frontend/app/(dashboard)/meals/page.tsx` — slot cards, detail modal, form modal, inputs

#### Rebranding ke HABIT + Icon Menu — 2026-09-01
- `frontend/components/layout/Sidebar.tsx` — ganti nama "Kenangan Keluarga" → logo `logo-habit.png` + `tittle-habit.png`. Ganti semua lucide icon nav dengan gambar dari `assets-habit/menu-*.png`
- `frontend/components/layout/BottomNav.tsx` — sama, ganti lucide icon dengan gambar `assets-habit/menu-*.png`
- `frontend/app/layout.tsx` — title & appleWebApp.title → "HABIT"
- `frontend/public/manifest.json` — name, short_name → "HABIT"

#### CORS — Allow All Origins — 2026-09-01
- `backend/internal/middleware/middleware.go` — ganti logic CORS berbasis allowlist ke `AllowOrigins: "*"` (allow all). Hapus dependency `os` dan `strings`. Set `AllowCredentials: false` (wajib jika AllowOrigins `*`). Hapus header `ngrok-skip-browser-warning`

#### Bug Fixes & Ngrok Dev Setup — 2026-08-31

**CORS & Ngrok:**
- `backend/internal/middleware/middleware.go` — ganti `AllowOrigins` string ke `AllowOriginsFunc` (map lookup) agar multi-origin reliable di Fiber v2.52. Tambah `ngrok-skip-browser-warning` ke `AllowHeaders`
- `frontend/lib/api.ts` — tambah header `ngrok-skip-browser-warning: true` di semua request axios (bypass ngrok interstitial)
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=https://6587-202-165-33-7.ngrok-free.app/api/v1` (BE ngrok URL, update jika ngrok restart)
- `backend/.env` — `ALLOWED_ORIGINS=https://9bf5-202-165-33-7.ngrok-free.app` (FE ngrok URL, update jika ngrok restart)

**Auth — Refresh Token:**
- `backend/internal/services/auth_service.go` — `Refresh()` tidak lagi cek Redis; cukup validasi JWT signature + expiry. Token valid = issue token baru

**Meal Plan — Display Bug:**
- `frontend/app/(dashboard)/meals/page.tsx` — `getMealsForSlot()` ganti `.find()` → `.filter()` agar semua menu per slot tampil. Tambah `AddSlotButton` yang selalu muncul di bawah kartu. Tombol `+` tidak lagi tertutup data
- `frontend/app/(dashboard)/meals/page.tsx` — `date.slice(0,10)` untuk strip timestamp ISO (`"2026-08-31T00:00:00Z"` → `"2026-08-31"`) sebelum compare
- `frontend/app/(dashboard)/meals/page.tsx` — tambah `MealDetailModal` (bottom sheet mobile): klik kartu → lihat detail → Edit/Hapus
- `frontend/app/(dashboard)/meals/page.tsx` — fix `MealFormModal`: state `name/notes/recipeURL` sekarang di-sync via `useEffect` saat `isOpen/editingMeal` berubah (sebelumnya nilai lama tidak ter-reset)
- `frontend/app/(dashboard)/meals/page.tsx` — grid kalender dibungkus `overflow-x-auto` + `min-w-[640px]` untuk horizontal scroll di mobile

**Date Display Bug (semua fitur):**
- `frontend/components/budget/ExpenseModal.tsx` — `expense.date.slice(0,10)` untuk input `type="date"`
- `frontend/app/(dashboard)/budget/page.tsx` — `expense.date.slice(0,10)` untuk display di list
- `frontend/components/memories/MemoryModal.tsx` — `memory.date.slice(0,10)` untuk input date
- `frontend/app/(dashboard)/kids/page.tsx` — `h.date.slice(0,10)` untuk display health date

**Foto Kenangan — Proxy via Backend:**
- `backend/pkg/storage/storage.go` — tambah method `GetObject()` ke interface
- `backend/pkg/storage/minio.go` — implementasi `GetObject()` untuk stream file. `PublicURL()` sekarang return `""` jika tidak ada public URL (bukan path invalid `/keluarga/...`)
- `backend/internal/services/memory_service.go` — `resolvePhotos()` return URL proxy `/api/v1/memories/:memoryId/photos/:photoId/serve`. Tambah `GetPhotoStream()` method
- `backend/internal/handlers/memory_handler.go` — tambah `ServePhoto()` handler: stream foto dari MinIO ke browser via backend
- `backend/cmd/main.go` — daftarkan route `GET /memories/:id/photos/:photo_id/serve`
- `frontend/components/memories/MemoryCard.tsx` — `resolvePhotoUrl()` prefix relative URL dengan BE base URL
- `frontend/components/memories/PhotoLightbox.tsx` — sama

#### Fix Auth Loop Reload — 2026-08-30
**Root cause:**
1. `authStore.ts` — cookie `access_token` hanya `max-age=15 menit`. Saat expired, cookie hilang tapi `isAuthenticated=true` masih di localStorage (Zustand persist). Middleware baca cookie kosong → redirect `/login` → Zustand hydrate → set cookie lagi → redirect `/dashboard` → **loop**.
2. `api.ts` — saat refresh berhasil, token baru hanya disimpan ke `localStorage`, cookie tidak diperbarui → middleware langsung redirect lagi.
3. `providers.tsx` — `AuthSync` hanya melakukan re-set cookie dengan token lama, tidak mencoba refresh.

**Fix yang dilakukan:**
- `frontend/stores/authStore.ts` — tambah method `setAccessToken(token)` yang update localStorage + cookie sekaligus
- `frontend/lib/api.ts` — saat refresh berhasil: set cookie baru + panggil `setAccessToken`; saat refresh gagal: panggil `clearAuth()` + hapus cookie sebelum redirect `/login`
- `frontend/app/providers.tsx` — `AuthSync` sekarang memanggil `/auth/refresh` saat mount; jika berhasil → set token baru; jika gagal → `clearAuth()` + redirect login
- `frontend/middleware.ts` — tambah `/meals` ke `PROTECTED_PREFIXES`


#### Fitur Jadwal Makanan (Meal Plan) — Selesai semua 8 task
File backend baru:
- `backend/internal/models/meal_plan.go` — model + `backend/internal/models/push_subscription.go`
- `backend/internal/repositories/meal_plan_repo.go` + `push_subscription_repo.go`
- `backend/internal/services/meal_plan_service.go`
- `backend/internal/handlers/meal_plan_handler.go` + `push_handler.go`
- `backend/internal/scheduler/meal_notifier.go` — cron `0 4 * * *` (jam 04:00)
- `backend/internal/config/config.go` — tambah `PushConfig` (VAPID keys, NOTIFICATION_TIME)
- `backend/cmd/main.go` — route `/meal-plans` + `/push/subscribe` + scheduler distart sebagai goroutine

File frontend baru:
- `frontend/types/index.ts` — tambah `MealPlan`, `MealType`, `CreateMealPlanPayload`, `UpdateMealPlanPayload`
- `frontend/hooks/useMealPlans.ts` — React Query hooks
- `frontend/app/(dashboard)/meals/page.tsx` — halaman grid 7×3, modal form, push subscribe banner
- `frontend/public/sw-push.js` — service worker push event handler
- `frontend/components/layout/Sidebar.tsx` — tambah "Jadwal Makan" setelah Keuangan
- `frontend/components/layout/BottomNav.tsx` — ganti Kenangan → Menu (UtensilsCrossed)

Library backend ditambahkan:
- `github.com/SherClockHolmes/webpush-go` — Web Push VAPID
- `github.com/robfig/cron/v3` — cron scheduler

Untuk aktifkan notifikasi, tambahkan ke `backend/.env`:
```
VAPID_PUBLIC_KEY=...   # dari: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@keluarga.dev
NOTIFICATION_TIME=0 4 * * *
```

#### Config Loading — Diganti dari Viper ke godotenv
- File: [`backend/internal/config/config.go`](backend/internal/config/config.go)
- **Sebelum:** pakai `github.com/spf13/viper` + `viper.SetConfigFile(".env")` → gagal jika tidak dijalankan dari dalam folder `backend/`
- **Sekarang:** pakai `github.com/joho/godotenv` + `os.Getenv()`, mencari `.env` dari 3 lokasi (cwd, `backend/`, relative dari file source)
- `FRONTEND_BASE_URL` ditambahkan ke `GoogleConfig` → Google OAuth callback tidak lagi hardcoded

#### Google OAuth
- `FRONTEND_BASE_URL` sekarang dibaca dari env (default: `http://localhost:3000`)
- Tambahkan ke `backend/.env`: `FRONTEND_BASE_URL=http://localhost:3000`

#### UI Redesign — Semua halaman sudah disesuaikan dengan mockup `docs/ui-ux/`
| File | Perubahan |
|---|---|
| [`frontend/components/layout/Sidebar.tsx`](frontend/components/layout/Sidebar.tsx) | Logo pin kuning-hijau, nama "Kenangan Keluarga", garis kiri teal aktif |
| [`frontend/components/layout/Topbar.tsx`](frontend/components/layout/Topbar.tsx) | Search bar (prop `searchPlaceholder`), bell dot notifikasi |
| [`frontend/app/globals.css`](frontend/app/globals.css) | Background `#F4F6F8`, helper `.card` |
| [`frontend/app/(dashboard)/layout.tsx`](frontend/app/(dashboard)/layout.tsx) | Background konsisten |
| [`frontend/app/(dashboard)/dashboard/page.tsx`](frontend/app/(dashboard)/dashboard/page.tsx) | 4 stat card, tugas list dengan badge, progress bar pengeluaran, mini kalender SVG, reminder vaksin |
| [`frontend/app/(dashboard)/tasks/page.tsx`](frontend/app/(dashboard)/tasks/page.tsx) | Kanban 3 kolom (Akan Datang/Sedang Berjalan/Selesai), badge kategori |
| [`frontend/components/calendar/CalendarHeader.tsx`](frontend/components/calendar/CalendarHeader.tsx) | `< Hari Ini >` tengah, view toggle Hari/Minggu/Bulan |
| [`frontend/app/(dashboard)/memories/page.tsx`](frontend/app/(dashboard)/memories/page.tsx) | Filter tab pill, empty state ilustrasi SVG pohon |
| [`frontend/app/(dashboard)/kids/page.tsx`](frontend/app/(dashboard)/kids/page.tsx) | Sidebar "DAFTAR ANAK", tabel pertumbuhan 4 kolom, badge pill teal/biru, SVG line chart tren |
| [`frontend/app/(dashboard)/documents/page.tsx`](frontend/app/(dashboard)/documents/page.tsx) | Filter KTP/KK/Akta/Asuransi/BPJS, empty state + info bar enkripsi |

### 🗄️ Database (Belum Disetup di Mesin Lokal)
- PostgreSQL berjalan di host port 5432 (bukan Docker), password: `postgres`
- User `keluarga_user` dan database `keluarga` **belum dibuat** (user menolak saat diminta)
- Untuk setup: jalankan perintah berikut sekali saja:
```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "
  CREATE USER keluarga_user WITH PASSWORD 'keluarga_pass';
  CREATE DATABASE keluarga OWNER keluarga_user;
  GRANT ALL PRIVILEGES ON DATABASE keluarga TO keluarga_user;
"
```
- Seed data dummy: `cd backend && go run cmd/seed/main.go`
- Akun seed: `admin@keluarga.dev` / `password123`

### ⏳ Yang Belum Dikerjakan

| Task | Prioritas |
|---|---|
| Unit test backend (auth service, task service) | Sedang |
| Seed data production DB di VPS | Perlu dikerjakan |
| Edit profil (nama, avatar) dari halaman Settings | Opsional |

### ⚡ Next Steps (langsung dikerjakan saat mulai sesi baru)
1. Setup GitHub repo + tambahkan secrets (lihat `docs/deployment.md` section 2)
2. Push ke `master` → CI/CD akan jalan otomatis
3. Opsional: update halaman Register agar tampilannya seperti halaman Login
4. Opsional: tulis unit test backend (auth service, task service)

> **⚠️ Catatan Dev Environment:**
> - Ngrok URL berubah setiap restart tunnel. Update dua tempat jika URL berubah:
>   1. `backend/.env` → `ALLOWED_ORIGINS=https://<FE-ngrok>.ngrok-free.app`
>   2. `frontend/.env.local` → `NEXT_PUBLIC_API_URL=https://<BE-ngrok>.ngrok-free.app/api/v1`
> - Setelah update `.env`, restart backend. Setelah update `.env.local`, restart Next.js (`npm run dev`)
> - Akun dev: `admin@keluarga.dev` / `password123`

---

## 📌 Referensi Utama

| Dokumen | Deskripsi |
|---|---|
| [`family-hub-plan.md`](family-hub-plan.md) | Plan lengkap: arsitektur, tech stack, database schema, fitur, dan semua task |

Selalu baca `family-hub-plan.md` untuk konteks lengkap sebelum mengerjakan task apapun.

---

## 🗂️ Struktur Project

```
project-root/
├── frontend/        # Next.js 14 App (PWA)
├── backend/         # Golang API Server
├── docs/            # Dokumentasi tambahan (design system, frontend plan, dll)
├── family-hub-plan.md
└── agents.md        # File ini
```

---

## ⚙️ Cara Kerja Agent

### 0. Wajib Dilakukan di Awal Setiap Sesi Baru
**Sebelum melakukan apapun**, baca `agents.md` terlebih dahulu:
1. Baca section **🚦 STATUS TERKINI & NEXT STEPS** — pahami apa yang sudah selesai dan apa yang belum
2. Baca section **🔄 Perubahan Penting yang Sudah Dilakukan** — pahami konteks pekerjaan terakhir
3. Baca section **⚡ Next Steps** — ini titik awal pengerjaan sesi ini
4. Jangan mengerjakan apapun sebelum membaca `agents.md`

### 1. Selalu Baca Plan Sebelum Mulai
Sebelum mengerjakan task apapun, baca section task yang relevan di [`family-hub-plan.md`](family-hub-plan.md). Pahami:
- **Intent** — tujuan task ini
- **Expected Outcomes** — hasil yang harus dicapai
- **Todo List** — langkah-langkah spesifik yang harus dikerjakan

### 2. Kerjakan Satu Task dalam Satu Waktu
- Jangan loncat ke task berikutnya sebelum task saat ini selesai dan divalidasi
- Setiap task backend dan frontend dikerjakan **berpasangan**: selesaikan backend dulu, baru frontend
- Setelah task selesai, update status di `family-hub-plan.md` dari `[ ]` menjadi `[x]`

### 3. Urutan Pengerjaan Wajib Diikuti
```
Fase 0 (UI/UX Design)
    ↓
Fase 1 (Setup Project)
    ↓
Fase 2 (Auth & Family)   ← backend dulu, lalu frontend
    ↓
Fase 3 (Calendar)        ← backend dulu, lalu frontend
    ↓
Fase 4 (Tasks)
    ↓
Fase 5 (Budget)
    ↓
Fase 6 (Memories)
    ↓
Fase 7 (Kids Tracker)
    ↓
Fase 8 (Documents)
    ↓
Fase 9 (Dashboard + PWA + Polish)
    ↓
Fase 10 (Testing + Deploy)
```

### 4. Tunggu Konfirmasi User Sebelum Lanjut
Setelah menyelesaikan setiap task, **selalu minta user untuk mengecek** sebelum melanjutkan ke task berikutnya. Jangan otomatis lanjut tanpa persetujuan.

### 5. Wajib Update `agents.md` Setelah Setiap Pekerjaan
**Setiap kali selesai mengerjakan sesuatu** (fix bug, tambah fitur, refactor, apapun), langsung update `agents.md`:
1. Update **Last updated** di baris pertama section STATUS TERKINI
2. Tambahkan entry baru di **🔄 Perubahan Penting yang Sudah Dilakukan** dengan format:
   ```
   #### [Nama Perubahan] — [tanggal YYYY-MM-DD]
   - file yang diubah dan apa yang diubah
   ```
3. Update tabel **✅ Sudah Selesai** jika ada fase/fitur baru yang selesai
4. Update tabel **⏳ Yang Belum Dikerjakan** — hapus yang sudah dikerjakan, tambah yang baru ditemukan
5. Update **⚡ Next Steps** — sesuaikan dengan kondisi terkini
6. Jangan tunggu sampai akhir sesi — update segera setelah setiap task selesai

---

## 🛠️ Tech Stack Ringkasan

### Frontend
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **State:** Zustand (global) + React Query/TanStack (server state)
- **Form:** React Hook Form + Zod
- **Charts:** Recharts
- **Date:** date-fns
- **HTTP:** Axios (dengan JWT interceptor)
- **PWA:** next-pwa

### Backend
- **Language:** Golang 1.22+
- **Framework:** Fiber v2
- **ORM:** GORM + PostgreSQL driver
- **Auth:** JWT (golang-jwt) + Bcrypt + Google OAuth (golang.org/x/oauth2)
- **Cache:** Redis
- **Realtime:** WebSocket (gorilla/websocket)
- **Config:** godotenv + os.Getenv (diganti dari Viper — lebih simpel, tidak ada masalah path)
- **Docs:** Swagger
- **Storage:** MinIO / Cloudflare R2

### Infrastructure
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Storage:** MinIO (local) / Cloudflare R2 (production)
- **Container:** Docker + Docker Compose
- **Proxy:** Nginx
- **SSL:** Let's Encrypt
- **CI/CD:** GitHub Actions

---

## 📐 Konvensi Koding

### Backend (Golang)

#### Struktur Package
```
internal/
├── config/        # App config via Viper
├── database/      # DB init & migration
├── middleware/    # Auth, CORS, Logger, Recovery
├── models/        # GORM struct models
├── handlers/      # HTTP request handlers (thin layer)
├── services/      # Business logic
├── repositories/  # Database queries
└── websocket/     # WebSocket hub & client
```

#### Konvensi Penamaan
- Package: `lowercase` (contoh: `authservice`, `userrepo`)
- Struct & interface: `PascalCase` (contoh: `FamilyMember`, `AuthService`)
- Fungsi publik: `PascalCase` (contoh: `CreateFamily`, `GetMemberByID`)
- Fungsi privat: `camelCase` (contoh: `hashPassword`, `generateToken`)
- Konstanta: `UPPER_SNAKE_CASE` (contoh: `MAX_TOKEN_EXPIRY`)
- File: `snake_case.go` (contoh: `family_member.go`, `auth_handler.go`)

#### Pola Handler
```go
// Handler hanya tangani request/response, delegasikan logika ke service
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(ErrorResponse{Message: "invalid request"})
    }
    result, err := h.authService.Login(req)
    if err != nil {
        return c.Status(401).JSON(ErrorResponse{Message: err.Error()})
    }
    return c.JSON(result)
}
```

#### Format Response API
```json
// Success
{ "data": { ... }, "message": "success" }

// Error
{ "message": "error description", "code": "ERROR_CODE" }

// List dengan pagination
{ "data": [...], "total": 100, "page": 1, "limit": 20 }
```

#### Environment Variables (Backend)
```env
APP_PORT=8080
APP_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=familyhub
DB_USER=postgres
DB_PASSWORD=secret

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=familyhub
MINIO_USE_SSL=false

VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

---

### Frontend (Next.js)

#### Struktur Folder
```
frontend/
├── app/
│   ├── (auth)/           # Halaman login, register, callback
│   └── (dashboard)/      # Semua halaman setelah login
├── components/
│   ├── ui/               # Shadcn/UI primitives (jangan diubah)
│   ├── layout/           # Sidebar, Topbar, BottomNav
│   └── [module]/         # Komponen per modul (calendar, tasks, dst)
├── hooks/                # Custom React hooks (useAuth, useFamily, dst)
├── lib/
│   ├── api.ts            # Axios instance
│   ├── auth.ts           # Auth helpers
│   └── utils.ts          # cn() dan helpers lainnya
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions
```

#### Konvensi Penamaan
- Komponen: `PascalCase.tsx` (contoh: `TaskCard.tsx`, `CalendarView.tsx`)
- Hook: `camelCase.ts` dengan prefix `use` (contoh: `useAuth.ts`, `useTasks.ts`)
- Store: `camelCase.ts` dengan suffix `Store` (contoh: `authStore.ts`)
- Type/Interface: `PascalCase` (contoh: `FamilyMember`, `EventPayload`)
- Util: `camelCase.ts` (contoh: `formatCurrency.ts`)

#### State Management — Apa yang Masuk Zustand vs React Query
```
Zustand (global client state):
├── Auth state (user, token, isAuthenticated)
├── Active family & members
├── UI state (sidebar open/close, theme)
└── WebSocket connection state

React Query (server state):
├── Semua data dari API (events, tasks, expenses, memories, dll)
├── Mutations (create, update, delete)
└── Cache otomatis & invalidasi
```

#### Axios Instance dengan JWT Auto-Refresh
```typescript
// lib/api.ts
// Interceptor request: tambah Authorization header
// Interceptor response: jika 401 → coba refresh token → retry request
// Jika refresh gagal → logout → redirect ke /login
```

#### Environment Variables (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

---

## 🏠 Multi-Tenancy & Isolasi Data

Family Hub adalah aplikasi **multi-tenant** — banyak keluarga pakai satu sistem, tapi data masing-masing keluarga terisolasi penuh.

### Pemisah Utama: `family_id`

`family_id` adalah kolom yang wajib ada di semua tabel data dan menjadi satu-satunya pemisah antar keluarga di database.

### Tabel yang Wajib Punya `family_id`
```
events, tasks, expenses, budgets, shopping_items,
memories, documents, kids_profiles, family_members
```

### Aturan Wajib — `family_id` HARUS dari JWT, BUKAN dari Input User

```go
// ✅ BENAR — selalu ambil dari JWT context
familyID := c.Locals("family_id").(string)
db.Where("family_id = ?", familyID).Find(&events)

// ❌ SALAH — jangan pernah dari query/body/params
familyID := c.Query("family_id")   // celah keamanan!
familyID := c.Params("family_id")  // celah keamanan!
```

### 3 Lapis Isolasi

```
Lapis 1 — JWT menyimpan user_id + family_id + role
Lapis 2 — Middleware ekstrak family_id → inject ke c.Locals("family_id")
Lapis 3 — Semua query filter WHERE family_id = c.Locals("family_id")
```

### Middleware Auth (wajib inject family_id)

```go
func AuthMiddleware(c *fiber.Ctx) error {
    token := extractToken(c)
    claims := validateJWT(token)
    c.Locals("user_id", claims.UserID)
    c.Locals("family_id", claims.FamilyID)  // ← wajib selalu di-inject
    c.Locals("role", claims.Role)
    return c.Next()
}
```

---

## 🗄️ Database — Aturan Penting

- Semua tabel wajib punya kolom: `id` (UUID), `created_at`, `updated_at`
- Gunakan UUID untuk semua primary key (bukan auto-increment integer)
- Semua tabel data keluarga **wajib** punya kolom `family_id` (UUID, indexed)
- Semua migrasi disimpan di `backend/migrations/` dengan format: `001_init.sql`, `002_add_google_oauth.sql`, dst
- Jangan pernah drop kolom di migrasi — gunakan rename atau soft delete
- Soft delete menggunakan kolom `deleted_at` (GORM soft delete)
- Selalu buat index pada kolom `family_id` di setiap tabel untuk performa query

---

## 🔐 Auth Flow

### Email/Password
```
Register → hash password → simpan ke DB → return JWT
Login → cek email → verify password → return access token + refresh token
Refresh → validasi refresh token → return access token baru
Logout → invalidasi refresh token di Redis
```

### Google OAuth
```
/api/auth/google → redirect ke Google consent screen
/api/auth/google/callback → tukar code → ambil Google profile
  ├── Email baru → auto register → return JWT
  ├── Email ada (email/pass) → link google_id → return JWT
  └── Email ada (Google) → login → return JWT
Frontend /auth/callback → tangkap JWT dari query params → simpan → redirect dashboard
```

### JWT Strategy
- **Access Token:** expire 15 menit, dikirim via Authorization header
- **Refresh Token:** expire 7 hari, disimpan di Redis, dikirim via httpOnly cookie
- Semua endpoint privat wajib lewat middleware auth

---

## 🔄 WebSocket

- WebSocket hub berjalan di Golang, satu koneksi per user
- Setiap pesan punya format:
```json
{
  "type": "event_created | event_updated | task_completed | shopping_checked | ...",
  "family_id": "uuid",
  "payload": { ... }
}
```
- Frontend subscribe ke WebSocket saat masuk dashboard
- React Query di-invalidate saat menerima pesan WebSocket yang relevan

---

## 📁 File Storage (MinIO/R2)

- Bucket: `familyhub`
- Struktur path:
```
avatars/{family_id}/{member_id}.jpg
memories/{family_id}/{memory_id}/{filename}
documents/{family_id}/{document_id}/{filename}
receipts/{family_id}/{expense_id}/{filename}
```
- Akses file selalu via presigned URL (expired 1 jam untuk dokumen sensitif, 24 jam untuk foto)
- Dokumen yang ditandai sensitif dienkripsi dengan AES-256 sebelum upload

---

## ✅ Checklist Sebelum Selesai Setiap Task

Sebelum melaporkan task selesai, pastikan:

### Backend Task
- [ ] Semua endpoint di todo list sudah diimplementasi
- [ ] Validasi input sudah ada di setiap endpoint
- [ ] Middleware auth terpasang di semua endpoint privat
- [ ] Response format konsisten (data/message/code)
- [ ] Swagger annotation sudah ditambahkan
- [ ] Tidak ada `fmt.Println` debug yang tertinggal
- [ ] Unit test untuk business logic kritis sudah ditulis

### Frontend Task
- [ ] Semua halaman/komponen di todo list sudah diimplementasi
- [ ] Form sudah ada validasi Zod
- [ ] Loading state (skeleton) sudah ada
- [ ] Empty state sudah ada
- [ ] Error state sudah ada
- [ ] Tampilan responsif di mobile (min. 375px) dan desktop
- [ ] Tidak ada `console.log` debug yang tertinggal
- [ ] TypeScript tidak ada error (`any` hanya jika benar-benar terpaksa)

---

## 🚨 Hal yang Dilarang

- ❌ Jangan skip task atau loncat fase tanpa alasan jelas
- ❌ Jangan tambah library baru tanpa konfirmasi user
- ❌ Jangan ubah database schema yang sudah di-migrate tanpa migrasi baru
- ❌ Jangan hardcode credentials, API key, atau secret apapun di kode
- ❌ Jangan gunakan `any` di TypeScript kecuali benar-benar tidak ada alternatif
- ❌ Jangan implementasi fitur di luar scope task yang sedang dikerjakan
- ❌ Jangan lanjut ke task berikutnya sebelum mendapat konfirmasi user
- ❌ **Jangan pernah ambil `family_id` dari input user** (body/params/query) — selalu dari JWT context
- ❌ Jangan buat query database tanpa filter `family_id` pada tabel yang memilikinya

---

## 📝 Update Plan Setelah Task Selesai

Setiap kali task selesai, update status di [`family-hub-plan.md`](family-hub-plan.md):

```markdown
// Sebelum
#### [ ] Task 2.1 — Backend: Auth & Family API

// Sesudah
#### [x] Task 2.1 — Backend: Auth & Family API
```

Jika ada temuan penting saat implementasi (perubahan schema, keputusan teknis, dsb), tambahkan catatan di bagian bawah task yang relevan di plan file.

---

## 💬 Cara Komunikasi dengan User

- Laporkan progress setelah setiap task selesai dengan ringkasan singkat apa yang sudah dibuat
- Jika menemukan ambiguitas atau keputusan teknis yang perlu dipilih, tanyakan ke user sebelum lanjut
- Jika ada blocker (misal: credential belum ada, dependensi belum terinstall), laporkan segera
- Gunakan format checklist saat melaporkan progres task
