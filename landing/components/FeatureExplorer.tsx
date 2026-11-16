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
  note: string;
}[] = [
  {
    id: "calendar",
    label: "Kalender",
    icon: "calendar",
    eyebrow: "JADWAL KELUARGA",
    title: "Lihat jadwal vaksin bersama tenggat tugas.",
    description:
      "Agenda yang kamu buat, jadwal vaksin anak, dan tenggat tugas tampil di kalender Habit. Pilih tanggal untuk melihat rinciannya, lalu buka catatan asal saat perlu mengubahnya.",
    points: [
      "Pilih tampilan hari, minggu, atau bulan",
      "Lihat juga jadwal makan dan perjalanan",
      "Saring jenis catatan yang ingin ditampilkan",
    ],
    note: "Jadwal vaksin yang dicatat di menu Anak ikut muncul di kalender.",
    image: "calendar",
  },
  {
    id: "tasks",
    label: "Tugas",
    icon: "task",
    eyebrow: "PEMBAGIAN TUGAS RUMAH",
    title: "Siapa belanja, siapa menyiapkan bekal?",
    description:
      "Tentukan penanggung jawab setiap tugas dan kapan perlu selesai. Pasangan bisa mengecek tugasnya sendiri; kamu bisa melihat mana yang sedang dikerjakan dan sudah selesai.",
    points: [
      "Bagikan tugas ke anggota keluarga",
      "Tetapkan tenggat dan prioritas",
      "Beri poin untuk tugas yang diselesaikan",
    ],
    note: "Tenggat tugas terhubung ke kalender keluarga.",
    image: "tasks",
  },
  {
    id: "budget",
    label: "Keuangan",
    icon: "wallet",
    eyebrow: "BELANJA DAN ANGGARAN",
    title: "Lihat belanja masuk ke anggaran mana.",
    description:
      "Tulis daftar belanja bersama. Setelah belanja selesai, catat totalnya sebagai pengeluaran dan cek sisa anggaran bulan itu. Target tabungan punya catatan setoran tersendiri.",
    points: [
      "Catat pengeluaran per kategori",
      "Bandingkan pengeluaran dengan anggaran",
      "Ikuti setoran menuju target tabungan",
    ],
    note: "Belanja yang diselesaikan bisa langsung dicatat sebagai pengeluaran.",
    image: "budget",
  },
  {
    id: "kids",
    label: "Anak",
    icon: "baby",
    eyebrow: "TUMBUH KEMBANG ANAK",
    title: "Buka lagi catatan berat badan dan vaksinnya.",
    description:
      "Simpan hasil pengukuran setelah posyandu di profil anak. Catat rencana vaksin dan tanggal pemberiannya secara terpisah. Riwayat kesehatan serta pencapaian anak juga bisa ditambahkan.",
    points: [
      "Lihat grafik pertumbuhan berdasarkan tanggal",
      "Pisahkan jadwal vaksin dari pelaksanaannya",
      "Catat keluhan, obat, dan pencapaian anak",
    ],
    note: "Setiap anak punya profil dan riwayatnya sendiri.",
    image: "kids",
  },
  {
    id: "memories",
    label: "Kenangan",
    icon: "photo",
    eyebrow: "FOTO DAN CERITA KELUARGA",
    title: "Simpan ceritanya bersama foto keluarga.",
    description:
      "Unggah foto liburan atau tulis cerita saat anak mencoba sesuatu untuk pertama kali. Tambahkan tanggal, lalu cari kembali lewat judul, cerita, atau bulan kejadiannya.",
    points: [
      "Tambahkan beberapa foto dalam satu kenangan",
      "Tulis cerita, termasuk saat tidak ada foto",
      "Tandai favorit untuk dibuka kembali",
    ],
    note: "Tanggal kenangan juga bisa dilihat lewat filter catatan di kalender.",
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
            {feature.note}
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
