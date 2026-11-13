import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isolate production QA from a concurrently running development server.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  // Output standalone — dibutuhkan agar Docker image bisa jalan tanpa node_modules penuh
  output: "standalone",

  // Izinkan ngrok dan domain eksternal lain saat development
  // Tambah domain ngrok kamu di sini jika berubah, atau pakai wildcard *.ngrok-free.app
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io"],
  images: {
    remotePatterns: [
      // MinIO dev
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      // Cloudflare R2 / custom CDN — tambah domain production di sini
      // { protocol: "https", hostname: "*.r2.dev",            pathname: "/**" },
      // { protocol: "https", hostname: "media.keluarga.app",  pathname: "/**" },
    ],
  },
};

const config = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false, // Registered explicitly by the App Router root layout.
  importScripts: ["/sw-push.js"],
  buildExcludes: [/app-build-manifest\.json$/],
  cacheStartUrl: false,
  fallbacks: { document: "/offline.html" },
  skipWaiting: true,
  // Cache strategy — gunakan StaleWhileRevalidate untuk halaman utama
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
      options: { cacheName: "navigation" },
    },
    {
      // Family data is loaded from the network; offline navigation uses the explicit fallback.
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: "NetworkOnly",
      options: { cacheName: "api-network" },
    },
    {
      // Foto dari MinIO / storage — CacheFirst
      urlPattern: /^https?:\/\/(localhost:9000|.*\.r2\.dev|media\.).*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "media-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 hari
      },
    },
    {
      // Halaman Next.js — StaleWhileRevalidate
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
})(nextConfig);

export default config;
