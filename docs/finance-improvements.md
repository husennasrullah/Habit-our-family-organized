# Pembenahan Keuangan — 2026-11-13

Status: implementasi dan verifikasi selesai. Belum commit/push.

## Perilaku baru

- Satu tingkat navigasi: **Pengeluaran · Anggaran · Tabungan · Belanja**. Tab mendukung tombol panah/Home/End dan satu panel aktif.
- Anggaran dapat dibuat sebelum transaksi pertama, dengan kategori dan periode bulanan; edit/hapus tersedia. Ringkasan menampilkan total anggaran, total pengeluaran, serta sisa/kelebihan. Pengeluaran kategori yang belum diberi anggaran tetap dihitung dan ditandai. “Sisa anggaran” bukan saldo rekening; fitur pemasukan/rekening belum ditambahkan.
- Pengeluaran memakai tanggal lokal. Filter bulan/kategori, tanggal pada setiap transaksi, validasi nominal positif, maksimal dua desimal, dan pesan gagal dipertahankan/diperjelas. Alur ini memakai IDR; request nominal baru non-IDR ditolak dan ringkasan/daftar IDR tidak menjumlahkan mata uang berbeda.
- **Selesaikan belanja** mengambil snapshot ID item tercentang, meminta nominal total/kategori/tanggal, dan membuat satu pengeluaran. Semua item terpilih dikunci dalam urutan tetap dan ditautkan ke expense dalam transaksi yang sama; item yang telah dicatat keluar dari daftar aktif. Kegagalan salah satu item membatalkan seluruh checkout. Pengiriman ulang item yang sama ditolak. Nama barang disimpan pada keterangan pengeluaran. Menghapus pengeluaran tidak otomatis mengembalikan daftar belanja.
- Tabungan memiliki riwayat saldo awal, setoran, dan koreksi: nominal, saldo setelahnya, waktu, anggota pencatat, serta catatan. Saldo lama tetap dipertahankan; ketika pertama kali berubah, saldo sebelum perubahan dicatat sebagai pembukaan riwayat tanpa mengarang tanggal/anggota setoran lama.
- Setoran dan edit tabungan memakai row lock dalam transaksi; perubahan saldo dan riwayat tersimpan bersama. Status tercapai dihitung ulang dari saldo dan target. Edit judul/target tidak mengirim ulang saldo lama. Koreksi saldo manual harus dipilih secara eksplisit dan dicatat dalam riwayat.

## Modal dan ceklis

Permintaan lanjutan pengguna: modal dan ceklis terlalu besar. Semua dialog Keuangan memakai lebar maksimum 360 px (riwayat 440 px), jarak form lebih rapat, input desktop 13 px/tinggi 36 px. Target/saldo tabungan berdampingan. Pada layar pendek, isi dialog bisa digulir. Input perangkat sentuh tetap 16 px/44 px untuk menghindari zoom otomatis dan menjaga kemudahan tekan. Lingkaran ceklis berukuran **20 px**, terpisah dari area klik 36/44 px.

## Database dan API

Migrasi tambahan: `backend/migrations/011_finance_history_checkout.sql`. Menambah `financial_goal_entries` dan `shopping_items.expense_id`; tidak menghapus data lama. Model baru juga didaftarkan dalam AutoMigrate yang dipakai aplikasi. SQL 011 sudah diterapkan di database pengembangan lokal, backend baru dijalankan dan health endpoint lulus.

- `GET /api/v1/financial-goals/:id/entries` — hanya riwayat goal milik keluarga pada JWT.
- `PATCH /api/v1/financial-goals/:id/progress` — `amount`, `note` opsional; anggota diambil dari JWT.
- `POST /api/v1/shopping-items/checkout` — `item_ids`, `amount`, `category`, `date`, `description` opsional; keluarga/anggota diambil dari JWT.
- `PUT /api/v1/financial-goals/:id` — saldo hanya diubah jika `current_amount` dikirim; deadline dapat dihapus dengan string kosong; status tercapai selalu diturunkan dari saldo/target.

## Verifikasi

- Build produksi frontend (19 halaman), lint/TypeScript lulus.
- Backend build, go vet, go test ./... lulus. Integrasi PostgreSQL menggunakan schema temporer yang dibersihkan: 20 setoran bersamaan, riwayat, koreksi/status target, akses antar keluarga, checkout parsial yang rollback, checkout bersamaan yang hanya menghasilkan satu expense, dan item terarsip tidak dapat dibuka kembali. CI menyediakan HABIT_TEST_DATABASE_URL untuk menjalankan tes ini.
- Sembilan tes logika frontend lulus: termasuk sisa anggaran/kategori tanpa alokasi dan tanggal lokal di sekitar pergantian hari UTC/Jakarta.
- Browser fixture: 28 pemeriksaan alur/responsif tanpa error pada 375/390/768/1366 px; 15 audit axe terpilih (nama tombol, label, kontras, nested-interactive) bersih. Bukti: `qa/finance-results.json`, `qa/finance-*.png`.
- API lokal melalui curl: 16 pemeriksaan memakai keluarga sementara, termasuk checkout ulang, validasi negatif, ledger/setoran, dan penolakan akses antar keluarga. Keluarga/data QA dibersihkan. Bukti: `qa/finance-api-results.json`.

Reproduksi browser: `HABIT_QA_MODULES=/tmp/habit-qa/node_modules node frontend/scripts/finance-qa.cjs`. Tes integrasi backend memakai variabel `HABIT_TEST_DATABASE_URL` menuju PostgreSQL yang mengizinkan pembuatan schema temporer; tidak memakai data keluarga asli untuk pengujian.
