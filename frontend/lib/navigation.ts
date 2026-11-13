import { House, CalendarDays, ListChecks, Wallet, UtensilsCrossed, Plane, Images, Baby, FolderOpen, Settings } from "lucide-react";

export const navigation = [
  { href: "/dashboard", label: "Beranda", group: "Sehari-hari", icon: House },
  { href: "/calendar", label: "Kalender", group: "Sehari-hari", icon: CalendarDays },
  { href: "/tasks", label: "Tugas", group: "Sehari-hari", icon: ListChecks },
  { href: "/meals", label: "Jadwal Makan", group: "Sehari-hari", icon: UtensilsCrossed },
  { href: "/budget", label: "Keuangan", group: "Keluarga", icon: Wallet },
  { href: "/kids", label: "Anak", group: "Keluarga", icon: Baby },
  { href: "/memories", label: "Kenangan", group: "Keluarga", icon: Images },
  { href: "/trips", label: "Liburan", group: "Keluarga", icon: Plane },
  { href: "/documents", label: "Dokumen", group: "Keluarga", icon: FolderOpen },
  { href: "/settings", label: "Pengaturan", group: "Akun", icon: Settings },
];

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
