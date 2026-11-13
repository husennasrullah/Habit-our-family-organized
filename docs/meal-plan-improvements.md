# Jadwal Makan — pembenahan 2026-11-13

Menu mendukung beberapa masakan per waktu makan. Sebelumnya notifikasi hanya mengambil satu masakan, status aktivasi bisa sukses walau server gagal, dan unsubscribe belum membatasi pemilik. Perbaikan menyamakan alur jadwal dan notifikasi, memperketat validasi, serta merapikan form.

## Perilaku akhir

- Tambah/edit memakai form native dan Zod: nama trim maksimal 150 karakter, catatan maksimal 2000, URL HTTP(S) maksimal 2048 tanpa kredensial, tanggal kalender valid dan tiga waktu makan yang sah. Backend memvalidasi ulang semuanya serta rentang tanggal query.
- Tanggal/waktu makan dapat dipindahkan saat edit. Catatan dan resep dapat dikosongkan. URL lama yang tidak aman tidak dirender sebagai tautan. Kartu dan dialog memiliki nama akses yang spesifik.
- Modal maksimal 360 px, input desktop 13 px dan sentuh 16 px. Tombol Hari Ini mengembalikan minggu dan hari terpilih di HP. Gagal simpan mempertahankan form serta menampilkan pesan server.
- Query/write meal tetap dibatasi keluarga JWT. Update memakai UPDATE terfilter keluarga dan soft-delete; record yang sudah dihapus tidak dibuat ulang dan update stale mengembalikan error.
- Aktivasi push memakai client API bersama, termasuk refresh token dan penanganan HTTP gagal. Kedua kunci VAPID wajib tersedia. Langganan browser baru dibatalkan bila penyimpanan server gagal. Langganan yang sudah ada dipakai ulang.
- Saat halaman dibuka, status langganan diperiksa di browser dan server untuk anggota JWT saat ini. Tersedia tombol nonaktifkan dan penjelasan izin ditolak. Gagal menghapus server tidak membatalkan subscription browser terlebih dahulu.
- Status, unsubscribe, dan upsert dibatasi keluarga/anggota. Upsert atomik menolak pemindahan endpoint milik akun lain (HTTP 409), mencegah duplikasi pada request bersamaan, dan dapat mengaktifkan kembali record soft-deleted milik anggota yang sama.
- Provider push yang diterima: Google FCM/Android, Mozilla, Apple, dan Windows; HTTPS, tanpa userinfo/fragment/port khusus. Kunci harus berupa titik P-256 dan secret auth 16 byte. Endpoint/kunci legacy diperiksa lagi sebelum pengiriman. Pengiriman tidak mengikuti redirect dan timeout 15 detik. Endpoint/token tidak dicetak ke log.
- Scheduler dan penentuan hari memakai WIB eksplisit. Semua masakan per slot digabung; payload memakai encoding/json. Respons 404/410 membersihkan subscription, status gagal tidak dicatat sebagai terkirim. Endpoint pendek tidak menyebabkan panic.

## Wordmark Habit

`HabitWordmark.tsx` menggambar lettering vektor mengikuti referensi pengguna: bentuk tebal membulat, hijau gelap, titik kuning. Digunakan pada sidebar dan branding auth desktop/mobile. Tema gelap memakai huruf terang. Ikon rumah dan aset launcher PWA tetap sama; tidak menambah font atau dependency.

## Validasi

- `go test ./...` dan `go vet ./...` lulus, termasuk tes validasi tanggal/URL, provider dan kunci push, konfigurasi VAPID HTTP, payload multi-masakan/JSON dan legacy endpoint pendek.
- Integrasi PostgreSQL `TestMealCRUDAndPushOwnership` lulus pada schema temporer: CRUD, perpindahan tanggal/waktu, clear field, isolasi keluarga/anggota, stale update setelah hapus, 10 upsert bersamaan, penolakan transfer pemilik, unsubscribe/resubscribe. Schema dibersihkan otomatis; tidak mengubah data keluarga asli.
- `npm run test` lulus pada enam file tes frontend, termasuk schema meal dan lifecycle push (config kosong, rollback saat POST gagal, reuse, status, unsubscribe gagal/berhasil dan service worker belum siap).
- Build produksi `.next-qa`, lint dan typecheck lulus untuk 19 halaman.
- QA browser: `frontend/scripts/meals-qa.cjs`, API fixture di memori dan subscription browser simulasi. Hasil/screenshot: `docs/qa/meals-modern-*`, `meals-modal-mobile.png`, `habit-wordmark-login.png`. 23 pemeriksaan dan sembilan audit axe terarah lulus tanpa error runtime, overflow, atau pelanggaran; mencakup halaman serta dialog terang/gelap. Detail pada `meals-modern-results.json`.

Push ke provider/perangkat nyata belum dikirim. Tidak menambah dependency runtime atau migrasi schema. Pengguna meminta pengiriman melalui commit dan push biasa ke origin/main; verifikasi deployment dan push perangkat nyata tetap menjadi tindak lanjut. Penggantian akun yang menemui endpoint milik akun lain memerlukan reset subscription browser; kepemilikan tidak dipindahkan otomatis.
