# BBO — Official Website

The official website of **BBO (Bakare Boluwatife Oluwatobi)**, gospel music minister, worship leader and songwriter.
Built with React and Vite, hosted free on GitHub Pages, and deployed automatically on every push to `main`. It replaces the Wix site at `gabriel6145.wixsite.com/thebbobrand`.

**Live site:** https://gabgab11.github.io/bbo-official-website/

## What's on the site

| Section | What it does |
| --- | --- |
| Welcome | Music notes that gather into "BBO", once per visit (skippable) |
| Home | Full-screen hero with photos that crossfade every 10 seconds, the artist name, featured release (*Renewed Faith*), and Listen / Watch / Book buttons |
| About | Biography, ministry story, a press quote (ThisDay, 2024) and key facts |
| Music | *Renewed Faith* with a live Spotify player, streaming links and a list of releases with official store links |
| Videos | A player with a playlist of 12 videos: the 9 from the old site plus 3 found on YouTube. Videos load only when played (privacy-enhanced `youtube-nocookie.com`) |
| Gallery | Slideshow of 15 photographs: gentle motion, swipe, arrows, pause and a full-screen viewer |
| Booking | Event request form that saves to a Supabase database |
| Newsletter | Email sign-up with consent, saved to the same database |
| Footer | Navigation, streaming platforms, social profiles and booking link |

## Project structure

```
├── .github/workflows/deploy.yml   Build + deploy to GitHub Pages on push to main
├── index.html                     SEO, Open Graph, structured data (schema.org MusicGroup)
├── public/                        Favicon, app icons, web manifest (and media/ once photos are pulled)
├── scripts/pull-media.mjs         Downloads the original photos from Wix into public/media/
├── src/
│   ├── data/content.js            ← Edit text, links, releases and videos here
│   ├── data/media-files.mjs       ← Photo list (recovered from the Wix site)
│   ├── data/media.js              Chooses self-hosted or original photo URLs
│   ├── lib/forms.js               Sends form data to Supabase
│   ├── components/                Header, Hero, About, Music, Videos, Gallery, Booking, Newsletter, Footer
│   └── styles/global.css          Design tokens and all styles
├── supabase/migrations/           Database schema and security rules for the forms
└── vite.config.js                 Relative base path, sitemap/robots/404 generation
```

## Run it locally

Requires Node.js 20.19 or newer.

```bash
npm install
cp .env.example .env          # then paste the publishable key (see "Forms" below)
npm run media:pull            # optional: download the original photos
npm run dev                   # http://localhost:5173
npm run build && npm run preview
```

## Updating content

Almost everything lives in `src/data/content.js`:

- **New release:** add an entry to `releases` (title, credit, kind, year, link). Use the official store or smart link.
- **New video:** add `{ id: 'YOUTUBE_ID', title, credit }` to `videos`. The ID is the part after `watch?v=`.
- **Featured release:** change `featured` (title, description, link).
- **Photos:** save two sizes of the photo in `public/media/` as `name-800.jpg` and `name-1600.jpg` (800 and 1600 pixels wide), then add `{ local: 'name', w, h, alt }` to `src/data/media-files.mjs`.
- **Home page photos:** the hero crossfades between the photos in `heroSlides` (in `src/data/media-files.mjs`) every 10 seconds. Add or reorder entries there; `pos` / `posMobile` choose which part of the photo stays in view, and `mono: true` shows a colour photo in black and white.
- **Gallery:** the slideshow plays the `gallery` list in order (6 seconds per photo; visitors can swipe, use the arrows, pause, or tap a photo to view it full screen).
- **Welcome screen:** music notes gather into "BBO" on the first visit of each browser session (`src/components/Intro.jsx`). It is skipped for visitors who have reduced motion turned on; to switch it off entirely, delete `<Intro />` from `src/App.jsx`.

Push to `main` and the site rebuilds in about two minutes.

## Forms (booking and newsletter)

GitHub Pages can't run server code, so both forms send data directly to a dedicated **Supabase** project:

- Project: `bbo-official-website` (ref `yijgkqzdnjpewtdsyach`, region London), free plan
- Tables: `booking_inquiries`, `newsletter_subscribers`
- **Read submissions:** Supabase dashboard → Table Editor. Bookings have a `status` column (`new`, `contacted`, `confirmed`, `declined`) you can update as you work through them. Export subscribers as CSV for your email tool.

**Security.** The website uses only the *publishable* key, which is designed to be public. Row Level Security means the website can add a booking request and call `subscribe_newsletter` (which ignores repeat sign-ups) — it cannot read, change or delete anything. The key is not stored in the repository: GitHub Actions reads it from repository variables. Never put the `service_role` / secret key in this project.

Repository variables (Settings → Secrets and variables → Actions → **Variables**):

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://yijgkqzdnjpewtdsyach.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API Keys → publishable key (`sb_publishable_…`) |

If these are missing the site still builds, and the forms show a clear "temporarily unavailable" message instead of failing silently.

**Optional: email alerts for new bookings.** In Supabase, Database → Webhooks → create a webhook on `INSERT` into `booking_inquiries` that calls an email service (for example a Supabase Edge Function using Resend). This needs a sending domain and the inbox address bookings should go to.

**Spam protection.** The booking form has a hidden honeypot field and ignores submissions made within three seconds of loading; the database enforces field lengths and email format.

## Photos

The original photographs are recovered from the Wix media library. The deploy workflow runs `npm run media:pull` before every build, which downloads them into `public/media/` so the live site serves them itself. If a download ever fails, that photo falls back to its original Wix URL rather than breaking.

The same step trims the white frame that is baked into the two portrait files, and builds `og-share.jpg`, the 1200×630 image shown when the site is shared on WhatsApp, Facebook or X (black ground, "BBO" in Bodoni Moda, the black-and-white portrait). The code is in `scripts/share-image.mjs`.

To make the site fully independent of Wix before you close the Wix account, run this once on your own computer and commit the result:

```bash
npm run media:pull
git add public/media src/data/media-manifest.json
git commit -m "Self-host original photographs"
git push
```

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` (and can be started manually from the Actions tab): install → pull photos → build → publish to GitHub Pages. In **Settings → Pages**, the source must be **GitHub Actions**.

Vite uses a relative base path (`./`). Because the site is a single page that navigates with `#anchors`, the same build works at `/bbo-official-website/` on GitHub Pages and at the root of a custom domain, with no routing changes. Unknown URLs get a `404.html` that sends visitors to the homepage. `robots.txt` and `sitemap.xml` are generated at build time with the correct site address.

## Using a custom domain (for example officialbbo.com)

1. Create `public/CNAME` containing just the domain, e.g. `officialbbo.com`, and push.
2. At your domain registrar, add DNS records for GitHub Pages: four `A` records for the apex (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a `CNAME` record for `www` pointing to `gabgab11.github.io`. Check GitHub's current guidance: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site
3. In **Settings → Pages**, enter the domain and tick **Enforce HTTPS** once the certificate is issued.

The workflow detects `public/CNAME` and switches canonical, Open Graph and sitemap URLs to the custom domain automatically.

## Content sources

Content was carried over from the existing Wix site and checked against BBO's official profiles. Nothing was invented; anything that couldn't be verified was left out.

- **From the Wix site:** biography summary, all 9 videos, 11 gallery photos and 3 portraits, Spotify, Instagram, YouTube, TikTok and Facebook links, booking and newsletter fields.
- **Streaming profiles:** [Spotify](https://open.spotify.com/artist/2uaQ0i7hnhD1rRwDOSCkOd), [Apple Music](https://music.apple.com/us/artist/bbo/1555520275), [YouTube Music](https://music.youtube.com/channel/UCPzuFoh98yLRy_sMOL6NO1g), [Deezer](https://www.deezer.com/artist/12869397). Release titles and store links come from these catalogues; ORO and Orun Si links come from the descriptions of BBO's own YouTube uploads.
- **Biography:** expanded from BBO's YouTube Music artist bio and Nigerian press profiles, keeping only facts that several sources agree on (Ijebu origin, MC and acting before ministry, the 2020 lockdown and *Most High*, collaborations). The quote is from [ThisDay, 31 October 2024](https://www.thisdaylive.com/2024/10/31/one-of-my-deepest-desires-is-to-see-jesus-manifest-through-my-music-bbo/).
- **Added videos:** *Amin (Amen)* live, *Ka Ma Ma Ri* (Tope Alabi featuring BBO and Eyitayo) and *DODOnDAWA* (Testimony Jaga and BBO).

Please review the biography before launch; BBO's team knows the story best.

## Accessibility and performance

Semantic landmarks, skip link, visible focus styles, labelled form fields with inline error messages, `aria-live` status messages, keyboard-operable video playlist and photo viewer (arrow keys, Escape), reduced-motion support, and colour contrast of at least 4.5:1 for body text. Images are responsive (`srcset`), lazy-loaded and sized to prevent layout shift; YouTube and Spotify load only when needed.
