import { nav, socials, streaming, artist } from '../data/content.js';

const ext = { target: '_blank', rel: 'noopener noreferrer' };
const NewTab = () => <span className="visually-hidden"> (opens in a new tab)</span>;

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a className="wordmark" href="#top">BBO</a>
            <p>{artist.fullName}. {artist.role}.</p>
          </div>
          <nav className="footer__col" aria-labelledby="footer-explore">
            <h2 id="footer-explore">Explore</h2>
            <ul>
              {nav.map((n) => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}
            </ul>
          </nav>
          <div className="footer__col">
            <h2 id="footer-listen">Listen</h2>
            <ul aria-labelledby="footer-listen">
              {streaming.map((s) => <li key={s.label}><a href={s.href} {...ext}>{s.label}<NewTab /></a></li>)}
            </ul>
          </div>
          <div className="footer__col">
            <h2 id="footer-follow">Follow and contact</h2>
            <ul aria-labelledby="footer-follow">
              {socials.map((s) => (
                <li key={s.label}><a href={s.href} {...ext}>{s.label}<small>{s.handle}</small><NewTab /></a></li>
              ))}
              <li><a href="#booking">Booking enquiries</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} BBO. All rights reserved.</span>
          <a href="#top">Back to top</a>
        </div>
      </div>
    </footer>
  );
}
