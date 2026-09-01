import { Inter, JetBrains_Mono, Nunito } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["700", "800", "900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HABIT — Our Family, Organized",
  description:
    "Atur jadwal, tugas, kenangan, dan keuangan keluarga bersama dalam satu aplikasi.",
  manifest: "/manifest.json",
  // Apple PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HABIT",
    startupImage: "/icons/apple-touch-icon.png",
  },
  // Ikon untuk berbagai platform
  icons: {
    icon: [
      { url: "/icons/assets-habit/logo-habit.png", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // viewport-fit=cover diperlukan agar safe-area-inset bekerja di iPhone
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} ${nunito.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
