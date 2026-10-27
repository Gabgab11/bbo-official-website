// Photo data shared by the site and scripts/pull-media.mjs (plain Node, no Vite).
//
// Two kinds of photo:
//   - `file`:  recovered from BBO's original Wix media library; `npm run media:pull`
//              downloads it into public/media/ (until then it loads from Wix).
//   - `local`: supplied directly by BBO's team and committed in public/media/ as
//              `<local>-800.jpg` and `<local>-1600.jpg`.
// `pos` / `posMobile` set which part of the photo stays in view when it is cropped.

export const photos = {
  hero: { file: 'ab7e7d_5cdf3f8596614503aad1a14ba318908f~mv2.jpg', w: 738, h: 923, pos: '50% 20%', posMobile: '50% 14%', alt: 'BBO in traditional agbada, holding a carved staff' },
  // Both Wix portraits have a white border baked into the file; `trim` removes it when pulled.
  portrait: { file: 'ab7e7d_22f0357b7be446a29f4612dad1008b39~mv2.jpg', w: 800, h: 985, trim: true, pos: '50% 22%', posMobile: '50% 16%', alt: 'Black-and-white portrait of BBO in a white shirt' },
  portraitRed: { file: 'ab7e7d_76c28687ba34400a81a25dad29d88e35~mv2.jpg', w: 800, h: 991, trim: true, alt: 'BBO in traditional attire, lit in red' },
  smile: { local: 'bbo-smile', w: 1600, h: 1209, pos: '58% 30%', posMobile: '56% 22%', alt: 'BBO smiling with eyes closed, in a white shirt' },
  silhouette: { local: 'bbo-silhouette', w: 1080, h: 1350, pos: '55% 30%', posMobile: '58% 20%', alt: 'Silhouette of BBO in profile, smiling, holding a horsetail whisk' },
  veil: { local: 'bbo-veil', w: 1600, h: 2000, pos: '52% 38%', posMobile: '52% 30%', alt: 'BBO veiled in white cloth, a band of light across one eye' },
};

// Home page: photos crossfade every 10 seconds, in this order.
// `mono: true` shows a colour photo in black and white so it matches the others.
export const heroSlides = [
  photos.hero,
  { ...photos.smile, mono: true },
  photos.silhouette,
  photos.veil,
  photos.portrait,
];

export const gallery = [
  photos.smile,
  { file: 'ab7e7d_12ab11c2dc364f38901d43f505eb9a31~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_3c1a95e1fc1a4e2a9cab933dd1b144a1~mv2.jpg', w: 648, h: 432 },
  photos.silhouette,
  { file: 'ab7e7d_035129c976f84c27b1db35cb11f49765~mv2.jpg', w: 642, h: 502 },
  { file: 'ab7e7d_d812564559f0427ba3482ea8c2e03401~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_2192af33ab164049aab3f9a114fa544d~mv2.jpg', w: 855, h: 502 },
  photos.veil,
  { file: 'ab7e7d_84c78c5780e14559a01ed0ee37f833ac~mv2.jpg', w: 846, h: 502 },
  { file: 'ab7e7d_64e00f7afb22434a904d425f6120061f~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_1d9d8e4433d342ac9eb09b251917f0ff~mv2.jpg', w: 980, h: 502 },
  photos.portraitRed,
  { file: 'ab7e7d_1c1defb8467143319b8a8e8916e70a99~mv2.jpg', w: 860, h: 502 },
  { file: 'ab7e7d_75b1fa8c94d9461e9044722395fae470~mv2.jpg', w: 720, h: 502 },
  { file: 'ab7e7d_cd65a113d0c84f75a1b74ab1189a03e8~mv2.jpg', w: 864, h: 502 },
].map((p, i, all) => ({ ...p, alt: `${p.alt || 'BBO ministering'} (${i + 1} of ${all.length})` }));

export const WIDTHS = [800, 1600];

export const wixUrl = (file, width) =>
  `https://static.wixstatic.com/media/${file}/v1/fit/w_${width},h_${width * 2},q_85/${file}`;

export const localName = (file, width) => `${file.split('~')[0]}-${width}.jpg`;

/** Stable key for a photo of either kind. */
export const photoKey = (p) => p.file || p.local;
