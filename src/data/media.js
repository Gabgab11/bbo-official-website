// Resolves photo URLs, preferring self-hosted copies in public/media/.
// Committed photos (`local`) are always self-hosted. Wix photos (`file`) are
// self-hosted once `npm run media:pull` has downloaded them (the deploy workflow
// does this automatically); until then they load from their original Wix URL.

import manifest from './media-manifest.json';
import { WIDTHS, wixUrl, localName } from './media-files.mjs';
import { mediaUrl } from '../lib/supabase.js';

export { photos, gallery, heroSlides } from './media-files.mjs';

const base = () => `${import.meta.env.BASE_URL}media/`;

/** Stable key for a photo of any kind. */
export const photoKey = (p) => p.id || p.file || p.local || p.upload;

/** Returns { src, srcSet } for a photo: uploaded via the admin panel, committed, or from Wix. */
export function photoSources(photo) {
  const url = photo.upload
    ? (w) => mediaUrl(`${photo.upload}-${w}.jpg`)
    : photo.local
    ? (w) => `${base()}${photo.local}-${w}.jpg`
    : manifest[photo.file]
      ? (w) => `${base()}${localName(photo.file, w)}`
      : (w) => wixUrl(photo.file, w);
  return {
    src: url(WIDTHS[0]),
    srcSet: WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
  };
}
