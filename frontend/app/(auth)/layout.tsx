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
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── Sisi Kiri — Branding ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#f0fdf9] via-[#e8faf7] to-[#f0f6ff] px-14 py-12 border-r border-teal-100 relative overflow-hidden">

          {/* Background decorations */}
          <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full bg-purple-100/30 blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <Image
              src="/icons/assets-habit/logo-habit.png"
              alt="HABIT"
              width={48}
              height={48}
              className="object-contain"
            />
            <div>
              <div
                className="text-[22px] tracking-[0.16em] text-[#1a2744] leading-none"
                style={{ fontFamily: "var(--font-nunito)", fontWeight: 900 }}
              >
                HABIT
              </div>
              <div className="text-[8px] font-bold tracking-[0.12em] text-orange-400 uppercase mt-0.5">
                Our Family, Organized
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="relative z-10 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold tracking-wide mb-5">
                ✦ Family Command Center
              </span>
              <h1 className="text-[42px] font-black leading-[1.08] tracking-tight text-[#172033]">
                Urus keluarga,<br />
                <span className="text-teal-500">lebih mudah.</span>
              </h1>
              <p className="mt-5 text-[15px] text-slate-500 leading-[1.75] max-w-[440px]">
                Satu tempat untuk mengatur tugas, keuangan, jadwal, kesehatan, dan kenangan keluarga — supaya hidup bersama terasa lebih ringan.
              </p>
            </div>

            {/* Dummy illustration card */}
            <div className="w-full max-w-[460px] h-[160px] rounded-2xl border border-teal-100 bg-white/70 backdrop-blur-sm flex items-center justify-center gap-6 shadow-sm">
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center text-3xl">👨🏻</div>
                <span className="text-xs text-slate-400 font-medium">Ayah</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-3xl">👩🏻</div>
                <span className="text-xs text-slate-400 font-medium">Ibu</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl">👶🏻</div>
                <span className="text-xs text-slate-400 font-medium">Anak</span>
              </div>
              <div className="ml-2 text-sm text-slate-400 font-medium max-w-[120px] leading-relaxed">
                Semua yang penting, dalam satu tempat. 💚
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="relative z-10 text-xs text-slate-400">© 2026 HABIT · Made for family life</p>
        </div>

        {/* ── Sisi Kanan — Form ────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7fafb] px-6 py-10">

          {/* Logo mobile only */}
          <Link href="/" className="flex flex-col items-center gap-1 mb-8 lg:hidden">
            <Image
              src="/icons/assets-habit/logo-habit.png"
              alt="HABIT"
              width={56}
              height={56}
              className="object-contain"
            />
            <span
              className="text-2xl tracking-[0.18em] text-[#1a2744]"
              style={{ fontFamily: "var(--font-nunito)", fontWeight: 900 }}
            >
              HABIT
            </span>
            <span className="text-[8px] font-bold tracking-[0.18em] text-orange-400 uppercase">
              Our Family, Organized
            </span>
          </Link>

          {/* Card form */}
          <div className="w-full max-w-[420px] bg-white rounded-2xl border border-neutral-100 shadow-lg px-8 py-9">
            {children}
          </div>

          <p className="mt-5 text-xs text-slate-400">🔒 Data keluarga kamu tetap aman dan privat.</p>
        </div>

      </div>
    </Providers>
  );
}
