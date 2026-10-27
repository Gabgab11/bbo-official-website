import { useState } from 'react';
import Photo from './Photo.jsx';
import { RichText, useSiteContent } from '../lib/siteContent.jsx';
import { photos } from '../data/media.js';

const facts = [
  ['From', 'Ijebu, Ogun State, Nigeria'],
  ['In ministry since', '2020'],
  ['Sound', 'Yoruba praise and contemporary worship'],
  ['Has recorded with', 'Tope Alabi, Woli Arole, Oladosu Twins, Testimony Jaga, Grace Idowu, Soji Adeleke, Ayo Alabi'],
];

export default function About() {
  const { about } = useSiteContent();
  const [first, ...rest] = about.paragraphs;
  const [open, setOpen] = useState(false);
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="container about__grid">
        <figure className="about__portrait">
          <Photo photo={photos.portrait} sizes="(max-width: 860px) 90vw, 40vw" />
          <figcaption>Bakare Boluwatife Oluwatobi</figcaption>
        </figure>

        <div className="about__body">
          <h2 className="section-title" id="about-title">{about.title}</h2>
          <p><RichText text={first} /></p>
          <div className={`about__more${open ? ' is-open' : ''}`} id="about-more">
          {rest.map((p, i) => <p key={i}><RichText text={p} /></p>)}

          {about.quote && (
            <blockquote className="about__quote">
              <p>“{about.quote}”</p>
              {about.quoteSource && (
                <footer>
                  BBO, speaking to{' '}
                  <cite>
                    {about.quoteHref
                      ? <a href={about.quoteHref} target="_blank" rel="noopener noreferrer">{about.quoteSource}</a>
                      : about.quoteSource}
                  </cite>
                </footer>
              )}
            </blockquote>
          )}

          <dl className="facts">
            {facts.map(([term, value]) => (
              <div key={term} style={{ display: 'contents' }}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          </div>
          <button type="button" className="read-more" aria-expanded={open} aria-controls="about-more" onClick={() => setOpen((v) => !v)}>
            {open ? 'Show less' : 'Read the full story'}
          </button>
        </div>
      </div>
    </section>
  );
}
