import { HabitMark } from "@/components/brand/HabitMark";
import { HabitWordmark } from "@/components/brand/HabitWordmark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Providers } from "@/app/providers";
import { CalendarDays, Heart, ListChecks, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="auth-shell">
        <header className="auth-topbar">
          <Link href="/" aria-label="Habit — Beranda" className="auth-brand">
            <span className="auth-brand-symbol"><HabitMark /></span>
            <span><HabitWordmark /><span className="auth-brand-caption">Ruang keluarga kita</span></span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="auth-main">
          <section className="auth-story" aria-label="Bersama Habit">
            <span className="auth-eyebrow"><span /> KEHANGATAN DIMULAI DARI RUMAH</span>
            <h2>Hal kecil teratur.<br /><span>Momen bersama,</span><br className="auth-desktop-break" /> lebih berarti.</h2>
            <p className="auth-story-copy">Dari rencana hari ini sampai cerita yang ingin diingat. Rawat keseharian keluarga, bersama Habit.</p>
            <div className="auth-art">
              <span className="auth-art-halo" />
              <span className="auth-art-spark auth-art-spark-one" aria-hidden="true">✦</span>
              <span className="auth-art-spark auth-art-spark-two" aria-hidden="true">✧</span>
              <Image src="/illustrations/family-banner-v3.webp" alt="" width={1600} height={510} priority sizes="(min-width: 1024px) 540px, 340px" className="auth-family" />
              <span className="auth-together"><Heart size={13} fill="currentColor" /> Ada waktu untuk bersama.</span>
            </div>
            <div className="auth-features" aria-label="Keseharian bersama Habit">
              <span><CalendarDays size={15} /> Jadwal selaras</span>
              <span><ListChecks size={15} /> Tugas berbagi</span>
              <span><Wallet size={15} /> Keuangan tertata</span>
            </div>
          </section>

          <div className="auth-form-column">
            <div className="auth-form-card">{children}</div>
            <p className="auth-footnote"><Heart size={12} /> Kebiasaan kecil. Keluarga lebih dekat.</p>
          </div>
        </main>
        <footer className="auth-footer">Habit <span>·</span> Satu tempat untuk hal yang paling berarti.</footer>
      </div>
    </Providers>
  );
}
