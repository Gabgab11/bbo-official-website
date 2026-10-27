import { useEffect, useState } from 'react';
import { nav, socials } from '../data/content.js';

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view.
  useEffect(() => {
    const sections = nav.map((n) => document.querySelector(n.href)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Lock scroll and allow Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  const close = () => setOpen(false);

  // Close the menu first, then scroll once the page is scrollable again.
  const go = (e) => {
    const href = e.currentTarget.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    setOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      history.pushState(null, '', href);
    }, 30);
  };

  return (
    <>
      <header className={`site-header${solid || open ? ' is-solid' : ''}`}>
        <div className="container site-header__inner">
          <a className="wordmark" href="#top" onClick={close} aria-label="BBO, back to top">BBO</a>
          <nav className="site-nav" aria-label="Main">
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} aria-current={active === item.href ? 'true' : undefined}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <a className="btn btn--gold site-header__cta" href="#booking">Book BBO</a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </header>

      {open && (
        <div id="mobile-menu" className="mobile-menu">
          <nav aria-label="Mobile">
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <a className="mobile-menu__link" href={item.href} onClick={go}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mobile-menu__foot">
            <a className="btn btn--gold" href="#booking" onClick={go}>Book BBO</a>
            <div className="mobile-menu__socials">
              {socials.map((s) => (
                <a key={s.label} className="text-link" href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
