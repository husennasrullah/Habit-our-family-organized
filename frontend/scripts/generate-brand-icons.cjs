const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

async function main() {
  const root = path.resolve(__dirname, "../..");
  const source =
    process.argv[2] || path.join(root, "docs/brand/habit-logo-source-v2.png");
  const target = path.join(root, "frontend/public/icons");
  const metadata = await sharp(source).metadata();
  if (!metadata.width || metadata.width !== metadata.height)
    throw new Error("Brand source must be square");
  fs.mkdirSync(target, { recursive: true });
  const sizes = [32, 48, 180, 192, 512];
  await sharp(source)
    .resize(512, 512)
    .png()
    .toFile(path.join(target, "habit-mark-v2.png"));
  for (const size of sizes) {
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(path.join(target, `habit-v2-${size}.png`));
  }
  // Extra padding keeps the whole monogram inside Android's central safe circle.
  const corner = await sharp(source)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer();
  const background = { r: corner[0], g: corner[1], b: corner[2], alpha: 1 };
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.88);
    const mark = await sharp(source).resize(inner, inner).png().toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background },
    })
      .composite([{ input: mark, gravity: "centre" }])
      .png()
      .toFile(path.join(target, `habit-v2-maskable-${size}.png`));
  }
  // ICO supports embedded PNG images; serve native 16/32/48 px favicon variants.
  const images = await Promise.all(
    [16, 32, 48].map((size) =>
      sharp(source).resize(size, size).png().toBuffer(),
    ),
  );
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((bytes, index) => {
    const entry = 6 + index * 16;
    const size = [16, 32, 48][index];
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
    "Generated HABIT v2 mark, favicons, Apple icon, PWA and maskable icons.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
