import Photo from './Photo.jsx';
import { photos } from '../data/media.js';

const facts = [
  ['From', 'Ijebu, Ogun State, Nigeria'],
  ['In ministry since', '2020'],
  ['Sound', 'Yoruba praise and contemporary worship'],
  ['Has recorded with', 'Tope Alabi, Woli Arole, Oladosu Twins, Testimony Jaga, Grace Idowu, Soji Adeleke, Ayo Alabi'],
];

export default function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="container about__grid">
        <figure className="about__portrait">
          <Photo photo={photos.portrait} sizes="(max-width: 860px) 90vw, 40vw" />
          <figcaption>Bakare Boluwatife Oluwatobi</figcaption>
        </figure>

        <div className="about__body">
          <h2 className="section-title" id="about-title">A sound born in prayer</h2>
          <p>
            Bakare Boluwatife Oluwatobi, known to congregations as BBO, is a gospel music minister, worship
            leader and songwriter from Ijebu in Ogun State, Nigeria. His music joins the depth of Yoruba praise
            with the textures of contemporary worship, and his ministrations are known for turning a room
            toward prayer.
          </p>
          <p>
            Before music became his calling, BBO worked as a compère and actor. That changed in 2020. During
            the COVID-19 lockdown he gave himself to prayer and worship, and <em>Most High</em>, shared in that
            season, carried his voice far beyond his city and introduced him to gospel audiences across Nigeria.
          </p>
          <p>
            He has since ministered on major gospel stages at home and abroad, including Tope Alabi’s Praise
            The Almighty in the United Kingdom, and recorded with Tope Alabi, Woli Arole, Oladosu Twins and
            Testimony Jaga. His catalogue moves between studio singles such as <em>My God</em>, <em>ORO</em> and{' '}
            <em>Orun Si</em>, live worship albums, and long, unhurried sessions of spontaneous worship.
          </p>

          <blockquote className="about__quote">
            <p>“One of my deepest desires is to see Jesus manifest through my music.”</p>
            <footer>
              BBO, speaking to{' '}
              <cite>
                <a href="https://www.thisdaylive.com/2024/10/31/one-of-my-deepest-desires-is-to-see-jesus-manifest-through-my-music-bbo/" target="_blank" rel="noopener noreferrer">
                  ThisDay, October 2024
                </a>
              </cite>
            </footer>
          </blockquote>

          <dl className="facts">
            {facts.map(([term, value]) => (
              <div key={term} style={{ display: 'contents' }}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
