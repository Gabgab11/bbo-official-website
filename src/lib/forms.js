// Sends form submissions to Supabase over its REST API.
// Only the PUBLIC publishable key is used here. Database Row Level Security
// lets the website add booking requests and newsletter sign-ups and nothing
// else; submissions can only be read from the Supabase dashboard.

const URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const formsConfigured = Boolean(URL && KEY);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Resolves to { ok: true } or { ok: false, reason: 'invalid' | 'network' | 'unavailable' | 'server' }. */
async function post(path, body) {
  if (!formsConfigured) return { ok: false, reason: 'unavailable' };

  const headers = { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  if (KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${KEY}`; // legacy anon JWT keys

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    if (res.ok) return { ok: true };
    if (res.status === 400) return { ok: false, reason: 'invalid' };
    return { ok: false, reason: 'server' };
  } catch {
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Saves a booking request to the booking_inquiries table. */
export const submitBooking = (row) => post('booking_inquiries', row);

/** Subscribes an email address. Repeat sign-ups are accepted and ignored. */
export const subscribe = (email) => post('rpc/subscribe_newsletter', { p_email: email, p_consent: true });
