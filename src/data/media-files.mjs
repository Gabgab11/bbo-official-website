// Photo data shared by the site and scripts/pull-media.mjs (plain Node, no Vite).
// Recovered from BBO's original Wix website.

export const photos = {
  hero: { file: 'ab7e7d_5cdf3f8596614503aad1a14ba318908f~mv2.jpg', w: 738, h: 923, alt: 'BBO, gospel music minister' },
  // Both portraits have a white border baked into the file; `trim` removes it when pulled.
  portrait: { file: 'ab7e7d_22f0357b7be446a29f4612dad1008b39~mv2.jpg', w: 800, h: 985, trim: true, alt: 'Black-and-white portrait of BBO in a white shirt' },
  portraitRed: { file: 'ab7e7d_76c28687ba34400a81a25dad29d88e35~mv2.jpg', w: 800, h: 991, trim: true, alt: 'BBO in traditional attire, lit in red' },
};

// The red-lit portrait closes the gallery.
export const gallery = [
  { file: 'ab7e7d_12ab11c2dc364f38901d43f505eb9a31~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_3c1a95e1fc1a4e2a9cab933dd1b144a1~mv2.jpg', w: 648, h: 432 },
  { file: 'ab7e7d_035129c976f84c27b1db35cb11f49765~mv2.jpg', w: 642, h: 502 },
  { file: 'ab7e7d_d812564559f0427ba3482ea8c2e03401~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_2192af33ab164049aab3f9a114fa544d~mv2.jpg', w: 855, h: 502 },
  { file: 'ab7e7d_84c78c5780e14559a01ed0ee37f833ac~mv2.jpg', w: 846, h: 502 },
  { file: 'ab7e7d_64e00f7afb22434a904d425f6120061f~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_1d9d8e4433d342ac9eb09b251917f0ff~mv2.jpg', w: 980, h: 502 },
  { file: 'ab7e7d_1c1defb8467143319b8a8e8916e70a99~mv2.jpg', w: 860, h: 502 },
  { file: 'ab7e7d_75b1fa8c94d9461e9044722395fae470~mv2.jpg', w: 720, h: 502 },
  { file: 'ab7e7d_cd65a113d0c84f75a1b74ab1189a03e8~mv2.jpg', w: 864, h: 502 },
  photos.portraitRed,
].map((p, i, all) => ({ ...p, alt: `${p.alt || 'Photograph of BBO'} (${i + 1} of ${all.length})` }));

export const WIDTHS = [800, 1600];

export const wixUrl = (file, width) =>
  `https://static.wixstatic.com/media/${file}/v1/fit/w_${width},h_${width * 2},q_85/${file}`;

export const localName = (file, width) => `${file.split('~')[0]}-${width}.jpg`;
