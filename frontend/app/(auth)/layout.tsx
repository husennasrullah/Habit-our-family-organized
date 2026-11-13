import { HabitMark } from "@/components/brand/HabitMark";
import { HabitWordmark } from "@/components/brand/HabitWordmark";
import { Providers } from "@/app/providers";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
        <aside className="hidden min-h-screen flex-col justify-between bg-primary-50 p-10 dark:bg-primary-950 lg:flex xl:p-14">
          <Link
            href="/"
            aria-label="Habit — Beranda"
            className="flex items-center gap-3"
          >
            <HabitMark />
            <span className="text-xl font-semibold tracking-tight">
              <HabitWordmark />
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Ruang keluarga kita
              </span>
            </span>
          </Link>
          <div className="mx-auto max-w-lg py-10">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-primary-700 dark:text-primary-200">
              Kebiasaan kecil. Keluarga lebih dekat.
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Lebih teratur.
              <br />
              Lebih banyak waktu
              <br />
              untuk bersama.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
              Jadwal, tugas, keuangan, dan cerita keluarga. Semua punya ruang di
              sini.
            </p>
            <Image
              src="/illustrations/family-planning.webp"
              alt=""
              width={840}
              height={560}
              priority
              className="mx-auto mt-8 w-full max-w-md"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Habit · Kebiasaan kecil. Keluarga lebih dekat.
          </p>
        </aside>
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
          <Link
            href="/"
            aria-label="Habit — Beranda"
            className="mb-7 flex items-center gap-2.5 lg:hidden"
          >
            <HabitMark />
            <HabitWordmark />
          </Link>
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Satu tempat untuk hal yang paling berarti.
          </p>
        </main>
      </div>
    </Providers>
  );
}
