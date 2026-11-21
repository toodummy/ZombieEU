// Road of the Dead — Out of London (browser vertical slice)
// Game composes the runtime systems from docs/technical-design.md:
//   MissionDirector (mission.js) · Player/Vehicle controllers · Vehicle condition & resources (vehicle.js)
//   EncounterDirector (encounter.js) · Level (world.js) · CheckpointService (checkpoint.js) · Presentation (hud.js, audio.js, fx.js)
import * as THREE from 'three';
import { VehicleTune as VT, PlayerTune as PT, RouteTune, SAVE_SCHEMA } from './config.js';
import { clamp, damp, dampAngle, wrapAngle, lerp } from './mathutil.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { World } from './world.js';
import { Vehicle } from './vehicle.js';
import { Player } from './player.js';
import { EncounterDirector } from './encounter.js';
import { MissionDirector } from './mission.js';
import { CheckpointService } from './checkpoint.js';
import { HUD } from './hud.js';
import { Rain, Particles, PostFX } from './fx.js';
import { buildHumanoid, animate } from './characters.js';

const $ = id => document.getElementById(id);
const QA = new URLSearchParams(location.search).has('qa');
const SETTINGS_KEY = 'rotd.settings';
const DEFAULTS = { volume: 0.8, music: 0.5, sens: 1, invertY: false, subtitles: true, shake: true, soundCues: true, quality: 'high', showFps: false };

class Game {
  constructor() {
    this.canvas = $('view');
    this.settings = { ...DEFAULTS, ...loadJSON(SETTINGS_KEY) };
    if (new URLSearchParams(location.search).get('quality')) this.settings.quality = new URLSearchParams(location.search).get('quality');
    const q = this.settings.quality;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: q !== 'high', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, q === 'low' ? 1 : 1.5));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = q !== 'low'; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 2000);
    this.input = new Input(this.canvas); this.audio = new AudioEngine(); this.hud = new HUD(); this.checkpoints = new CheckpointService();
    this.state = 'title'; this.ready = false; this.frames = 0; this.t = 0;
    this.inventory = { canister: false, canisterLeft: 0, kit: false };
    this.camState = { yaw: 0, pitch: 0.12, mode: 'drive', blend: 1, from: new THREE.Vector3(), fromQ: new THREE.Quaternion(), shake: 0, fov: 62 };
    this.hurt = 0; this.transition = null; this.fuelSession = null; this.holdT = 0; this.holdKind = null; this.playerInCar = true;
    this.applySettings();
    this.wireUI();
    addEventListener('resize', () => this.resize());
    this.input.onPauseRequest = (fromLock) => { if (this.state === 'playing') this.pause(); else if (this.state === 'paused' && !fromLock) this.resume(); };
    this.loop = this.loop.bind(this); this.last = performance.now();
    requestAnimationFrame(this.loop);
    this.load().catch(err => { console.error(err); $('saveNotice').textContent = 'Failed to load: ' + err.message; $('saveNotice').classList.remove('hidden'); });
  }

  async load() {
    const notice = $('saveNotice'); notice.classList.remove('hidden');
    $('btnNew').disabled = true;
    this.world = new World(this.scene, this.renderer, this.settings.quality);
    await this.world.build((p, msg) => { notice.textContent = `Loading ${Math.round(p * 100)}% — ${msg}`; });
    this.car = new Vehicle(this.scene);
    this.player = new Player(this.scene);
    this.encounter = new EncounterDirector(this.scene, this.world, this.audio);
    this.mission = new MissionDirector(this.missionHooks());
    const c = this.world.canopy; this.rain = new Rain(this.scene, this.settings.quality === 'low' ? 3500 : 8000, new THREE.Vector4(c.cx - c.hx, c.cx + c.hx, c.cz - c.hz, c.cz + c.hz));
    this.smoke = new Particles(this.scene, 900, false); this.sparks = new Particles(this.scene, 500, true);
    this.post = new PostFX(this.renderer, this.scene, this.camera, this.settings.quality);
    this.buildPickups(); this.buildMarker(); this.buildWorker();
    // initial pose for the title backdrop and warm-up compile
    this.applySnapshot(this.defaultSnapshot('start'), true);
    this.updateCamera(1 / 60, { lookX: 0, lookY: 0 }, true);
    this.renderer.compile(this.scene, this.camera);
    this.ready = true; $('btnNew').disabled = false;
    notice.classList.add('hidden');
    this.refreshTitle();
  }

  // ---------------- presentation hooks for the mission director ----------------
  missionHooks() {
    return {
      say: (speaker, text, dur, radio) => this.hud.say(speaker, text, dur, radio),
      chime: k => this.audio.chime(k),
      phaseChanged: p => { this.encounter.setPhase(p); },
      checkpoint: id => this.commitCheckpoint(id),
      setShortcut: open => this.world.setGate(open),
      complete: d => this.win(d),
      fail: r => this.fail(r),
    };
  }

  // ---------------- checkpoints ----------------
  defaultSnapshot(id) {
    const cp = RouteTune.checkpoints[id];
    return {
      schema: SAVE_SCHEMA, checkpointId: id, generation: 0,
      mission: { ...new MissionDirector({}).flags(), phase: cp.phase },
      player: { inCar: true, x: cp.car.x, z: cp.car.z, yaw: cp.car.heading, health: PT.health, stamina: PT.stamina, mag: PT.pistol.mag, reserve: PT.pistol.startReserve },
      vehicle: { x: cp.car.x, z: cp.car.z, heading: cp.car.heading, fuel: VT.startFuel, engine: 100, wheels: [100, 100, 100, 100], lightsOn: true },
    };
  }
  makeSnapshot(id) {
    return { checkpointId: id, mission: this.mission.flags(), player: { ...this.player.snapshot(), inCar: this.playerInCar }, vehicle: this.car.snapshot(), inventory: { ...this.inventory } };
  }
  commitCheckpoint(id) {
    const r = this.checkpoints.commit(this.makeSnapshot(id));
    this.hud.toast(r.ok ? `CHECKPOINT SAVED · ${RouteTune.checkpoints[id].label.toUpperCase()}` : 'CHECKPOINT WRITE FAILED — LAST GOOD CHECKPOINT KEPT', r.ok ? '' : '#ffb347');
    this.lastCheckpoint = id;
  }
  // restore all authoritative state before enabling controls or encounters
  applySnapshot(s, silent = false) {
    this.car.reset(s.vehicle);
    this.player.reset(s.player);
    this.playerInCar = s.player.inCar !== false;
    this.car.occupied = this.playerInCar; if (!this.playerInCar) this.car.engineOn = false;
    this.player.visible = !this.playerInCar; this.player.model.root.visible = !this.playerInCar; this.player.model.root.position.set(this.player.x, 0, this.player.z);
    this.mission.reset(s.mission);
    this.inventory = { canister: false, canisterLeft: 0, kit: false, ...(s.inventory || {}) };
    this.inventory.canister = Object.values(this.mission.canisters).includes('carried'); this.inventory.kit = this.mission.kit === 'carried';
    if (this.inventory.canister && !this.inventory.canisterLeft) this.inventory.canisterLeft = VT.canisterLitres;
    this.world.setGate(this.mission.rescue === 'success'); if (this.world.gate) this.world.gate.t = this.mission.rescue === 'success' ? 1 : 0;
    this.world.setShutter(this.mission.rescue === 'success');
    this.worker.root.visible = false; this.workerT = 0;
    this.encounter.reset(this.mission.phase);
    this.transition = null; this.fuelSession = null; this.holdT = 0; this.holdKind = null; this.hurt = 0;
    this.smoke.clear(); this.sparks.clear(); this.hud.clearSubs();
    this.camState.mode = this.playerInCar ? 'drive' : 'foot'; this.camState.blend = 1; this.camState.yaw = this.car.heading;
    this.syncPickups();
    if (!silent) this.updateCamera(1 / 60, { lookX: 0, lookY: 0 }, true);
  }

  // ---------------- screens ----------------
  wireUI() {
    const on = (id, f) => $(id).addEventListener('click', () => { this.audio.init(); this.audio.click(); f(); });
    on('btnNew', () => this.newGame());
    on('btnContinue', () => this.continueGame());
    on('btnControls', () => this.showScreen('screenControls', 'screenTitle'));
    on('btnSettings', () => this.showScreen('screenSettings', 'screenTitle'));
    on('btnIntroGo', () => this.play());
    on('btnResume', () => this.resume());
    on('btnRestartCp', () => this.retry());
    on('btnPauseControls', () => this.showScreen('screenControls', 'screenPause'));
    on('btnPauseSettings', () => this.showScreen('screenSettings', 'screenPause'));
    on('btnQuit', () => this.toTitle());
    on('btnRetry', () => this.retry());
    on('btnFailQuit', () => this.toTitle());
    on('btnReplay', () => this.newGame());
    on('btnWinQuit', () => this.toTitle());
    document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => this.showScreen(this.backTo || 'screenTitle')));
    const form = $('settingsForm');
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') el.checked = !!this.settings[el.name]; else el.value = this.settings[el.name];
      el.addEventListener('input', () => { this.settings[el.name] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? +el.value : el.value); this.applySettings(); localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); });
    }
  }
  applySettings() {
    const s = this.settings;
    this.audio.setVolume(s.volume); this.audio.setMusic(s.music);
    this.input.sens = s.sens; this.input.invertY = s.invertY;
    this.hud.subtitlesOn = s.subtitles; this.hud.soundCues = s.soundCues; this.hud.showFps = s.showFps;
    if (this.post) { this.post.enabled = s.quality !== 'low'; this.post.bloom.enabled = s.quality !== 'low'; }
  }
  showScreen(id, backTo) {
    for (const el of document.querySelectorAll('.screen')) el.classList.add('hidden');
    if (id) $(id).classList.remove('hidden');
    if (backTo) this.backTo = backTo;
  }
  refreshTitle() {
    const r = this.checkpoints.load();
    const btn = $('btnContinue');
    if (r.snapshot) { btn.classList.remove('hidden'); $('continueInfo').textContent = '· ' + RouteTune.checkpoints[r.snapshot.checkpointId].label; } else btn.classList.add('hidden');
    const n = $('saveNotice');
    if (r.recovered) { n.textContent = 'Latest checkpoint was unreadable — recovered the last complete checkpoint.'; n.classList.remove('hidden'); }
  }
  newGame() {
    if (!this.ready) return;
    this.checkpoints.clear();
    this.applySnapshot(this.defaultSnapshot('start'));
    this.commitCheckpoint('start');
    this.showScreen('screenIntro'); this.state = 'intro'; this.hud.show(false);
  }
  continueGame() {
    const r = this.checkpoints.load(); if (!r.snapshot) return this.newGame();
    this.applySnapshot(r.snapshot); this.play();
    if (r.recovered) this.hud.toast('RECOVERED FROM BACKUP CHECKPOINT', '#ffb347');
  }
  retry() {
    const r = this.checkpoints.load();
    this.applySnapshot(r.snapshot || this.defaultSnapshot('start')); this.play();
    this.hud.toast('RESTARTED · ' + RouteTune.checkpoints[(r.snapshot || { checkpointId: 'start' }).checkpointId].label.toUpperCase());
    if (r.recovered) this.hud.toast('RECOVERED FROM BACKUP CHECKPOINT', '#ffb347');
  }
  play() { this.audio.init(); this.showScreen(null); this.hud.show(true); this.state = 'playing'; this.input.wantLock = true; this.input.requestLock(); this.canvas.focus(); this.last = performance.now(); }
  pause() { this.state = 'paused'; this.input.wantLock = false; this.input.releaseLock(); this.showScreen('screenPause'); this.audio.horn(false); if (this.audio.ctx) this.audio.ctx.suspend(); }
  resume() { if (this.audio.ctx) this.audio.ctx.resume(); this.play(); }
  toTitle() { this.state = 'title'; this.input.wantLock = false; this.input.releaseLock(); this.hud.show(false); this.showScreen('screenTitle'); this.refreshTitle(); if (this.audio.ctx) this.audio.ctx.resume(); this.audio.horn(false); }
  fail(reason) {
    const text = { player_down: ['You were overwhelmed.', 'Keep moving, swing to stagger walkers and get back to the car when the forecourt fills up.'], car_wrecked: ['The sedan is wrecked.', 'Heavy impacts destroy the engine. Slow down for wrecks and crowds; tyres and engine show damage on the HUD.'], out_of_fuel: ['Out of fuel.', 'No jerrycan left within reach. Refuel to the recommended mark before choosing a route.'] }[reason] || ['Mission failed.', ''];
    setTimeout(() => {
      if (this.state !== 'playing') return;
      this.state = 'failed'; this.input.wantLock = false; this.input.releaseLock(); this.audio.chime('bad');
      $('failReason').textContent = text[0]; $('failHint').textContent = text[1] + ' Retry restores the ' + RouteTune.checkpoints[this.checkpoints.load().snapshot?.checkpointId || 'start'].label.toLowerCase() + ' checkpoint.';
      this.showScreen('screenFail'); this.hud.show(false);
    }, 1400);
  }
  win(d) {
    this.audio.chime('good');
    const mins = Math.floor(d.time / 60), secs = Math.round(d.time % 60).toString().padStart(2, '0');
    const wheels = d.wheels.map(w => w < VT.flatWheel ? 'flat' : w < 35 ? 'damaged' : w < 70 ? 'worn' : 'ok');
    const cells = [['ROUTE', d.route], ['FUEL LEFT', d.fuel.toFixed(1) + ' L'], ['ENGINE', Math.round(d.engine) + '%'], ['TYRES', wheels.join(' · ')], ['KIOSK RESCUE', d.rescue], ['TIME', `${mins}:${secs}`], ['FUEL TRANSFERRED', d.fueled.toFixed(1) + ' L'], ['INFECTED DOWN', d.kills], ['CHECKPOINT', 'Motorway reached']];
    $('debrief').innerHTML = cells.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    const why = d.engine < 35 ? 'The sedan barely made it — the engine is failing.' : d.fuel < 3 ? 'You arrived running on fumes.' : 'The car is in shape to continue south toward Dover.';
    $('debriefNote').textContent = why + (d.rescue.startsWith('Priya') ? ' Priya radioed your route to the evacuation network.' : ' The kiosk stayed shut.');
    setTimeout(() => { this.state = 'won'; this.input.wantLock = false; this.input.releaseLock(); this.showScreen('screenWin'); this.hud.show(false); }, 1200);
  }

  // ---------------- world objects owned by game ----------------
  buildPickups() {
    const canGeo = new THREE.BoxGeometry(0.35, 0.45, 0.18), canMat = new THREE.MeshStandardMaterial({ color: 0xb01f12, roughness: 0.4, metalness: 0.3, emissive: 0x330000 });
    const kitGeo = new THREE.BoxGeometry(0.55, 0.25, 0.25), kitMat = new THREE.MeshStandardMaterial({ color: 0x1f5fb0, roughness: 0.4, metalness: 0.4 });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    const mk = (geo, mat, x, z) => { const g = new THREE.Group(); const m = new THREE.Mesh(geo, mat); m.position.y = 0.25; m.castShadow = true; g.add(m); const r = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.55, 24), ringMat); r.rotation.x = -Math.PI / 2; r.position.y = 0.05; g.add(r); g.position.set(x, 0, z); this.scene.add(g); return g; };
    this.pickups = RouteTune.canisters.map(c => ({ ...c, kind: 'canister', mesh: mk(canGeo, canMat, c.x, c.z) }));
    const k = RouteTune.repairKit; this.pickups.push({ ...k, kind: 'kit', mesh: mk(kitGeo, kitMat, k.x, k.z) });
  }
  syncPickups() { for (const p of this.pickups) p.mesh.visible = p.kind === 'kit' ? this.mission.kit === 'world' : this.mission.canisters[p.id] === 'world'; }
  buildMarker() {
    const g = new THREE.Group();
    const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xffc040, emissive: 0xffa020, emissiveIntensity: 3 }));
    d.scale.y = 1.4; g.add(d);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 40, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); beam.position.y = 18; g.add(beam);
    this.marker = g; this.markerD = d; this.scene.add(g);
  }
  buildWorker() { this.worker = buildHumanoid({ top: 0x2a3a6a, bottom: 0x222, vest: true, hairColor: 0x111, skin: 0x9a6b4f, seed: 11 }); this.worker.root.visible = false; this.scene.add(this.worker.root); this.workerT = 0; }

  // ---------------- main loop ----------------
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (!this.ready) return;
    try {
      if (this.state === 'playing') this.update(dt);
      else if (this.state === 'title' || this.state === 'intro') { this.t += dt; this.titleCam(dt); this.world.updateLights(dt, this.car); this.rain.update(dt, this.camera.position); }
      this.render(dt);
    } catch (e) { console.error(e); this.errors = (this.errors || 0) + 1; if (this.errors > 5) { this.state = 'paused'; } }
  }
  titleCam(dt) {
    const a = this.t * 0.05; const cx = this.car.x, cz = this.car.z;
    this.camera.position.set(cx + Math.sin(a) * 9, 2.2, cz + Math.cos(a) * 9 - 2); this.camera.lookAt(cx, 1, cz - 2);
    this.car.syncMesh(dt, this.t);
  }

  update(dt) {
    this.t += dt; const a = this.input.sample();
    const car = this.car, pl = this.player, world = this.world;
    // ---- vehicle ----
    const ctl = this.playerInCar && !this.transition ? a : null;
    if (ctl && a.lights) car.lightsOn = !car.lightsOn;
    this.audio.horn(!!(ctl && a.horn)); if (ctl && a.horn) this.encounter.noise.push({ x: car.x, z: car.z, r: 45 });
    const impact = car.update(dt, ctl, world);
    if (impact) { this.audio.crash(impact.x, impact.z, impact.strength / 8); this.shake(Math.min(1, impact.strength / 12)); this.sparks.emit(impact.x, 0.7, impact.z, { count: Math.min(30, impact.strength * 2 | 0), color: [1, 0.7, 0.3], speed: 4, spread: 0.8, gravity: 9, life: 0.5, size: 0.08 }); this.mission.stats.impacts++; this.encounter.noise.push({ x: impact.x, z: impact.z, r: 30 }); }
    car.updateOBB();
    this.encounter.carSweep(car, (i, speed, killed) => {
      this.audio.thud(i.x, i.z); this.shake(0.25); car.damageEngine(VT.infectedHitEngine * Math.min(2, speed / 10)); car.vx *= 0.94; car.vz *= 0.94;
      this.smoke.emit(i.x, 1, i.z, { count: 14, color: [0.35, 0.02, 0.02], speed: 2.5, spread: 0.9, gravity: 6, life: 0.7, size: 0.18, drag: 1 });
      if (killed) this.mission.stats.kills++;
    });
    car.syncMesh(dt, this.t);
    // ---- player / transitions ----
    this.updateTransitions(dt, a);
    const carObb = this.playerInCar ? null : car.obb;
    if (!this.playerInCar) {
      const lock = !!this.transition || (this.holdKind && this.holdKind !== 'none');
      pl.update(a, { dt, t: this.t, camYaw: this.camState.yaw, camPitch: this.camState.pitch, world, carObb, enc: this.encounter, audio: this.audio, actionLock: lock, anim: this.holdKind === 'fuel' || this.holdKind === 'pour' ? 'fuel' : (this.holdKind === 'pry' || this.holdKind === 'patch') ? 'pry' : null,
        onShot: p => this.shoot(p), onHitInfected: (i, killed, x, y, z) => { this.smoke.emit(x, y, z, { count: 12, color: [0.4, 0.02, 0.02], speed: 2, spread: 0.8, gravity: 6, life: 0.6, size: 0.15, drag: 1 }); if (killed) this.mission.stats.kills++; } });
      if (pl.knock) { const [nx, nz] = world.moveCircle(pl.x, pl.z, pl.knock[0] * 0.6, pl.knock[1] * 0.6, PT.radius, [car.obb]); pl.x = nx; pl.z = nz; pl.knock = null; }
    } else { pl.x = car.x; pl.z = car.z; pl.model.root.visible = false; }
    this.updateInteractions(dt, a);
    // ---- encounter director ----
    const forecourtActive = (this.mission.phase === 'approach' || this.mission.phase === 'refuel') && Math.hypot((this.playerInCar ? car.x : pl.x) - 212, (this.playerInCar ? car.z : pl.z) + 326) < 60;
    this.encounter.update({
      dt, t: this.t, cam: this.camera, player: pl, car, playerInCar: this.playerInCar, carObb: car.obb, fueling: !!this.fuelSession, forecourtActive, loiter: this.mission.loiter,
      onPlayerHit: (i, dmg) => this.onPlayerHit(i, dmg),
      onCarHit: (i, dmg) => { if (car.speed < 3) { car.damageEngine(dmg * 0.6); this.audio.hit(i.x, i.z, true); this.shake(0.15); } },
      onScreamerArrive: () => this.mission.emit('screamer_arrived', {}, 'screamer_arrived'),
      onScreamStart: () => { this.screaming = true; },
      onScreamInterrupted: () => { this.screaming = false; this.hud.toast('SCREAMER SILENCED', '#7ddc8a'); },
      onScreamComplete: () => { this.screaming = false; this.mission.emit('scream_complete', {}, 'scream_complete'); this.shake(0.3); },
    });
    if (this.encounter.activeScream && this.encounter.activeScream.dead) this.screaming = false;
    if (!this.encounter.activeScream) this.screaming = false;
    // ---- mission director ----
    this.mission.update(dt, this);
    // ---- worker (rescue) ----
    if (this.worker.root.visible) {
      this.workerT += dt; const w = this.worker;
      const tx = this.workerT < 6 ? 205 : 205, tz = this.workerT < 6 ? -338.6 : -341;
      w.root.position.set(tx, 0, lerp(w.root.position.z, tz, Math.min(1, dt * 2))); w.root.rotation.y = this.workerT < 6 ? Math.PI : 0;
      animate(w, dt, this.workerT < 6 ? 'idle' : 'walk', this.workerT < 6 ? 0 : 1.2, this.t);
      if (this.workerT > 6) { w.armR.rotation.x = 0; } else { w.armR.rotation.set(-2.6 + Math.sin(this.t * 8) * 0.3, 0, -0.3); }
      if (this.workerT > 8) { w.root.visible = false; world.setShutter(false); world.shutter.mesh.position.y = 1.35; }
    }
    // ---- effects ----
    if (car.engine < 60 && car.engine > 0) { this._smk = (this._smk || 0) - dt; if (this._smk <= 0) { this._smk = car.engine < 30 ? 0.05 : 0.15; const [fx, fz] = car.forward(); this.smoke.emit(car.x + fx * 1.9, 1.0, car.z + fz * 1.9, { color: car.engine < 30 ? [0.08, 0.08, 0.08] : [0.55, 0.55, 0.58], alpha: 0.5, speed: 1, dir: [0, 1.4, 0], spread: 0.3, life: 2.2, size: 0.6, grow: 1.4, drag: 0.6 }); } }
    if (car.engine <= 0) { this.smoke.emit(car.x, 1.2, car.z, { color: [0.05, 0.05, 0.05], alpha: 0.6, dir: [0, 2, 0], spread: 0.3, life: 3, size: 1, grow: 2 }); }
    if (Math.abs(car.vf) > 7 && car.surface !== 'offroad') { const [fx, fz] = car.forward(); const rx = -fz, rz = fx; for (const s of [-0.8, 0.8]) this.smoke.emit(car.x - fx * 1.6 + rx * s, 0.25, car.z - fz * 1.6 + rz * s, { color: car.surface === 'gravel' ? [0.35, 0.3, 0.24] : [0.6, 0.64, 0.7], alpha: 0.25, dir: [-fx * 0.5, 0.6, -fz * 0.5], speed: 2, spread: 0.4, life: 0.6, size: 0.35, grow: 1.5, drag: 1.5 }); }
    this.smoke.update(dt); this.sparks.update(dt);
    this.hurt = Math.max(0, this.hurt - dt * 0.8);
    world.updateLights(dt, this.playerInCar ? car : pl);
    this.rain.update(dt, this.camera.position);
    this.updateCamera(dt, a);
    this.updateMarker(dt);
    // ---- audio ----
    this.audio.update({ listener: { x: this.camera.position.x, z: this.camera.position.z, yaw: this.camState.worldYaw || 0 }, inCar: this.playerInCar, underCanopy: !this.playerInCar && world.underCanopy(pl.x, pl.z), engineOn: car.engineOn, rpm: car.rpm, load: car.load, engineHealth: car.engine, speed: Math.abs(car.vf), surface: car.surface, carDist: Math.hypot(this.camera.position.x - car.x, this.camera.position.z - car.z), fueling: !!this.fuelSession, threat: this.encounter.threat });
    // ---- HUD ----
    this.objective = this.mission.objective(this);
    this.hud.update(dt, this.hudState());
  }

  hudState() {
    const threats = []; const cy = this.camState.worldYaw || 0;
    const px = this.playerInCar ? this.car.x : this.player.x, pz = this.playerInCar ? this.car.z : this.player.z;
    for (const i of this.encounter.list) {
      if (i.dead) continue; const dx = i.x - px, dz = i.z - pz, d = Math.hypot(dx, dz);
      const isScream = i.type === 'screamer' && i.state === 'scream';
      if (!isScream && (!i.alert || d > 22 || this.playerInCar)) continue;
      const rel = wrapAngle(Math.atan2(-dx, -dz) - cy);
      if (!isScream && Math.abs(rel) < 0.7) continue;
      threats.push({ id: i.id, kind: i.type, angle: -rel, strength: isScream ? 1 : clamp(1 - d / 22, 0.3, 1) });
    }
    return {
      car: this.car, player: this.player, playerInCar: this.playerInCar, objective: this.objective, prompt: this.prompt, inventory: this.inventory, world: this.world,
      hurt: this.hurt, screaming: this.screaming, threats, infected: this.encounter.list, shortcutOpen: this.mission.rescue === 'success',
      canisterMarkers: this.pickups.filter(p => p.mesh.visible && p.kind === 'canister'),
    };
  }

  // ---------------- interactions (interaction ownership lives here) ----------------
  doorState() {
    const pts = this.car.doorPoints();
    return pts.map(d => {
      const [x, z] = d.p; let ok = this.world.isWalkable(x, z, -0.3) && !this.world.penetration(x, z);
      if (ok) for (const o of this.world.nearObstacles(x, z, 1.5)) if (o.pushCircle(x, z, PT.radius)) { ok = false; break; }
      if (ok) for (const i of this.encounter.list) if (!i.dead && i.distTo(x, z) < 0.7) { ok = false; break; }
      return { ...d, ok };
    });
  }
  updateTransitions(dt, a) {
    const tr = this.transition; if (!tr) return;
    tr.t += dt; const pl = this.player;
    if (tr.type === 'enter') {
      const k = Math.min(1, tr.t / (tr.dur * 0.6));
      pl.x = lerp(tr.from[0], tr.door.p[0], k); pl.z = lerp(tr.from[1], tr.door.p[1], k);
      pl.yaw = dampAngle(pl.yaw, this.car.heading, 10, dt);
      if (tr.t >= tr.dur) {
        this.transition = null; this.playerInCar = true; this.car.occupied = true; pl.model.root.visible = false;
        this.car.engineOn = this.car.fuel > 0 && this.car.engine > 0; this.audio.door(false);
        this.camState.mode = 'drive'; this.startBlend();
      }
    } else if (tr.type === 'exit') {
      if (tr.t >= tr.dur) {
        this.transition = null; this.playerInCar = false; this.car.occupied = false; this.car.engineOn = false;
        pl.x = tr.door.p[0]; pl.z = tr.door.p[1]; pl.yaw = this.car.heading; pl.visible = true; pl.model.root.visible = true;
        this.camState.mode = 'foot'; this.camState.yaw = this.car.heading; this.camState.pitch = 0.15; this.startBlend(); this.audio.door(false);
      }
    }
  }
  startBlend() { this.camState.blend = 0; this.camState.from.copy(this.camera.position); this.camState.fromQ.copy(this.camera.quaternion); }
  onPlayerHit(i, dmg) {
    if (this.playerInCar) return;
    if (this.transition && this.transition.type === 'enter') { this.transition = null; this.hud.toast('ENTRY INTERRUPTED', '#ff8c3e'); }
    this.player.hurt(dmg, i.x, i.z); this.hurt = Math.min(1, this.hurt + 0.45); this.shake(0.3);
    this.audio.hit(this.player.x, this.player.z, true);
    this.closeFuel('hit'); if (this.holdKind === 'pry') this.mission.rescueProgress = Math.max(0, this.mission.rescueProgress - 0.25);
    this.holdT = 0; this.holdKind = null;
    this.smoke.emit(this.player.x, 1.3, this.player.z, { count: 10, color: [0.5, 0.02, 0.02], speed: 2, spread: 0.8, gravity: 6, life: 0.5, size: 0.14 });
  }
  closeFuel(why) {
    if (!this.fuelSession) return;
    const s = this.fuelSession; this.fuelSession = null; // commit exactly once
    if (s.kind === 'pump') this.mission.emit('fuel_stopped', { amount: s.transferred });
    else if (s.kind === 'pour') { this.mission.fueled += 0; }
    if (why === 'hit') this.hud.toast(`FUELLING INTERRUPTED · ${s.transferred.toFixed(1)} L KEPT`, '#ffb347');
  }
  updateInteractions(dt, a) {
    this.prompt = null; this.fuelHint = false; const car = this.car, pl = this.player, M = this.mission;
    if (this.transition) { this.prompt = { key: '', text: this.transition.type === 'enter' ? 'Getting in…' : 'Getting out…', progress: Math.min(1, this.transition.t / this.transition.dur) }; return; }
    if (this.playerInCar) {
      this.closeFuel(); this.holdKind = null;
      const slow = car.speed < PT.maxExitSpeed;
      if (slow && a.interact) {
        const doors = this.doorState(); const d = doors.find(x => x.ok);
        if (d) { this.transition = { type: 'exit', t: 0, dur: PT.exitTime, door: d }; this.audio.door(true); if (d.side === 'passenger' && !doors[0].ok) this.hud.toast('DRIVER DOOR BLOCKED · USING PASSENGER SIDE', '#ffb347'); }
        else { this.hud.toast('BOTH DOORS BLOCKED · MOVE THE CAR', '#ff4b3e'); this.audio.chime('bad'); }
      } else if (slow && (M.phase === 'approach' || M.phase === 'refuel') && Math.hypot(car.x - 212, car.z + 324) < 14) this.prompt = { key: 'E', text: 'Get out', sub: 'Engine off while you are outside' };
      else if (slow && car.fuel <= 0) this.prompt = { key: 'E', text: 'Get out', sub: 'Out of fuel' };
      return;
    }
    // --- on foot ---
    const near = (x, z, r) => Math.hypot(pl.x - x, pl.z - z) < r;
    // pickups
    for (const p of this.pickups) {
      if (!p.mesh.visible || !near(p.x, p.z, 1.6)) continue;
      const label = p.kind === 'kit' ? 'Pick up tyre repair kit' : 'Pick up jerrycan';
      if (p.kind === 'canister' && this.inventory.canister) { this.prompt = { key: '', text: 'Already carrying a jerrycan' }; break; }
      this.prompt = { key: 'E', text: label };
      if (a.interact) {
        if (p.kind === 'kit') { M.kit = 'carried'; this.inventory.kit = true; } else { M.canisters[p.id] = 'carried'; this.inventory.canister = true; this.inventory.canisterLeft = VT.canisterLitres; this.inventory.canisterId = p.id; }
        this.audio.click(); this.syncPickups(); this.hud.toast(p.kind === 'kit' ? 'TYRE KIT · HOLD F AT THE CAR' : 'JERRYCAN · HOLD F AT THE CAR');
      }
      return;
    }
    // pump refuel
    let pump = null, pd = 1e9; for (const p of this.world.pumps) { const d = Math.hypot(pl.x - p.x, pl.z - p.z); if (d < pd) { pd = d; pump = p; } }
    this.nearestPump = pump;
    const carNearPump = pump && Math.hypot(car.x - pump.x, car.z - pump.z) < PT.hoseReach;
    const nearCar = Math.hypot(pl.x - car.x, pl.z - car.z) < 3.4;
    if (carNearPump && Math.hypot(car.x - 212, car.z + 324) < 30) this.fuelHint = true;
    if (pump && pd < PT.pumpReach && carNearPump) {
      const full = car.fuel >= VT.tank - 0.05;
      const s = this.fuelSession;
      this.prompt = { key: 'F', text: full ? 'Tank full' : (s ? 'Refuelling — release F to stop' : 'Hold to refuel'), sub: `${car.fuel.toFixed(1)} / ${VT.tank} L${s ? ' · +' + s.transferred.toFixed(1) + ' L this fill' : ''} · recommended ${VT.recommendedFill} L`, progress: car.fuel / VT.tank };
      if (a.fuelHeld && !full) {
        if (!this.fuelSession) { this.fuelSession = { kind: 'pump', transferred: 0 }; M.emit('fuel_started'); }
        const add = car.addFuel(VT.refuelRate * dt); this.fuelSession.transferred += add; this.holdKind = 'fuel';
        this._glug = (this._glug || 0) - dt; if (this._glug <= 0) { this._glug = 0.35; this.audio.glug(); }
        pl.yaw = dampAngle(pl.yaw, Math.atan2(-(pump.x - pl.x), -(pump.z - pl.z)), 8, dt);
        if (car.fuel >= VT.tank - 0.05) this.closeFuel();
      } else { this.closeFuel(); if (this.holdKind === 'fuel') this.holdKind = null; }
      // standing at the pump next to the car: E still gets you back in (refuel prompt keeps priority on screen)
      if (nearCar && !this.fuelSession) { this.prompt.sub += ' · E: get in'; if (a.interact) this.tryEnterCar(a, true); }
      return;
    } else { this.closeFuel(); if (this.holdKind === 'fuel') this.holdKind = null; }
    // pour jerrycan / patch tyre at the car
    if (nearCar && this.inventory.canister) {
      this.prompt = { key: 'F', text: 'Hold to pour jerrycan', sub: `${this.inventory.canisterLeft.toFixed(1)} L left in can · ${car.fuel.toFixed(1)} L in tank`, progress: 1 - this.inventory.canisterLeft / VT.canisterLitres };
      if (a.fuelHeld) {
        this.holdKind = 'pour'; const amt = Math.min(this.inventory.canisterLeft, VT.canisterLitres / 3 * dt);
        const added = car.addFuel(amt); this.inventory.canisterLeft -= amt; M.fueled += added;
        this._glug = (this._glug || 0) - dt; if (this._glug <= 0) { this._glug = 0.3; this.audio.glug(); }
        if (this.inventory.canisterLeft <= 0.001) { this.inventory.canister = false; for (const k in M.canisters) if (M.canisters[k] === 'carried') M.canisters[k] = 'used'; this.holdKind = null; this.hud.toast('JERRYCAN EMPTIED INTO THE TANK'); }
      } else if (this.holdKind === 'pour') this.holdKind = null;
      return;
    }
    const worst = car.wheels.indexOf(Math.min(...car.wheels));
    if (nearCar && this.inventory.kit && car.wheels[worst] < 70) {
      this.prompt = { key: 'F', text: 'Hold to patch the worst tyre', progress: this.holdKind === 'patch' ? this.holdT / 3 : 0 };
      if (a.fuelHeld) { this.holdKind = 'patch'; this.holdT += dt; if (this.holdT >= 3) { car.wheels[worst] = Math.max(car.wheels[worst], 75); this.inventory.kit = false; M.kit = 'used'; this.holdT = 0; this.holdKind = null; this.hud.toast('TYRE PATCHED'); this.audio.chime('good'); } }
      else if (this.holdKind === 'patch') { this.holdKind = null; this.holdT = 0; }
      return;
    }
    // kiosk shutter (optional rescue)
    const sh = this.world.shutter;
    if (M.workerCalled && M.rescue === 'none' && near(sh.x, sh.z, 2.4)) {
      this.prompt = { key: 'E', text: 'Hold to pry open the shutter', sub: 'Optional rescue · noisy', progress: M.rescueProgress };
      if (a.interactHeld) {
        this.holdKind = 'pry'; M.rescueProgress = Math.min(1, M.rescueProgress + dt / 4);
        pl.yaw = dampAngle(pl.yaw, 0, 8, dt);
        this._pry = (this._pry || 0) - dt; if (this._pry <= 0) { this._pry = 0.5; this.audio.shutter(); this.encounter.noise.push({ x: sh.x, z: sh.z, r: 18 }); }
        if (M.rescueProgress >= 1) { this.holdKind = null; this.world.setShutter(true); this.worker.root.visible = true; this.workerT = 0; this.worker.root.position.set(205, 0, -341); M.emit('rescue_complete', {}, 'rescue_complete'); }
      } else if (this.holdKind === 'pry') this.holdKind = null;
      return;
    }
    if (this.holdKind === 'pry') this.holdKind = null;
    this.tryEnterCar(a, false);
  }
  tryEnterCar(a, silent) {
    const car = this.car, pl = this.player;
    const nearCar = Math.hypot(pl.x - car.x, pl.z - car.z) < 3.4;
    const prevPrompt = this.prompt;
    // enter car
    const doors = this.doorState();
    let best = null, bd = 1e9; for (const d of doors) { const dd = Math.hypot(pl.x - d.p[0], pl.z - d.p[1]); if (dd < bd) { bd = dd; best = d; } }
    if (best && (bd < 1.8 || nearCar)) {
      const usable = best.ok ? best : doors.find(d => d.ok);
      if (!usable) { if (silent) { if (a.interact) this.hud.toast('BOTH DOORS BLOCKED', '#ff4b3e'); } else this.prompt = { key: '', text: 'Both doors blocked', sub: 'Clear the infected or move away', blocked: true }; return; }
      const blockedNote = !best.ok ? `${best.side} door blocked — use the ${usable.side} side` : '';
      this.prompt = { key: 'E', text: car.fuel <= 0 ? 'Get in (no fuel)' : 'Get in', sub: blockedNote || (usable.side === 'driver' ? 'Driver door' : 'Passenger door — slide across'), blocked: !best.ok };
      if (a.interact) { this.transition = { type: 'enter', t: 0, dur: PT.enterTime + (usable.side === 'passenger' ? 0.4 : 0), door: usable, from: [pl.x, pl.z] }; this.audio.door(true); this.closeFuel(); }
      if (silent && !this.transition) this.prompt = prevPrompt;
    }
  }
  shoot(p) {
    const cam = this.camera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const o = cam.position.clone().addScaledVector(dir, 1.5);
    const hit = this.encounter.rayHit(o, dir, PT.pistol.range);
    const hand = new THREE.Vector3(p.x - Math.sin(p.yaw) * 0.6 + Math.cos(p.yaw) * 0.25, 1.45, p.z - Math.cos(p.yaw) * 0.6 - Math.sin(p.yaw) * 0.25);
    this.world.flash.position.copy(hand); this.world.flash.intensity = 60;
    this.sparks.emit(hand.x, hand.y, hand.z, { count: 8, color: [1, 0.8, 0.4], speed: 3, dir: [dir.x * 2, dir.y * 2, dir.z * 2], spread: 0.4, life: 0.08, size: 0.12 });
    this.audio.gunshot(p.x, p.z); this.shake(0.12);
    this.encounter.noise.push({ x: p.x, z: p.z, r: PT.pistol.noise });
    const end = hit ? o.clone().addScaledVector(dir, hit.dist) : o.clone().addScaledVector(dir, 40);
    for (let k = 0; k < 10; k++) { const tt = k / 10; this.sparks.emit(lerp(hand.x, end.x, tt), lerp(hand.y, end.y, tt), lerp(hand.z, end.z, tt), { count: 1, color: [1, 0.85, 0.5], speed: 0, life: 0.06, size: 0.05, alpha: 0.7, jitter: 0 }); }
    if (hit) {
      const killed = hit.inf.damage(PT.pistol.damage * (hit.head ? PT.pistol.headMult : 1), p.x, p.z, 'shot');
      this.smoke.emit(end.x, end.y, end.z, { count: hit.head ? 18 : 10, color: [0.45, 0.02, 0.02], speed: 2.5, spread: 0.7, gravity: 7, life: 0.6, size: 0.14, drag: 1 });
      if (killed) this.mission.stats.kills++;
      const ch = $('crosshair'); ch.classList.add('hit'); setTimeout(() => ch.classList.remove('hit'), 120);
    }
  }
  updateMarker(dt) {
    const t = this.objective && this.objective.target; const m = this.marker;
    if (!t) { m.visible = false; return; }
    const px = this.playerInCar ? this.car.x : this.player.x, pz = this.playerInCar ? this.car.z : this.player.z;
    const d = Math.hypot(t.x - px, t.z - pz);
    m.visible = d > 7 && !(t.x === this.car.x && this.playerInCar);
    m.position.set(t.x, 4 + Math.sin(this.t * 2) * 0.3, t.z); this.markerD.rotation.y += dt * 1.5;
  }

  // ---------------- camera ----------------
  shake(a) { if (this.settings.shake) this.camState.shake = Math.min(1, this.camState.shake + a); }
  updateCamera(dt, a, snap = false) {
    const cs = this.camState, cam = this.camera, car = this.car, pl = this.player;
    const pos = new THREE.Vector3(), look = new THREE.Vector3(); let fov;
    if (cs.mode === 'drive') {
      const [fx, fz] = car.forward(); const sp = Math.abs(car.vf);
      cs.driveYaw = snap || cs.driveYaw === undefined ? car.heading : dampAngle(cs.driveYaw, car.heading + (car.vf < -1 ? 0 : 0), 3.2, dt);
      // free-look offset with the mouse while driving, recentring automatically
      cs.lookOff = damp((cs.lookOff || 0) + (a.lookX || 0) * -1, 0, a.lookX ? 0 : 1.5, dt);
      const yaw = cs.driveYaw + cs.lookOff;
      const dist = 6.6 + sp * 0.06, h = 2.5 + sp * 0.02;
      pos.set(car.x + Math.sin(yaw) * dist, h, car.z + Math.cos(yaw) * dist);
      look.set(car.x + fx * 3.5, 1.1, car.z + fz * 3.5);
      fov = Math.min(80, 62 + sp * 0.5);
      cs.worldYaw = yaw; cs.yaw = yaw;
    } else {
      cs.yaw -= (a.lookX || 0); cs.pitch = clamp(cs.pitch + (a.lookY || 0), -0.55, 0.9);
      const aim = pl.aiming; const dist = aim ? 1.8 : 3.7, sh = aim ? 0.62 : 0.45;
      const fx = -Math.sin(cs.yaw), fz = -Math.cos(cs.yaw), rx = Math.cos(cs.yaw), rz = -Math.sin(cs.yaw);
      const pivot = new THREE.Vector3(pl.x + rx * sh, 1.6, pl.z + rz * sh);
      const cp = Math.cos(cs.pitch), spch = Math.sin(cs.pitch);
      let want = new THREE.Vector3(pivot.x - fx * dist * cp, pivot.y + spch * dist, pivot.z - fz * dist * cp);
      // keep the camera out of buildings
      let k = 1; for (let s = 0.1; s <= 1.001; s += 0.1) { const x = lerp(pivot.x, want.x, s), z = lerp(pivot.z, want.z, s); if (this.world.obstacles.some(o => !o.disabled && (o.building || (o.r < 4 && lerp(pivot.y, want.y, s) < 2.6)) && o.contains(x, z, 0.3))) { k = s - 0.1; break; } }
      want.lerpVectors(pivot, want, Math.max(0.25, k));
      pos.copy(want);
      look.set(pivot.x + fx * 10 * cp, pivot.y - spch * 10 + 0.2, pivot.z + fz * 10 * cp);
      fov = aim ? 48 : 60; cs.worldYaw = cs.yaw;
    }
    if (snap) cs.blend = 1;
    if (cs.mode === 'drive' && !snap && cs.blend >= 1) pos.lerpVectors(cs.lastPos || pos, pos, 1 - Math.exp(-10 * dt));
    cs.lastPos = pos.clone();
    cam.position.copy(pos); cam.lookAt(look);
    if (cs.blend < 1) { cs.blend = Math.min(1, cs.blend + dt / 0.7); const e = cs.blend * cs.blend * (3 - 2 * cs.blend); const q = cam.quaternion.clone(); cam.position.lerpVectors(cs.from, pos, e); cam.quaternion.slerpQuaternions(cs.fromQ, q, e); }
    if (cs.shake > 0) { const s = cs.shake * 0.25; cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s; cam.position.z += (Math.random() - 0.5) * s; cs.shake = Math.max(0, cs.shake - dt * 2.5); }
    cs.fov = snap ? fov : damp(cs.fov, fov, 6, dt); cam.fov = cs.fov; cam.updateProjectionMatrix();
  }

  render(dt) {
    this.frames++;
    const usedPost = this.post && this.post.render(dt, this.hurt, this.encounter ? this.encounter.threat : 0);
    if (!usedPost) this.renderer.render(this.scene, this.camera);
  }
  resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); if (this.post) this.post.setSize(innerWidth, innerHeight); }
}

function loadJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }

const game = new Game();
// Read-only state for QA automation; mutation helpers only with ?qa=1
window.__ROTD = {
  get state() {
    const g = game; if (!g.ready) return { ready: false };
    return { ready: true, screen: g.state, frames: g.frames, phase: g.mission.phase, inCar: g.playerInCar, transition: g.transition && g.transition.type,
      car: { x: g.car.x, z: g.car.z, heading: g.car.heading, fuel: g.car.fuel, engine: g.car.engine, wheels: g.car.wheels.slice(), kmh: g.car.kmh, engineOn: g.car.engineOn },
      player: { x: g.player.x, z: g.player.z, health: g.player.health }, prompt: g.prompt ? g.prompt.text : null, objective: g.objective ? g.objective.text : null,
      infected: g.encounter.list.filter(i => !i.dead).length, rescue: g.mission.rescue, route: g.mission.route, fueled: g.mission.fueled, fueling: !!g.fuelSession,
      checkpoint: g.checkpoints.load().snapshot?.checkpointId || null, generation: g.checkpoints.generation };
  },
};
if (QA) window.__ROTD.qa = {
  game,
  parkAt(x, z, heading) { const c = game.car; c.x = x; c.z = z; c.heading = heading; c.vx = c.vz = c.vf = 0; c.updateOBB(); },
  setFuel(l) { game.car.fuel = l; },
  corruptLatest() { game.checkpoints.corruptLatest(); },
  teleportPlayer(x, z) { game.player.x = x; game.player.z = z; },
};
