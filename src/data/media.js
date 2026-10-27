// Resolves photo URLs, preferring self-hosted copies in public/media/.
// `npm run media:pull` (also run automatically by the deploy workflow) downloads
// the originals and records them in media-manifest.json. Until a photo has been
// pulled, it loads from its original Wix media URL.

import manifest from './media-manifest.json';
import { WIDTHS, wixUrl, localName } from './media-files.mjs';

export { photos, gallery } from './media-files.mjs';

/** Returns { src, srcSet } for a photo file. */
export function photoSources(file) {
  const local = manifest[file];
  const url = (w) => (local ? `${import.meta.env.BASE_URL}media/${localName(file, w)}` : wixUrl(file, w));
  return {
    src: url(WIDTHS[0]),
    srcSet: WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
  };
}
