import Photo from './Photo.jsx';
import { artist, featured } from '../data/content.js';
import { photos } from '../data/media.js';
import { HeadphonesIcon, PlayIcon } from './Icons.jsx';

export default function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-name">
      <div className="hero__media">
        <Photo photo={photos.hero} eager sizes="(max-width: 760px) 100vw, 58vw" alt="" />
      </div>
      <div className="container hero__inner">
        <p className="hero__role hero__fade">{artist.role}</p>
        <h1 className="hero__name" id="hero-name" aria-label="BBO">
          <span aria-hidden="true">B</span>
          <span aria-hidden="true">B</span>
          <span aria-hidden="true">O</span>
        </h1>
        <div className="hero__fade">
          <p className="hero__fullname">{artist.fullName}</p>
          <p className="hero__headline">{artist.headline}</p>
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
    </section>
  );
}
