// Minimal Supabase client (REST, Auth and Storage over fetch).
// Uses only the PUBLIC publishable key. What each request may do is decided by
// the database's Row Level Security rules, not by this code.

export const SB_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || '';
export const SB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const supabaseConfigured = Boolean(SB_URL && SB_KEY);

export const BUCKET = 'site-media';

export function sbHeaders(token, extra = {}) {
  const h = { apikey: SB_KEY, ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  else if (SB_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SB_KEY}`; // legacy anon JWT keys
  return h;
}

/** Turns a Supabase error response into one readable sentence. */
export function errorMessage(data, status) {
  const raw = (data && (data.message || data.msg || data.error_description || data.error)) || '';
  if (/JWT expired|invalid JWT/i.test(raw)) return 'Your session has expired. Sign in again.';
  if (/permission denied|row-level security|not allowed/i.test(raw) || status === 401 || status === 403) {
    return raw && !/permission denied|row-level security/i.test(raw) ? raw : 'You do not have permission to do that.';
  }
  if (/duplicate key/i.test(raw)) return 'That already exists.';
  if (/violates check constraint/i.test(raw)) return 'One of the values is not in the right format.';
  return raw || `The server returned an error (${status}).`;
}

/**
 * Calls the REST API. Resolves to { ok, status, data, error } and never throws.
 * path: e.g. "releases?select=*&order=sort" or "rpc/admin_join"
 */
export async function rest(path, { method = 'GET', body, token, prefer, timeout = 15000 } = {}) {
  if (!supabaseConfigured) return { ok: false, status: 0, data: null, error: 'The site is not connected to its database yet.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const headers = sbHeaders(token, body !== undefined ? { 'Content-Type': 'application/json' } : {});
    if (prefer) headers.Prefer = prefer;
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return res.ok
      ? { ok: true, status: res.status, data, error: null }
      : { ok: false, status: res.status, data, error: errorMessage(data, res.status) };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err.name === 'AbortError' ? 'The request took too long. Check your connection and try again.' : 'Could not reach the server. Check your connection and try again.' };
  } finally {
    clearTimeout(timer);
  }
}

/** Public URL of a file in the site-media bucket. */
export const mediaUrl = (path) => `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
