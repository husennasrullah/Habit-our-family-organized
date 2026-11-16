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
    time: "PAGI, MULAI DENGAN TENANG",
    title: "Tahu rencana hari ini.",
    body: "Agenda sekolah, janji bersama, sampai belanja sore. Lihat yang perlu disiapkan sebelum hari dimulai.",
  },
  {
    icon: "users",
    time: "SIANG, SALING MERINGANKAN",
    title: "Ada peran untuk semua.",
    body: "Bagi tugas rumah dan ikuti progresnya. Hal kecil terasa lebih ringan saat dikerjakan bersama.",
  },
  {
    icon: "moon",
    time: "MALAM, DEKAT KEMBALI",
    title: "Bawa pulang ceritanya.",
    body: "Simpan foto dan cerita hari ini. Karena momen keluarga tidak selalu harus menunggu hari istimewa.",
  },
];
const faqs = [
  [
    "Habit itu aplikasi apa?",
    "Habit adalah ruang digital untuk mengatur keseharian keluarga: kalender, tugas, keuangan, catatan anak, rencana makan, perjalanan, dokumen, dan kenangan.",
  ],
  [
    "Apakah perlu mengunduh aplikasi?",
    "Kamu bisa membuka Habit langsung melalui browser di ponsel atau komputer. Pada perangkat dan browser yang mendukung, Habit juga bisa ditambahkan ke layar utama sebagai PWA.",
  ],
  [
    "Bagaimana menggunakannya bersama keluarga?",
    "Daftar atau masuk ke aplikasi Habit, lalu buat keluarga atau bergabung melalui undangan. Anggota keluarga menggunakan akun masing-masing untuk berbagi informasi dalam ruang keluarga yang sama.",
  ],
  [
    "Apakah semua anggota punya akses yang sama?",
    "Akses mengikuti peran anggota di aplikasi. Beberapa informasi dan tindakan, termasuk catatan anak, dibatasi sesuai peran. Kelola anggota dan perannya melalui pengaturan keluarga.",
  ],
  [
    "Ke mana tombol Buka Habit mengarah?",
    "Tombol tersebut membuka aplikasi Habit di habit.senlabs.web.id. Kamu bisa masuk ke akun yang sudah ada atau memulai dari halaman pendaftaran.",
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
                Ruang keluarga digital
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
                Untuk jadwal yang saling bertemu, tugas yang dibagi, dan cerita
                yang ingin disimpan. Hadir bersama, setiap hari.
              </p>
              <div className="hero-actions">
                <AppLink />
                <a className="text-link" href="#fitur">
                  Kenalan dulu
                  <Icon name="arrow" size={17} />
                </a>
              </div>
              <div className="hero-footnote">
                <Icon name="heart" size={15} />
                <span>Dibuat untuk keseharian. Dijalani bersama.</span>
              </div>
            </div>
            <ProductPreview />
          </div>
          <div className="shell hero-bottom">
            <span>
              Lebih sedikit yang tercecer.
              <br />
              <strong>Lebih banyak waktu bersama.</strong>
            </span>
            <div>
              <span>
                <Icon name="calendar" size={17} />
                Rencana lebih jelas
              </span>
              <span>
                <Icon name="users" size={17} />
                Peran lebih terbagi
              </span>
              <span>
                <Icon name="photo" size={17} />
                Cerita lebih terjaga
              </span>
            </div>
          </div>
        </section>
        <section className="section routine-section">
          <div className="shell">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">DEKAT DALAM KESEHARIAN</span>
                <h2>
                  Bukan hari yang sempurna.
                  <br />
                  Cukup, lebih bersama.
                </h2>
              </div>
              <p>
                Kesibukan setiap orang boleh berbeda. Tetap punya satu tempat
                untuk saling tahu dan saling membantu.
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
              <span className="eyebrow">SATU HABIT, BANYAK CARA HADIR</span>
              <h2>
                Semua yang penting.
                <br />
                Punya tempat di sini.
              </h2>
              <p>
                Dari urusan hari ini sampai momen yang ingin dikenang.
                <br className="desktop-break" /> Jelajahi ruang-ruang kecil
                dalam Habit.
              </p>
            </div>
            <FeatureExplorer />
            <div className="more-features">
              <span>Dan hal-hal lain yang membuat rumah terasa tertata.</span>
              <div>
                {(
                  [
                    {
                      icon: "meal",
                      title: "Rencana makan",
                      body: "Menu harian lebih siap.",
                    },
                    {
                      icon: "plane",
                      title: "Perjalanan",
                      body: "Rencana liburan bersama.",
                    },
                    {
                      icon: "folder",
                      title: "Dokumen",
                      body: "Berkas keluarga tersimpan.",
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
              <span className="eyebrow">MULAI DARI HAL SEDERHANA</span>
              <h2>
                Ruang bersama,
                <br />
                dalam tiga langkah.
              </h2>
              <p>
                Tidak perlu langsung merapikan semuanya. Mulai dari satu agenda
                atau satu tugas hari ini.
              </p>
              <AppLink>Mulai bersama Habit</AppLink>
            </div>
            <ol className="steps">
              {[
                {
                  title: "Buka Habit, buat akunmu.",
                  body: "Masuk ke aplikasi melalui browser. Gunakan akunmu untuk memulai.",
                },
                {
                  title: "Temukan ruang keluargamu.",
                  body: "Buat keluarga baru atau bergabung melalui undangan keluarga yang sudah ada.",
                },
                {
                  title: "Isi hari, sedikit demi sedikit.",
                  body: "Ajak anggota keluarga, tambahkan agenda, atau bagikan tugas pertama kalian.",
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
                Rumah adalah tentang kita.
              </span>
            </div>
            <div className="together-copy">
              <span className="eyebrow">DEKAT, DI MANA PUN HARI MEMBAWA</span>
              <h2>
                Selalu ada cara
                <br />
                untuk ikut hadir.
              </h2>
              <p>
                Di meja kerja, di perjalanan, atau di sofa ruang keluarga. Buka
                Habit dari ponsel maupun komputer dan kembali ke rencana yang
                sama.
              </p>
              <div className="value-line">
                <Icon name="phone" size={21} />
                <div>
                  <h3>Ikut ritme harimu.</h3>
                  <p>
                    Buka lewat browser, atau tambahkan ke layar utama pada
                    perangkat yang mendukung.
                  </p>
                </div>
              </div>
              <div className="value-line">
                <Icon name="users" size={21} />
                <div>
                  <h3>Satu keluarga, ruang bersama.</h3>
                  <p>
                    Akun masing-masing, dengan akses informasi sesuai peran
                    anggota keluarga.
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
                Mungkin ini
                <br />
                yang kamu pikirkan.
              </h2>
              <p>Kenalan sedikit lebih dekat dengan Habit.</p>
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
              <p>Mulai dari satu hal hari ini. Sisanya, jalani bersama.</p>
              <AppLink className="button button-light">
                Buka Habit sekarang
              </AppLink>
              <span className="final-note">habit.senlabs.web.id</span>
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
            Ruang untuk keseharian.
            <br />
            Tempat untuk kebersamaan.
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
