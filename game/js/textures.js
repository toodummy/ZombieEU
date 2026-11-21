// Procedural canvas textures (no external image assets; fictional signage only).
import * as THREE from 'three';
import { mulberry32 } from './mathutil.js';

const R = mulberry32(1337);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8; t.needsUpdate = true; return t;
}
function speckle(g, w, h, n, colors, size = 2) {
  for (let i = 0; i < n; i++) { g.fillStyle = colors[(R() * colors.length) | 0]; g.globalAlpha = 0.2 + R() * 0.5; const s = size * (0.5 + R()); g.fillRect(R() * w, R() * h, s, s); }
  g.globalAlpha = 1;
}
function blotches(g, w, h, n, color, rmin, rmax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h, r = rmin + R() * (rmax - rmin);
    const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, color); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha; g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalAlpha = 1;
}

// Road: u across the carriageway, v along it. Returns {map, rough}
export function roadTextures(kind = 'dash', lanes = 2) {
  const W = 512, H = 1024;
  const [c, g] = canvas(W, H), [rc, rg] = canvas(256, 512);
  g.fillStyle = '#2a2c2f'; g.fillRect(0, 0, W, H);
  speckle(g, W, H, 26000, ['#3a3c40', '#1d1f22', '#45474b', '#252629'], 2);
  blotches(g, W, H, 40, 'rgba(15,16,18,1)', 20, 90, 0.35); // patches & oil
  // cracks
  g.strokeStyle = 'rgba(10,10,10,.55)'; g.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) { g.beginPath(); let x = R() * W, y = R() * H; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (R() - 0.5) * 40; y += R() * 30; g.lineTo(x, y); } g.stroke(); }
  // kerb shade + gutter
  const gr = g.createLinearGradient(0, 0, 40, 0); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 40, H);
  const gr2 = g.createLinearGradient(W, 0, W - 40, 0); gr2.addColorStop(0, 'rgba(0,0,0,.6)'); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(W - 40, 0, 40, H);
  if (kind === 'dash' || kind === 'motorway') {
    g.fillStyle = 'rgba(225,225,215,.85)';
    const lines = kind === 'motorway' ? [1 / 4, 2 / 4, 3 / 4] : [0.5];
    for (const f of lines) for (let y = 0; y < H; y += 128) g.fillRect(W * f - 5, y + 10, 10, 64);
    g.fillStyle = 'rgba(230,200,60,.8)'; g.fillRect(22, 0, 7, H); g.fillRect(W - 29, 0, 7, H);
    g.fillRect(34, 0, 7, H); g.fillRect(W - 41, 0, 7, H);
  }
  speckle(g, W, H, 3000, ['rgba(0,0,0,.6)'], 3);
  // roughness: puddles very smooth, asphalt semi-wet
  rg.fillStyle = 'rgb(120,120,120)'; rg.fillRect(0, 0, 256, 512);
  speckle(rg, 256, 512, 6000, ['rgb(150,150,150)', 'rgb(95,95,95)'], 2);
  blotches(rg, 256, 512, 26, 'rgba(8,8,8,1)', 10, 45, 0.9);
  rg.fillStyle = 'rgba(20,20,20,.7)'; rg.fillRect(0, 0, 14, 512); rg.fillRect(242, 0, 14, 512); // gutters hold water
  return { map: tex(c), rough: tex(rc, false) };
}

export function gravelTextures() {
  const [c, g] = canvas(512, 512), [rc, rg] = canvas(256, 256);
  g.fillStyle = '#4a443b'; g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, 40000, ['#5e574c', '#39332b', '#6b6457', '#2b2721', '#7a705f'], 3);
  blotches(g, 512, 512, 30, 'rgba(30,26,20,1)', 20, 70, 0.5);
  g.strokeStyle = 'rgba(25,22,18,.5)'; g.lineWidth = 26; // tyre ruts
  [150, 362].forEach(x => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, 512); g.stroke(); });
  rg.fillStyle = 'rgb(200,200,200)'; rg.fillRect(0, 0, 256, 256); blotches(rg, 256, 256, 18, 'rgba(10,10,10,1)', 8, 35, 0.85);
  return { map: tex(c), rough: tex(rc, false) };
}

export function concreteTextures() {
  const [c, g] = canvas(1024, 1024), [rc, rg] = canvas(256, 256);
  g.fillStyle = '#5b5d60'; g.fillRect(0, 0, 1024, 1024);
  speckle(g, 1024, 1024, 30000, ['#66686b', '#4b4d50', '#727477'], 2);
  blotches(g, 1024, 1024, 50, 'rgba(25,25,25,1)', 30, 120, 0.3);
  g.strokeStyle = 'rgba(30,30,30,.7)'; g.lineWidth = 3; for (let i = 0; i <= 1024; i += 256) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke(); }
  rg.fillStyle = 'rgb(140,140,140)'; rg.fillRect(0, 0, 256, 256); blotches(rg, 256, 256, 20, 'rgba(10,10,10,1)', 10, 40, 0.8);
  return { map: tex(c), rough: tex(rc, false) };
}

export function pavingTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#6a6b6d'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { const v = 95 + R() * 25 | 0; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(x + 2, y + 2, 60, 60); }
  speckle(g, 256, 256, 2000, ['#555', '#888'], 2);
  return tex(c);
}

// Facade: 1 texture tile = 8m wide x 12m tall (3 storeys). Returns {map, emissive}
export function facadeTextures(style = 'brick', seed = 1) {
  const r = mulberry32(seed * 7919);
  const W = 512, H = 768; const [c, g] = canvas(W, H), [ec, eg] = canvas(W, H);
  const palettes = { brick: ['#6b3a2c', '#5a3025', '#74402f'], stock: ['#8a7553', '#7a6648', '#93805d'], render: ['#8e8a80', '#77736b', '#9a958a'], dark: ['#3e3c3a', '#46423e', '#353331'] };
  const pal = palettes[style] || palettes.brick;
  g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
  if (style !== 'render') { // brick courses
    for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? -12 : 0; x < W; x += 24) { g.fillStyle = pal[(r() * 3) | 0]; g.globalAlpha = 0.85; g.fillRect(x + 1, y + 1, 22, 6); }
    g.globalAlpha = 1;
  }
  blotches(g, W, H, 30, 'rgba(0,0,0,1)', 30, 120, 0.18); // grime
  const grime = g.createLinearGradient(0, H - 200, 0, H); grime.addColorStop(0, 'rgba(0,0,0,0)'); grime.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = grime; g.fillRect(0, H - 200, W, 200);
  eg.fillStyle = '#000'; eg.fillRect(0, 0, W, H);
  const shop = style === 'shop';
  const floors = 3, fh = H / floors;
  for (let f = 0; f < floors; f++) {
    const y0 = f * fh;
    if (shop && f === floors - 1) { // ground floor shopfront
      g.fillStyle = '#1a1c20'; g.fillRect(0, y0 + 40, W, fh - 40);
      g.fillStyle = ['#7a1d1d', '#1d3b5a', '#2f4a2a', '#5a4a1d'][(r() * 4) | 0]; g.fillRect(0, y0 + 10, W, 40); // fascia
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = 'bold 26px sans-serif'; g.fillText(['CORNER SHOP', 'LAUNDERETTE', 'CHEMIST', 'BOOKMAKER', 'CAFE', 'TAKEAWAY'][(r() * 6) | 0], 20, y0 + 40);
      const lit = r() < 0.35;
      for (let x = 16; x < W - 16; x += 124) {
        g.fillStyle = lit ? '#3a3220' : '#101318'; g.fillRect(x, y0 + 64, 108, fh - 90);
        if (r() < 0.5) { g.strokeStyle = '#444'; g.lineWidth = 2; for (let yy = y0 + 64; yy < y0 + fh - 26; yy += 8) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 108, yy); g.stroke(); } } // shutter
        else if (lit) { eg.fillStyle = 'rgba(255,190,110,.75)'; eg.fillRect(x, y0 + 64, 108, fh - 90); }
      }
      continue;
    }
    for (let i = 0; i < 4; i++) {
      const x = 24 + i * 124, w = 76, h = 130, y = y0 + 60;
      g.fillStyle = '#d8d2c4'; g.fillRect(x - 6, y - 6, w + 12, h + 16); // frame / sill
      const lit = r() < 0.16, broken = r() < 0.15;
      g.fillStyle = lit ? '#6b5332' : (broken ? '#050505' : '#141a22'); g.fillRect(x, y, w, h);
      if (!lit) { const gl = g.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(120,140,170,.25)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h); }
      g.fillStyle = '#d8d2c4'; g.fillRect(x, y + h / 2 - 3, w, 6); g.fillRect(x + w / 2 - 3, y, 6, h);
      if (lit) { eg.fillStyle = r() < 0.5 ? 'rgba(255,170,90,1)' : 'rgba(255,210,150,.9)'; eg.fillRect(x, y, w, h); eg.fillStyle = '#000'; eg.fillRect(x, y + h / 2 - 3, w, 6); eg.fillRect(x + w / 2 - 3, y, 6, h); }
      if (r() < 0.12) { g.fillStyle = '#3a2a1a'; g.fillRect(x, y, w, h); } // boarded up
    }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y0 + fh - 8, W, 6); // string course
  }
  return { map: tex(c), emissive: tex(ec) };
}

export function roofTexture() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#2b2d31'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) { g.fillStyle = y % 20 ? '#33363b' : '#26282c'; g.fillRect(0, y, 256, 9); }
  speckle(g, 256, 256, 3000, ['#1a1a1a', '#444'], 2); return tex(c);
}

export function signTexture(lines, opts = {}) {
  const w = opts.w || 512, h = opts.h || 256; const [c, g] = canvas(w, h);
  g.fillStyle = opts.bg || '#0a5b2c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = opts.border || '#fff'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = opts.fg || '#fff'; g.textBaseline = 'middle';
  const lh = (h - 40) / lines.length;
  lines.forEach((l, i) => { g.font = `bold ${opts.size || Math.min(64, lh * 0.62)}px "Arial Narrow", Arial, sans-serif`; g.textAlign = opts.align || 'center'; g.fillText(l, opts.align === 'left' ? 34 : w / 2, 20 + lh * (i + 0.5)); });
  return tex(c, true, false);
}

export function brandTexture() { // fictional fuel brand "NORTHGATE"
  const [c, g] = canvas(1024, 128); const grd = g.createLinearGradient(0, 0, 0, 128); grd.addColorStop(0, '#d23b1f'); grd.addColorStop(1, '#9a2412'); g.fillStyle = grd; g.fillRect(0, 0, 1024, 128);
  g.fillStyle = '#fff'; g.font = 'bold 84px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NORTHGATE  ◆  FUEL', 512, 68);
  return tex(c, true, false);
}

export function priceBoardTexture() {
  const [c, g] = canvas(256, 512); g.fillStyle = '#111'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#d23b1f'; g.fillRect(0, 0, 256, 110); g.fillStyle = '#fff'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.fillText('NORTHGATE', 128, 70);
  g.font = 'bold 30px Arial'; g.textAlign = 'left';
  [['UNLEADED', '---.9'], ['DIESEL', '---.9'], ['SUPER', 'SOLD OUT']].forEach(([a, b], i) => { g.fillStyle = '#ddd'; g.fillText(a, 18, 170 + i * 110); g.fillStyle = '#ffb347'; g.fillText(b, 18, 210 + i * 110); });
  return tex(c, true, false);
}

export function skinTexture(base, seed) { // clothing grime for characters
  const r = mulberry32(seed); const [c, g] = canvas(128, 128); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) { const x = r() * 128, y = r() * 128, rad = 4 + r() * 18; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, r() < 0.4 ? 'rgba(70,10,8,.55)' : 'rgba(20,15,10,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  return tex(c);
}
