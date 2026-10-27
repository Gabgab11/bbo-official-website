// Downloads BBO's original photographs from the Wix media CDN into public/media/
// so the site is fully self-hosted. Safe to run repeatedly: existing files are
// skipped. If a download fails, the site keeps using the original Wix URL for
// that photo, so a failed pull never breaks the build.
//
//   npm run media:pull

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { photos, gallery, WIDTHS, wixUrl, localName } from '../src/data/media-files.mjs';

const root = new URL('..', import.meta.url);
const outDir = new URL('public/media/', root);
const manifestPath = new URL('src/data/media-manifest.json', root);

const exists = (url) => access(url).then(() => true, () => false);

async function download(url, dest) {
  const res = await fetch(url, { headers: { Accept: 'image/jpeg,image/*;q=0.8' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('response too small to be an image');
  await writeFile(dest, buf);
  return buf.length;
}

await mkdir(outDir, { recursive: true });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
const files = [...Object.values(photos).map((p) => p.file), ...gallery.map((p) => p.file)];
let ok = 0;
let failed = 0;

for (const file of files) {
  let complete = true;
  for (const w of WIDTHS) {
    const dest = new URL(localName(file, w), outDir);
    if (await exists(dest)) continue;
    try {
      const bytes = await download(wixUrl(file, w), dest);
      console.log(`✓ ${localName(file, w)} (${Math.round(bytes / 1024)} KB)`);
    } catch (err) {
      complete = false;
      console.warn(`✗ ${file} @${w}px: ${err.message}`);
    }
  }
  if (complete) { manifest[file] = true; ok++; } else { delete manifest[file]; failed++; }
}

// Social sharing image (1200x630, the size Open Graph and X prefer).
const og = new URL('og-image.jpg', outDir);
if (!(await exists(og))) {
  const f = photos.og.file;
  try {
    await download(`https://static.wixstatic.com/media/${f}/v1/fill/w_1200,h_630,al_c,q_85/og-image.jpg`, og);
    console.log('✓ og-image.jpg');
  } catch (err) {
    console.warn(`✗ og-image.jpg: ${err.message}`);
  }
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nMedia ready: ${ok} photos self-hosted${failed ? `, ${failed} still served from Wix` : ''}.`);
