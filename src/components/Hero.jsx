import { useEffect, useState } from 'react';
import Photo from './Photo.jsx';
import { photoKey } from '../data/media.js';
import { useSiteContent } from '../lib/siteContent.jsx';
import { HeadphonesIcon, PlayIcon } from './Icons.jsx';
import { useIsMobile, usePageVisible, useReducedMotion } from '../hooks/useMedia.js';

const INTERVAL = 10000;

export default function Hero() {
  const { hero, featured, heroSlides } = useSiteContent();
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0]));
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const visible = usePageVisible();

  // Advance every 10 seconds while the page is visible. Reduced motion keeps the first photo.
  useEffect(() => {
    if (reduced || !visible) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % heroSlides.length), INTERVAL);
    return () => clearInterval(id);
  }, [reduced, visible, heroSlides.length]);

  // Live content may bring a different number of photos.
  useEffect(() => { setActive(0); setLoaded(new Set([0])); }, [heroSlides]);

  // Load each photo just before it is needed, so the first visit stays light.
  useEffect(() => {
    const next = (active + 1) % heroSlides.length;
    setLoaded((s) => (s.has(next) ? s : new Set(s).add(next)));
  }, [active, heroSlides.length]);

  return (
    <section className="hero" id="top" aria-labelledby="hero-name">
      <div className="hero__media" aria-hidden="true">
        {heroSlides.map((slide, i) =>
          loaded.has(i) ? (
            <Photo
              key={photoKey(slide)}
              photo={slide}
              eager={i === 0}
              alt=""
              sizes="(max-width: 760px) 100vw, 58vw"
              className={`hero__slide${i === active ? ' is-active' : ''}${slide.mono ? ' is-mono' : ''}`}
              style={{ objectPosition: (mobile && slide.posMobile) || slide.pos }}
            />
          ) : null,
        )}
      </div>
      <div className="container hero__inner">
        <h1 className="hero__name" id="hero-name" aria-label="BBO">
          <span aria-hidden="true">B</span>
          <span aria-hidden="true">B</span>
          <span aria-hidden="true">O</span>
        </h1>
        <div className="hero__fade">
          <p className="hero__fullname">{hero.fullName}</p>
          <p className="hero__headline">{hero.headline}</p>
          <div className="hero__actions">
            <a className="btn btn--gold" href="#music"><HeadphonesIcon /> Listen</a>
            <a className="btn" href="#videos"><PlayIcon /> Watch</a>
            <a className="btn" href="#booking">Book BBO</a>
          </div>
          <div className="hero__featured">
            <p>Featured release<strong>{featured.title}</strong></p>
            <a className="text-link" href={featured.href} target="_blank" rel="noopener noreferrer">
              Stream on Spotify<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
      <ol className="hero__dots" aria-hidden="true">
        {heroSlides.map((s, i) => <li key={photoKey(s)} className={i === active ? 'is-active' : ''} />)}
      </ol>
    </section>
  );
}
