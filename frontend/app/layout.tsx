import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = localFont({
  src: "./fonts/PlusJakartaSansVariable.ttf",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Habit — Keluarga lebih dekat",
  applicationName: "Habit",
  description:
    "Kebiasaan kecil. Keluarga lebih dekat. Atur jadwal, tugas, keuangan, tumbuh kembang, dan kenangan keluarga bersama Habit.",
  manifest: "/manifest.json?v=20261113-hadir3",
  other: { "mobile-web-app-capable": "yes" },
  // Apple PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Habit",
    startupImage: "/icons/habit-v3-180.png?v=20261113-hadir3",
  },
  // Ikon untuk berbagai platform
  icons: {
    icon: [
      {
        url: "/icons/habit-v3-32.png?v=20261113-hadir3",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/habit-v3-48.png?v=20261113-hadir3",
        sizes: "48x48",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/habit-v3-180.png?v=20261113-hadir3",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#007F5B",
  width: "device-width",
  initialScale: 1,
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
      <body className={`${jakarta.variable} ${mono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ServiceWorkerRegistration />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
