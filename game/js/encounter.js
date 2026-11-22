// Encounter director: owns the infected budget, legal spawn areas, cues, pursuit and cleanup.
// Reacts to mission phase and noise. Spawns are occluded/reachable; encounter state is rebuilt from phase on restore.
import * as THREE from 'three';
import { EncounterTune as E } from './config.js';
import { Infected } from './infected.js';
import { rand } from './mathutil.js';

// authored placements by phase (route identifiers, not scene object names)
const AUTHORED = [
  // safehouse street — sparse, teaches ramming/avoiding
  ...[[-5, -70], [4, -105], [-3, -150], [6, -190], [1, -205], [-6, -240], [3, -270], [-2, -285]].map(([x, z]) => ({ x, z, type: 'walker', phases: ['drive_to_station'] })),
  ...[[40, -296], [70, -303], [130, -298], [143, -304]].map(([x, z]) => ({ x, z, type: 'walker', phases: ['drive_to_station', 'approach'] })),
  // forecourt: walkers at a distance on approach
  ...[[244, -352], [172, -340], [236, -309], [190, -309]].map(([x, z]) => ({ x, z, type: 'walker', phases: ['approach', 'refuel'], state: 'idle' })),
  // HIGH STREET: crowd pressure
  ...Array.from({ length: 26 }, (_, i) => ({ x: 260 + ((i * 37) % 15) - 7, z: -350 - i * 16.5, type: 'walker', phases: ['refuel', 'escape'], route: 'high_street' })),
  ...[[262, -600], [256, -720]].map(([x, z]) => ({ x, z, type: 'screamer', phases: ['escape'], route: 'high_street' })),
  // SERVICE LANE: lower density
  ...[[440, -360], [439, -450], [441, -540], [400, -622], [331, -660], [329, -740]].map(([x, z]) => ({ x, z, type: 'walker', phases: ['refuel', 'escape'] })),
  ...[[394, -470], [351, -530]].map(([x, z]) => ({ x, z, type: 'walker', phases: ['escape'] })),
  // motorway approach
  ...[[255, -770], [265, -765], [331, -775]].map(([x, z]) => ({ x, z, type: 'walker', phases: ['escape'] })),
];
// occluded entrances around the forecourt for reinforcements
const ANCHORS = [[178, -353.5], [240, -353.5], [120, -300], [300, -302], [262, -370], [252, -354], [168.5, -312]];

export class EncounterDirector {
  constructor(scene, world, audio) {
    this.scene = scene; this.world = world; this.audio = audio; this.list = [];
    this.reset('drive_to_station');
  }
  reset(phase) {
    for (const i of this.list) i.dispose();
    this.list = []; this.consumed = new Set(); this.phase = phase;
    this.pressureT = 0; this.screamer = null; this.screamerSpawned = false; this.escalateT = 0; this.wavesSpawned = 0;
    this.threat = 0; this.activeScream = null; this.screamSound = null; this.spawnT = 0; this.noise = [];
  }
  setPhase(phase) { this.phase = phase; if (phase === 'escape') this.cleanup(null, 60); }
  get alive() { return this.list.filter(i => !i.dead); }

  spawn(type, x, z, opts = {}) {
    if (this.alive.length >= E.activeBudget) return null;
    if (!this.world.isWalkable(x, z)) { console.warn('[encounter] rejected spawn outside walkable area', x, z); return null; }
    const inf = new Infected(this.scene, type, x, z, opts); this.list.push(inf); return inf;
  }
  // occluded = outside the camera frustum or behind a building, and not too close
  occluded(x, z, cam, px, pz) {
    if (Math.hypot(x - px, z - pz) < 16) return false;
    const v = new THREE.Vector3(x, 1.2, z).project(cam);
    const inView = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    return !inView || !this.world.lineClear(px, pz, x, z);
  }
  wave(n, cam, px, pz) {
    const cands = ANCHORS.filter(([x, z]) => Math.hypot(x - px, z - pz) < 70);
    for (let k = 0; k < 24; k++) { const a = Math.random() * Math.PI * 2, r = rand(22, 42); cands.push([px + Math.cos(a) * r, pz + Math.sin(a) * r]); }
    const anchors = cands.filter(([x, z]) => this.world.isWalkable(x, z, -0.4) && this.occluded(x, z, cam, px, pz));
    if (!anchors.length) return 0;
    let made = 0;
    const local = () => this.alive.filter(i => Math.hypot(i.x - px, i.z - pz) < 60).length;
    for (let k = 0; k < n; k++) {
      if (local() >= E.forecourtBudget) break;
      const [ax, az] = anchors[k % anchors.length];
      if (this.spawn('walker', ax + rand(-1.5, 1.5), az + rand(-1, 1), { alert: true, state: 'chase' })) made++;
    }
    return made;
  }
  emitNoise(x, z, radius) {
    for (const i of this.list) if (!i.dead && !i.alert && i.distTo(x, z) < radius) { i.noiseGoal = { x, z }; if (i.distTo(x, z) < radius * 0.5) i.alert = true; }
  }
  cleanup(px, maxD = E.cleanupDistance, pz) {
    this.list = this.list.filter(i => {
      const far = px === null ? (i.dead || Math.hypot(i.x - 210, i.z + 330) < maxD) && i.z > -360 && i.x < 300 : Math.hypot(i.x - px, i.z - pz) > maxD;
      const stale = i.dead && i.deadT > 25;
      if ((far && px !== null) || stale || (px === null && far && !i.alert)) { i.dispose(); return false; }
      return true;
    });
  }

  // ctx: { dt, t, cam, player, car, playerInCar, fueling, forecourtActive, route, mission callbacks... }
  update(ctx) {
    const px = ctx.playerInCar ? ctx.car.x : ctx.player.x, pz = ctx.playerInCar ? ctx.car.z : ctx.player.z;
    // streaming of authored placements
    this.spawnT -= ctx.dt;
    if (this.spawnT <= 0) {
      this.spawnT = 0.4;
      AUTHORED.forEach((a, idx) => {
        if (this.consumed.has(idx) || !a.phases.includes(this.phase)) return;
        const d = Math.hypot(a.x - px, a.z - pz);
        if (d < 120 && d > 22) { if (this.spawn(a.type, a.x, a.z, { state: a.state })) this.consumed.add(idx); }
      });
      this.cleanup(px, E.cleanupDistance, pz);
    }
    // forecourt pressure: screamer telegraph after fuelling starts (or loitering on foot)
    if (ctx.forecourtActive) {
      if (ctx.fueling || ctx.loiter > 18) this.pressureT += ctx.dt;
      if (!this.screamerSpawned && this.pressureT > E.pressureDelay) {
        const anchors = ANCHORS.slice(0, 3).filter(([x, z]) => this.occluded(x, z, ctx.cam, px, pz));
        const [ax, az] = anchors[0] || ANCHORS[1];
        this.screamer = this.spawn('screamer', ax, az, { alert: true, state: 'chase' });
        if (this.screamer) { this.screamerSpawned = true; ctx.onScreamerArrive && ctx.onScreamerArrive(this.screamer); }
      }
      if (this.wavesSpawned > 0) {
        this.escalateT += ctx.dt;
        if (this.escalateT > E.escalationEvery) { this.escalateT = 0; this.wave(3, ctx.cam, px, pz); }
      }
    }
    // noise from player actions
    for (const n of this.noise.splice(0)) this.emitNoise(n.x, n.z, n.r);
    const self = this;
    const ictx = {
      dt: ctx.dt, t: ctx.t, world: this.world, player: ctx.player, car: ctx.car, playerInCar: ctx.playerInCar, carObb: ctx.carObb, audio: this.audio, others: this.list,
      onPlayerHit: ctx.onPlayerHit, onCarHit: ctx.onCarHit,
      canScream: () => !self.activeScream,
      onScreamStart(i) { self.activeScream = i; self.screamSound = self.audio.scream(i.x, i.z, E.screamer.warning); ctx.onScreamStart && ctx.onScreamStart(i); },
      onScreamInterrupted(i) { if (self.screamSound) self.screamSound.stop(); self.activeScream = null; ctx.onScreamInterrupted && ctx.onScreamInterrupted(i); },
      onScreamComplete(i) {
        self.activeScream = null; self.wavesSpawned++;
        self.wave(E.reinforcementWave, ctx.cam, px, pz);
        self.emitNoise(i.x, i.z, 80); for (const z of self.list) if (!z.dead && z.distTo(px, pz) < 60) z.alert = true;
        ctx.onScreamComplete && ctx.onScreamComplete(i);
      },
    };
    for (const i of this.list) {
      const wasAlive = !i.dead;
      i.update(ictx);
      if (wasAlive && i.dead && self.activeScream === i) { if (self.screamSound) self.screamSound.stop(); self.activeScream = null; }
    }
    // threat level for audio/post (0..1)
    let th = 0; for (const i of this.list) if (!i.dead && i.alert) { const d = i.distTo(px, pz); th += Math.max(0, 1 - d / 25); }
    this.threat += (Math.min(1, th / 3) - this.threat) * Math.min(1, ctx.dt * 2);
  }
  // car impacts on infected
  carSweep(car, onHit) {
    const speed = Math.abs(car.vf); if (speed < 3) return;
    const o = car.obb;
    for (const i of this.list) {
      if (i.dead) continue;
      if (!o.contains(i.x, i.z, 0.45)) continue;
      const killed = i.damage(speed * 7, car.x, car.z, 'car');
      if (!killed) { i.stagger = 0.8; const [fx, fz] = car.forward(); i.push = [fx * speed * 0.6, fz * speed * 0.6]; }
      onHit(i, speed, killed);
    }
  }
  rayHit(o, dir, maxD) {
    let best = null;
    for (const i of this.list) { const r = i.ray(o, dir, maxD); if (r && (!best || r.dist < best.dist)) best = { ...r, inf: i }; }
    return best;
  }
}
