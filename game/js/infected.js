// Walker and screamer behaviour. Owned and budgeted by the EncounterDirector.
import * as THREE from 'three';
import { EncounterTune as E } from './config.js';
import { buildHumanoid, animate } from './characters.js';
import { rand, wrapAngle, clamp } from './mathutil.js';

const WALKER_LOOKS = [
  { top: 0x4a4a42, bottom: 0x2c2f38, skin: 0x8f9a86 }, { top: 0x5b2e26, bottom: 0x3a3a3a, skin: 0x9aa08c },
  { top: 0x2f3d4f, bottom: 0x24262b, skin: 0x8a9480 }, { top: 0x6c6150, bottom: 0x3b3326, skin: 0xa0a491 },
  { top: 0x7a7a72, bottom: 0x2a2a30, skin: 0x8e9784, vest: true }, { top: 0x3a4a2e, bottom: 0x403a30, skin: 0x969d88 },
];
let uid = 1;

export class Infected {
  constructor(scene, type, x, z, opts = {}) {
    this.id = uid++; this.type = type; this.x = x; this.z = z; this.yaw = opts.yaw ?? rand(-Math.PI, Math.PI);
    const scr = type === 'screamer';
    const look = scr ? { top: 0x3b2a2a, bottom: 0x2a2224, skin: 0xb9b2a4, thin: true, hair: false, scale: 1.08 } : { ...WALKER_LOOKS[(Math.random() * WALKER_LOOKS.length) | 0], hunch: rand(0, 0.2), scale: rand(0.92, 1.06), hairColor: 0x1d1a16 };
    this.model = buildHumanoid({ ...look, infected: true, seed: (Math.random() * 50) | 0 });
    this.scale = look.scale || 1;
    scene.add(this.model.root); this.scene = scene;
    if (scr) { // glowing throat cue for the screamer silhouette
      this.glow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3020 }));
      this.glow.position.set(0, 0.02, 0.1); this.model.neck.add(this.glow);
      this.ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 32), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.08; this.model.root.add(this.ring);
    }
    this.hp = scr ? E.screamer.hp : E.walker.hp;
    this.speed = scr ? E.screamer.speed : rand(E.walker.speedMin, E.walker.speedMax);
    this.state = opts.state || (Math.random() < 0.5 ? 'idle' : 'wander');
    this.alert = !!opts.alert; this.goal = null; this.t = 0; this.timer = rand(0, 3); this.cool = 0;
    this.attackT = 0; this.screamT = 0; this.screamCool = scr ? 0 : 0; this.screams = 0;
    this.dead = false; this.deadT = 0; this.fly = null; this.groanT = rand(2, 8); this.stagger = 0;
    this.anchorX = x; this.anchorZ = z;
    this.sync(0);
  }
  get alive() { return !this.dead; }
  distTo(x, z) { return Math.hypot(this.x - x, this.z - z); }

  damage(amount, fromX, fromZ, kind = 'melee') {
    if (this.dead) return false;
    this.hp -= amount; this.alert = true;
    if (this.state === 'scream') this.interruptScream = true;
    if (this.hp <= 0) { this.die(fromX, fromZ, kind === 'car' ? amount : 2); return true; }
    if (kind !== 'car') { this.stagger = kind === 'shot' ? 0.25 : 0.6; const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1; this.push = [dx / d * 3.2, dz / d * 3.2]; }
    return false;
  }
  die(fromX, fromZ, force) {
    this.dead = true; this.state = 'dead'; this.deadT = 0;
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    const f = Math.min(force, 16);
    this.fly = { vx: dx / d * f * 0.6, vz: dz / d * f * 0.6, vy: f > 6 ? f * 0.35 : 0.5, y: 0, spin: (Math.random() - 0.5) * f * 0.6 };
    this.fallDir = Math.atan2(dx, dz);
    if (this.ring) this.ring.material.opacity = 0;
  }

  // ctx: { dt, t, world, player, car, playerInCar, onPlayerHit, onCarHit, onScreamStart, onScreamComplete, audio, others }
  update(ctx) {
    const dt = ctx.dt; this.t += dt;
    if (this.dead) {
      this.deadT += dt; const f = this.fly;
      if (f) { f.vy -= 18 * dt; f.y = Math.max(0, f.y + f.vy * dt); if (f.y > 0 || this.deadT < 0.3) { const [nx, nz] = ctx.world.moveCircle(this.x, this.z, f.vx * dt, f.vz * dt, 0.3); this.x = nx; this.z = nz; } f.vx *= 0.94; f.vz *= 0.94; }
      this.sync(dt, ctx.t); return;
    }
    const W = E.walker, S = E.screamer;
    const target = ctx.playerInCar ? { x: ctx.car.x, z: ctx.car.z } : { x: ctx.player.x, z: ctx.player.z };
    const d = this.distTo(target.x, target.z);
    this.cool = Math.max(0, this.cool - dt); this.screamCool = Math.max(0, this.screamCool - dt);
    if (!this.alert && d < W.awareness * (ctx.playerInCar ? 0.7 : 1) * (ctx.noiseBoost || 1)) this.alert = true;
    if (this.noiseGoal && !this.alert) { this.state = 'investigate'; }
    let moveSpeed = 0, mode = 'shamble', faceTo = null, k = 0;
    if (this.stagger > 0) {
      this.stagger -= dt; mode = 'stagger';
      if (this.push) { const [nx, nz] = ctx.world.moveCircle(this.x, this.z, this.push[0] * dt, this.push[1] * dt, 0.3, ctx.carObb ? [ctx.carObb] : []); this.x = nx; this.z = nz; this.push[0] *= 0.85; this.push[1] *= 0.85; }
      this.attackT = 0;
    } else if (this.type === 'screamer') {
      if (this.state === 'scream') {
        this.screamT += dt; k = Math.min(1, this.screamT / 0.4); mode = 'scream'; faceTo = target;
        if (this.ring) { this.ring.material.opacity = 0.5 + Math.sin(this.t * 20) * 0.3; const sc = 1 + (this.screamT / S.warning) * 5; this.ring.scale.set(sc, sc, sc); }
        if (this.interruptScream) { this.interruptScream = false; this.state = 'chase'; this.screamCool = 4; ctx.onScreamInterrupted && ctx.onScreamInterrupted(this); if (this.ring) this.ring.material.opacity = 0; }
        else if (this.screamT >= S.warning) { this.state = 'chase'; this.screamCool = S.cooldown; this.screams++; ctx.onScreamComplete(this); if (this.ring) this.ring.material.opacity = 0; }
      } else if (this.alert) {
        faceTo = target;
        if (d > S.standoff + 2) { moveSpeed = this.speed; mode = 'run'; }
        else if (d < S.standoff - 5) { moveSpeed = -this.speed * 0.5; mode = 'walk'; }
        if (d < S.standoff + 6 && this.screamCool <= 0 && ctx.canScream(this)) { this.state = 'scream'; this.screamT = 0; this.interruptScream = false; ctx.onScreamStart(this); }
        if (d < 1.6 && this.cool <= 0) { this.cool = 1.4; ctx.onPlayerHit(this, 9); }
      } else { mode = 'idle'; }
    } else {
      // walker
      if (this.alert) {
        faceTo = target;
        const reach = ctx.playerInCar ? 1.0 : W.attackRange;
        const dEdge = ctx.playerInCar ? carEdgeDist(ctx.carObb, this.x, this.z) : d;
        if (dEdge < reach || this.attackT > 0) {
          this.attackT += dt; k = Math.min(1, this.attackT / W.windup); mode = 'attack';
          if (this.attackT >= W.windup) {
            const dNow = ctx.playerInCar ? carEdgeDist(ctx.carObb, this.x, this.z) : this.distTo(ctx.player.x, ctx.player.z);
            if (dNow < reach + 0.5) { if (ctx.playerInCar) ctx.onCarHit(this, W.carDamage); else ctx.onPlayerHit(this, W.damage); }
            this.attackT = -0.6; // recovery
          }
          if (this.attackT < 0) { this.attackT += dt * 2; if (this.attackT >= 0) this.attackT = 0; mode = 'shamble'; }
        } else { moveSpeed = this.speed * (d < 12 ? W.chaseMult : 1); mode = 'shamble'; }
      } else if (this.noiseGoal) {
        faceTo = this.noiseGoal; moveSpeed = this.speed * 0.8;
        if (Math.hypot(this.noiseGoal.x - this.x, this.noiseGoal.z - this.z) < 2) this.noiseGoal = null;
      } else if (this.state === 'wander') {
        this.timer -= dt;
        if (!this.goal || this.timer <= 0) { this.goal = { x: this.anchorX + rand(-6, 6), z: this.anchorZ + rand(-6, 6) }; this.timer = rand(4, 9); }
        faceTo = this.goal; moveSpeed = this.speed * 0.45;
        if (Math.hypot(this.goal.x - this.x, this.goal.z - this.z) < 1) { moveSpeed = 0; mode = 'idle'; }
      } else { mode = 'idle'; this.yaw += Math.sin(this.t * 0.3 + this.id) * dt * 0.2; }
    }
    if (faceTo) { const want = Math.atan2(-(faceTo.x - this.x), -(faceTo.z - this.z)); this.yaw += wrapAngle(want - this.yaw) * Math.min(1, dt * 5); }
    if (moveSpeed !== 0) {
      let dx = -Math.sin(this.yaw) * moveSpeed * dt, dz = -Math.cos(this.yaw) * moveSpeed * dt;
      // separation
      for (const o of ctx.others) { if (o === this || o.dead) continue; const ox = this.x - o.x, oz = this.z - o.z, dd = ox * ox + oz * oz; if (dd < 0.7 && dd > 1e-4) { const q = Math.sqrt(dd); dx += ox / q * (0.84 - q) * 0.5; dz += oz / q * (0.84 - q) * 0.5; } }
      const [nx, nz] = ctx.world.moveCircle(this.x, this.z, dx, dz, 0.3, ctx.carObb ? [ctx.carObb] : []);
      this.x = nx; this.z = nz;
    }
    this.groanT -= dt;
    if (this.groanT <= 0) { this.groanT = rand(4, 10); if (d < 35 && this.type === 'walker') ctx.audio.groan(this.x, this.z, this.alert ? 0.6 : 0.3); }
    this.mode = mode; this.moveSpeed = Math.abs(moveSpeed);
    animate(this.model, dt, mode === 'shamble' && !this.moveSpeed ? 'shamble' : mode, this.moveSpeed, ctx.t, k);
    this.sync(dt, ctx.t);
  }
  sync(dt, t = 0) {
    const r = this.model.root; r.position.set(this.x, 0, this.z); r.rotation.y = this.yaw;
    if (this.dead) {
      const f = this.fly; const p = Math.min(1, this.deadT / 0.5);
      r.position.y = f ? f.y + 0.05 : 0; r.rotation.order = 'YXZ';
      r.rotation.y = this.fallDir !== undefined ? this.fallDir + Math.PI : this.yaw;
      r.rotation.x = -p * Math.PI / 2 * 0.98; r.rotation.z = f ? f.spin * Math.min(1, this.deadT) * 0.3 : 0;
    }
    if (this.glow) this.glow.material.color.setScalar(1).setRGB(1, 0.2 + (this.state === 'scream' ? Math.sin(t * 30) * 0.3 + 0.3 : 0), 0.1);
  }
  dispose() { this.scene.remove(this.model.root); }
  // ray test for firearms: returns {dist, head} or null
  ray(o, dir, maxD) {
    if (this.dead) return null;
    const s = this.scale; let best = null;
    const spheres = [[1.62 * s, 0.17, true], [1.2 * s, 0.32, false], [0.65 * s, 0.28, false]];
    for (const [y, rad, head] of spheres) {
      const cx = this.x - o.x, cy = y - o.y, cz = this.z - o.z;
      const b = cx * dir.x + cy * dir.y + cz * dir.z; if (b < 0) continue;
      const c2 = cx * cx + cy * cy + cz * cz - b * b; if (c2 > rad * rad) continue;
      const dist = b - Math.sqrt(rad * rad - c2); if (dist > maxD) continue;
      if (!best || dist < best.dist) best = { dist, head };
    }
    return best;
  }
}

function carEdgeDist(obb, x, z) {
  if (!obb) return 99;
  const [lx, lz] = obb.local(x, z); const dx = Math.max(0, Math.abs(lx) - obb.hx), dz = Math.max(0, Math.abs(lz) - obb.hz);
  return Math.hypot(dx, dz);
}
export { clamp };
