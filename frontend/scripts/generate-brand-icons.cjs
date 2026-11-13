// Export the approved Hadir Bersama SVG to platform assets. No generated-image dependency.
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
async function main() {
  const root = path.resolve(__dirname, "../..");
  const source = path.join(
    root,
    "docs/brand/habit-v3/habit-hadir-bersama-pwa.svg",
  );
  const target = path.join(root, "frontend/public/icons");
  fs.mkdirSync(target, { recursive: true });
  const vector = fs.readFileSync(source);
  for (const size of [16, 32, 48, 180, 192, 512])
    await sharp(vector)
      .resize(size, size)
      .png()
      .toFile(path.join(target, `habit-v3-${size}.png`));
  for (const size of [192, 512])
    await sharp(vector)
      .resize(size, size)
      .png()
      .toFile(path.join(target, `habit-v3-maskable-${size}.png`));
  await sharp(vector)
    .resize(512, 512)
    .png()
    .toFile(path.join(target, "habit-mark-v3.png"));
  for (const [sourceName, targetName] of [
    ["habit-hadir-bersama-icon-color.svg", "habit-mark-v3.svg"],
    ["habit-hadir-bersama-horizontal-color.svg", "habit-lockup-v3.svg"],
    ["habit-hadir-bersama-horizontal-dark.svg", "habit-lockup-v3-dark.svg"],
  ])
    fs.copyFileSync(
      path.join(root, "docs/brand/habit-v3", sourceName),
      path.join(target, targetName),
    );
  // Android notification badges require a monochrome alpha mask, not a colored app tile.
  const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="none" stroke="white" stroke-width="13" stroke-linecap="round"><path d="M14 20v30M50 20v30M14 32c9 13 27 13 36 0"/></g><circle cx="32" cy="18" r="5.5" fill="white"/></svg>`;
  await sharp(Buffer.from(badge))
    .resize(96, 96)
    .png()
    .toFile(path.join(target, "habit-v3-badge-96.png"));
  const images = await Promise.all(
    [16, 32, 48].map((size) =>
      sharp(vector).resize(size, size).png().toBuffer(),
    ),
  );
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((bytes, index) => {
    const entry = 6 + index * 16,
      size = [16, 32, 48][index];
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(bytes.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += bytes.length;
  });
  fs.writeFileSync(
    path.join(root, "frontend/app/favicon.ico"),
    Buffer.concat([header, ...images]),
  );
  console.log(
    "Generated Habit v3 SVG lockups, PNG/ICO favicons, Apple, PWA, maskable icons and notification badge.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
