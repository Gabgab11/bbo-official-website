import { useState } from 'react';
import { youtubeChannel } from '../data/content.js';
import { useSiteContent } from '../lib/siteContent.jsx';
import { PlayIcon } from './Icons.jsx';

const thumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;

export default function Videos() {
  const { videos } = useSiteContent();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const video = videos[Math.min(index, videos.length - 1)];

  const choose = (i) => {
    setIndex(i);
    setPlaying(videos[i].embed !== false);
    document.getElementById('player')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  if (!video) return null;

  return (
    <section className="section videos" id="videos" aria-labelledby="videos-title">
      <div className="container">
        <div className="videos__head">
          <h2 className="section-title" id="videos-title">Watch</h2>
          <a className="text-link" href={youtubeChannel} target="_blank" rel="noopener noreferrer">
            Subscribe on YouTube<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </div>

        <div className="theater">
          <div className="theater__stage">
            <div className="player" id="player">
              {video.embed === false ? (
                <a className="player__facade" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                  <img src={thumb(video.id)} alt="" width="480" height="360" loading="lazy" decoding="async" />
                  <span className="player__play"><PlayIcon /></span>
                  <span className="player__note">Plays on YouTube</span>
                  <span className="visually-hidden">Play {video.title} on YouTube (opens in a new tab)</span>
                </a>
              ) : playing ? (
                <iframe
                  key={video.id}
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${video.title} — BBO`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" className="player__facade" onClick={() => setPlaying(true)}>
                  <img src={thumb(video.id)} alt="" width="480" height="360" loading="lazy" decoding="async" />
                  <span className="player__play"><PlayIcon /></span>
                  <span className="visually-hidden">Play {video.title}</span>
                </button>
              )}
            </div>
            <div className="now-playing" aria-live="polite">
              <div>
                <h3>{video.title}</h3>
                <p>{video.credit}</p>
              </div>
              <a className="text-link" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                Watch on YouTube<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </div>
          </div>

          <ul className="playlist" aria-label="Video playlist">
            {videos.map((v, i) => (
              <li key={v.key || v.id}>
                <button type="button" onClick={() => choose(i)} aria-current={i === index ? 'true' : undefined}>
                  <img src={thumb(v.id, 'mqdefault')} alt="" width="320" height="180" loading="lazy" decoding="async" />
                  <span>
                    <strong>{v.title}</strong>
                    <span>{v.credit}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
