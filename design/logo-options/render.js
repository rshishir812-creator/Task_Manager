// One-off preview renderer: rasterizes each logo SVG with sharp, composites it
// onto a rounded navy brand tile, and builds a contact sheet for comparison.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = __dirname;
const OUT = path.join(DIR, "out");
const NAVY = { r: 0x0b, g: 0x0f, b: 0x2a };
const NAVY_HEX = "#0B0F2A";

// label, file
const MARKS = [
  ["Current", "current.svg"],
  ["A · Q-Check", "a-q-check.svg"],
  ["B · Quest Shield", "b-quest-shield.svg"],
  ["C · Level-Up Spark", "c-level-up-spark.svg"],
];

// Build a rounded navy tile of `size`, with the SVG (rendered at logoFrac of the
// tile) centered on it. Returns a PNG buffer.
async function tile(svgPath, size, logoFrac = 0.62) {
  const radius = Math.round(size * 0.22);
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${NAVY_HEX}"/></svg>`
  );
  const tileBuf = await sharp(bg).png().toBuffer();

  const logoSize = Math.round(size * logoFrac);
  const logo = await sharp(fs.readFileSync(svgPath), { density: 384 })
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const off = Math.round((size - logoSize) / 2);
  return sharp(tileBuf)
    .composite([{ input: logo, top: off, left: off }])
    .png()
    .toBuffer();
}

async function textLabel(text, width, height = 40) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="${width / 2}" y="${height / 2 + 8}" font-family="Arial, sans-serif" font-size="24"
      font-weight="700" fill="#A0A8C8" text-anchor="middle">${text}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const BIG = 512;
  const SMALL = 64;
  const PAD = 48;
  const COLW = BIG + PAD;
  const sheetW = COLW * MARKS.length + PAD;
  // rows: label, big tile, small tile (shown at 64 but on its own padded cell), caption
  const labelH = 50;
  const smallCellH = 140;
  const sheetH = PAD + labelH + BIG + 24 + smallCellH + PAD;

  const sheet = sharp({
    create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0x07, g: 0x0a, b: 0x1c, alpha: 1 } },
  });

  const layers = [];
  for (let i = 0; i < MARKS.length; i++) {
    const [label, file] = MARKS[i];
    const svgPath = path.join(DIR, file);
    const x = PAD + i * COLW;

    // per-mark individual big tile saved to disk
    const big = await tile(svgPath, BIG);
    fs.writeFileSync(path.join(OUT, file.replace(/\.svg$/, "-512.png")), big);

    const small = await tile(svgPath, SMALL);
    fs.writeFileSync(path.join(OUT, file.replace(/\.svg$/, "-64.png")), small);

    const lbl = await textLabel(label, BIG, labelH);

    layers.push({ input: lbl, top: PAD, left: x });
    layers.push({ input: big, top: PAD + labelH, left: x });
    // small tile centered under the big one, with a faint caption
    const smallLeft = x + Math.round((BIG - SMALL) / 2);
    layers.push({ input: small, top: PAD + labelH + BIG + 24, left: smallLeft });
    const cap = await textLabel("64px (Product Hunt size)", BIG, 36);
    layers.push({ input: cap, top: PAD + labelH + BIG + 24 + SMALL + 12, left: x });
  }

  await sheet.composite(layers).png().toFile(path.join(OUT, "contact-sheet.png"));
  console.log("Wrote", path.join(OUT, "contact-sheet.png"));
  console.log("Individual tiles in", OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
