// Site content: built-in defaults, replaced by the live content the team
// manages in the admin panel. If the database cannot be reached, visitors
// still see the complete built-in site.

import { createContext, useContext, useEffect, useState } from 'react';
import * as base from '../data/content.js';
import { gallery as staticGallery, heroSlides as staticHero } from '../data/media-files.mjs';
import { rest, supabaseConfigured } from './supabase.js';

const strip = (p) => ({ ...p, alt: (p.alt || '').replace(/ \(\d+ of \d+\)$/, '') });

export const defaults = {
  hero: { fullName: base.artist.fullName, headline: base.artist.headline },
  featured: { title: base.featured.title, description: base.featured.description, href: base.featured.href },
  about: {
    title: 'A sound born in prayer',
    paragraphs: [
      'Bakare Boluwatife Oluwatobi, known to congregations as BBO, is a gospel music minister, worship leader and songwriter from Ijebu in Ogun State, Nigeria. His music joins the depth of Yoruba praise with the textures of contemporary worship, and his ministrations are known for turning a room toward prayer.',
      'Before music became his calling, BBO worked as a compère and actor. That changed in 2020. During the COVID-19 lockdown he gave himself to prayer and worship, and *Most High*, shared in that season, carried his voice far beyond his city and introduced him to gospel audiences across Nigeria.',
      'He has since ministered on major gospel stages at home and abroad, including Tope Alabi’s Praise The Almighty in the United Kingdom, and recorded with Tope Alabi, Woli Arole, Oladosu Twins and Testimony Jaga. His catalogue moves between studio singles such as *My God*, *ORO* and *Orun Si*, live worship albums, and long, unhurried sessions of spontaneous worship.',
    ],
    quote: 'One of my deepest desires is to see Jesus manifest through my music.',
    quoteSource: 'ThisDay, October 2024',
    quoteHref: 'https://www.thisdaylive.com/2024/10/31/one-of-my-deepest-desires-is-to-see-jesus-manifest-through-my-music-bbo/',
  },
  booking: { title: 'Invite BBO to minister', lede: 'Tell us about your church service, concert, conference or celebration. Every request is read by BBO’s team, who reply by email.' },
  newsletter: { title: 'Stay close to the ministry', lede: 'New releases, upcoming ministrations and live recordings, sent occasionally by email.' },
  releases: base.releases,
  videos: base.videos,
  gallery: staticGallery.map(strip),
  heroSlides: staticHero.map(strip),
};

/** Converts a gallery_photos row into the photo shape the site uses. */
export function rowToPhoto(row) {
  const photo = { id: row.id, w: row.width, h: row.height, alt: row.alt, pos: row.pos || undefined, posMobile: row.pos_mobile || undefined };
  if (row.kind === 'upload') photo.upload = row.ref;
  else if (row.ref.includes('~mv2')) photo.file = row.ref;
  else photo.local = row.ref;
  return photo;
}

const CACHE_KEY = 'bbo-content-v1';

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}
function writeCache(value) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* storage may be blocked */ }
}

/** Fetches live content. Resolves to a full content object, or null if unavailable. */
export async function fetchLiveContent() {
  if (!supabaseConfigured) return null;
  const [text, photos, rel, vid] = await Promise.all([
    rest('site_content?select=key,value', { timeout: 8000 }),
    rest('gallery_photos?select=*&deleted_at=is.null', { timeout: 8000 }),
    rest('releases?select=*&deleted_at=is.null&order=sort.asc,created_at.asc', { timeout: 8000 }),
    rest('videos?select=*&deleted_at=is.null&order=sort.asc,created_at.asc', { timeout: 8000 }),
  ]);
  if (![text, photos, rel, vid].every((r) => r.ok)) return null;

  const live = { ...defaults };
  for (const { key, value } of text.data) {
    if (defaults[key] && value && typeof value === 'object') live[key] = { ...defaults[key], ...value };
  }
  const rows = photos.data;
  const galleryRows = rows.filter((r) => r.in_gallery).sort((a, b) => a.gallery_sort - b.gallery_sort);
  const homeRows = rows.filter((r) => r.on_home).sort((a, b) => a.home_sort - b.home_sort);
  if (galleryRows.length) live.gallery = galleryRows.map(rowToPhoto);
  if (homeRows.length) live.heroSlides = homeRows.map((r) => ({ ...rowToPhoto(r), mono: r.home_mono }));
  live.releases = rel.data.map((r) => ({ id: r.id, title: r.title, credit: r.credit, kind: r.kind, year: r.year, href: r.href, store: r.store }));
  live.videos = vid.data.map((v) => ({ id: v.youtube_id, key: v.id, title: v.title, credit: v.credit, embed: v.embed }));
  return live;
}

const SiteContentContext = createContext(defaults);

export function SiteContentProvider({ children }) {
  // Start from the last content this browser saw (if any), so repeat visits
  // show the latest text immediately; then refresh from the database.
  const [content, setContent] = useState(() => {
    const cached = readCache();
    return cached ? { ...defaults, ...cached } : defaults;
  });
  useEffect(() => {
    let active = true;
    fetchLiveContent().then((live) => {
      if (!active || !live) return;
      setContent(live);
      writeCache(live);
    });
    return () => { active = false; };
  }, []);
  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

export const useSiteContent = () => useContext(SiteContentContext);

/** Renders text where *words between asterisks* are shown in italics. */
export function RichText({ text }) {
  const parts = String(text || '').split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part,
  );
}
