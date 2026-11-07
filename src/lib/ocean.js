// The live ocean: draws the water, kelp, sand and bubbles, and moves every creature.
// Kept outside React so the animation loop never re-renders components.

import { TYPES } from '../creatures.js';

const rand = (a, b) => a + Math.random() * (b - a);
const now = () => performance.now() / 1000;

export class Ocean {
  constructor(canvas, { onSelect } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onSelect = onSelect;
    this.sprites = new Map();
    this.order = [];
    this.bubbles = [];
    this.weeds = [];
    this.pebbles = [];
    this.highlightId = null;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lastT = now();
    this.running = true;

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.handleClick = this.handleClick.bind(this);
    window.addEventListener('resize', this.resize);
    canvas.addEventListener('click', this.handleClick);
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('click', this.handleClick);
  }

  // Creature newly released by this visitor: drops in from the surface and glows.
  highlight(id) {
    this.highlightId = id;
    const s = this.sprites.get(id);
    if (s?.ready) this.startEntrance(s);
  }

  setCreatures(list) {
    const ids = new Set(list.map((c) => c.id));
    for (const id of this.sprites.keys()) if (!ids.has(id)) this.sprites.delete(id);
    for (const c of list) if (!this.sprites.has(c.id)) this.addSprite(c);
    this.sortOrder();
  }

  resize() {
    const { canvas, ctx } = this;
    this.DPR = Math.min(2, devicePixelRatio || 1);
    this.W = canvas.clientWidth;
    this.H = canvas.clientHeight;
    const { W, H, DPR } = this;
    if (!W || !H) return;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.sandTop = H - Math.max(70, H * 0.13);

    this.bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    this.bgGrad.addColorStop(0, '#2a9fc0');
    this.bgGrad.addColorStop(0.35, '#0f6788');
    this.bgGrad.addColorStop(0.75, '#073a5a');
    this.bgGrad.addColorStop(1, '#04243d');
    this.sandGrad = ctx.createLinearGradient(0, this.sandTop, 0, H);
    this.sandGrad.addColorStop(0, '#e3c890');
    this.sandGrad.addColorStop(1, '#b08c56');

    const nW = Math.max(5, Math.round(W / 150));
    this.weeds = Array.from({ length: nW }, (_, i) => ({
      x: (i + rand(0.1, 0.9)) * W / nW, h: rand(0.18, 0.4) * H, segs: 7, ph: rand(0, 6),
      col: Math.random() < 0.5 ? '#1f7a55' : '#2f9a68', lw: rand(5, 9),
    }));
    this.pebbles = Array.from({ length: Math.round(W / 40) }, () => ({ x: rand(0, W), y: rand(this.sandTop + 20, H - 6), r: rand(2, 5) }));
    if (!this.bubbles.length) for (let i = 0; i < 46; i++) this.bubbles.push(this.newBubble(true));
    this.sprites.forEach((s) => this.place(s));
  }

  newBubble(anywhere) {
    return { x: rand(0, this.W), y: anywhere ? rand(0, this.H) : this.H + rand(0, 40), r: rand(1.5, 6), sp: rand(18, 48), wob: rand(0, 6) };
  }

  // Height of an average creature: about 110px on a laptop, 57px on a phone.
  baseH() {
    return Math.max(52, Math.min(120, Math.min(this.W, this.H) * 0.145));
  }

  nameSize() {
    return this.baseH() > 100 ? 14 : 12;
  }

  // Space the name tag takes below a creature.
  tagSpace() {
    const fs = this.nameSize();
    return fs + (fs + 8) / 2;
  }

  // Bob amplitude for jellyfish; also used when placing them.
  bobAmp() {
    return Math.min(60, this.H * 0.06);
  }

  place(s) {
    const { W, H, sandTop } = this;
    if (!s.ready || !W) return;
    let h = this.baseH() * s.t.size;
    let w = h * s.ar;
    const maxW = this.baseH() * s.t.size * 2.4;
    if (w > maxW) { w = maxW; h = w / s.ar; }
    s.w = w;
    s.h = h;

    if (s.t.motion === 'crawl') {
      // walks on the sand, with its name still on screen
      s.home = Math.min(sandTop + (H - sandTop) * 0.35, H - this.tagSpace() - 8) - h / 2;
    } else {
      // lowest the creature, its movement and its name tag may reach: just above the sand's highest ripple
      const floor = sandTop - 12 - this.tagSpace();
      let amp, reach;
      if (s.t.motion === 'bob') { amp = this.bobAmp(); reach = h * 0.54; }
      else if (s.t.motion === 'wiggle') { amp = 16; reach = h * 0.52 + w * 0.07; }
      else { amp = 7; reach = h / 2 + w * 0.03; }
      const lowest = floor - amp - reach;
      const highest = Math.min(lowest, H * 0.13 + h / 2 + amp);
      s.home = rand(highest, lowest);
    }
    if (s.x == null) s.x = rand(w / 2, Math.max(w / 2 + 1, W - w / 2));
  }

  addSprite(c) {
    const type = TYPES[c.type] ? c.type : 'anything';
    const t = TYPES[type];
    const dir = Math.random() < 0.5 ? -1 : 1;
    const s = {
      id: c.id, name: String(c.name || 'Someone').slice(0, 24), type, t, createdAt: c.createdAt || 0, src: c.img,
      img: new Image(), ready: false, ar: 1, x: null, home: 0, dir, face: dir,
      speed: rand(t.speed[0], t.speed[1]), ph: rand(0, Math.PI * 2), enterAt: 0, glowUntil: 0,
    };
    s.img.crossOrigin = 'anonymous';
    s.img.onload = () => {
      s.ready = true;
      s.ar = (s.img.naturalWidth || 1) / (s.img.naturalHeight || 1);
      this.place(s);
      if (s.id === this.highlightId) this.startEntrance(s);
      this.sortOrder();
    };
    s.img.src = c.img;
    this.sprites.set(s.id, s);
  }

  startEntrance(s) {
    s.enterAt = now();
    s.glowUntil = now() + 8;
    s.x = this.W / 2;
    this.highlightId = null;
  }

  sortOrder() {
    // bigger creatures behind smaller ones
    this.order = [...this.sprites.values()].filter((s) => s.ready).sort((a, b) => b.t.size - a.t.size);
  }

  // ---------- drawing ----------

  drawBackground(t) {
    const { ctx, W, H, sandTop } = this;
    ctx.fillStyle = this.bgGrad;
    ctx.fillRect(0, 0, W, H);

    // light rays from the surface
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const cx = (i + 0.5) * W / 6 + Math.sin(t * 0.15 + i * 1.7) * 40;
      const top = 26 + i * 6, spread = 60 + (i % 3) * 40;
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
      g.addColorStop(0, 'rgba(255,255,255,.10)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - top, 0);
      ctx.lineTo(cx + top, 0);
      ctx.lineTo(cx + spread + H * 0.12, H * 0.85);
      ctx.lineTo(cx - spread + H * 0.05, H * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // surface shimmer
    ctx.strokeStyle = 'rgba(233,251,255,.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) {
      const y = 6 + Math.sin(x * 0.02 + t * 1.2) * 3;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();

    // kelp
    for (const k of this.weeds) {
      ctx.strokeStyle = k.col;
      ctx.lineWidth = k.lw;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(k.x, sandTop + 14);
      for (let j = 1; j <= k.segs; j++) {
        const f = j / k.segs;
        ctx.lineTo(k.x + Math.sin(t * 0.8 + k.ph + f * 2.2) * f * 26, sandTop + 14 - f * k.h);
      }
      ctx.stroke();
    }
  }

  drawSand() {
    const { ctx, W, H, sandTop } = this;
    ctx.fillStyle = this.sandGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, sandTop);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, sandTop + Math.sin(x * 0.012) * 7 + Math.sin(x * 0.031 + 1) * 3);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120,88,48,.35)';
    for (const p of this.pebbles) {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r * 1.4, p.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBubbles(dt) {
    const { ctx, bubbles } = this;
    ctx.strokeStyle = 'rgba(233,251,255,.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y -= b.sp * dt;
      b.wob += dt * 2;
      if (b.y < -10) bubbles[i] = this.newBubble(false);
      ctx.beginPath();
      ctx.arc(b.x + Math.sin(b.wob) * 3, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Moves one creature and returns how to draw it this frame.
  step(s, dt, t) {
    const { W, H } = this;
    const m = s.t.motion;
    if (m === 'crawl') {
      s.x += s.dir * s.speed * dt;
      if ((s.dir > 0 && s.x > W - s.w / 2) || (s.dir < 0 && s.x < s.w / 2) || Math.random() < dt * 0.12) s.dir *= -1;
      return { y: s.home - Math.abs(Math.sin(t * 9 + s.ph)) * 2.5, rot: Math.sin(t * 9 + s.ph) * 0.03, sx: 1, sy: 1 };
    }
    if (m === 'bob') {
      s.x += s.dir * s.speed * dt;
      if ((s.dir > 0 && s.x > W - s.w / 2) || (s.dir < 0 && s.x < s.w / 2)) s.dir *= -1;
      const p = Math.sin(t * 1.8 + s.ph);
      return { y: s.home + Math.sin(t * 0.35 + s.ph) * this.bobAmp(), rot: Math.sin(t * 0.5 + s.ph) * 0.05, sx: 1 - p * 0.04, sy: 1 + p * 0.07 };
    }
    if (m === 'wiggle') {
      s.x += s.dir * s.speed * dt;
      if ((s.dir > 0 && s.x > W - s.w / 2) || (s.dir < 0 && s.x < s.w / 2) || Math.random() < dt * 0.02) s.dir *= -1;
      return { y: s.home + Math.sin(t * 0.6 + s.ph) * 16, rot: Math.sin(t * 1.6 + s.ph) * 0.13, sx: 1, sy: 1 + Math.sin(t * 3 + s.ph) * 0.03 };
    }
    // swim: leave the edge a little, then turn around
    const edge = s.w * 0.25;
    s.x += s.dir * s.speed * dt;
    if ((s.dir > 0 && s.x > W + edge) || (s.dir < 0 && s.x < -edge) || Math.random() < dt * 0.015) s.dir *= -1;
    s.face += (s.dir - s.face) * Math.min(1, dt * 3.5);
    return { y: s.home + Math.sin(t * 0.9 + s.ph) * 7, rot: Math.sin(t * 0.9 + s.ph + 1.2) * 0.05 * s.dir, sx: s.face, sy: 1 };
  }

  drawSprite(s, dt, t) {
    const { ctx } = this;
    const p = this.step(s, dt, t);
    let y = p.y;

    if (s.enterAt) {
      const k = Math.min(1, (t - s.enterAt) / 1.8);
      const e = 1 - Math.pow(1 - k, 3);
      y = (-s.h - 40) * (1 - e) + y * e;
      if (k >= 1) {
        s.enterAt = 0;
        for (let i = 0; i < 18; i++) {
          this.bubbles.push({ x: s.x + rand(-s.w / 2, s.w / 2), y: y + rand(-s.h / 2, s.h / 2), r: rand(2, 7), sp: rand(40, 90), wob: rand(0, 6) });
        }
        if (this.bubbles.length > 120) this.bubbles.splice(0, this.bubbles.length - 120);
      }
    }

    const glow = t < s.glowUntil;
    const sx = Math.abs(p.sx) < 0.08 ? 0.08 * Math.sign(p.sx || 1) : p.sx;
    ctx.save();
    ctx.translate(s.x, y);
    ctx.rotate(p.rot);
    ctx.scale(sx, p.sy);
    if (glow) {
      ctx.shadowColor = 'rgba(255,236,170,.95)';
      ctx.shadowBlur = 26 + Math.sin(t * 4) * 8;
    }
    ctx.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
    ctx.restore();
    s.bx = s.x - s.w / 2;
    s.by = y - s.h / 2;

    // name tag
    const fs = this.nameSize();
    ctx.font = `700 ${fs}px Nunito, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ty = y + s.h / 2 + fs;
    const tw = ctx.measureText(s.name).width + fs + 2;
    const th = fs + 8;
    ctx.fillStyle = 'rgba(3,24,43,.5)';
    this.roundRect(s.x - tw / 2, ty - th / 2, tw, th, th / 2);
    ctx.fill();
    ctx.fillStyle = '#e9fbff';
    ctx.fillText(s.name, s.x, ty + 0.5);

    if (glow) {
      ctx.font = '600 15px Fredoka, sans-serif';
      const lbl = 'You drew this!';
      const lw = ctx.measureText(lbl).width + 20;
      const ly = y - s.h / 2 - 18;
      ctx.fillStyle = '#ff8a6b';
      this.roundRect(s.x - lw / 2, ly - 12, lw, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#3a1206';
      ctx.fillText(lbl, s.x, ly + 1);
    }
  }

  roundRect(x, y, w, h, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  frame() {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const t = now();
    let dt = Math.min(0.05, t - this.lastT);
    this.lastT = t;
    if (!this.W) return;
    if (this.reduceMotion) dt *= 0.35;
    this.drawBackground(t);
    for (const s of this.order) if (s.t.motion !== 'crawl') this.drawSprite(s, dt, t);
    this.drawSand();
    for (const s of this.order) if (s.t.motion === 'crawl') this.drawSprite(s, dt, t);
    this.drawBubbles(dt);
  }

  handleClick(e) {
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = this.order.length - 1; i >= 0; i--) {
      const s = this.order[i];
      if (s.bx != null && x >= s.bx && x <= s.bx + s.w && y >= s.by && y <= s.by + s.h) {
        this.onSelect?.({ id: s.id, name: s.name, type: s.type, img: s.src, createdAt: s.createdAt });
        return;
      }
    }
    this.onSelect?.(null);
  }
}
