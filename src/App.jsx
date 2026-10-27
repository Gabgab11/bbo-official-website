import { lazy, Suspense, useEffect, useState } from 'react';
import Intro from './components/Intro.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Music from './components/Music.jsx';
import Videos from './components/Videos.jsx';
import Gallery from './components/Gallery.jsx';
import Booking from './components/Booking.jsx';
import Newsletter from './components/Newsletter.jsx';
import Footer from './components/Footer.jsx';
import CookieNotice from './components/CookieNotice.jsx';
import { SiteContentProvider } from './lib/siteContent.jsx';
import { startAnalytics } from './lib/analytics.js';

// The admin panel lives at /admin and is loaded only when someone opens it,
// so visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

const isAdminPath = (path) => /^\/admin(\/|$)/.test(path);

/** Sends old or unknown addresses to the right place before the first render. */
function tidyAddress() {
  const { pathname, hash } = window.location;
  // Older links used #admin/… (and may arrive via the old github.io address).
  if (hash.startsWith('#admin')) {
    window.history.replaceState(null, '', `/${hash.slice(1)}`);
    return;
  }
  // GitHub Pages serves this app as the 404 page; anything that isn't the
  // homepage or the admin goes to the homepage, keeping its #section.
  if (pathname !== '/' && pathname !== '/index.html' && !isAdminPath(pathname)) {
    window.location.replace(`/${hash}`);
  }
}

function usePath() {
  const [path, setPath] = useState(() => { tidyAddress(); return window.location.pathname; });
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  useEffect(() => {
    if (!isAdminPath(path)) return undefined;
    // Inside the admin, links to /admin/… switch pages without reloading.
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="/admin"]');
      if (!a || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const href = a.getAttribute('href');
      if (href !== window.location.pathname) window.history.pushState(null, '', href);
      setPath(window.location.pathname);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [path]);
  return path;
}

/** Starts Google Analytics on the public site only. */
function PublicAnalytics() {
  useEffect(() => { startAnalytics(); }, []);
  return null;
}

export default function App() {
  const path = usePath();

  if (isAdminPath(path)) {
    const [, , section = '', param = ''] = path.split('/');
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
        <AdminApp route={[section, decodeURIComponent(param)]} />
      </Suspense>
    );
  }

  return (
    <SiteContentProvider>
      <Intro />
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <About />
        <Music />
        <Videos />
        <Gallery />
        <Booking />
        <Newsletter />
      </main>
      <Footer />
      <PublicAnalytics />
      <CookieNotice />
    </SiteContentProvider>
  );
}
