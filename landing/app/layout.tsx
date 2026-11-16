import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_TITLE, SITE_DESCRIPTION } from "@/lib/site";
import "./globals.css";
const jakarta = localFont({
  src: "./fonts/PlusJakartaSansVariable.ttf",
  variable: "--font-jakarta",
  display: "swap",
});
export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Habit",
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "id_ID",
    type: "website",
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#faf8f2" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <a className="skip-link" href="#konten">
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
