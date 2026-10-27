// Data access for the admin panel, as the signed-in team member.

import { BUCKET, SB_URL, rest, sbHeaders } from '../lib/supabase.js';
import { getValidSession } from './session.js';

const WITH_UPDATED_AT = new Set(['gallery_photos', 'releases', 'videos']);

let onExpired = () => {};
export const setExpiredHandler = (fn) => { onExpired = fn; };

async function call(path, opts = {}) {
  const session = await getValidSession();
  if (!session) { onExpired(); return { ok: false, error: 'Your session has expired. Sign in again.' }; }
  const res = await rest(path, { ...opts, token: session.access_token });
  if (res.status === 401) onExpired();
  return res;
}

export const api = {
  select: (table, query = 'select=*') => call(`${table}?${query}`),
  insert: (table, row) => call(table, { method: 'POST', body: row, prefer: 'return=representation' }),
  update: (table, id, patch, idColumn = 'id') =>
    call(`${table}?${idColumn}=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: WITH_UPDATED_AT.has(table) ? { ...patch, updated_at: new Date().toISOString() } : patch,
      prefer: 'return=representation',
    }),
  rpc: (fn, args = {}) => call(`rpc/${fn}`, { method: 'POST', body: args }),

  /** Uploads one file to the site-media bucket. */
  async upload(path, blob) {
    const session = await getValidSession();
    if (!session) { onExpired(); return { ok: false, error: 'Your session has expired. Sign in again.' }; }
    try {
      const res = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'POST',
        headers: sbHeaders(session.access_token, { 'Content-Type': blob.type || 'image/jpeg', 'Cache-Control': '31536000', 'x-upsert': 'false' }),
        body: blob,
      });
      if (res.ok) return { ok: true };
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.message || `Upload failed (${res.status}).` };
    } catch {
      return { ok: false, error: 'The upload was interrupted. Check your connection and try again.' };
    }
  },

  /** Deletes files from the site-media bucket. */
  async removeFiles(paths) {
    if (!paths.length) return { ok: true };
    const session = await getValidSession();
    if (!session) return { ok: false };
    try {
      const res = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: sbHeaders(session.access_token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefixes: paths }),
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  },
};

/** Moves an item to "Recently deleted". */
export const moveToBin = (table, id) => api.update(table, id, { deleted_at: new Date().toISOString() });
/** Brings an item back from "Recently deleted". */
export const restore = (table, id) => api.update(table, id, { deleted_at: null });
