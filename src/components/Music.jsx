import { featured, releases, streaming } from '../data/content.js';

const External = ({ children }) => (
  <>
    {children}
    <span className="visually-hidden"> (opens in a new tab)</span>
  </>
);

export default function Music() {
  return (
    <section className="section on-light music" id="music" aria-labelledby="music-title">
      <div className="container">
        <div className="music__feature">
          <div>
            <p className="music__kicker">Featured release</p>
            <h2 className="music__title" id="music-title">{featured.title}</h2>
            <p className="lede">{featured.description}</p>
            <div className="music__actions">
              <a className="btn btn--dark" href={featured.href} target="_blank" rel="noopener noreferrer">
                <External>Listen on Spotify</External>
              </a>
              <a className="btn" href="https://music.apple.com/us/artist/bbo/1555520275" target="_blank" rel="noopener noreferrer">
                <External>Apple Music</External>
              </a>
            </div>
            <ul className="platforms" aria-label="Also streaming on">
              {streaming.slice(2).map((s) => (
                <li key={s.label}>
                  <a className="text-link" href={s.href} target="_blank" rel="noopener noreferrer"><External>{s.label}</External></a>
                </li>
              ))}
            </ul>
          </div>

          <div className="music__embed">
            <iframe
              title="BBO on Spotify"
              src={featured.spotifyEmbed}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          </div>
        </div>

        <div className="releases">
          <div className="releases__head">
            <h3>Releases</h3>
            <a className="text-link" href={streaming[0].href} target="_blank" rel="noopener noreferrer">
              <External>Full catalogue on Spotify</External>
            </a>
          </div>
          <ul className="release-list">
            {releases.map((r) => (
              <li className="release" key={r.title}>
                <div className="release__title">
                  {r.title}
                  {r.credit && <small>{r.credit}</small>}
                </div>
                <div className="release__meta">{[r.kind, r.year].filter(Boolean).join(', ')}</div>
                <a className="text-link release__link" href={r.href} target="_blank" rel="noopener noreferrer">
                  <External>{r.store === 'All platforms' ? 'Listen' : r.store}</External>
                  <span className="visually-hidden"> — {r.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
