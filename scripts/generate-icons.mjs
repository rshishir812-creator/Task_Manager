#!/usr/bin/env node
/**
 * Regenerate PWA + apple-touch + favicon PNGs from public/icons/logo-mark.svg.
 *
 * Run:   node scripts/generate-icons.mjs
 *
 * Output: public/icons/icon-{192,512}.png
 *         public/icons/icon-maskable-{192,512}.png
 *         public/apple-touch-icon.png
 *         public/favicon-32.png  (used by app/icon.tsx)
 */
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const BG = "#0B0F2A";       // dark navy splash
const FG = "#00E5FF";       // electric teal mark
const SVG_PATH = resolve(root, "public/icons/logo-mark.svg");

const targets = [
  { out: "public/icons/icon-192.png",          size: 192, padding: 0.15 },
  { out: "public/icons/icon-512.png",          size: 512, padding: 0.15 },
  { out: "public/icons/icon-maskable-192.png", size: 192, padding: 0.22 },
  { out: "public/icons/icon-maskable-512.png", size: 512, padding: 0.22 },
  { out: "public/apple-touch-icon.png",        size: 180, padding: 0.15 },
  { out: "public/favicon-32.png",              size: 32,  padding: 0.10 },
];

async function main() {
  const rawSvg = await readFile(SVG_PATH, "utf8");
  // Replace `currentColor` with the brand teal so the rendered PNG has actual colour.
  const colouredSvg = rawSvg.replace(/currentColor/g, FG);

  for (const { out, size, padding } of targets) {
    const inner = Math.round(size * (1 - 2 * padding));
    const mark = await sharp(Buffer.from(colouredSvg))
      .resize(inner, inner)
      .png()
      .toBuffer();

    const offset = Math.round((size - inner) / 2);

    const finalPath = resolve(root, out);
    await mkdir(dirname(finalPath), { recursive: true });

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG,
      },
    })
      .composite([{ input: mark, top: offset, left: offset }])
      .png()
      .toFile(finalPath);

    console.log(`  ✓ ${out}  (${size}x${size}, padding ${(padding * 100).toFixed(0)}%)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
