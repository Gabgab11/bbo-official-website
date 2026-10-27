import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The site is a single page that navigates with #anchors, so a relative base
// ('./') works both at https://<user>.github.io/bbo-official-website/ and on a
// custom domain at the root, with no routing configuration needed.
// Absolute URLs (canonical, Open Graph, sitemap) come from VITE_SITE_URL, which
// the GitHub Actions workflow sets automatically (and switches to your custom
// domain when public/CNAME exists).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || 'https://gabgab11.github.io/bbo-official-website/').replace(/\/?$/, '/');

  return {
    base: './',
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
            source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
          });
          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
          });
          // GitHub Pages serves 404.html for unknown paths; send visitors home,
          // keeping any #section (so old github.io admin and invite links still work).
          this.emitFile({
            type: 'asset',
            fileName: '404.html',
            source: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page not found — BBO</title><meta name="robots" content="noindex"><script>location.replace(${JSON.stringify(siteUrl)} + location.hash)</script><meta http-equiv="refresh" content="1; url=${siteUrl}"><link rel="canonical" href="${siteUrl}"></head><body style="background:#000;color:#f5f0e6;font-family:sans-serif;padding:2rem"><p>This page doesn’t exist. <a style="color:#c9b37e" href="${siteUrl}">Go to the BBO homepage</a>.</p></body></html>\n`,
          });
        },
      },
    ],
    build: {
      target: 'es2020',
    },
  };
});
