import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold text-neutral-900">404</h1>
      <p className="text-neutral-500">Halaman tidak ditemukan.</p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
