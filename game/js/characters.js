// Procedural humanoids (Alex, walkers, screamer, kiosk worker) with code-driven animation.
import * as THREE from 'three';
import { skinTexture } from './textures.js';

const geo = {
  torso: new THREE.CapsuleGeometry(0.2, 0.36, 4, 10),
  pelvis: new THREE.BoxGeometry(0.36, 0.2, 0.22),
  head: new THREE.SphereGeometry(0.13, 14, 10),
  upper: new THREE.CapsuleGeometry(0.065, 0.26, 3, 8),
  fore: new THREE.CapsuleGeometry(0.055, 0.24, 3, 8),
  thigh: new THREE.CapsuleGeometry(0.085, 0.34, 3, 8),
  shin: new THREE.CapsuleGeometry(0.07, 0.34, 3, 8),
  foot: new THREE.BoxGeometry(0.12, 0.08, 0.26),
  hand: new THREE.BoxGeometry(0.08, 0.1, 0.06),
  box: new THREE.BoxGeometry(1, 1, 1),
};
const matCache = new Map();
function mat(color, rough = 0.85, tex = false, seed = 1) {
  const k = color + ':' + rough + ':' + tex + ':' + seed;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: tex ? 0xffffff : color, map: tex ? skinTexture('#' + new THREE.Color(color).getHexString(), seed) : null, roughness: rough }));
  return matCache.get(k);
}

export function buildHumanoid(o = {}) {
  const skin = mat(o.skin ?? 0xc9a184, 0.6, !!o.infected, 3);
  const top = mat(o.top ?? 0x3d4430, 0.9, true, o.seed || 1), bottom = mat(o.bottom ?? 0x2a3140, 0.9, true, (o.seed || 1) + 1), shoe = mat(o.shoe ?? 0x1a1714, 0.7);
  const root = new THREE.Group();
  const body = new THREE.Group(); body.rotation.y = Math.PI; root.add(body); // model authored facing +z; root faces -z like the car
  const hips = new THREE.Group(); hips.position.y = 0.92; body.add(hips);
  const pelvis = new THREE.Mesh(geo.pelvis, bottom); hips.add(pelvis);
  const chest = new THREE.Group(); hips.add(chest);
  const torso = new THREE.Mesh(geo.torso, top); torso.position.y = 0.32; torso.scale.set(1.15 * (o.thin ? 0.8 : 1), 1, 0.75); chest.add(torso);
  const neck = new THREE.Group(); neck.position.y = 0.66; chest.add(neck);
  const head = new THREE.Mesh(geo.head, skin); head.position.y = 0.13; head.scale.set(1, 1.15, 1.05); neck.add(head);
  if (o.hair !== false) { const hair = new THREE.Mesh(geo.head, mat(o.hairColor ?? 0x2b1d14, 0.9)); hair.position.set(0, 0.17, -0.015); hair.scale.set(1.05, 0.8, 1.08); neck.add(hair); }
  const limb = (g, m, parent, x, y, len) => { const pivot = new THREE.Group(); pivot.position.set(x, y, 0); parent.add(pivot); const mesh = new THREE.Mesh(g, m); mesh.position.y = -len / 2; pivot.add(mesh); return pivot; };
  const sw = o.thin ? 0.22 : 0.27;
  const armL = limb(geo.upper, top, chest, -sw, 0.56, 0.38), armR = limb(geo.upper, top, chest, sw, 0.56, 0.38);
  const foreL = limb(geo.fore, o.infected ? skin : top, armL, 0, -0.36, 0.34), foreR = limb(geo.fore, o.infected ? skin : top, armR, 0, -0.36, 0.34);
  const handL = new THREE.Mesh(geo.hand, skin); handL.position.y = -0.36; foreL.add(handL);
  const handR = new THREE.Mesh(geo.hand, skin); handR.position.y = -0.36; foreR.add(handR);
  const legL = limb(geo.thigh, bottom, hips, -0.11, -0.05, 0.44), legR = limb(geo.thigh, bottom, hips, 0.11, -0.05, 0.44);
  const shinL = limb(geo.shin, bottom, legL, 0, -0.44, 0.42), shinR = limb(geo.shin, bottom, legR, 0, -0.44, 0.42);
  const fL = new THREE.Mesh(geo.foot, shoe); fL.position.set(0, -0.44, 0.05); shinL.add(fL);
  const fR = new THREE.Mesh(geo.foot, shoe); fR.position.set(0, -0.44, 0.05); shinR.add(fR);
  if (o.backpack) { const bp = new THREE.Mesh(geo.box, mat(0x4a4632, 0.95)); bp.scale.set(0.36, 0.46, 0.2); bp.position.set(0, 0.36, -0.2); chest.add(bp); const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), mat(0x6a3b22)); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.64, -0.22); chest.add(roll); }
  if (o.vest) { const v = new THREE.Mesh(geo.box, mat(0xc8d22a, 0.6)); v.scale.set(0.44, 0.4, 0.3); v.position.y = 0.36; chest.add(v); }
  root.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
  const h = { root, hips, chest, neck, head, armL, armR, foreL, foreR, handR, legL, legR, shinL, shinR, phase: Math.random() * 6, hunch: o.hunch || 0 };
  root.scale.setScalar(o.scale || 1);
  return h;
}

export function addCrowbar(h) {
  const g = new THREE.Group(); const m = new THREE.Mesh(geo.box, mat(0x5a1410, 0.4)); m.scale.set(0.03, 0.75, 0.03); m.position.y = -0.3; g.add(m);
  const hook = new THREE.Mesh(geo.box, mat(0x5a1410, 0.4)); hook.scale.set(0.03, 0.03, 0.14); hook.position.set(0, -0.67, -0.06); g.add(hook);
  g.position.set(0, -0.38, 0); g.rotation.x = -1.2; h.foreR.add(g); h.crowbar = g;
  const p = new THREE.Group(); const body = new THREE.Mesh(geo.box, mat(0x1b1c1e, 0.4)); body.scale.set(0.05, 0.08, 0.2); body.position.set(0, -0.02, -0.08); p.add(body);
  const grip = new THREE.Mesh(geo.box, mat(0x1b1c1e, 0.4)); grip.scale.set(0.045, 0.12, 0.05); grip.position.set(0, -0.08, 0.0); p.add(grip);
  p.position.set(0, -0.42, 0); p.rotation.x = Math.PI / 2; p.visible = false; h.foreR.add(p); h.pistol = p;
}

// mode: idle | walk | run | shamble | lunge | attack | scream | swing | aim | fuel | pry | stagger
export function animate(h, dt, mode, speed = 0, t = 0, k = 0) {
  const s = Math.sin, c = Math.cos;
  const stride = mode === 'run' ? 11 : mode === 'shamble' ? 4.2 : 7.5;
  if (speed > 0.05) h.phase += dt * stride * Math.min(1.4, 0.5 + speed * 0.25); else h.phase += dt * 1.5;
  const p = h.phase, moving = speed > 0.15;
  const amp = moving ? (mode === 'run' ? 0.9 : mode === 'shamble' ? 0.45 : 0.6) : 0.02;
  // legs
  h.legL.rotation.x = s(p) * amp; h.legR.rotation.x = -s(p) * amp;
  h.shinL.rotation.x = Math.max(0, -s(p + 1.2)) * amp * 1.4 + (mode === 'shamble' ? 0.15 : 0);
  h.shinR.rotation.x = Math.max(0, s(p + 1.2)) * amp * 1.4 + (mode === 'shamble' ? 0.25 : 0);
  h.hips.position.y = 0.92 - (moving ? Math.abs(s(p)) * 0.04 : 0) - (mode === 'shamble' ? 0.05 : 0);
  // defaults
  let lean = mode === 'run' ? 0.25 : 0.05; let armLx = -s(p) * amp * 0.8, armRx = s(p) * amp * 0.8, foreL = -0.3, foreR = -0.3, armLz = 0.08, armRz = -0.08, headX = 0, headZ = 0, chestY = 0;
  if (!moving && mode === 'idle') { armLx = s(t * 1.3) * 0.03; armRx = -armLx; lean = 0.03 + s(t * 1.7) * 0.01; }
  if (mode === 'shamble' || mode === 'lunge') {
    lean = 0.35 + h.hunch + s(p * 0.5) * 0.05; armLx = -1.2 + s(p) * 0.2; armRx = -1.35 - s(p) * 0.2; foreL = -0.25; foreR = -0.4; headX = -0.25; headZ = s(p * 0.5) * 0.25;
    if (mode === 'lunge') { lean = 0.55; armLx = -1.7; armRx = -1.7; }
  }
  if (mode === 'attack') { lean = 0.35 + k * 0.4; armLx = -1.3 - k * 0.9; armRx = -1.3 - k * 0.9; foreL = foreR = -0.1; headX = 0.2; }
  if (mode === 'scream') { lean = -0.25 * k; armLx = -0.4 * k; armRx = -0.4 * k; armLz = 0.9 * k; armRz = -0.9 * k; headX = -0.8 * k + s(t * 40) * 0.04 * k; foreL = foreR = -0.2; }
  if (mode === 'stagger') { lean = -0.35; headX = 0.5; armLz = 0.6; armRz = -0.6; armLx = armRx = 0.3; }
  if (mode === 'swing') { // k: 0..1 progress of crowbar swing
    const w = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
    armRx = -1.9 * (k < 0.35 ? k / 0.35 : 1) + (k > 0.35 ? (k - 0.35) * 3.2 : 0); armRz = -0.4 - (k > 0.35 ? (k - 0.35) * 1.4 : 0); foreR = -0.9 + w * 0.6; chestY = -0.6 * w + (k > 0.35 ? (k - 0.35) * 2.4 : 0); lean = 0.15;
  }
  if (mode === 'aim') { armRx = -1.5; armLx = -1.35; armLz = -0.45; foreR = 0; foreL = -0.25; chestY = 0.15; lean = 0.05; }
  if (mode === 'fuel') { armRx = -0.9; foreR = -0.6; armLx = -0.2; headX = 0.25; lean = 0.08; }
  if (mode === 'pry') { armRx = -1.2 + s(t * 9) * 0.2; armLx = -1.25 + s(t * 9) * 0.2; foreL = foreR = -0.8; lean = 0.25; }
  h.chest.rotation.x = lean; h.chest.rotation.y = chestY;
  h.armL.rotation.set(armLx, 0, armLz); h.armR.rotation.set(armRx, 0, armRz);
  h.foreL.rotation.x = foreL; h.foreR.rotation.x = foreR;
  h.neck.rotation.set(headX - lean * 0.6, 0, headZ);
}
