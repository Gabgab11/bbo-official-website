// Sends form submissions to Supabase. Database Row Level Security lets the
// public website add booking requests and newsletter sign-ups and nothing
// else; submissions are read in the admin panel.

import { rest, supabaseConfigured } from './supabase.js';

export const formsConfigured = supabaseConfigured;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Resolves to { ok: true } or { ok: false, reason: 'invalid' | 'limited' | 'network' | 'unavailable' | 'server' }. */
async function post(path, body) {
  if (!formsConfigured) return { ok: false, reason: 'unavailable' };
  const res = await rest(path, { method: 'POST', body, prefer: 'return=minimal' });
  if (res.ok) return { ok: true };
  if (res.status === 0) return { ok: false, reason: 'network' };
  if (res.data?.hint === 'rate_limited') return { ok: false, reason: 'limited', message: res.data.message };
  if (res.status === 400) return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'server' };
}

/** Saves a booking request. */
export const submitBooking = (row) => post('booking_inquiries', row);

/** Subscribes an email address. Repeat sign-ups are accepted and ignored. */
export const subscribe = (email) => post('rpc/subscribe_newsletter', { p_email: email, p_consent: true });
