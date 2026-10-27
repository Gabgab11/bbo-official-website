import { useCallback, useEffect, useRef, useState } from 'react';
import Photo from './Photo.jsx';
import { gallery } from '../data/media.js';
import { socials } from '../data/content.js';
import { ArrowLeft, ArrowRight, CloseIcon } from './Icons.jsx';

export default function Gallery() {
  const dialogRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const instagram = socials.find((s) => s.label === 'Instagram');

  const open = (i) => {
    setCurrent(i);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = useCallback((d) => setCurrent((i) => (i + d + gallery.length) % gallery.length), []);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const onClose = () => setCurrent(null);
    dlg.addEventListener('keydown', onKey);
    dlg.addEventListener('close', onClose);
    return () => {
      dlg.removeEventListener('keydown', onKey);
      dlg.removeEventListener('close', onClose);
    };
  }, [step]);

  const photo = current === null ? null : gallery[current];

  return (
    <section className="section gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="gallery__head">
          <h2 className="section-title" id="gallery-title">Gallery</h2>
          <a className="text-link" href={instagram.href} target="_blank" rel="noopener noreferrer">
            More on Instagram<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </div>
        <ul className="gallery__grid">
          {gallery.map((p, i) => (
            <li className="gallery__item" key={p.file}>
              <button type="button" onClick={() => open(i)} aria-label={`Open photograph ${i + 1} of ${gallery.length}`}>
                <Photo photo={p} sizes="(max-width: 760px) 100vw, 60vw" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog ref={dialogRef} className="lightbox" aria-label="Photo viewer" onClick={(e) => e.target === e.currentTarget && close()}>
        {photo && (
          <>
            <div className="lightbox__bar">
              <span aria-live="polite">{current + 1} / {gallery.length}</span>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close photo viewer" autoFocus>
                <CloseIcon />
              </button>
            </div>
            <figure className="lightbox__figure">
              <Photo photo={photo} eager sizes="100vw" />
            </figure>
            <div className="lightbox__nav">
              <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous photograph"><ArrowLeft /></button>
              <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next photograph"><ArrowRight /></button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
