import { NextRequest, NextResponse } from "next/server";

// Route yang butuh login
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calendar",
  "/tasks",
  "/budget",
  "/memories",
  "/kids",
  "/documents",
  "/meals",
  "/settings",
];

// Route yang hanya boleh diakses saat BELUM login
const AUTH_ONLY_PATHS = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ambil token dari cookie (lebih reliable di SSR daripada localStorage)
  const token = req.cookies.get("access_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // Root "/" — redirect sesuai status auth
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/dashboard" : "/login", req.url)
    );
  }

  // Belum login → akses halaman protected → redirect ke login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname); // simpan tujuan awal
    return NextResponse.redirect(loginUrl);
  }

  // Sudah login → akses halaman login/register → redirect ke dashboard
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware di semua route kecuali static files & API
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)",
  ],
};
