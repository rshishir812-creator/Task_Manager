#!/usr/bin/env node
/**
 * Regenerate every app-icon PNG from the two final brand rasters.
 *
 * Run:   node scripts/generate-icons.mjs
 *
 * Sources (committed):
 *   public/icons/app-icon-source.png   1024² polished app icon (frame/glow/sparkle)
 *   public/icons/logo-mark-source.png  bare shield mark on a solid #082A34 background
 *
 * Outputs:
 *   public/icons/logo-mark.png            transparent-bg shield (inline mark, LogoMark)
 *   public/icons/icon-{192,512}.png       PWA icons (purpose: any) — from app icon
 *   public/icons/icon-maskable-{192,512}.png  PWA maskable (full-bleed navy, safe zone)
 *   public/apple-touch-icon.png           iOS home screen (180) — from app icon
 *   app/icon.png                          favicon (48) — bare shield on navy
 *   app/apple-icon.png                    Apple touch icon (180) — from app icon
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const NAVY = { r: 0x0b, g: 0x0f, b: 0x2a, alpha: 1 }; // #0B0F2A app background
const APP_ICON = resolve(root, "public/icons/app-icon-source.png");
const MARK_SRC = resolve(root, "public/icons/logo-mark-source.png");

const out = (p) => resolve(root, p);
const write = async (p) => { await mkdir(dirname(out(p)), { recursive: true }); return out(p); };

// Flood-fill the solid background of the bare-mark raster to transparent, then
// trim to the shield. Stops at the bright teal outline so the dark shield
// interior + arrow are preserved.
async function cutoutMark() {
  const { data, info } = await sharp(MARK_SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const BG = [data[0], data[1], data[2]]; // sample the corner (the baked bg)
  const TOL = 48;
  const near = (i) => {
    const dr = data[i] - BG[0], dg = data[i + 1] - BG[1], db = data[i + 2] - BG[2];
    return Math.sqrt(dr * dr + dg * dg + db * db) <= TOL;
  };
  const visited = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    if (x >= 0 && x < W && y >= 0 && y < H) {
      const p = y * W + x;
      if (!visited[p]) { visited[p] = 1; stack.push(p); }
    }
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const i = p * C;
    if (!near(i)) continue;
    data[i + 3] = 0;
    const x = p % W, y = (p / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return sharp(data, { raw: { width: W, height: H, channels: C } }).png().trim().toBuffer();
}

// Resize `src` to `inner`, then center on a `size`² navy square (full-bleed).
async function onNavy(srcBuf, size, padding) {
  const inner = Math.round(size * (1 - 2 * padding));
  const mark = await sharp(srcBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  // 1. Inline mark: transparent-bg shield.
  const cut = await cutoutMark();
  const markPath = await write("public/icons/logo-mark.png");
  await sharp(cut).toFile(markPath);
  console.log("  ✓ public/icons/logo-mark.png (transparent inline mark)");

  // 2. App-icon family — from the polished 1024 source (keeps its own background).
  for (const [p, size] of [
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/apple-touch-icon.png", 180],
    ["app/apple-icon.png", 180],
  ]) {
    await sharp(APP_ICON).resize(size, size).png().toFile(await write(p));
    console.log(`  ✓ ${p} (${size}²)`);
  }

  // 3. Maskable — app icon scaled into the inner safe zone on full-bleed navy.
  for (const [p, size] of [
    ["public/icons/icon-maskable-192.png", 192],
    ["public/icons/icon-maskable-512.png", 512],
  ]) {
    const buf = await onNavy(await sharp(APP_ICON).png().toBuffer(), size, 0.10);
    await sharp(buf).toFile(await write(p));
    console.log(`  ✓ ${p} (${size}², maskable safe-zone)`);
  }

  // 4. Favicon — bare shield on navy reads cleaner than the framed icon at 48².
  const fav = await onNavy(cut, 48, 0.12);
  await sharp(fav).toFile(await write("app/icon.png"));
  console.log("  ✓ app/icon.png (48² favicon)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
