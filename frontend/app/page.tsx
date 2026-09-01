// Root page — middleware akan redirect ke /login atau /dashboard
// berdasarkan status auth. Halaman ini tidak pernah benar-benar dirender.
import { redirect } from "next/navigation";

export default function HomePage() {
  // Fallback jika middleware tidak aktif (misal: static export)
  redirect("/dashboard");
}
