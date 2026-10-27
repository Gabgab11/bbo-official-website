// Downloads BBO's original photographs from the Wix media CDN into public/media/
// so the site is fully self-hosted, then builds the social sharing image.
// Safe to run repeatedly: existing files are skipped. If a download fails, the
// site keeps using the original Wix URL for that photo, so a failed pull never
// breaks the build.
//
//   npm run media:pull

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { photos, gallery, WIDTHS, wixUrl, localName } from '../src/data/media-files.mjs';
import { makeShareImage } from './share-image.mjs';

const root = new URL('..', import.meta.url);
const outDir = new URL('public/media/', root);
const manifestPath = new URL('src/data/media-manifest.json', root);

const exists = (url) => access(url).then(() => true, () => false);

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('sharp is not installed; photos are saved without border trimming.');
}

async function download(url) {
  const res = await fetch(url, { headers: { Accept: 'image/jpeg,image/*;q=0.8' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('response too small to be an image');
  return buf;
}

/** Removes a plain white frame baked into a photo. */
async function trimWhiteFrame(buf) {
  if (!sharp) return buf;
  return sharp(buf).trim({ background: '#ffffff', threshold: 40 }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}

await mkdir(outDir, { recursive: true });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
const all = [...Object.values(photos), ...gallery];
const unique = [...new Map(all.map((p) => [p.file, p])).values()];
let ok = 0;
let failed = 0;

for (const photo of unique) {
  let complete = true;
  for (const w of WIDTHS) {
    const dest = new URL(localName(photo.file, w), outDir);
    if (await exists(dest)) continue;
    try {
      let buf = await download(wixUrl(photo.file, w));
      if (photo.trim) buf = await trimWhiteFrame(buf);
      await writeFile(dest, buf);
      console.log(`✓ ${localName(photo.file, w)} (${Math.round(buf.length / 1024)} KB)${photo.trim ? ', frame trimmed' : ''}`);
    } catch (err) {
      complete = false;
      console.warn(`✗ ${photo.file} @${w}px: ${err.message}`);
    }
  }
  if (complete) { manifest[photo.file] = true; ok++; } else { delete manifest[photo.file]; failed++; }
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nMedia ready: ${ok} photos self-hosted${failed ? `, ${failed} still served from Wix` : ''}.`);

// Social sharing image (1200x630) in the site's black, ivory and gold identity.
const share = new URL('og-share.jpg', outDir);
if (!(await exists(share))) {
  try {
    const portrait = new URL(localName(photos.portrait.file, 1600), outDir);
    await writeFile(share, await makeShareImage(sharp, await readFile(portrait)));
    console.log('✓ og-share.jpg');
  } catch (err) {
    console.warn(`✗ og-share.jpg: ${err.message}`);
  }
}
