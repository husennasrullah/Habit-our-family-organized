"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";
const features: {
  id: string;
  label: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  image: string;
}[] = [
  {
    id: "calendar",
    label: "Kalender",
    icon: "calendar",
    eyebrow: "WAKTU UNTUK YANG PENTING",
    title: "Semua tanggal punya tempat.",
    description:
      "Lihat agenda keluarga, tenggat tugas, perjalanan, dan jadwal anak dalam satu kalender. Pilih informasi yang ingin ditampilkan, lalu buka menu asalnya.",
    points: [
      "Tampilan hari, minggu, dan bulan",
      "Tanggal terhubung dari berbagai menu",
      "Filter agenda dan catatan keluarga",
    ],
    image: "calendar",
  },
  {
    id: "tasks",
    label: "Tugas",
    icon: "task",
    eyebrow: "SEDIKIT BANTUAN, BESAR ARTINYA",
    title: "Berbagi tugas, berbagi lega.",
    description:
      "Dari menyiapkan bekal sampai merapikan rumah. Bagikan tanggung jawab, ikuti progresnya, dan apresiasi kontribusi setiap anggota keluarga.",
    points: [
      "Penanggung jawab dan tenggat yang jelas",
      "Status tugas mudah dipantau",
      "Poin sebagai apresiasi kebiasaan baik",
    ],
    image: "tasks",
  },
  {
    id: "budget",
    label: "Keuangan",
    icon: "wallet",
    eyebrow: "RENCANA KECIL UNTUK HARI ESOK",
    title: "Kebutuhan hari ini. Harapan esok hari.",
    description:
      "Catat pengeluaran, susun anggaran, siapkan belanja, dan ikuti target tabungan. Bicarakan kebutuhan keluarga dengan catatan yang lebih tertata.",
    points: [
      "Pengeluaran dan anggaran per kategori",
      "Daftar belanja bersama",
      "Target tabungan dan riwayat setoran",
    ],
    image: "budget",
  },
  {
    id: "kids",
    label: "Anak",
    icon: "baby",
    eyebrow: "MENEMANI SETIAP LANGKAH KECIL",
    title: "Tumbuhnya mereka, tercatat bersama.",
    description:
      "Simpan catatan pertumbuhan, jadwal dan riwayat vaksin, pencapaian, serta catatan kesehatan si kecil agar lebih mudah ditemukan kembali.",
    points: [
      "Profil dan catatan pertumbuhan anak",
      "Jadwal dan tanggal pemberian vaksin",
      "Milestone dan riwayat kesehatan",
    ],
    image: "kids",
  },
  {
    id: "memories",
    label: "Kenangan",
    icon: "photo",
    eyebrow: "HARI BIASA, CERITA ISTIMEWA",
    title: "Supaya yang sederhana tidak terlupa.",
    description:
      "Satu foto, satu cerita, atau satu hari yang terasa istimewa. Simpan momen keluarga, tandai favorit, dan buka kembali saat ingin mengenangnya.",
    points: [
      "Foto dan cerita dalam satu kenangan",
      "Pencarian, filter tanggal, dan favorit",
      "Galeri untuk dinikmati kembali bersama",
    ],
    image: "memories",
  },
];
export function FeatureExplorer() {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const feature = features[selected];
  const select = (index: number) => {
    setSelected(index);
    buttons.current[index]?.focus();
  };
  return (
    <div className="feature-explorer">
      <div
        className="feature-tabs"
        role="tablist"
        aria-label="Jelajahi fitur Habit"
      >
        {features.map((f, i) => (
          <button
            key={f.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            id={`tab-${f.id}`}
            type="button"
            role="tab"
            aria-selected={selected === i}
            aria-controls="feature-panel"
            tabIndex={selected === i ? 0 : -1}
            onClick={() => setSelected(i)}
            onKeyDown={(event) => {
              let next = i;
              if (event.key === "ArrowRight") next = (i + 1) % features.length;
              else if (event.key === "ArrowLeft")
                next = (i - 1 + features.length) % features.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = features.length - 1;
              else return;
              event.preventDefault();
              select(next);
            }}
          >
            <Icon name={f.icon} size={18} />
            {f.label}
          </button>
        ))}
      </div>
      <div
        className="feature-panel"
        id="feature-panel"
        role="tabpanel"
        aria-labelledby={`tab-${feature.id}`}
        tabIndex={0}
      >
        <div className="feature-copy">
          <span className="eyebrow">{feature.eyebrow}</span>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
          <ul>
            {feature.points.map((point) => (
              <li key={point}>
                <span>
                  <Icon name="check" size={13} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <span className="feature-note">
            <Icon name="spark" size={14} />
            Bagian dari keseharian keluarga, dalam satu Habit.
          </span>
        </div>
        <figure className="feature-screen">
          <div className="screen-toolbar">
            <span className="browser-dots">
              <i />
              <i />
              <i />
            </span>
            <span>{feature.label} di Habit</span>
          </div>
          <div className="feature-image">
            <Image
              key={feature.image}
              src={`/previews/${feature.image}.webp`}
              alt={`Contoh tampilan menu ${feature.label} pada aplikasi Habit dengan data ilustrasi`}
              width={1100}
              height={804}
              sizes="(max-width: 900px) 100vw, 60vw"
            />
          </div>
          <figcaption>
            Tampilan aplikasi Habit · menggunakan data contoh
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
