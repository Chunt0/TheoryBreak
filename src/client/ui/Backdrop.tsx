// The moving backgrounds the kit's themes pair with (rain, petals, embers…), drawn
// faintly on one canvas behind the app. Dots and none are plain CSS. Paused while the
// page is hidden; one still frame when the system asks for reduced motion.

import { useEffect, useRef } from 'react';
import { useStore } from '../app/store';
import { patternFor, resolveTheme, type Pattern } from '../app/themes';

interface Ctx {
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
  color: string;
  /** 0..1, how strong the theme wants it */
  k: number;
}
type Effect = (c: Ctx) => (c: Ctx, t: number) => void;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** particles per screen, scaled to its area (a 1280×720 screen gets `n`) */
const count = (c: Ctx, n: number) => Math.max(8, Math.round((n * c.w * c.h) / (1280 * 720)));

const rain: Effect = (c) => {
  const drops = Array.from({ length: count(c, 90) }, () => ({ x: rnd(0, c.w), y: rnd(0, c.h), len: rnd(10, 26), v: rnd(5, 10) }));
  return ({ g, w, h, color, k }) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = color;
    g.lineWidth = 1;
    for (const d of drops) {
      g.globalAlpha = (0.12 + (d.v - 5) / 40) * k;
      g.beginPath();
      g.moveTo(d.x, d.y);
      g.lineTo(d.x - d.len * 0.12, d.y + d.len);
      g.stroke();
      d.y += d.v;
      d.x -= d.v * 0.12;
      if (d.y > h) Object.assign(d, { y: -d.len, x: rnd(0, w + 40) });
    }
  };
};

const embers: Effect = (c) => {
  const make = (y = rnd(0, c.h)) => ({ x: rnd(0, c.w), y, r: rnd(0.8, 2.4), v: rnd(0.3, 1.1), drift: rnd(0, Math.PI * 2), life: rnd(0, 1) });
  const ps = Array.from({ length: count(c, 46) }, () => make());
  return ({ g, w, h, color, k }, t) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color;
    for (const p of ps) {
      const flicker = 0.55 + 0.45 * Math.sin(t * 0.004 + p.drift * 7);
      const fade = Math.min(1, p.y / (h * 0.5));
      g.globalAlpha = 0.1 * flicker * fade * k;
      g.beginPath();
      g.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 0.5 * flicker * fade * k;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
      p.y -= p.v;
      p.x += Math.sin(t * 0.001 + p.drift) * 0.35;
      if (p.y < -10) Object.assign(p, make(h + 10));
    }
  };
};

const petals: Effect = (c) => {
  const make = (y = rnd(0, c.h)) => ({ x: rnd(0, c.w), y, s: rnd(4, 8), rot: rnd(0, Math.PI), vr: rnd(-0.02, 0.02), v: rnd(0.35, 0.9), sway: rnd(0, Math.PI * 2) });
  const ps = Array.from({ length: count(c, 26) }, () => make());
  return ({ g, w, h, color, k }, t) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color;
    for (const p of ps) {
      g.globalAlpha = 0.3 * k;
      g.save();
      g.translate(p.x + Math.sin(t * 0.0012 + p.sway) * 14, p.y);
      g.rotate(p.rot);
      g.beginPath();
      g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
      p.y += p.v;
      p.rot += p.vr;
      if (p.y > h + 12) Object.assign(p, make(-12));
    }
  };
};

/** Points that drift and join their near neighbours: stars (slow, twinkling) or a network (faster, with pulses). */
const web = (opts: { n: number; speed: number; reach: number; twinkle: boolean; pulses: boolean }): Effect => (c) => {
  const ps = Array.from({ length: count(c, opts.n) }, () => ({ x: rnd(0, c.w), y: rnd(0, c.h), vx: rnd(-1, 1) * opts.speed, vy: rnd(-1, 1) * opts.speed, r: rnd(0.6, 1.8), ph: rnd(0, 7) }));
  let pulse = { a: 0, b: 1, at: 0 };
  return ({ g, w, h, color, k }, t) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = 1;
    const reach2 = opts.reach * opts.reach;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      for (let j = i + 1; j < ps.length; j++) {
        const q = ps[j];
        const d2 = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
        if (d2 > reach2) continue;
        g.globalAlpha = (1 - d2 / reach2) * 0.16 * k;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(q.x, q.y);
        g.stroke();
      }
    }
    for (const p of ps) {
      g.globalAlpha = (opts.twinkle ? 0.35 + 0.35 * Math.sin(t * 0.002 + p.ph) : 0.5) * k;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    if (opts.pulses) {
      // a spark runs along one link at a time
      const a = ps[pulse.a];
      const b = ps[pulse.b];
      const f = (t - pulse.at) / 900;
      if (f >= 1 || !a || !b || (a.x - b.x) ** 2 + (a.y - b.y) ** 2 > reach2) {
        const i = Math.floor(rnd(0, ps.length));
        const near = ps.findIndex((q, j) => j !== i && (q.x - ps[i].x) ** 2 + (q.y - ps[i].y) ** 2 < reach2);
        pulse = { a: i, b: near < 0 ? i : near, at: t };
      } else {
        g.globalAlpha = 0.8 * k * Math.sin(f * Math.PI);
        g.beginPath();
        g.arc(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  };
};

const flow: Effect = (c) => {
  const ps = Array.from({ length: count(c, 140) }, () => ({ x: rnd(0, c.w), y: rnd(0, c.h), age: rnd(0, 200) }));
  const angle = (x: number, y: number, t: number) => (Math.sin(x * 0.004 + t * 0.00012) * Math.cos(y * 0.005 - t * 0.0001) + Math.sin((x + y) * 0.0018 + t * 0.00007)) * Math.PI;
  return ({ g, w, h, color, k }, t) => {
    // fade what is there (the canvas stays see-through) and extend each trail a step
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 0.06;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.globalAlpha = 0.16 * k;
    g.beginPath();
    for (const p of ps) {
      const a = angle(p.x, p.y, t);
      const nx = p.x + Math.cos(a) * 1.4;
      const ny = p.y + Math.sin(a) * 1.4;
      g.moveTo(p.x, p.y);
      g.lineTo(nx, ny);
      Object.assign(p, { x: nx, y: ny, age: p.age + 1 });
      if (p.age > 260 || nx < 0 || nx > w || ny < 0 || ny > h) Object.assign(p, { x: rnd(0, w), y: rnd(0, h), age: 0 });
    }
    g.stroke();
  };
};

const sparkles: Effect = (c) => {
  const make = () => ({ x: rnd(0, c.w), y: rnd(0, c.h), s: rnd(3, 7), ph: rnd(0, Math.PI), v: rnd(0.012, 0.03) });
  const ps = Array.from({ length: count(c, 34) }, make);
  return ({ g, w, h, color, k }) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color;
    for (const p of ps) {
      const a = Math.sin(p.ph);
      if (a > 0) {
        const s = p.s * a;
        g.globalAlpha = 0.55 * a * k;
        g.beginPath();
        g.moveTo(p.x, p.y - s);
        g.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
        g.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
        g.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
        g.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
        g.fill();
      }
      p.ph += p.v;
      if (p.ph > Math.PI) Object.assign(p, make(), { ph: 0 });
    }
  };
};

const EFFECTS: Partial<Record<Pattern, Effect>> = {
  rain,
  embers,
  petals,
  constellations: web({ n: 70, speed: 0.06, reach: 110, twinkle: true, pulses: false }),
  synapse: web({ n: 54, speed: 0.25, reach: 150, twinkle: false, pulses: true }),
  'perlin-flow': flow,
  sparkles,
};

export function Backdrop() {
  const key = useStore((d) => d.settings.theme);
  const backdrop = useStore((d) => d.settings.backdrop);
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = resolveTheme(key);
  const pattern = patternFor(theme, backdrop);
  const effect = EFFECTS[pattern];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !effect) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx: Ctx = { g, w: 0, h: 0, color: theme.effect ?? theme.accent, k: theme.intensity ?? 0.5 };
    let step: ReturnType<Effect> | null = null;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      ctx.w = window.innerWidth;
      ctx.h = window.innerHeight;
      canvas.width = Math.round(ctx.w * dpr);
      canvas.height = Math.round(ctx.h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      step = effect(ctx);
      if (still) for (let i = 0; i < 40; i++) step(ctx, i * 33);
    };
    size();
    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      // about 30 frames a second is plenty for a background
      if (t - last < 32 || document.hidden) return;
      last = t;
      step?.(ctx, t);
    };
    if (!still) raf = requestAnimationFrame(frame);
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      g.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [effect, theme.key]);

  return effect ? <canvas ref={ref} className="s-backdrop" aria-hidden="true" /> : null;
}
