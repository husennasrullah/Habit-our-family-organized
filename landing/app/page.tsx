import Image from "next/image";
import { Header } from "@/components/Header";
import { ProductPreview } from "@/components/ProductPreview";
import { FeatureExplorer } from "@/components/FeatureExplorer";
import { Icon, type IconName } from "@/components/Icon";
import { APP_URL } from "@/lib/site";
const routines: {
  icon: IconName;
  time: string;
  title: string;
  body: string;
}[] = [
  {
    icon: "sun",
    time: "SEBELUM MULAI AKTIVITAS",
    title: "Cek jadwal hari ini.",
    body: "Buka Beranda untuk melihat agenda dan tugas yang perlu dikerjakan. Jadwal vaksin anak juga bisa dilihat lewat kalender.",
  },
  {
    icon: "users",
    time: "SAAT BERBAGI TUGAS RUMAH",
    title: "Tentukan siapa yang mengerjakan.",
    body: "Orang tua menyiapkan bekal, anak merapikan mainan. Bagikan tugas ke anggota keluarga, beri tenggat, lalu lihat mana yang sudah selesai.",
  },
  {
    icon: "moon",
    time: "SETELAH SEHARIAN BERSAMA",
    title: "Simpan cerita di balik fotonya.",
    body: "Tambahkan foto, tanggal, dan cerita ke Kenangan. Momen bermain di rumah pun punya catatan yang bisa dibuka lagi.",
  },
];
const faqs = [
  [
    "Siapa yang cocok memakai Habit?",
    "Habit bisa dipakai orang tua dan anak dalam satu keluarga. Anak bisa melihat tugasnya dan menandainya selesai. Orang tua dapat mengelola pengeluaran serta catatan tumbuh kembang anak sesuai peran akunnya.",
  ],
  [
    "Bagaimana mengajak anggota keluarga, termasuk anak?",
    "Buat keluarga di Habit, lalu bagikan kode undangannya. Setiap anggota bergabung dengan akun masing-masing. Setelah anak bergabung, admin mengatur perannya menjadi Anak melalui Pengaturan.",
  ],
  [
    "Bisa dibuka di HP dan laptop?",
    "Bisa. Buka Habit melalui browser di HP atau laptop dengan akun yang sama. Pada perangkat dan browser yang mendukung, kamu bisa menambahkannya ke layar utama.",
  ],
  [
    "Apakah Habit bisa dipakai tanpa internet?",
    "Koneksi internet diperlukan untuk memuat dan menyimpan data keluarga. Habit menyediakan halaman offline saat halaman aplikasi tidak dapat dimuat; pencatatan data tetap membutuhkan koneksi.",
  ],
  [
    "Apakah semua anggota bisa melihat catatan anak?",
    "Akses mengikuti peran anggota dalam keluarga. Catatan anak dan keuangan tersedia untuk admin dan anggota dewasa. Akun anak serta akun hanya-lihat memiliki akses terbatas sesuai menu.",
  ],
  [
    "Apakah jadwal vaksin dibuat otomatis?",
    "Jadwal vaksin diisi sendiri berdasarkan catatan keluarga atau arahan tenaga kesehatan. Habit memisahkan tanggal rencana dari tanggal vaksin benar-benar diberikan, lalu menampilkannya di kalender.",
  ],
];
function AppLink({
  children = "Buka Habit",
  className = "button button-primary",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={APP_URL} className={className} data-app-link>
      {children}
      <Icon name="arrow-up" size={18} />
    </a>
  );
}
export default function Home() {
  return (
    <>
      <Header />
      <main id="konten">
        <section className="hero" id="beranda">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <span className="pill">
                <span className="live-dot" />
                Untuk orang tua dan anak
              </span>
              <h1>
                Hal kecil teratur.
                <br />
                <span>
                  Keluarga
                  <br />
                  lebih dekat.
                </span>
              </h1>
              <p>
                Orang tua dan anak bisa berbagi tugas rumah dan melihat jadwal
                keluarga di Habit. Orang tua juga bisa mencatat pengeluaran
                serta tumbuh kembang anak, termasuk berat badan dan tanggal
                vaksin.
              </p>
              <div className="hero-actions">
                <AppLink />
                <a className="text-link" href="#fitur">
                  Lihat fitur Habit
                  <Icon name="arrow" size={17} />
                </a>
              </div>
              <div className="hero-footnote">
                <Icon name="heart" size={15} />
                <span>
                  Buka di browser HP atau laptop. Masuk atau buat akun.
                </span>
              </div>
            </div>
            <ProductPreview />
          </div>
          <div className="shell hero-bottom">
            <span>
              Rencana vaksin, menu makan, dan tenggat tugas.
              <br />
              <strong>Bisa dilihat lewat kalender keluarga.</strong>
            </span>
            <div>
              <span>
                <Icon name="calendar" size={17} />
                Jadwal keluarga
              </span>
              <span>
                <Icon name="users" size={17} />
                Pembagian tugas
              </span>
              <span>
                <Icon name="photo" size={17} />
                Catatan anak
              </span>
            </div>
          </div>
        </section>
        <section className="section routine-section">
          <div className="shell">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">HABIT DALAM KESEHARIANMU</span>
                <h2>
                  Ada jadwal anak.
                  <br />
                  Ada tugas rumah yang perlu dibagi.
                </h2>
              </div>
              <p>
                Jadwal vaksin perlu dicatat, bekal perlu disiapkan. Gunakan
                Habit untuk melihat rencana dan membagi tugas dengan anggota
                keluarga.
              </p>
            </div>
            <div className="routine-grid">
              {routines.map((r, i) => (
                <article className="routine" key={r.time}>
                  <span className={`routine-icon routine-${i}`}>
                    <Icon name={r.icon} size={25} />
                  </span>
                  <span className="eyebrow">{r.time}</span>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section features-section" id="fitur">
          <div className="shell">
            <div className="section-heading centered">
              <span className="eyebrow">
                DARI URUSAN RUMAH SAMPAI CATATAN ANAK
              </span>
              <h2>
                Pilih yang ingin
                <br />
                kamu rapikan dulu.
              </h2>
              <p>
                Cek bagaimana Habit menghubungkan jadwal keluarga dengan tugas
                dan catatan anak. Kamu juga bisa menyiapkan anggaran serta
                menyimpan foto keluarga.
              </p>
            </div>
            <FeatureExplorer />
            <div className="more-features">
              <span>
                Untuk menu besok, rencana liburan, dan berkas keluarga.
              </span>
              <div>
                {(
                  [
                    {
                      icon: "meal",
                      title: "Rencana makan",
                      body: "Susun sarapan sampai makan malam.",
                    },
                    {
                      icon: "plane",
                      title: "Perjalanan",
                      body: "Atur kegiatan dan biaya liburan.",
                    },
                    {
                      icon: "folder",
                      title: "Dokumen",
                      body: "Cari berkas berdasarkan kategori.",
                    },
                  ] as { icon: IconName; title: string; body: string }[]
                ).map((f) => (
                  <div key={f.title}>
                    <Icon name={f.icon} size={21} />
                    <span>
                      <strong>{f.title}</strong>
                      <small>{f.body}</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="section steps-section" id="cara-kerja">
          <div className="shell steps-layout">
            <div>
              <span className="eyebrow">BUAT RUANG KELUARGAMU</span>
              <h2>
                Ajak anggota keluarga.
                <br />
                Tambahkan rencana pertama.
              </h2>
              <p>
                Bagikan kode undangan agar anggota keluarga bergabung dengan
                akun masing-masing. Setelah anak bergabung, admin dapat mengatur
                peran Anak melalui Pengaturan.
              </p>
              <AppLink />
            </div>
            <ol className="steps">
              {[
                {
                  title: "Buat akun Habit.",
                  body: "Daftar dengan email atau akun Google. Jika sudah punya akun, langsung masuk.",
                },
                {
                  title: "Buat atau gabung keluarga.",
                  body: "Buat keluarga baru, lalu bagikan kode undangannya. Gunakan kode yang kamu terima untuk bergabung.",
                },
                {
                  title: "Tambahkan tugas atau jadwal.",
                  body: "Pilih siapa yang mengerjakan tugas dan kapan tenggatnya, atau catat agenda pertama di kalender.",
                },
              ].map((s, i) => (
                <li key={s.title}>
                  <span className="step-number">0{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="section together-section">
          <div className="shell together-grid">
            <div className="family-art">
              <span className="art-circle" />
              <Image
                src="/illustrations/family-planning.webp"
                alt="Ilustrasi keluarga merencanakan kegiatan bersama di rumah"
                width={840}
                height={560}
                sizes="(max-width: 900px) 90vw, 45vw"
              />
              <span className="art-note">
                <Icon name="heart" size={16} />
                Jadwal dan tugas dibagi bersama.
              </span>
            </div>
            <div className="together-copy">
              <span className="eyebrow">
                AKUN MASING-MASING, KELUARGA YANG SAMA
              </span>
              <h2>
                Orang tua dan anak
                <br />
                ikut berbagi tugas.
              </h2>
              <p>
                Orang tua mencatat belanja, anak mengecek tugas merapikan
                mainan, lalu menandainya selesai. Setiap anggota memakai akun
                sendiri dengan akses sesuai perannya.
              </p>
              <div className="value-line">
                <Icon name="phone" size={21} />
                <div>
                  <h3>Buka di HP atau laptop.</h3>
                  <p>
                    Gunakan browser untuk mengakses Habit. Pada perangkat yang
                    mendukung, tambahkan ke layar utama agar mudah dibuka lagi.
                  </p>
                </div>
              </div>
              <div className="value-line">
                <Icon name="users" size={21} />
                <div>
                  <h3>Atur peran anggota keluarga.</h3>
                  <p>
                    Admin dapat mengatur peran Anak melalui Pengaturan. Catatan
                    tumbuh kembang dan keuangan tersedia untuk admin serta
                    anggota dewasa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="section faq-section" id="faq">
          <div className="shell faq-grid">
            <div>
              <span className="eyebrow">SEBELUM MULAI</span>
              <h2>
                Sebelum mengajak
                <br />
                keluargamu bergabung.
              </h2>
              <p>Tentang akun keluarga, akses, dan cara memakai Habit.</p>
              <span className="faq-flower">
                <Icon name="leaf" size={66} />
              </span>
            </div>
            <div className="faq-list">
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span className="faq-plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="final-section">
          <div className="shell">
            <div className="final-cta">
              <span className="final-decoration decoration-one" />
              <span className="final-decoration decoration-two" />
              <span className="eyebrow">HADIR BERSAMA, SETIAP HARI</span>
              <h2>
                Kebiasaan kecil.
                <br />
                Keluarga lebih dekat.
              </h2>
              <p>
                Buka Habit, ajak anggota keluarga, lalu bagikan tugas rumah
                pertama untuk dikerjakan bersama.
              </p>
              <AppLink className="button button-light">Buka Habit</AppLink>
              <span className="final-note">
                Masuk atau buat akun di habit.senlabs.web.id
              </span>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="shell footer-top">
          <a href="#beranda" aria-label="Habit — kembali ke beranda">
            <Image
              src="/brand/habit-logo.svg"
              alt="Habit"
              width={150}
              height={50}
            />
          </a>
          <p>
            Atur tugas rumah dan jadwal keluarga.
            <br />
            Simpan catatan tumbuh kembang anak.
          </p>
          <nav aria-label="Navigasi footer">
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#faq">Tanya jawab</a>
            <a href={APP_URL} data-app-link>
              Buka aplikasi
              <Icon name="arrow-up" size={13} />
            </a>
          </nav>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Habit · Senlabs</span>
          <span>
            Dibuat dengan perhatian untuk keluarga.
            <Icon name="heart" size={12} />
          </span>
        </div>
      </footer>
    </>
  );
}
