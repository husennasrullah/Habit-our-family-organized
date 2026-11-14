# Object storage dan dokumen privat

Semua modul memakai `storage.NewClient`: foto kenangan, dokumen keluarga dan lampiran liburan. Ubah env backend lalu restart/recreate backend. Tidak ada dependency baru.

| Env | Fungsi |
| --- | --- |
| `STORAGE_PROVIDER` | `minio` (default), `s3`, `r2`, atau `disabled` |
| `STORAGE_ENDPOINT` | Host:port atau URL HTTP(S) tanpa path; URL menentukan TLS |
| `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` | Credentials provider |
| `STORAGE_SESSION_TOKEN` | Opsional untuk credentials sementara; harus diperbarui sebelum kedaluwarsa |
| `STORAGE_BUCKET` | Nama bucket, default `keluarga` |
| `STORAGE_REGION` | Region bucket; R2 default `auto` |
| `STORAGE_USE_SSL` | Dipakai jika endpoint tidak berisi scheme; default false MinIO, true cloud |
| `STORAGE_ADDRESSING_STYLE` | `auto`, `path`, `virtual` |
| `STORAGE_AUTO_CREATE_BUCKET` | Default true MinIO / false cloud; cloud tidak memerlukan izin membuat/memeriksa bucket pada startup |
| `STORAGE_PUBLIC_URL` | Opsional untuk fitur media existing. Dokumen keluarga selalu melewati API privat, mengabaikan nilai ini |
| `DOCUMENT_ENCRYPTION_KEY` | Opsional, 32 byte dalam 64 karakter hex; AES-256-GCM dokumen sensitif |

Konfigurasi cloud yang tidak lengkap ditolak; credentials dev MinIO tidak otomatis dipakai untuk cloud. Startup gagal dengan pesan aman jika konfigurasi tidak valid atau provisioning bucket gagal. `disabled` menonaktifkan operasi storage sambil membiarkan aplikasi berjalan. Tanpa auto-create, akses provider baru diperiksa saat operasi file.

## Contoh MinIO lokal

```dotenv
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=replace-with-your-password
STORAGE_BUCKET=keluarga
STORAGE_REGION=us-east-1
STORAGE_USE_SSL=false
STORAGE_ADDRESSING_STYLE=path
STORAGE_AUTO_CREATE_BUCKET=true
```

Di Docker production, endpoint bawaan `minio:9000` dan credentials fallback `MINIO_ROOT_USER/PASSWORD` tetap kompatibel. `docker-compose.prod.yml` kini meneruskan seluruh env cloud. Service MinIO boleh tetap berjalan saat memakai cloud; untuk menjalankan tanpa container MinIO:

```bash
docker-compose -f docker-compose.prod.yml up -d postgres redis backend frontend
```

Jangan menghapus volume MinIO lama sebelum file selesai dipindahkan.

## Cloudflare R2

```dotenv
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-r2-access-key
STORAGE_SECRET_KEY=your-r2-secret-key
STORAGE_BUCKET=your-existing-bucket
STORAGE_REGION=auto
STORAGE_ADDRESSING_STYLE=path
STORAGE_AUTO_CREATE_BUCKET=false
```

Gunakan endpoint S3 API, bukan domain public bucket. Referensi: [R2 S3](https://developers.cloudflare.com/r2/get-started/s3/), [API compatibility](https://developers.cloudflare.com/r2/api/s3/api/).

## AWS S3

```dotenv
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=your-existing-bucket
STORAGE_REGION=ap-southeast-1
STORAGE_ADDRESSING_STYLE=auto
STORAGE_AUTO_CREATE_BUCKET=false
```

Sesuaikan region dan endpoint bucket. Referensi: [AWS endpoints](https://docs.aws.amazon.com/general/latest/gr/s3.html). Layanan lain yang menyediakan S3 API memakai `s3` dengan endpoint/region/credentials layanan tersebut. Azure Blob, Google Drive, atau API cloud native lain memerlukan adapter tersendiri; label cloud saja tidak menjamin kompatibilitas S3.

## Dokumen keluarga

Admin/member dapat upload, edit metadata, cari nama/tag, filter kategori, preview, unduh dan hapus. Child/view_only ditolak oleh API dan tidak mendapat menu sidebar. File hanya PDF/JPEG/PNG/WebP, 1 byte–10 MB, diperiksa ekstensi dan signature/MIME server. HTML/SVG/format aktif ditolak. File lama yang tidak memenuhi kebijakan format/ukuran tidak bisa dibuka melalui endpoint baru; simpan backup dan konversikan ke format didukung sebelum upload ulang.

Unduh melalui bearer JWT `/api/v1/documents/:id/download`; opsi `preview=true` mengembalikan inline. Response `private, no-store`, `nosniff`, dan nama file aman. Daftar tidak mengirim public URL/object key. Bucket/prefix dokumen harus private pada provider. Proxy API tidak mencabut izin bucket publik atau URL lama yang sudah beredar; ubah policy/ACL prefix documents di provider saat deployment. Jangan gunakan public bucket policy untuk dokumen tanpa enkripsi. UI mengambil blob dengan API client yang mendukung refresh token; preview PDF bergantung pada browser, tombol unduh tetap tersedia.

Enkripsi tambahan tersedia jika `DOCUMENT_ENCRYPTION_KEY` valid. Buat kunci dengan `openssl rand -hex 32`, simpan hanya di env backend/secrets dan backup aman. Kunci tidak dibuat otomatis atau dicetak aplikasi. Jangan mengganti/menghapus kunci selama dokumen terenkripsi masih disimpan. Enkripsi memakai nonce acak dan mengikat ciphertext ke object key; perubahan ciphertext/kunci salah ditolak. File lama tidak dienkripsi otomatis, checkbox hanya berlaku upload baru. Edit metadata tidak mengubah enkripsi. Rotasi kunci multi-versi belum tersedia.

Migrasi tambahan `013_document_metadata.sql` menambah metadata nama/MIME dan status cleanup; AutoMigrate startup menyelaraskan kolom. Penghapusan menyimpan tombstone sebelum menghapus object. Jika storage gagal, dokumen tidak bisa dibuka dan tetap muncul dengan tombol coba hapus lagi. Setelah object terhapus, status diselesaikan; kegagalan commit akhir dapat dicoba ulang. Tidak ada transaksi atomik lintas PostgreSQL/object storage. Upload yang gagal menyimpan metadata mencoba membersihkan object; bila DB dan storage sekaligus gagal, operator perlu membersihkan orphan dari log/backup.

## Pindah provider

Mengganti env tidak memindahkan file. Metadata hanya menyimpan object key, sehingga seluruh objek lama harus disalin ke bucket baru dengan key yang sama sebelum switch. Pertahankan `DOCUMENT_ENCRYPTION_KEY`, hentikan write sementara selama copy/cutover, verifikasi checksum dan baca file (termasuk terenkripsi), lalu restart backend. Simpan bucket lama sebagai backup sampai verifikasi selesai. Tidak ada fallback lintas provider per file.

Untuk media selain Dokumen, alur URL existing tetap berlaku; endpoint presigned yang diberikan ke browser harus bisa dijangkau perangkat, bukan hostname internal `minio`. Dokumen baru menggunakan proxy API sehingga tidak terkena masalah hostname tersebut.

## Verifikasi lokal

`cd backend && go test ./... && go vet ./...` menjalankan tes config/provider/validasi/role. Isi `HABIT_TEST_DATABASE_URL` ke PostgreSQL khusus pengujian untuk mengaktifkan lifecycle Dokumen; tes membuat dan menghapus schema sementara. Tidak memakai keluarga nyata.

Build frontend dengan `NEXT_BUILD_DIR=.next-qa npm run build`, jalankan pada port 3100, lalu jalankan `node frontend/scripts/documents-qa.cjs` dari root. Script memakai Chrome headless dan API fixture, melewati service worker khusus fixture agar request tidak keluar ke API asli. Audit membutuhkan axe-core lokal: simpan `https://cdn.jsdelivr.net/npm/axe-core@4.10.3/axe.min.js` di `/tmp/habit-documents-axe.min.js` atau set `HABIT_AXE_PATH`. Hasil dan screenshot berada di `docs/qa/documents-modern-*`. Tes SDK memakai endpoint HTTP mock; hasil bukan verifikasi credentials/provider cloud nyata.
