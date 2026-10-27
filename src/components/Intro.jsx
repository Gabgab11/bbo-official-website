import { useCallback, useEffect, useRef, useState } from 'react';

// Welcome screen: music notes drift in from all sides and gather into the
// letters "BBO", resolve into the lettering itself, then the screen lifts away.
// Shown once per browser session; skipped entirely for reduced motion
// (index.html decides before the page paints, so there is no flash).

const GOLD = '#c9b37e';
const GOLD_SOFT = '#e3d4ab';
const IVORY = '#f5f0e6';
const FONT = '"Bodoni Moda", "Bodoni 72", Didot, Georgia, serif';
const SEEN_KEY = 'bbo-intro-seen';

const T_GATHER = 1500; // notes travelling
const T_LETTERS = 2350; // lettering appears
const T_LEAVE = 3500; // screen lifts away
const T_DONE = 4300;

const ease = (t) => 1 - (1 - t) ** 3;
const clamp = (v) => Math.min(1, Math.max(0, v));

/** Draws a note glyph centred on its head. kind: 0 quarter, 1 eighth, 2 sixteenth. */
function drawNote(ctx, kind, u) {
  const rx = u * 0.34;
  const ry = u * 0.24;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, -0.4, 0, Math.PI * 2);
  ctx.fill();
  const sx = rx * 0.86;
  const top = -u * 1.45;
  ctx.fillRect(sx - u * 0.045, top, u * 0.09, -top - ry * 0.3);
  for (let f = 0; f < kind; f++) {
    const y = top + f * u * 0.32;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.bezierCurveTo(sx + u * 0.05, y + u * 0.32, sx + u * 0.62, y + u * 0.42, sx + u * 0.38, y + u * 0.92);
    ctx.bezierCurveTo(sx + u * 0.5, y + u * 0.5, sx + u * 0.18, y + u * 0.38, sx, y + u * 0.3);
    ctx.fill();
  }
}

/** Points that fill the letters "BBO", sampled from rendered text. */
function letterPoints(width, height, fontSize, target) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = `600 ${fontSize}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  const m = g.measureText('BBO');
  const baseline = height / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 - height * 0.04;
  g.fillStyle = '#fff';
  g.fillText('BBO', width / 2, baseline);
  const data = g.getImageData(0, 0, width, height).data;

  // Pick a grid spacing that yields roughly `target` points.
  const area = m.width * (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
  let step = Math.max(4, Math.sqrt((area * 0.42) / target));
  let pts = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    pts = [];
    for (let y = 0; y < height; y += step) {
      for (let x = (Math.round(y / step) % 2) * (step / 2); x < width; x += step) {
        if (data[(Math.round(y) * width + Math.round(x)) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    if (pts.length > target * 1.25) step *= 1.12;
    else if (pts.length < target * 0.8) step *= 0.9;
    else break;
  }
  return { pts, step, baseline };
}

export default function Intro() {
  const [show, setShow] = useState(() => document.documentElement.classList.contains('intro'));
  const [leaving, setLeaving] = useState(false);
  const canvasRef = useRef(null);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* storage may be blocked */ }
    document.documentElement.classList.remove('intro');
    setLeaving(true);
    setTimeout(() => setShow(false), T_DONE - T_LEAVE);
  }, []);

  useEffect(() => {
    if (!show) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let cancelled = false;
    const timers = [];

    const start = async () => {
      // Wait briefly for the display font so the letters match the site.
      await Promise.race([
        document.fonts?.load(`600 200px ${FONT}`).catch(() => {}),
        new Promise((r) => setTimeout(r, 900)),
      ]);
      if (cancelled) return;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontSize = Math.min(W * 0.4, H * 0.34, 380);
      const target = W < 600 ? 95 : 150;
      const { pts, step, baseline } = letterPoints(W, H, fontSize, target);
      const u = step * 0.95;

      const notes = pts.map((p) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(W, H) * (0.55 + Math.random() * 0.5);
        return {
          tx: p.x,
          ty: p.y + u * 0.3,
          sx: W / 2 + Math.cos(angle) * dist,
          sy: H / 2 + Math.sin(angle) * dist,
          rot: (Math.random() - 0.5) * 2.4,
          swirl: (Math.random() - 0.5) * 160,
          delay: (p.x / W) * 380 + Math.random() * 260,
          kind: Math.random() < 0.45 ? 1 : Math.random() < 0.75 ? 0 : 2,
          color: Math.random() < 0.18 ? GOLD_SOFT : GOLD,
          scale: 0.85 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
        };
      });

      const t0 = performance.now();
      const frame = (now) => {
        const t = now - t0;
        ctx.clearRect(0, 0, W, H);

        // Notes travel in on gently curved paths, then settle with a faint sway.
        const notesFade = 1 - clamp((t - T_LETTERS) / 600);
        if (notesFade > 0) {
          for (const n of notes) {
            const p = ease(clamp((t - n.delay) / T_GATHER));
            if (p <= 0) continue;
            const arc = Math.sin(p * Math.PI) * n.swirl;
            const x = n.sx + (n.tx - n.sx) * p + arc;
            const y = n.sy + (n.ty - n.sy) * p - arc * 0.5;
            const sway = p >= 1 ? Math.sin(t / 420 + n.phase) * 0.06 : 0;
            ctx.save();
            ctx.globalAlpha = Math.min(1, p * 1.6) * notesFade;
            ctx.translate(x, y);
            ctx.rotate(n.rot * (1 - p) + sway);
            const s = n.scale * (1 - 0.35 * (1 - notesFade));
            ctx.scale(s, s);
            ctx.fillStyle = n.color;
            drawNote(ctx, n.kind, u);
            ctx.restore();
          }
        }

        // The lettering resolves where the notes gathered.
        const letters = clamp((t - T_LETTERS + 250) / 700);
        if (letters > 0) {
          ctx.save();
          ctx.globalAlpha = letters;
          ctx.fillStyle = IVORY;
          ctx.font = `600 ${fontSize}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.fillText('BBO', W / 2, baseline);
          ctx.restore();
        }

        if (!finished.current || t < T_DONE) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      timers.push(setTimeout(finish, T_LEAVE));
    };

    start();
    const onKey = () => finish();
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  }, [show, finish]);

  if (!show) return null;

  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}`} onClick={finish} role="presentation">
      <canvas ref={canvasRef} className="intro__canvas" aria-hidden="true" />
      <p className="intro__name">Bakare Boluwatife Oluwatobi</p>
      <button type="button" className="intro__skip" onClick={finish}>Skip intro</button>
    </div>
  );
}
