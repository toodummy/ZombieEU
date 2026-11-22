// Procedural WebAudio: no external sound files. Engine load + cabin filtering, rain under/outside canopy,
// fuel pump, infected voices, distinct screamer cue, impacts, gunshots, radio static, ambient drone.
export class AudioEngine {
  constructor() { this.ctx = null; this.ready = false; this.volume = 0.8; this.musicVol = 0.5; this.listener = { x: 0, z: 0, yaw: 0 }; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.volume; this.master.connect(c.destination);
    this.comp = c.createDynamicsCompressor(); this.comp.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.comp);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicVol * 0.5; this.musicBus.connect(this.comp);
    // shared noise buffer
    const len = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // simple reverb (feedback delay) for outdoor slap-back
    this.verb = c.createDelay(1); this.verb.delayTime.value = 0.13; const fb = c.createGain(); fb.gain.value = 0.32;
    const vf = c.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 2200;
    this.verb.connect(vf); vf.connect(fb); fb.connect(this.verb); vf.connect(this.comp);
    this.verbSend = c.createGain(); this.verbSend.gain.value = 0.35; this.verbSend.connect(this.verb);
    // cabin filter used while inside the car
    this.world = c.createBiquadFilter(); this.world.type = 'lowpass'; this.world.frequency.value = 20000; this.world.connect(this.sfx); this.world.connect(this.verbSend);
    this._rain(); this._engine(); this._pump(); this._drone();
    this.ready = true;
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  setMusic(v) { this.musicVol = v; if (this.musicBus) this.musicBus.gain.value = v * 0.5; }
  noise(loop = true) { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = loop; return s; }

  _rain() {
    const c = this.ctx, n = this.noise(); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    this.rainGain = c.createGain(); this.rainGain.gain.value = 0.16; n.connect(hp); hp.connect(lp); lp.connect(this.rainGain); this.rainGain.connect(this.sfx);
    this.rainLP = lp; n.start();
    // patter on roof/canopy
    const n2 = this.noise(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 0.7;
    this.patter = c.createGain(); this.patter.gain.value = 0; n2.connect(bp); bp.connect(this.patter); this.patter.connect(this.sfx); n2.start();
  }
  _engine() {
    const c = this.ctx; this.engGain = c.createGain(); this.engGain.gain.value = 0;
    this.engLP = c.createBiquadFilter(); this.engLP.type = 'lowpass'; this.engLP.frequency.value = 600; this.engLP.Q.value = 2;
    this.osc1 = c.createOscillator(); this.osc1.type = 'sawtooth'; this.osc2 = c.createOscillator(); this.osc2.type = 'square';
    this.osc3 = c.createOscillator(); this.osc3.type = 'sine';
    const g2 = c.createGain(); g2.gain.value = 0.35; const g3 = c.createGain(); g3.gain.value = 0.8;
    this.osc1.connect(this.engLP); this.osc2.connect(g2); g2.connect(this.engLP); this.osc3.connect(g3); g3.connect(this.engLP);
    this.engLP.connect(this.engGain); this.engGain.connect(this.sfx);
    [this.osc1, this.osc2, this.osc3].forEach(o => o.start());
    // tyre / road noise
    const tn = this.noise(); this.tyreLP = c.createBiquadFilter(); this.tyreLP.type = 'lowpass'; this.tyreLP.frequency.value = 500;
    this.tyreGain = c.createGain(); this.tyreGain.gain.value = 0; tn.connect(this.tyreLP); this.tyreLP.connect(this.tyreGain); this.tyreGain.connect(this.sfx); tn.start();
  }
  _pump() {
    const c = this.ctx; this.pumpGain = c.createGain(); this.pumpGain.gain.value = 0;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 118; const n = this.noise(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 3;
    const og = c.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(this.pumpGain); n.connect(bp); bp.connect(this.pumpGain); this.pumpGain.connect(this.world); o.start(); n.start();
  }
  _drone() {
    const c = this.ctx; this.droneGain = c.createGain(); this.droneGain.gain.value = 0.0; this.droneGain.connect(this.musicBus);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.connect(this.droneGain); this.droneLP = lp;
    [55, 55.4, 82.4, 110.3, 65.4].forEach((f, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'sine'; o.frequency.value = f; const g = c.createGain(); g.gain.value = i % 2 ? 0.05 : 0.18; o.connect(g); g.connect(lp); o.start(); });
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 140; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  }

  // per-frame continuous state
  update(s) {
    if (!this.ready) return;
    const t = this.ctx.currentTime, k = 0.08;
    this.listener = s.listener;
    const inCar = s.inCar;
    this.world.frequency.setTargetAtTime(inCar ? 900 : 20000, t, 0.1);
    this.rainLP.frequency.setTargetAtTime(inCar ? 1400 : (s.underCanopy ? 3500 : 7000), t, k);
    this.rainGain.gain.setTargetAtTime(inCar ? 0.09 : (s.underCanopy ? 0.1 : 0.17), t, k);
    this.patter.gain.setTargetAtTime(inCar ? 0.07 : (s.underCanopy ? 0.09 : 0.0), t, k);
    const running = s.engineOn;
    const rpm = 0.12 + s.rpm * 0.88;
    const f = 32 + rpm * 120 * (s.engineHealth < 30 ? 0.92 + Math.random() * 0.1 : 1);
    this.osc1.frequency.setTargetAtTime(f, t, 0.05); this.osc2.frequency.setTargetAtTime(f * 0.5, t, 0.05); this.osc3.frequency.setTargetAtTime(f * 0.25, t, 0.05);
    this.engLP.frequency.setTargetAtTime((inCar ? 300 : 500) + s.load * (inCar ? 900 : 1800) + rpm * 400, t, 0.06);
    const dist = s.carDist; const att = inCar ? 1 : Math.max(0, 1 - dist / 60);
    this.engGain.gain.setTargetAtTime(running ? (0.11 + s.load * 0.08) * att : 0, t, 0.1);
    this.tyreGain.gain.setTargetAtTime(Math.min(0.25, s.speed / 30 * 0.22) * att * (s.surface === 'gravel' ? 1.6 : 1), t, 0.1);
    this.tyreLP.frequency.setTargetAtTime(s.surface === 'gravel' ? 1400 : 500 + s.speed * 15, t, 0.1);
    this.pumpGain.gain.setTargetAtTime(s.fueling ? 0.12 : 0, t, 0.05);
    this.droneGain.gain.setTargetAtTime(0.25 + s.threat * 0.6, t, 0.8);
    this.droneLP.frequency.value; // keep LFO
  }

  _pan(x, z) {
    if (x === undefined) return { pan: 0, gain: 1 };
    const L = this.listener, dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz);
    // camera right vector from yaw (camera looks along -z at yaw 0)
    const rx = Math.cos(L.yaw), rz = -Math.sin(L.yaw);
    const pan = d > 0.01 ? Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d)) : 0;
    return { pan, gain: 1 / (1 + d * d * 0.004) };
  }
  _out(x, z, vol = 1) {
    const c = this.ctx, g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    const { pan, gain } = this._pan(x, z); g.gain.value = vol * gain;
    if (p) { p.pan.value = pan; g.connect(p); p.connect(this.world); } else g.connect(this.world);
    return g;
  }
  env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }

  groan(x, z, vol = 0.5) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(x, z, vol);
    const o = c.createOscillator(); o.type = 'sawtooth'; const base = 70 + Math.random() * 60; o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * (0.7 + Math.random() * 0.5), t + 1.2);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.setValueAtTime(500 + Math.random() * 300, t); bp.frequency.linearRampToValueAtTime(350 + Math.random() * 500, t + 1.1);
    const g = c.createGain(); this.env(g, t, 0.15, 0.6, 1.1); o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 1.4);
  }
  scream(x, z, dur = 3.2) { // distinct rising, warbling cue
    if (!this.ready) return null; const c = this.ctx, t = c.currentTime, out = this._out(x, z, 1.4);
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(1300, t + dur);
    const lfo = c.createOscillator(); lfo.frequency.value = 11; const lg = c.createGain(); lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(2400, t + dur); bp.Q.value = 2;
    const n = this.noise(); const ng = c.createGain(); ng.gain.value = 0.25; n.connect(ng); ng.connect(bp);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.4); g.gain.setValueAtTime(0.5, t + dur - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
    o.connect(bp); bp.connect(g); g.connect(out); [o, lfo, n].forEach(s => { s.start(t); s.stop(t + dur + 0.4); });
    return { stop: () => { try { const now = c.currentTime; g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0.0001, now, 0.05); [o, lfo, n].forEach(s => s.stop(now + 0.2)); } catch (e) {} } };
  }
  hit(x, z, heavy = false) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(x, z, heavy ? 1 : 0.7);
    const n = this.noise(false); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = heavy ? 900 : 1600; const g = c.createGain(); this.env(g, t, 0.005, 0.8, 0.18);
    n.connect(lp); lp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.3);
    const o = c.createOscillator(); o.frequency.setValueAtTime(heavy ? 90 : 140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2); const og = c.createGain(); this.env(og, t, 0.005, 0.7, 0.2); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.3);
  }
  swing() { if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(undefined, undefined, 0.35); const n = this.noise(false); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5; bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2500, t + 0.15); const g = c.createGain(); this.env(g, t, 0.03, 0.5, 0.15); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.25); }
  gunshot(x, z) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(x, z, 1.3);
    const n = this.noise(false); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(6000, t); lp.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    const g = c.createGain(); this.env(g, t, 0.002, 1.0, 0.35); n.connect(lp); lp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.5);
    const o = c.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.25); const og = c.createGain(); this.env(og, t, 0.002, 0.9, 0.3); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.4);
  }
  click() { if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(undefined, undefined, 0.4); const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 1800; const g = c.createGain(); this.env(g, t, 0.001, 0.3, 0.04); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.06); }
  crash(x, z, strength = 1) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(x, z, Math.min(1.5, 0.4 + strength * 0.5));
    const n = this.noise(false); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200 + Math.random() * 1500; bp.Q.value = 0.8; const g = c.createGain(); this.env(g, t, 0.003, 0.9, 0.5 + strength * 0.2);
    n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 1);
    const o = c.createOscillator(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.3); const og = c.createGain(); this.env(og, t, 0.003, 0.9, 0.3); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.4);
  }
  thud(x, z) { this.hit(x, z, true); }
  door(open = true) { if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(undefined, undefined, 0.6); const o = c.createOscillator(); o.frequency.setValueAtTime(open ? 220 : 120, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.15); const g = c.createGain(); this.env(g, t, 0.003, 0.7, 0.2); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3); const n = this.noise(false); const lp = c.createBiquadFilter(); lp.frequency.value = 800; const ng = c.createGain(); this.env(ng, t, 0.002, 0.5, 0.1); n.connect(lp); lp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.2); }
  step(x, z, wet = true) { if (!this.ready) return; const c = this.ctx, t = c.currentTime, out = this._out(x, z, 0.18); const n = this.noise(false); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = wet ? 1800 : 700; bp.Q.value = 1.2; const g = c.createGain(); this.env(g, t, 0.004, 0.6, 0.08); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.15); }
  chime(kind = 'info') {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime;
    const seq = kind === 'warn' ? [880, 660] : kind === 'good' ? [523, 659, 784] : kind === 'bad' ? [330, 247] : [660, 880];
    seq.forEach((f, i) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = c.createGain(); this.env(g, t + i * 0.12, 0.01, 0.18, 0.35); o.connect(g); g.connect(this.sfx); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.5); });
  }
  radio(dur = 0.35) { if (!this.ready) return; const c = this.ctx, t = c.currentTime; const n = this.noise(false); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 2; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.setValueAtTime(0.25, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1); n.connect(bp); bp.connect(g); g.connect(this.sfx); n.start(t); n.stop(t + dur + 0.2); }
  horn(on) {
    if (!this.ready) return; const c = this.ctx;
    if (on && !this.hornNodes) { const g = c.createGain(); g.gain.value = 0.18; const lp = c.createBiquadFilter(); lp.frequency.value = 2000; g.connect(lp); lp.connect(this.sfx); const a = c.createOscillator(), b = c.createOscillator(); a.type = b.type = 'square'; a.frequency.value = 415; b.frequency.value = 523; a.connect(g); b.connect(g); a.start(); b.start(); this.hornNodes = [a, b, g]; }
    if (!on && this.hornNodes) { this.hornNodes[0].stop(); this.hornNodes[1].stop(); this.hornNodes = null; }
  }
  glug() { if (!this.ready) return; const c = this.ctx, t = c.currentTime; const o = c.createOscillator(); o.frequency.setValueAtTime(180 + Math.random() * 80, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.08); const g = c.createGain(); this.env(g, t, 0.005, 0.08, 0.08); o.connect(g); g.connect(this.world); o.start(t); o.stop(t + 0.15); }
  shutter() { if (!this.ready) return; const c = this.ctx, t = c.currentTime; for (let i = 0; i < 6; i++) { const n = this.noise(false); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + i * 120; bp.Q.value = 4; const g = c.createGain(); this.env(g, t + i * 0.07, 0.003, 0.4, 0.06); n.connect(bp); bp.connect(g); g.connect(this.world); n.start(t + i * 0.07); n.stop(t + i * 0.07 + 0.1); } }
}
