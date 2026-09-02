import { Providers } from "@/app/providers";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Branding */}
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/icons/assets-habit/logo-habit.png"
              alt="HABIT"
              width={72}
              height={72}
              className="object-contain mb-3 drop-shadow-sm"
            />
            <h1
              className="text-3xl tracking-[0.2em] text-[#1a2744] mb-0.5"
              style={{ fontFamily: "var(--font-nunito)", fontWeight: 900 }}
            >
              HABIT
            </h1>
            <p className="text-[9px] font-semibold tracking-[0.25em] text-[#f97316] uppercase">
              Our Family, Organized
            </p>
          </div>

          {/* Card wrapper */}
          <div className="bg-white rounded-2xl shadow-md border border-neutral-100 px-6 py-7">
            {children}
          </div>

        </div>
      </div>
    </Providers>
  );
}
