/** @type {import('next').NextConfig} */
const config = {
  turbopack: { root: new URL(".", import.meta.url).pathname },
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default config;
