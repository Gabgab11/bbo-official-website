import { nav, socials, streaming, artist } from '../data/content.js';
import { useIsMobile } from '../hooks/useMedia.js';

const ext = { target: '_blank', rel: 'noopener noreferrer' };
const NewTab = () => <span className="visually-hidden"> (opens in a new tab)</span>;

/** A footer column: always open on larger screens, a tap-to-open dropdown on phones. */
function Column({ title, children, mobile }) {
  return (
    <details className="footer__col" open={!mobile}>
      <summary>{title}</summary>
      <ul>{children}</ul>
    </details>
  );
}

export default function Footer() {
  const mobile = useIsMobile();
  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a className="wordmark" href="#top">BBO</a>
            <p>{artist.fullName}. {artist.role}.</p>
          </div>
          <Column title="Explore" mobile={mobile}>
            {nav.map((n) => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}
          </Column>
          <Column title="Listen" mobile={mobile}>
            {streaming.map((s) => <li key={s.label}><a href={s.href} {...ext}>{s.label}<NewTab /></a></li>)}
          </Column>
          <Column title="Follow and contact" mobile={mobile}>
            {socials.map((s) => (
              <li key={s.label}><a href={s.href} {...ext}>{s.label}<small>{s.handle}</small><NewTab /></a></li>
            ))}
            <li><a href="#booking">Booking enquiries</a></li>
          </Column>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} BBO. All rights reserved. <span className="footer__credit">Luminary Digital Group</span></span>
          <span className="footer__links">
            <button type="button" className="footer__linkbtn" onClick={() => window.dispatchEvent(new Event('bbo-cookie-settings'))}>Cookie settings</button>
            <a href="#top">Back to top</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
