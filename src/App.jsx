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
import { SiteContentProvider } from './lib/siteContent.jsx';

// The admin panel is loaded only when someone opens #admin, so visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();

  if (hash.startsWith('#admin')) {
    const [, section = '', param = ''] = hash.slice(1).split('/');
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
    </SiteContentProvider>
  );
}
