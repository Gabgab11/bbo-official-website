// Google Analytics 4 for the public website (never loaded on /admin).
//
// Uses Google's consent mode: until a visitor accepts the cookie notice,
// Analytics stores no cookies and sends only anonymous, cookieless pings.
// Advertising features are always off. No names, emails or phone numbers
// are ever sent; only event names and non-personal details.

export const GA_ID = 'G-JBFZMBD76W';
const CHOICE_KEY = 'bbo-cookie-choice'; // 'accepted' | 'declined'

export function getChoice() {
  try { return localStorage.getItem(CHOICE_KEY); } catch { return null; }
}

function gtag() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

let started = false;

export function startAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  const granted = getChoice() === 'accepted';
  gtag('consent', 'default', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('js', new Date());
  gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

export function setChoice(choice) {
  try { localStorage.setItem(CHOICE_KEY, choice); } catch { /* private mode */ }
  if (window.gtag) window.gtag('consent', 'update', { analytics_storage: choice === 'accepted' ? 'granted' : 'denied' });
  window.dispatchEvent(new Event('bbo-cookie-choice'));
}

/** Records an event, e.g. track('generate_lead', { event_type: 'Wedding' }). */
export function track(name, params = {}) {
  if (window.gtag) window.gtag('event', name, params);
}
