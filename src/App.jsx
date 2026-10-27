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

export default function App() {
  return (
    <>
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
    </>
  );
}
