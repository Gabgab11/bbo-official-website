import { useCallback, useEffect, useRef, useState } from 'react';
import Photo from './Photo.jsx';
import { gallery, photoKey } from '../data/media.js';
import { socials } from '../data/content.js';
import { ArrowLeft, ArrowRight, CloseIcon, PauseIcon, PlayIcon } from './Icons.jsx';
import { usePageVisible, useReducedMotion } from '../hooks/useMedia.js';

const INTERVAL = 6000;
const SWIPE = 40; // px

export default function Gallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // chosen by the visitor
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [viewer, setViewer] = useState(false);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const stageRef = useRef(null);
  const dialogRef = useRef(null);
  const thumbsRef = useRef(null);
  const touch = useRef(null);
  const lastSwipe = useRef(0);
  const instagram = socials.find((s) => s.label === 'Instagram');
  const count = gallery.length;

  const go = useCallback((d) => setIndex((i) => (i + d + count) % count), [count]);

  // Only run the slideshow while it is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (stageRef.current) io.observe(stageRef.current);
    return () => io.disconnect();
  }, []);

  const running = !paused && !hovering && inView && visible && !viewer && !reduced;
  useEffect(() => {
    if (!running) return undefined;
    const id = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(id);
  }, [running, index, go]);

  // Keep the active thumbnail in view.
  useEffect(() => {
    const el = thumbsRef.current?.children[index];
    if (!el || !thumbsRef.current) return;
    const strip = thumbsRef.current;
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [index, reduced]);

  // Swipe on touch screens.
  const onPointerDown = (e) => { touch.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - t.y)) {
      lastSwipe.current = Date.now();
      go(dx < 0 ? 1 : -1);
    }
  };

  // A tap (not a swipe) on the photo opens it full screen.
  const openViewer = () => {
    if (Date.now() - lastSwipe.current < 400 || dialogRef.current?.open) return;
    setViewer(true);
    dialogRef.current?.showModal();
  };
  const closeViewer = () => dialogRef.current?.close();

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  useEffect(() => {
    const dlg = dialogRef.current;
    const onClose = () => setViewer(false);
    dlg?.addEventListener('close', onClose);
    return () => dlg?.removeEventListener('close', onClose);
  }, []);

  // Only keep the current photo and its neighbours in the page.
  const near = (i) => [index, (index + 1) % count, (index - 1 + count) % count].includes(i);

  return (
    <section className="section gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="gallery__head">
          <h2 className="section-title" id="gallery-title">Gallery</h2>
          <a className="text-link" href={instagram.href} target="_blank" rel="noopener noreferrer">
            More on Instagram<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </div>

        <div
          className={`slideshow${running ? ' is-running' : ''}`}
          ref={stageRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Photographs of BBO"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onKeyDown={onKeyDown}
        >
          <div
            className="slideshow__stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { touch.current = null; }}
          >
            {gallery.map((p, i) =>
              near(i) ? (
                <figure
                  key={photoKey(p)}
                  className={`slide${i === index ? ' is-active' : ''}`}
                  aria-hidden={i !== index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                >
                  <Photo photo={p} alt="" className="slide__backdrop" sizes="10vw" />
                  <Photo photo={p} className="slide__img" sizes="(max-width: 760px) 100vw, 80vw" draggable="false" />
                </figure>
              ) : null,
            )}
            <button type="button" className="slideshow__zoom" onClick={openViewer}>
              <span className="visually-hidden">View photograph {index + 1} full screen</span>
            </button>
          </div>

          <div className="slideshow__bar">
            <span className="slideshow__count" aria-live="polite">
              {String(index + 1).padStart(2, '0')} <span>/ {String(count).padStart(2, '0')}</span>
            </span>
            <div className="slideshow__progress" aria-hidden="true">
              <span key={`${index}-${running}`} className={running ? 'is-filling' : ''} style={{ animationDuration: `${INTERVAL}ms` }} />
            </div>
            <div className="slideshow__controls">
              <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous photograph"><ArrowLeft /></button>
              {!reduced && (
                <button type="button" className="icon-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
                  {paused ? <PlayIcon /> : <PauseIcon />}
                </button>
              )}
              <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next photograph"><ArrowRight /></button>
            </div>
          </div>

          <ol className="slideshow__thumbs" ref={thumbsRef} aria-label="Choose a photograph">
            {gallery.map((p, i) => (
              <li key={photoKey(p)}>
                <button type="button" onClick={() => setIndex(i)} aria-current={i === index ? 'true' : undefined} aria-label={`Show photograph ${i + 1}`}>
                  <Photo photo={p} alt="" sizes="120px" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <dialog ref={dialogRef} className="lightbox" aria-label="Photo viewer" onClick={(e) => e.target === e.currentTarget && closeViewer()} onKeyDown={onKeyDown}>
        {viewer && (
          <>
            <div className="lightbox__bar">
              <span aria-live="polite">{index + 1} / {count}</span>
              <button type="button" className="icon-btn" onClick={closeViewer} aria-label="Close photo viewer" autoFocus><CloseIcon /></button>
            </div>
            <figure className="lightbox__figure" onPointerDown={onPointerDown} onPointerUp={(e) => {
              const t = touch.current; touch.current = null;
              if (t && Math.abs(e.clientX - t.x) > SWIPE) go(e.clientX - t.x < 0 ? 1 : -1);
            }}>
              <Photo photo={gallery[index]} eager sizes="100vw" draggable="false" />
            </figure>
            <div className="lightbox__nav">
              <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous photograph"><ArrowLeft /></button>
              <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next photograph"><ArrowRight /></button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
