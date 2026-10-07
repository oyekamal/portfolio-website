import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './Slime.css';

/*
 * Kamil, a jelly slime that lives on the page.
 * One rAF loop owns everything: position (hop / perch / fling), body squash, rim jiggle, eyes.
 * React only renders the speech bubble.
 *
 * Props:
 *   perch   – CSS selector of the element to sit on (null = home spot)
 *   say     – text for the speech bubble (null = hidden)
 *   mood    – 'idle' | 'happy' | 'wink' | 'sleepy' | 'wow'
 *   onPoke  – called when Kamil is clicked (not dragged)
 */

const N = 16;                 // rim points
const W = 120, H = 110;       // svg box; feet at (60, 100)
const FEET_X = 60, FEET_Y = 100;
const RX = 44, RY = 40;       // body radii
const CY = FEET_Y - RY * 0.62; // body centre; the belly is flattened onto the floor

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function rimPath(off, sx, sy) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 1 + off[i];
    let x = Math.cos(a) * RX * r;
    let y = Math.sin(a) * RY * r;
    if (y > 0) y *= 0.62; // flat-ish belly: slimes sit, they don't roll
    x = FEET_X + x * sx;
    y = FEET_Y + (CY - FEET_Y + y) * sy;
    pts.push([x, Math.min(y, FEET_Y)]);
  }
  // closed Catmull-Rom → cubic Béziers
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

const MOUTH = {
  idle: 'M52 76 Q60 83 68 76',
  happy: 'M50 74 Q60 88 70 74 Z',
  wink: 'M52 76 Q60 83 68 76',
  sleepy: 'M57 78 Q60 80 63 78',
  wow: 'M56 77 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0',
};

export default function Slime({ perch, say, mood, onPoke }) {
  const root = useRef(null);
  const rig = useRef(null);
  const body = useRef(null);
  const depth = useRef(null);
  const shine = useRef(null);
  const face = useRef(null);
  const pupils = useRef([]);
  const lids = useRef([]);
  const shadow = useRef(null);
  const mouth = useRef(null);
  const props = useRef({ perch, mood, onPoke });
  useLayoutEffect(() => { props.current = { perch, mood, onPoke }; });
  const [side, setSide] = useState('left');

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = () => window.innerWidth < 700;
    const scale = () => (small() ? 0.72 : 1.1);

    const s = {
      x: window.innerWidth - 110, y: -140,      // feet position, viewport px. Starts above the screen: drops in.
      vx: 0, vy: 0,
      mode: 'fall',                             // fall | hop | perch | drag | fling
      hop: null,
      sx: 1, sy: 1, vsx: 0, vsy: 0,             // squash springs
      off: new Float32Array(N), voff: new Float32Array(N),
      look: [0, 0], pointer: [window.innerWidth / 2, window.innerHeight / 2],
      blinkAt: performance.now() + 1500, blink: 0,
      t: 0, last: performance.now(),
      drag: null, lastScroll: window.scrollY,
      nextIdle: performance.now() + 3500, glance: null,
    };

    const home = () => [window.innerWidth - (small() ? 64 : 96), window.innerHeight - (small() ? 12 : 20)];
    const target = () => {
      const sel = props.current.perch;
      const el = sel && document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.bottom > 60 && r.top < window.innerHeight - 40) {
          return [clamp(r.right - 64 * scale() - 8, 40, window.innerWidth - 40), r.top + 2];
        }
      }
      return home();
    };

    const kick = (amount, dir = 1) => { // radial jiggle
      for (let i = 0; i < N; i++) s.voff[i] += (Math.random() - 0.5) * amount + (dir * amount * Math.sin((i / N) * Math.PI * 2)) * 0.3;
    };
    const land = (impact) => {
      s.vsy -= impact * 0.9; s.vsx += impact * 0.7;
      kick(impact * 0.6);
    };

    const startHop = ([tx, ty]) => {
      const dist = Math.hypot(tx - s.x, ty - s.y);
      s.hop = { x0: s.x, y0: s.y, tx, ty, t0: performance.now(), dur: clamp(dist * 1.1, 380, 820), h: 40 + dist * 0.18 };
      s.mode = 'hop';
      s.vsy += 0.25; s.vsx -= 0.18; // pre-jump stretch
    };

    // ---- input -------------------------------------------------------------
    const onMove = (e) => {
      s.pointer = [e.clientX, e.clientY];
      if (s.drag) {
        const now = performance.now(), dt = Math.max(8, now - s.drag.t);
        s.vx = ((e.clientX - s.drag.px) / dt) * 16; s.vy = ((e.clientY - s.drag.py) / dt) * 16;
        s.x = e.clientX - s.drag.dx; s.y = e.clientY - s.drag.dy;
        s.drag.px = e.clientX; s.drag.py = e.clientY; s.drag.t = now;
        if (Math.hypot(e.clientX - s.drag.sx0, e.clientY - s.drag.sy0) > 6) s.drag.moved = true;
      }
    };
    const onDown = (e) => {
      if (still) { props.current.onPoke?.(); return; }
      e.preventDefault();
      root.current.setPointerCapture?.(e.pointerId);
      s.drag = { dx: e.clientX - s.x, dy: e.clientY - s.y, px: e.clientX, py: e.clientY, sx0: e.clientX, sy0: e.clientY, t: performance.now(), moved: false };
      s.mode = 'drag'; s.vsy -= 0.15; kick(0.12);
    };
    const onUp = () => {
      if (!s.drag) return;
      const moved = s.drag.moved; s.drag = null;
      if (!moved) { s.mode = 'perch'; land(0.5); props.current.onPoke?.(); return; }
      s.mode = 'fling'; s.flingRest = 0;
    };
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); land(0.5); props.current.onPoke?.(); } };

    const el = root.current;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('keydown', onKey);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);

    // ---- loop ----------------------------------------------------------------
    let raf;
    const step = (now) => {
      if (!rig.current || !body.current || !shadow.current) return; // unmounted: refs are cleared before effects clean up
      const dt = Math.min(32, now - s.last) / 16.67; s.last = now; s.t += dt;
      const sc = scale();
      const floor = window.innerHeight - (small() ? 12 : 20);
      const mood = props.current.mood;

      if (still) {
        [s.x, s.y] = target();
      } else if (s.mode === 'fall' || s.mode === 'fling') {
        s.vy += 0.9 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        s.vx *= 0.995;
        const half = 50 * sc;
        if (s.x < half) { s.x = half; s.vx = -s.vx * 0.6; s.vsx -= 0.3; kick(0.25); }
        if (s.x > window.innerWidth - half) { s.x = window.innerWidth - half; s.vx = -s.vx * 0.6; s.vsx -= 0.3; kick(0.25); }
        if (s.y < 90 * sc) { s.y = 90 * sc; s.vy = Math.abs(s.vy) * 0.5; }
        if (s.y >= floor) {
          s.y = floor;
          if (Math.abs(s.vy) > 3) { land(clamp(s.vy / 30, 0.15, 0.7)); s.vy = -s.vy * 0.42; s.vx *= 0.8; }
          else { s.vy = 0; s.vx *= 0.85; s.flingRest += dt; }
          if (s.mode === 'fall' && Math.abs(s.vy) < 3) { s.mode = 'perch'; }
          if (s.flingRest > 50) { s.mode = 'perch'; }
        }
      } else if (s.mode === 'hop') {
        const h = s.hop, k = clamp((now - h.t0) / h.dur, 0, 1);
        const tgt = target(); h.tx = tgt[0]; h.ty = tgt[1]; // target may scroll mid-air
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        s.x = lerp(h.x0, h.tx, e);
        s.y = lerp(h.y0, h.ty, e) - Math.sin(Math.PI * k) * h.h;
        s.sy = 1 + Math.sin(Math.PI * k) * 0.12; s.sx = 1 - Math.sin(Math.PI * k) * 0.08;
        if (k >= 1) { s.mode = 'perch'; land(0.45); }
      } else if (s.mode === 'perch') {
        const [tx, ty] = target();
        const d = Math.hypot(tx - s.x, ty - s.y);
        if (d > 70) startHop([tx, ty]);
        else { s.x = lerp(s.x, tx, 0.35); s.y = lerp(s.y, ty, 0.5); } // stick to the card while it scrolls
        // little bits of life while sitting still
        if (now > s.nextIdle && mood !== 'sleepy') {
          s.nextIdle = now + 3800 + Math.random() * 4200;
          const r = Math.random();
          if (r < 0.4) { s.hop = { x0: s.x, y0: s.y, tx, ty, t0: now, dur: 420, h: 26 }; s.mode = 'hop'; s.vsy += 0.2; }
          else if (r < 0.75) { s.glance = { until: now + 900, dx: Math.random() < 0.5 ? -3.4 : 3.4 }; }
          else { kick(0.22); s.vsx += 0.12; }
        }
      }

      // scroll makes the jelly slosh
      const sv = window.scrollY - s.lastScroll; s.lastScroll = window.scrollY;
      if (Math.abs(sv) > 2) { for (let i = 0; i < N; i++) s.voff[i] += sv * 0.0009 * Math.cos((i / N) * Math.PI * 2); }

      // squash springs (stiff, underdamped → bouncy)
      if (s.mode !== 'hop') {
        const breathe = mood === 'sleepy' ? Math.sin(s.t * 0.05) * 0.035 : Math.sin(s.t * 0.08) * 0.018;
        s.vsx += ((1 - s.sx) * 0.16 - s.vsx * 0.16) * dt; s.vsy += ((1 + breathe - s.sy) * 0.16 - s.vsy * 0.16) * dt;
        s.sx += s.vsx * dt; s.sy += s.vsy * dt;
      }
      // rim springs
      for (let i = 0; i < N; i++) {
        const l = s.off[(i + N - 1) % N], r = s.off[(i + 1) % N];
        s.voff[i] += (-s.off[i] * 0.12 + (l + r - 2 * s.off[i]) * 0.06 - s.voff[i] * 0.1) * dt;
        s.off[i] += s.voff[i] * dt;
      }
      if (s.mode === 'drag') kick(0.004);

      // eyes look at the pointer
      const ex = s.x, ey = s.y - 60 * sc;
      const ang = Math.atan2(s.pointer[1] - ey, s.pointer[0] - ex);
      const dist = clamp(Math.hypot(s.pointer[0] - ex, s.pointer[1] - ey) / 140, 0, 1);
      const glancing = s.glance && now < s.glance.until;
      s.look[0] = lerp(s.look[0], glancing ? s.glance.dx : Math.cos(ang) * 3.2 * dist, 0.2);
      s.look[1] = lerp(s.look[1], glancing ? -1 : Math.sin(ang) * 2.6 * dist, 0.2);

      // blink
      if (now > s.blinkAt) { s.blink = 1; s.blinkAt = now + 2200 + Math.random() * 3200; }
      s.blink = Math.max(0, s.blink - 0.12 * dt);
      const closed = mood === 'sleepy' ? 0.85 : Math.sin(s.blink * Math.PI);

      // ---- paint ----
      const tilt = s.mode === 'fling' || s.mode === 'drag' ? clamp(s.vx * 0.6, -18, 18) : 0;
      el.style.transform = `translate(${(s.x - FEET_X).toFixed(1)}px, ${(s.y - FEET_Y).toFixed(1)}px)`;
      el.style.setProperty('--sc', sc);
      rig.current.style.transform = `scale(${sc}) rotate(${tilt.toFixed(1)}deg)`;
      const d = rimPath(s.off, s.sx, s.sy);
      body.current.setAttribute('d', d); depth.current.setAttribute('d', d);
      const faceY = (1 - s.sy) * 30, faceX = s.look[0] * 0.9;
      face.current.setAttribute('transform', `translate(${faceX.toFixed(2)} ${(faceY + s.look[1] * 0.5).toFixed(2)})`);
      shine.current.setAttribute('transform', `translate(${(faceX * 0.4).toFixed(2)} ${(faceY * 0.8).toFixed(2)})`);
      pupils.current.forEach((p) => p && p.setAttribute('transform', `translate(${s.look[0].toFixed(2)} ${s.look[1].toFixed(2)})`));
      lids.current.forEach((l, i) => {
        if (!l) return;
        const winkShut = mood === 'wink' && i === 1;
        l.setAttribute('transform', `scale(1 ${winkShut ? 0.12 : (1 - closed * 0.9).toFixed(3)})`);
      });
      const air = clamp((floor - s.y) / 300, 0, 1);
      shadow.current.style.opacity = s.mode === 'perch' && s.y < floor - 4 ? 0.35 : (0.5 - air * 0.4).toFixed(2);
      shadow.current.setAttribute('rx', (34 * s.sx * (1 - air * 0.5)).toFixed(1));

      // bubble side: keep it on screen
      const vw = window.innerWidth, bw = Math.min(230, vw - 32);
      const roomRight = vw - (s.x + 34 * sc) > bw + 16, roomLeft = s.x - 34 * sc > bw + 16;
      let want = roomRight ? 'right' : roomLeft ? 'left' : 'center';
      if (want === 'center') el.style.setProperty('--bl', `${clamp(s.x - bw / 2, 16, vw - 16 - bw) - (s.x - FEET_X)}px`);
      want += s.y < 170 ? ' below' : '';
      if (want !== s.side) { s.side = want; setSide(want); }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // land on first paint once the hop target exists
    const onResize = () => { if (s.mode === 'perch') startHop(target()); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => { if (mouth.current) mouth.current.setAttribute('d', MOUTH[mood] || MOUTH.idle); }, [mood]);

  return (
    <div
      ref={root}
      className={`slime mood-${mood}`}
      role="button"
      tabIndex={0}
      aria-label="Kamil, Muhammad's AI agent. Click to visit his planet, drag to throw."
    >
      {say && <p className={`slime-say ${side}`} aria-live="polite">{say}</p>}
      <div ref={rig} className="slime-rig">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
        <defs>
          <radialGradient id="slime-fill" cx="38%" cy="28%" r="80%">
            <stop offset="0" stopColor="#b9e2ff" />
            <stop offset="0.45" stopColor="#6db8ff" />
            <stop offset="1" stopColor="#2f80ed" />
          </radialGradient>
          <radialGradient id="slime-depth" cx="50%" cy="30%" r="75%">
            <stop offset="0.55" stopColor="#1d5fbf" stopOpacity="0" />
            <stop offset="1" stopColor="#123f8a" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="slime-core" cx="50%" cy="62%" r="40%">
            <stop offset="0" stopColor="#d9f0ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#d9f0ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse ref={shadow} className="slime-shadow" cx={FEET_X} cy={FEET_Y + 4} rx="34" ry="5" />
        <path ref={body} className="slime-body" d={rimPath(new Float32Array(N), 1, 1)} fill="url(#slime-fill)" />
        <path ref={depth} className="slime-depth" d={rimPath(new Float32Array(N), 1, 1)} fill="url(#slime-depth)" />
        <ellipse cx="60" cy="80" rx="26" ry="12" fill="url(#slime-core)" />
        <g ref={shine}>
          <ellipse cx="40" cy="44" rx="10" ry="6" fill="#fff" opacity="0.7" transform="rotate(-28 40 44)" />
          <circle cx="53" cy="38" r="2.4" fill="#fff" opacity="0.8" />
        </g>
        <g ref={face}>
          <ellipse cx="38" cy="74" rx="6" ry="3.6" fill="#ff8fb1" opacity="0.55" />
          <ellipse cx="82" cy="74" rx="6" ry="3.6" fill="#ff8fb1" opacity="0.55" />
          {[46, 74].map((cx, i) => (
            <g key={cx} transform={`translate(${cx} 63)`}>
              <g ref={(n) => { lids.current[i] = n; }}>
                <rect x="-5.5" y="-9" width="11" height="18" rx="5.5" fill="#0b1217" />
                <g ref={(n) => { pupils.current[i] = n; }}>
                  <circle cx="1.6" cy="-4" r="2.4" fill="#fff" />
                  <circle cx="-1.8" cy="3" r="1" fill="#fff" opacity="0.7" />
                </g>
              </g>
            </g>
          ))}
          <path ref={mouth} className="slime-mouth" d={MOUTH.idle} />
        </g>
      </svg>
      </div>
    </div>
  );
}

Slime.propTypes = {
  perch: PropTypes.string,
  say: PropTypes.string,
  mood: PropTypes.string,
  onPoke: PropTypes.func,
};
