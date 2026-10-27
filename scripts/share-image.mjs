// Builds the 1200x630 image shown when the site is shared on WhatsApp,
// Facebook, X and other apps: black ground, the black-and-white portrait on
// the right, "BBO" in Bodoni Moda and a champagne subtitle on the left.

const W = 1200;
const H = 630;
const BLACK = '#000000';
const IVORY = '#f5f0e6';
const GOLD = '#c9b37e';

/** Fetches a static TrueType instance of a Google Font (best effort). */
async function googleFont(family, axes) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axes}`, {
    headers: { 'User-Agent': 'curl/8' }, // older user agents get .ttf files
  }).then((r) => (r.ok ? r.text() : ''));
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) return null;
  const buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  const { writeFile, mkdtemp } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const file = join(await mkdtemp(join(tmpdir(), 'bbo-font-')), `${family}.ttf`);
  await writeFile(file, buf);
  return { file, name: fontName(buf) };
}

/** Reads the family and style a font file declares (OpenType 'name' table). */
export function fontName(buf) {
  const numTables = buf.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString('latin1', rec, rec + 4) !== 'name') continue;
    const table = buf.readUInt32BE(rec + 8);
    const count = buf.readUInt16BE(table + 2);
    const strings = table + buf.readUInt16BE(table + 4);
    const names = {};
    for (let j = 0; j < count; j++) {
      const r = table + 6 + j * 12;
      const [platform, , , id, len, off] = [0, 2, 4, 6, 8, 10].map((o) => buf.readUInt16BE(r + o));
      if (platform !== 3 || names[id]) continue; // Windows, UTF-16BE
      const raw = buf.subarray(strings + off, strings + off + len);
      names[id] = Buffer.from(raw).swap16().toString('utf16le');
    }
    const familyName = names[16] || names[1];
    const style = names[17] || names[2] || '';
    return style && style !== 'Regular' ? `${familyName} ${style}` : familyName;
  }
  return null;
}

async function textLayer(sharp, { text, font, fontfile, width, color }) {
  const markup = `<span foreground="${color}">${text}</span>`;
  return sharp({ text: { text: markup, font, fontfile, width, rgba: true, dpi: 72 } }).png().toBuffer();
}

export async function makeShareImage(sharp, portraitBuffer) {
  if (!sharp) throw new Error('sharp is required');

  const [display, italic, sans] = await Promise.all([
    googleFont('Bodoni+Moda', 'opsz,wght@96,600').catch(() => null),
    googleFont('Bodoni+Moda', 'ital,opsz,wght@1,28,400').catch(() => null),
    googleFont('Hanken+Grotesk', 'wght@500').catch(() => null),
  ]);
  console.log(`Share image fonts: ${[display, italic, sans].map((f) => f?.name || 'fallback').join(', ')}`);

  const photoW = 520;
  const photo = await sharp(portraitBuffer)
    .resize(photoW, H, { fit: 'cover', position: 'attention' })
    .greyscale()
    .toBuffer();

  // Fade the photo's left edge into black.
  const fade = Buffer.from(
    `<svg width="${photoW}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${BLACK}" stop-opacity="1"/><stop offset="0.45" stop-color="${BLACK}" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );

  const name = await textLayer(sharp, {
    text: 'BBO',
    font: display?.name ? `${display.name} 230` : 'DejaVu Serif Bold 200',
    fontfile: display?.file,
    width: 700,
    color: IVORY,
  });
  const sub = await textLayer(sharp, {
    text: 'Gospel music minister, worship leader and songwriter',
    font: sans?.name ? `${sans.name} 30` : 'DejaVu Sans 28',
    fontfile: sans?.file,
    width: 600,
    color: GOLD,
  });
  const fullName = await textLayer(sharp, {
    text: italic ? 'Bakare Boluwatife Oluwatobi' : '<i>Bakare Boluwatife Oluwatobi</i>',
    font: italic?.name ? `${italic.name} 38` : 'DejaVu Serif Italic 34',
    fontfile: italic?.file,
    width: 640,
    color: IVORY,
  });

  const nameMeta = await sharp(name).metadata();
  const top = Math.round((H - nameMeta.height) / 2) - 70;

  return sharp({ create: { width: W, height: H, channels: 3, background: BLACK } })
    .composite([
      { input: photo, left: W - photoW, top: 0 },
      { input: fade, left: W - photoW, top: 0 },
      { input: name, left: 72, top },
      { input: fullName, left: 78, top: top + nameMeta.height + 18 },
      { input: sub, left: 80, top: top + nameMeta.height + 86 },
      { input: Buffer.from(`<svg width="120" height="2"><rect width="120" height="2" fill="${GOLD}"/></svg>`), left: 80, top: H - 72 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}
