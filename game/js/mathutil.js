// Small geometry helpers: oriented boxes on the XZ plane (rotation matches Object3D.rotation.y).
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export function wrapAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
export function dampAngle(a, b, lambda, dt) { return a + wrapAngle(b - a) * (1 - Math.exp(-lambda * dt)); }

// seeded RNG so the level is identical every load (checkpoint-safe)
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class OBB2 {
  constructor(cx, cz, hx, hz, rot = 0, data = {}) { this.set(cx, cz, hx, hz, rot); Object.assign(this, data); }
  set(cx, cz, hx, hz, rot) { this.cx = cx; this.cz = cz; this.hx = hx; this.hz = hz; this.rot = rot; this.c = Math.cos(rot); this.s = Math.sin(rot); this.r = Math.hypot(hx, hz); return this; }
  local(x, z) { const dx = x - this.cx, dz = z - this.cz; return [dx * this.c - dz * this.s, dx * this.s + dz * this.c]; }
  world(lx, lz) { return [this.cx + lx * this.c + lz * this.s, this.cz - lx * this.s + lz * this.c]; }
  contains(x, z, m = 0) {
    const dx = x - this.cx, dz = z - this.cz;
    if (dx * dx + dz * dz > (this.r + m) * (this.r + m)) return false;
    const lx = dx * this.c - dz * this.s, lz = dx * this.s + dz * this.c;
    return Math.abs(lx) <= this.hx + m && Math.abs(lz) <= this.hz + m;
  }
  corners() { return [this.world(-this.hx, -this.hz), this.world(this.hx, -this.hz), this.world(this.hx, this.hz), this.world(-this.hx, this.hz)]; }
  // push a circle out of the box; returns [nx,nz,depth] or null
  pushCircle(x, z, rad) {
    const [lx, lz] = this.local(x, z);
    const qx = Math.max(-this.hx, Math.min(this.hx, lx)), qz = Math.max(-this.hz, Math.min(this.hz, lz));
    let dx = lx - qx, dz = lz - qz; let d = Math.hypot(dx, dz);
    if (d > rad) return null;
    if (d < 1e-6) { // centre inside: push along smallest axis
      const px = this.hx - Math.abs(lx), pz = this.hz - Math.abs(lz);
      if (px < pz) { dx = Math.sign(lx) || 1; dz = 0; d = -px; } else { dx = 0; dz = Math.sign(lz) || 1; d = -pz; }
      const len = Math.hypot(dx, dz); dx /= len; dz /= len;
      const wx = dx * this.c + dz * this.s, wz = -dx * this.s + dz * this.c;
      return [wx, wz, rad - d];
    }
    dx /= d; dz /= d;
    const wx = dx * this.c + dz * this.s, wz = -dx * this.s + dz * this.c;
    return [wx, wz, rad - d];
  }
}

// road segment a->b of width w as an OBB
export function segmentOBB(ax, az, bx, bz, w, data) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
  return new OBB2((ax + bx) / 2, (az + bz) / 2, w / 2, L / 2, Math.atan2(dx, dz), data);
}
