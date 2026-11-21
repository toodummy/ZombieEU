// Alex on foot: movement, stamina, crowbar melee, pistol, damage. Input mode / occupancy is owned by Game.
import * as THREE from 'three';
import { PlayerTune as P } from './config.js';
import { buildHumanoid, addCrowbar, animate } from './characters.js';
import { wrapAngle, clamp } from './mathutil.js';

export class Player {
  constructor(scene) {
    this.model = buildHumanoid({ top: 0x46503a, bottom: 0x2b3446, skin: 0xc9a184, backpack: true, hairColor: 0x2a1c12, seed: 7 });
    addCrowbar(this.model);
    scene.add(this.model.root);
    this.reset({ x: 0, z: 0, yaw: 0, health: P.health, stamina: P.stamina, mag: P.pistol.mag, reserve: P.pistol.startReserve });
  }
  reset(s) {
    this.x = s.x; this.z = s.z; this.yaw = s.yaw || 0; this.health = s.health; this.stamina = s.stamina ?? P.stamina; this.mag = s.mag; this.reserve = s.reserve;
    this.swingT = -1; this.swingHit = false; this.fireCool = 0; this.reloadT = 0; this.reloading = false; this.aiming = false; this.stagger = 0; this.hurtT = 0;
    this.speed = 0; this.action = null; this.stepT = 0; this.visible = true;
  }
  snapshot() { return { x: +this.x.toFixed(2), z: +this.z.toFixed(2), yaw: +this.yaw.toFixed(3), health: Math.max(1, Math.round(this.health)), stamina: Math.round(this.stamina), mag: this.mag, reserve: this.reserve }; }
  get busy() { return this.swingT >= 0 || this.stagger > 0; }

  // a: input actions; c: { dt, t, camYaw, world, carObb, enc, audio, fx, onShot, actionLock }
  update(a, c) {
    const dt = c.dt;
    this.fireCool = Math.max(0, this.fireCool - dt); this.stagger = Math.max(0, this.stagger - dt); this.hurtT = Math.max(0, this.hurtT - dt);
    this.aiming = !!a.aim && !c.actionLock && this.stagger <= 0;
    // movement relative to camera
    let mx = a.moveX, my = a.moveY; const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
    const sprint = a.sprint && !this.aiming && this.stamina > 5 && len > 0.1;
    let sp = this.aiming ? P.aimWalk : sprint ? P.sprint : P.walk;
    if (c.actionLock || this.stagger > 0) sp = 0;
    if (this.swingT >= 0) sp *= 0.4;
    const cy = c.camYaw; // camera looks along (-sin, -cos)
    const fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
    const vx = (fx * my + rx * mx) * sp, vz = (fz * my + rz * mx) * sp;
    if (len > 0.1 && sp > 0) {
      const [nx, nz] = c.world.moveCircle(this.x, this.z, vx * dt, vz * dt, P.radius, c.carObb ? [c.carObb] : []);
      this.x = nx; this.z = nz;
      if (!this.aiming) this.yaw += wrapAngle(Math.atan2(-vx, -vz) - this.yaw) * Math.min(1, dt * 12);
      this.stepT -= dt * (sprint ? 1.6 : 1); if (this.stepT <= 0) { this.stepT = 0.42; c.audio.step(this.x, this.z, true); }
    }
    if (this.aiming || this.swingT >= 0) this.yaw += wrapAngle(cy - this.yaw) * Math.min(1, dt * 14);
    this.speed = len > 0.1 ? sp : 0;
    this.stamina = clamp(this.stamina + (sprint ? -P.sprintCost : (this.swingT >= 0 ? 0 : P.staminaRegen)) * dt, 0, P.stamina);
    // melee (light swing). LMB when not aiming / gamepad X
    if ((a.melee || (a.fire && !this.aiming)) && this.swingT < 0 && !c.actionLock && this.stagger <= 0) {
      if (this.stamina >= P.melee.cost * 0.5) { this.swingT = 0; this.swingHit = false; this.stamina = Math.max(0, this.stamina - P.melee.cost); c.audio.swing(); }
    }
    if (this.swingT >= 0) {
      this.swingT += dt;
      if (!this.swingHit && this.swingT >= P.melee.hitAt) {
        this.swingHit = true;
        const fx2 = -Math.sin(this.yaw), fz2 = -Math.cos(this.yaw);
        let hits = 0;
        for (const i of c.enc.list) {
          if (i.dead) continue; const dx = i.x - this.x, dz = i.z - this.z, d = Math.hypot(dx, dz);
          if (d > P.melee.range || d < 0.01) continue;
          const dot = (dx * fx2 + dz * fz2) / d; if (dot < Math.cos(P.melee.arc / 2)) continue;
          const killed = i.damage(P.melee.damage * (this.stamina < 5 ? 0.6 : 1), this.x, this.z, 'melee'); hits++;
          c.onHitInfected(i, killed, i.x, 1.3, i.z);
        }
        if (hits) { c.audio.hit(this.x - Math.sin(this.yaw), this.z - Math.cos(this.yaw)); c.enc.noise.push({ x: this.x, z: this.z, r: 9 }); }
      }
      if (this.swingT >= P.melee.time) this.swingT = -1;
    }
    // pistol
    if (this.reloading) { this.reloadT -= dt; if (this.reloadT <= 0) { const need = P.pistol.mag - this.mag, take = Math.min(need, this.reserve); this.mag += take; this.reserve -= take; this.reloading = false; c.audio.click(); } }
    if (a.reload && !this.reloading && this.mag < P.pistol.mag && this.reserve > 0) { this.reloading = true; this.reloadT = P.pistol.reload; c.audio.click(); }
    if (this.aiming && a.fire && this.fireCool <= 0 && !this.reloading) {
      if (this.mag > 0) { this.mag--; this.fireCool = P.pistol.fireTime; c.onShot(this); }
      else { c.audio.click(); this.fireCool = 0.3; if (this.reserve > 0) { this.reloading = true; this.reloadT = P.pistol.reload; } }
    }
    // animation
    const m = this.model;
    m.crowbar.visible = !this.aiming; m.pistol.visible = this.aiming;
    let mode = this.speed > 0 ? (sprint ? 'run' : 'walk') : 'idle', k = 0;
    if (c.anim) mode = c.anim;
    if (this.swingT >= 0) { mode = 'swing'; k = this.swingT / P.melee.time; }
    else if (this.aiming) mode = 'aim';
    if (this.stagger > 0) mode = 'stagger';
    animate(m, dt, mode, this.speed, c.t, k);
    if (this.aiming || mode === 'swing') { // upper body follows camera pitch a bit
      m.chest.rotation.x += clamp(-c.camPitch * 0.5, -0.4, 0.4);
    }
    m.root.position.set(this.x, 0, this.z); m.root.rotation.y = this.yaw; m.root.visible = this.visible;
  }
  hurt(amount, fromX, fromZ) {
    this.health -= amount; this.stagger = 0.35; this.hurtT = 0.6; this.swingT = -1;
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1; this.knock = [dx / d, dz / d];
  }
}
