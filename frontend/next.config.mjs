import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Izinkan ngrok dan domain eksternal lain saat development
  // Tambah domain ngrok kamu di sini jika berubah, atau pakai wildcard *.ngrok-free.app
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  images: {
    remotePatterns: [
      // MinIO dev
      { protocol: "http",  hostname: "localhost", port: "9000", pathname: "/**" },
      // Cloudflare R2 / custom CDN — tambah domain production di sini
      // { protocol: "https", hostname: "*.r2.dev",            pathname: "/**" },
      // { protocol: "https", hostname: "media.keluarga.app",  pathname: "/**" },
    ],
  },
};

const config = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Cache strategy — gunakan StaleWhileRevalidate untuk halaman utama
  runtimeCaching: [
    {
      // API calls — NetworkFirst: selalu coba network, fallback ke cache
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 },
        networkTimeoutSeconds: 10,
      },
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
