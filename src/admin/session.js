// Team sign-in with Supabase Auth (email + password), kept fresh in the background.

import { SB_URL, sbHeaders, supabaseConfigured } from '../lib/supabase.js';

const KEY = 'bbo-admin-session';
let memory = null;

function save(session) {
  memory = session;
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch { /* private browsing: keep it in memory only */ }
}

export function loadSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') || memory; } catch { return memory; }
}

function toSession(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: { id: data.user?.id, email: data.user?.email },
  };
}

async function authRequest(path, { method = 'POST', body, token } = {}) {
  try {
    const res = await fetch(`${SB_URL}/auth/v1/${path}`, {
      method,
      headers: sbHeaders(token, { 'Content-Type': 'application/json' }),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

function authError({ status, data }) {
  const code = data?.error_code || data?.code;
  if (status === 0) return 'Could not reach the server. Check your connection and try again.';
  if (code === 'invalid_credentials' || status === 400) return 'That email and password do not match. Check them and try again.';
  if (status === 429) return 'Too many attempts. Wait a few minutes, then try again.';
  if (code === 'same_password') return 'Choose a password different from your current one.';
  if (code === 'weak_password') return 'Choose a longer password (at least 10 characters).';
  return data?.msg || data?.message || 'Signing in did not work. Try again in a moment.';
}

export async function signIn(email, password) {
  if (!supabaseConfigured) return { ok: false, error: 'The admin panel is not connected to its database yet.' };
  const res = await authRequest('token?grant_type=password', { body: { email: email.trim().toLowerCase(), password } });
  if (!res.ok) return { ok: false, error: authError(res) };
  const session = toSession(res.data);
  save(session);
  return { ok: true, session };
}

let refreshing = null;

/** Returns a session whose access token is valid for at least a minute, or null. */
export async function getValidSession() {
  const session = loadSession();
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session;
  if (!refreshing) {
    refreshing = authRequest('token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } })
      .then((res) => {
        if (!res.ok) { if (res.status !== 0) save(null); return res.status === 0 ? session : null; }
        const next = toSession(res.data);
        save(next);
        return next;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function signOut() {
  const session = loadSession();
  save(null);
  if (session) await authRequest('logout', { token: session.access_token });
}

export async function changePassword(password) {
  const session = await getValidSession();
  if (!session) return { ok: false, error: 'Your session has expired. Sign in again.' };
  const res = await authRequest('user', { method: 'PUT', body: { password }, token: session.access_token });
  return res.ok ? { ok: true } : { ok: false, error: authError(res) };
}
