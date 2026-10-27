import { useEffect, useState } from 'react';
import { getChoice, setChoice } from '../lib/analytics.js';

/** A small, non-blocking notice asking visitors whether Analytics may use cookies. */
export default function CookieNotice() {
  const [open, setOpen] = useState(() => !getChoice());

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('bbo-cookie-settings', reopen);
    return () => window.removeEventListener('bbo-cookie-settings', reopen);
  }, []);

  if (!open) return null;
  const choose = (c) => { setChoice(c); setOpen(false); };

  return (
    <div className="cookie" role="region" aria-label="Cookie choice">
      <p>
        We use cookies to understand how people find and use this site, so we can make it better.
        No advertising, and nothing that identifies you.
      </p>
      <div className="cookie__actions">
        <button type="button" className="cookie__btn" onClick={() => choose('declined')}>Decline</button>
        <button type="button" className="cookie__btn cookie__btn--accept" onClick={() => choose('accepted')}>Accept</button>
      </div>
    </div>
  );
}
