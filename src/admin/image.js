// Prepares a photo for the website in the browser: corrects rotation, and makes
// an 800px and a 1600px wide JPEG (photos from phones are often 4000px+ and
// several megabytes; these come out at roughly 60–300 KB).

const MAX_INPUT = 40 * 1024 * 1024;

async function decode(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back below */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpeg(source, srcW, srcH, targetW) {
  const scale = Math.min(1, targetW / srcW);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve({ blob: b, w, h }) : reject(new Error('Could not process this photo.'))), 'image/jpeg', 0.84),
  );
}

export async function prepareImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not a photo.`);
  if (file.size > MAX_INPUT) throw new Error(`${file.name} is larger than 40 MB.`);
  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error(`${file.name} could not be opened. Save it as a JPEG or PNG and try again.`);
  }
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  if (w < 400 || h < 300) throw new Error(`${file.name} is too small (at least 400 × 300 pixels).`);
  const [small, large] = await Promise.all([toJpeg(source, w, h, 800), toJpeg(source, w, h, 1600)]);
  source.close?.();
  return { small: small.blob, large: large.blob, width: large.w, height: large.h };
}
