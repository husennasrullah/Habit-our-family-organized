import { Providers } from "@/app/providers";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-[#1a2744] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Dekoratif lingkaran samar */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-white/[0.03]" />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-[#f97316]/5" />
        <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-primary-500/5" />

        <div className="relative z-10 w-full max-w-md">
          {/* Branding */}
          <div className="flex flex-col items-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/assets-habit/logo-habit.png"
              alt="HABIT"
              className="w-20 h-20 object-contain mb-3 drop-shadow-lg"
            />
            <h1
              className="text-4xl tracking-[0.2em] text-white mb-1"
              style={{ fontFamily: "var(--font-nunito)", fontWeight: 900 }}
            >
              HABIT
            </h1>
            <p className="text-[9px] font-semibold tracking-[0.25em] text-[#f97316] uppercase">
              Our Family, Organized
            </p>
          </div>

          {/* Form card */}
          {children}
        </div>
      </div>
    </Providers>
  );
}
