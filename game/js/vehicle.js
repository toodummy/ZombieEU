// Hero sedan: procedural model + arcade handling + condition/resources (fuel, engine, wheels).
import * as THREE from 'three';
import { VehicleTune as T } from './config.js';
import { clamp, damp, OBB2 } from './mathutil.js';

const sharedGeo = {};
function sedanGeometries() {
  if (sharedGeo.body) return sharedGeo;
  const s = new THREE.Shape(); // side profile; +x = front
  s.moveTo(2.3, 0.3); s.lineTo(1.75, 0.3); s.absarc(1.3, 0.34, 0.45, 0, Math.PI, false); s.lineTo(-0.95, 0.3);
  s.absarc(-1.4, 0.34, 0.45, 0, Math.PI, false); s.lineTo(-2.28, 0.3); s.lineTo(-2.33, 0.62); s.lineTo(-2.22, 0.9);
  s.lineTo(-1.45, 0.96); s.lineTo(1.05, 0.96); s.lineTo(2.2, 0.8); s.lineTo(2.36, 0.56); s.lineTo(2.3, 0.3);
  const bodyW = 1.66;
  const body = new THREE.ExtrudeGeometry(s, { depth: bodyW, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 3, curveSegments: 10 });
  body.rotateY(Math.PI / 2); body.translate(-bodyW / 2, 0, 0); body.computeVertexNormals();
  const g = new THREE.Shape(); g.moveTo(1.02, 0.95); g.lineTo(0.2, 1.4); g.lineTo(-0.85, 1.4); g.lineTo(-1.5, 0.95); g.lineTo(1.02, 0.95);
  const glassW = 1.46;
  const glass = new THREE.ExtrudeGeometry(g, { depth: glassW, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  glass.rotateY(Math.PI / 2); glass.translate(-glassW / 2, 0, 0); glass.computeVertexNormals();
  const tire = new THREE.CylinderGeometry(0.35, 0.35, 0.26, 22); tire.rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(0.22, 0.22, 0.27, 12); rim.rotateZ(Math.PI / 2);
  Object.assign(sharedGeo, { body, glass, tire, rim, box: new THREE.BoxGeometry(1, 1, 1) });
  return sharedGeo;
}
const mats = {};
function sedanMaterials() {
  if (mats.glass) return mats;
  mats.glass = new THREE.MeshPhysicalMaterial({ color: 0x0b1118, roughness: 0.08, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.88 });
  mats.tire = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.85 });
  mats.rim = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.9 });
  mats.trim = new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.6, metalness: 0.3 });
  mats.chrome = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 1 });
  mats.head = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xfff1cc, emissiveIntensity: 3 });
  mats.headOff = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.2 });
  mats.tail = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1a0a, emissiveIntensity: 1.2 });
  mats.tailDead = new THREE.MeshStandardMaterial({ color: 0x330505, roughness: 0.3 });
  mats.bag = new THREE.MeshStandardMaterial({ color: 0x3b3a2a, roughness: 0.95 });
  mats.bag2 = new THREE.MeshStandardMaterial({ color: 0x5a2d1c, roughness: 0.95 });
  mats.plate = new THREE.MeshStandardMaterial({ color: 0xe8d34a, roughness: 0.5 });
  return mats;
}

export function buildSedanMesh(color = 0x1a2846, { wreck = false, rack = true, lights = true } = {}) {
  const G = sedanGeometries(), M = sedanMaterials();
  const root = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: wreck ? 0.75 : 0.42, metalness: wreck ? 0.3 : 0.55, clearcoat: wreck ? 0.1 : 0.9, clearcoatRoughness: 0.25 });
  const chassis = new THREE.Group(); root.add(chassis); root.userData.chassis = chassis;
  const body = new THREE.Mesh(G.body, paint); body.castShadow = true; body.receiveShadow = true; chassis.add(body);
  const glass = new THREE.Mesh(G.glass, wreck ? M.trim : M.glass); glass.castShadow = true; chassis.add(glass);
  const add = (geo, mat, sx, sy, sz, x, y, z, parent = chassis) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); parent.add(m); return m; };
  add(G.box, M.trim, 1.78, 0.22, 0.22, 0, 0.42, -2.36); // front bumper
  add(G.box, M.trim, 1.78, 0.22, 0.22, 0, 0.42, 2.36);  // rear bumper
  add(G.box, M.trim, 0.9, 0.16, 0.05, 0, 0.66, -2.4);   // grille
  add(G.box, M.plate, 0.5, 0.12, 0.02, 0, 0.42, -2.48);
  add(G.box, M.plate, 0.5, 0.12, 0.02, 0, 0.62, 2.43);
  add(G.box, paint, 1.34, 0.05, 1.05, 0, 1.43, -0.32);   // roof panel
  add(G.box, M.trim, 0.12, 0.08, 0.18, -0.92, 1.0, -0.9); add(G.box, M.trim, 0.12, 0.08, 0.18, 0.92, 1.0, -0.9); // mirrors
  const hl = [add(G.box, wreck ? M.headOff : M.head, 0.42, 0.14, 0.06, -0.6, 0.72, -2.38), add(G.box, wreck ? M.headOff : M.head, 0.42, 0.14, 0.06, 0.6, 0.72, -2.38)];
  const tl = [add(G.box, wreck ? M.tailDead : M.tail.clone(), 0.38, 0.15, 0.05, -0.62, 0.76, 2.4), add(G.box, wreck ? M.tailDead : M.tail.clone(), 0.38, 0.15, 0.05, 0.62, 0.76, 2.4)];
  if (rack && !wreck) { // roof rack + bags (concept vehicle progression)
    add(G.box, M.trim, 0.04, 0.05, 1.2, -0.6, 1.5, -0.3); add(G.box, M.trim, 0.04, 0.05, 1.2, 0.6, 1.5, -0.3);
    add(G.box, M.bag, 0.9, 0.28, 0.55, -0.1, 1.66, -0.5).castShadow = true;
    add(G.box, M.bag2, 0.5, 0.22, 0.45, 0.32, 1.63, 0.05).castShadow = true;
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.0, 10), M.bag); roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.6, 0.25); chassis.add(roll);
  }
  const wheels = [];
  const wp = [[-0.83, -1.3], [0.83, -1.3], [-0.83, 1.4], [0.83, 1.4]]; // FL FR RL RR
  wp.forEach(([x, z], i) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.35, z); root.add(pivot);
    const spin = new THREE.Group(); pivot.add(spin);
    const t = new THREE.Mesh(G.tire, M.tire); t.castShadow = true; spin.add(t);
    const r = new THREE.Mesh(G.rim, M.rim); r.position.x = x < 0 ? -0.01 : 0.01; spin.add(r);
    if (wreck) { pivot.rotation.z = (Math.random() - 0.5) * 0.3; pivot.position.y = 0.25 + Math.random() * 0.1; }
    wheels.push({ pivot, spin });
  });
  if (wreck) { chassis.rotation.z = (Math.random() - 0.5) * 0.08; chassis.position.y = -0.05; }
  root.userData.parts = { wheels, hl, tl, paint };
  return root;
}

export class Vehicle {
  constructor(scene) {
    this.mesh = buildSedanMesh(0x1b2a4a);
    scene.add(this.mesh);
    const p = this.mesh.userData.parts; this.parts = p;
    // headlights
    this.spots = [-0.6, 0.6].map(x => {
      const s = new THREE.SpotLight(0xfff0d0, 120, 55, 0.5, 0.45, 1.6);
      s.position.set(x, 0.75, -2.3); s.target.position.set(x * 1.5, 0, -18);
      this.mesh.add(s); this.mesh.add(s.target); return s;
    });
    this.spots[0].castShadow = false;
    this.tailLight = new THREE.PointLight(0xff2010, 0, 7, 2); this.tailLight.position.set(0, 0.8, 2.8); this.mesh.add(this.tailLight);
    // fake volumetric beams in rain
    const coneGeo = new THREE.ConeGeometry(2.2, 14, 20, 1, true); coneGeo.translate(0, -7, 0); coneGeo.rotateX(-Math.PI / 2);
    this.beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uOn: { value: 1 } },
      vertexShader: 'varying float vD; varying vec3 vN; varying vec3 vV; void main(){ vD = -position.z/14.0; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform float uOn; varying float vD; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); float a = (1.0-vD)*(1.0-vD)*0.07*edge*uOn; gl_FragColor = vec4(1.0,0.93,0.8,a); }',
    });
    this.beams = [-0.6, 0.6].map(x => { const m = new THREE.Mesh(coneGeo, this.beamMat); m.position.set(x, 0.72, -2.4); m.rotation.x = 0.06; this.mesh.add(m); return m; });
    this.obb = new OBB2(0, 0, T.halfWidth, T.halfLength, 0);
    this.reset({ x: 0, z: 0, heading: 0, fuel: T.startFuel, engine: 100, wheels: [100, 100, 100, 100] });
  }
  reset(s) {
    this.x = s.x; this.z = s.z; this.heading = s.heading; this.vx = 0; this.vz = 0; this.vf = 0; this.yawRate = 0;
    this.steer = 0; this.fuel = s.fuel; this.engine = s.engine; this.wheels = s.wheels.slice();
    this.engineOn = this.fuel > 0 && this.engine > 0; this.lightsOn = s.lightsOn !== false;
    this.throttle = 0; this.braking = false; this.rpm = 0; this.load = 0; this.roll = 0; this.pitch = 0; this.wheelSpin = 0;
    this.distance = 0; this.lastImpact = 0; this.surface = 'asphalt'; this.occupied = false;
    this.syncMesh(0);
  }
  snapshot() { return { x: +this.x.toFixed(2), z: +this.z.toFixed(2), heading: +this.heading.toFixed(4), fuel: +this.fuel.toFixed(3), engine: +this.engine.toFixed(1), wheels: this.wheels.map(w => +w.toFixed(1)), lightsOn: this.lightsOn }; }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get kmh() { return Math.abs(this.vf) * 3.6; }
  get drivable() { return this.engine > 0; }
  get condition() { const w = Math.min(...this.wheels); return Math.min(this.engine, w * 1.2); }
  forward() { return [-Math.sin(this.heading), -Math.cos(this.heading)]; }
  updateOBB() { this.obb.set(this.x, this.z, T.halfWidth, T.halfLength, this.heading); return this.obb; }
  doorPoints() { // driver (right-hand drive UK: driver on the right side) then passenger
    const o = this.updateOBB();
    return [{ side: 'driver', p: o.world(T.halfWidth + 0.75, -0.25) }, { side: 'passenger', p: o.world(-T.halfWidth - 0.75, -0.25) }];
  }
  addFuel(l) { const before = this.fuel; this.fuel = Math.min(T.tank, this.fuel + l); if (this.fuel > 0 && this.engine > 0 && before <= 0) this.engineOn = true; return this.fuel - before; }

  update(dt, ctl, world) {
    const surf = world.surfaceAt(this.x, this.z); this.surface = surf;
    const S = T.surfaces[surf] || T.surfaces.offroad;
    const [fx, fz] = this.forward(); const rx = -fz, rz = fx; // right vector = (cos h, -sin h)
    let vf = this.vx * fx + this.vz * fz, vr = this.vx * rx + this.vz * rz;
    const wMin = Math.min(...this.wheels);
    const power = (this.engine < T.limpEngine ? 0.45 + this.engine / T.limpEngine * 0.3 : 1) * (wMin < T.flatWheel ? 0.55 : 1);
    const maxF = T.maxForward * (this.engine < T.limpEngine ? 0.55 : 1) * (wMin < 35 ? 0.75 : 1);
    const canDrive = this.engineOn && this.fuel > 0 && this.engine > 0;
    const thr = ctl ? ctl.throttle : 0, brk = ctl ? ctl.brake : 0, hb = ctl ? ctl.handbrake : true;
    let acc = 0; this.braking = false;
    if (thr > 0 && canDrive) { if (vf < -0.5) { acc += T.brakeForce * thr; this.braking = true; } else acc += T.engineForce * power * thr * clamp(1 - vf / maxF, 0, 1); }
    if (brk > 0) { if (vf > 0.5) { acc -= T.brakeForce * brk; this.braking = true; } else if (canDrive) acc -= T.engineForce * 0.6 * brk * clamp(1 + vf / T.maxReverse, 0, 1); }
    const drag = (T.coastDrag + S.drag) * Math.sign(vf) + T.airDrag * vf * Math.abs(vf);
    if (hb) acc -= Math.sign(vf) * 6;
    let nvf = vf + (acc - drag) * dt; if (Math.sign(nvf) !== Math.sign(vf) && Math.abs(acc) < Math.abs(drag) + 6.1 && thr === 0 && brk === 0) nvf = 0;
    if (!ctl && Math.abs(nvf) < 0.3) nvf = 0;
    vf = nvf;
    // steering (speed sensitive) + damaged-wheel pull
    const steerIn = ctl ? ctl.steer : 0;
    const target = steerIn * T.maxSteer / (1 + Math.abs(vf) / 16);
    this.steer = damp(this.steer, target, steerIn ? T.steerRate : T.steerReturn, dt);
    const pull = ((this.wheels[1] + this.wheels[3]) - (this.wheels[0] + this.wheels[2])) / 200 * 0.06; // weak side drags
    const yaw = vf * Math.tan(this.steer + pull * Math.sign(vf)) / T.wheelbase;
    const grip = hb ? T.handbrakeGrip : S.grip;
    this.yawRate = damp(this.yawRate, yaw, 4 + grip * 10, dt);
    this.heading += this.yawRate * dt;
    // lateral slip decays according to grip; keeps a little drift on gravel/handbrake
    vr = vr * Math.exp(-grip * 9 * dt);
    const [nfx, nfz] = this.forward(); const nrx = -nfz, nrz = nfx;
    this.vx = nfx * vf + nrx * vr; this.vz = nfz * vf + nrz * vr; this.vf = vf; this.vr = vr;
    const px = this.x, pz = this.z, ph = this.heading - this.yawRate * dt;
    this.x += this.vx * dt; this.z += this.vz * dt;
    const impact = this.collide(world, px, pz, ph);
    const moved = Math.hypot(this.x - px, this.z - pz); this.distance += moved;
    // fuel use
    if (this.engineOn) {
      this.fuel -= moved * T.fuelPerMeter * (1 + 0.7 * thr) + T.fuelIdlePerSec * dt;
      if (this.fuel <= 0) { this.fuel = 0; this.engineOn = false; }
    }
    // presentation state
    this.throttle = thr; this.rpm = clamp(Math.abs(vf) / maxF * 0.8 + thr * 0.25, 0, 1); this.load = thr * (canDrive ? 1 : 0);
    const latA = vf * this.yawRate, lonA = acc - drag;
    this.roll = damp(this.roll, clamp(-latA * 0.012, -0.08, 0.08), 6, dt);
    this.pitch = damp(this.pitch, clamp(lonA * 0.006, -0.05, 0.05), 6, dt);
    this.wheelSpin += vf * dt / 0.35;
    return impact;
  }

  samplePoints() {
    const o = this.updateOBB(), pts = [], hx = T.halfWidth, hz = T.halfLength;
    for (const lz of [-hz, -hz * 0.5, 0, hz * 0.5, hz]) { pts.push(o.world(-hx, lz)); pts.push(o.world(hx, lz)); }
    pts.push(o.world(0, -hz)); pts.push(o.world(0, hz));
    return pts;
  }
  collide(world, px, pz, ph) {
    let maxImpact = 0, hitPoint = null;
    for (let iter = 0; iter < 3; iter++) {
      let push = null, best = 0, at = null;
      for (const [x, z] of this.samplePoints()) {
        const r = world.penetration(x, z);
        if (r && r[2] > best) { best = r[2]; push = r; at = [x, z]; }
      }
      // small obstacles poking into the body
      const o = this.obb;
      for (const ob of world.nearObstacles(this.x, this.z, 6)) {
        if (ob.r > 2.5) continue;
        for (const [cx, cz] of [...ob.corners(), [ob.cx, ob.cz]]) {
          if (!o.contains(cx, cz)) continue;
          const [lx, lz] = o.local(cx, cz); const px2 = T.halfWidth - Math.abs(lx), pz2 = T.halfLength - Math.abs(lz);
          let n, d; if (px2 < pz2) { n = o.world(-Math.sign(lx), 0); d = px2; } else { n = o.world(0, -Math.sign(lz)); d = pz2; }
          const nx = n[0] - o.cx, nz = n[1] - o.cz; const len = Math.hypot(nx, nz) || 1;
          if (d > best) { best = d; push = [nx / len, nz / len, d]; at = [cx, cz]; }
        }
      }
      if (!push) break;
      const [nx, nz, d] = push;
      this.x += nx * (d + 0.01); this.z += nz * (d + 0.01);
      const vn = this.vx * nx + this.vz * nz;
      if (vn < 0) {
        maxImpact = Math.max(maxImpact, -vn); hitPoint = at;
        this.vx -= 1.25 * vn * nx; this.vz -= 1.25 * vn * nz; // small bounce
        this.vx *= 0.8; this.vz *= 0.8;
        this.yawRate *= 0.5;
      }
      if (iter === 2 && world.penetrationAny(this.samplePoints())) { this.x = px; this.z = pz; this.heading = ph; this.vx *= -0.2; this.vz *= -0.2; }
    }
    const [fx, fz] = this.forward(); this.vf = this.vx * fx + this.vz * fz;
    if (maxImpact > T.impactDamageThreshold) this.applyImpact(maxImpact, hitPoint);
    this.lastImpact = maxImpact;
    return maxImpact > 1.2 ? { strength: maxImpact, x: hitPoint ? hitPoint[0] : this.x, z: hitPoint ? hitPoint[1] : this.z } : null;
  }
  applyImpact(v, at) {
    const over = v - T.impactDamageThreshold;
    this.engine = Math.max(0, this.engine - over * T.engineDamagePerMs * (at && this.isFront(at) ? 1.3 : 0.7));
    if (at) { const i = this.nearestWheel(at); this.wheels[i] = Math.max(0, this.wheels[i] - over * T.wheelDamagePerMs); }
    if (this.engine <= 0) this.engineOn = false;
  }
  isFront([x, z]) { const [, lz] = this.obb.local(x, z); return lz < 0; }
  nearestWheel([x, z]) { const [lx, lz] = this.obb.local(x, z); return (lz < 0 ? 0 : 2) + (lx < 0 ? 0 : 1); }
  damageEngine(a) { this.engine = Math.max(0, this.engine - a); if (this.engine <= 0) this.engineOn = false; }

  syncMesh(dt, time = 0) {
    const m = this.mesh; m.position.set(this.x, 0, this.z); m.rotation.y = this.heading;
    const ch = m.userData.chassis; ch.rotation.z = this.roll; ch.rotation.x = this.pitch;
    this.parts.wheels.forEach((w, i) => {
      w.spin.rotation.x = -this.wheelSpin;
      if (i < 2) w.pivot.rotation.y = this.steer;
      const dmg = this.wheels[i];
      w.pivot.rotation.z = dmg < 35 ? (i % 2 ? -1 : 1) * (0.12 + Math.sin(time * 18 + i) * 0.03 * Math.min(1, Math.abs(this.vf))) : 0;
      w.pivot.position.y = dmg < T.flatWheel ? 0.24 : 0.35;
    });
    const on = this.lightsOn && this.engine > 0;
    this.spots.forEach(s => { s.intensity = on ? 120 : 0; });
    this.beamMat.uniforms.uOn.value = on ? 1 : 0;
    this.parts.hl.forEach(h => { h.material.emissiveIntensity = on ? 3 : 0; });
    const tailI = this.braking ? 4 : (on ? 1.2 : 0.1);
    this.parts.tl.forEach(t => { if (t.material.emissiveIntensity !== undefined) t.material.emissiveIntensity = tailI; });
    this.tailLight.intensity = this.braking ? 6 : (on ? 1.5 : 0);
  }
}
