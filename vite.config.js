import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The site is served from the root of www.officialbbo.com. The public site is
// one page that navigates with #anchors; the team's admin panel lives at /admin.
// GitHub Pages has no server-side routing, so the built index.html is copied
// to admin/ and each admin section's folder, and also used as 404.html (which
// covers /admin/join/<code> links and sends any other unknown address home).
// Absolute URLs (canonical, Open Graph, sitemap) come from VITE_SITE_URL, which
// the GitHub Actions workflow sets automatically (and switches to your custom
// domain when public/CNAME exists).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || 'https://gabgab11.github.io/bbo-official-website/').replace(/\/?$/, '/');

  const adminSections = ['bookings', 'photos', 'text', 'music', 'subscribers', 'deleted', 'team', 'account', 'join'];

  return {
    base: '/',
    plugins: [
      react(),
      {
        name: 'bbo-site-files',
        transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
        generateBundle() {
          const today = new Date().toISOString().slice(0, 10);
          this.emitFile({
            type: 'asset',
            fileName: 'robots.txt',
            source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}sitemap.xml\n`,
          });
          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
          });
        },
        closeBundle() {
          const dist = resolve(process.cwd(), 'dist');
          const page = resolve(dist, 'index.html');
          if (!existsSync(page)) return; // dev server: nothing to copy
          copyFileSync(page, resolve(dist, '404.html'));
          for (const dir of ['admin', ...adminSections.map((s) => `admin/${s}`)]) {
            mkdirSync(resolve(dist, dir), { recursive: true });
            copyFileSync(page, resolve(dist, dir, 'index.html'));
          }
        },
      },
    ],
    build: {
      target: 'es2020',
    },
  };
});
