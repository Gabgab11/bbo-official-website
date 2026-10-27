// Adds security headers (as <meta> tags, since GitHub Pages can't send custom
// headers) to the built HTML. Inline scripts are allowed by their exact hash,
// so no other inline script can run.
import { createHash } from 'node:crypto';

export function withSecurityHeaders(html, supabaseUrl = '') {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  let supabase = '';
  try { supabase = new URL(supabaseUrl).origin; } catch { /* forms disabled */ }

  const csp = [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://static.wixstatic.com https://i.ytimg.com ${supabase}`.trim(),
    `connect-src 'self' ${supabase}`.trim(),
    'frame-src https://www.youtube-nocookie.com https://open.spotify.com',
    "media-src 'self'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  const tags = [
    `<meta http-equiv="Content-Security-Policy" content="${csp}" />`,
    '<meta name="referrer" content="strict-origin-when-cross-origin" />',
  ].join('\n    ');
  return html.replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}\n    ${tags}`);
}
