// Checkpoint service: versioned, validated snapshots with a last-known-good backup.
// A new generation is written to a pending slot, read back and validated, then promoted.
import { SAVE_SCHEMA, RouteTune, VehicleTune } from './config.js';

const KEY = 'rotd.outOfLondon.checkpoint';
const fin = v => typeof v === 'number' && Number.isFinite(v);

export class CheckpointService {
  constructor(storage = safeStorage()) { this.storage = storage; this.generation = 0; this.lastResult = null; }
  validate(s) {
    try {
      if (!s || s.schema !== SAVE_SCHEMA) return 'schema';
      if (!RouteTune.checkpoints[s.checkpointId]) return 'checkpoint id';
      const v = s.vehicle, p = s.player, m = s.mission;
      if (!v || !fin(v.x) || !fin(v.z) || !fin(v.heading) || !fin(v.fuel) || v.fuel < 0 || v.fuel > VehicleTune.tank) return 'vehicle';
      if (!fin(v.engine) || !Array.isArray(v.wheels) || v.wheels.length !== 4 || !v.wheels.every(fin)) return 'vehicle condition';
      if (!p || !fin(p.health) || p.health <= 0 || !fin(p.mag) || !fin(p.reserve)) return 'player';
      if (!m || typeof m.phase !== 'string' || !['none', 'success'].includes(m.rescue)) return 'mission';
      if (!fin(s.generation)) return 'generation';
      return null;
    } catch (e) { return 'exception'; }
  }
  commit(snapshot) {
    const snap = { ...snapshot, schema: SAVE_SCHEMA, generation: this.generation + 1, savedAt: Date.now() };
    const err = this.validate(snap);
    if (err) { console.warn('[checkpoint] refusing invalid snapshot:', err); return { ok: false, error: err }; }
    try {
      const json = JSON.stringify(snap);
      this.storage.setItem(KEY + '.pending', json);
      const back = JSON.parse(this.storage.getItem(KEY + '.pending'));
      if (this.validate(back) || back.generation !== snap.generation) throw new Error('read-back mismatch');
      const prev = this.storage.getItem(KEY + '.latest');
      if (prev) this.storage.setItem(KEY + '.backup', prev);
      this.storage.setItem(KEY + '.latest', json);
      this.storage.removeItem(KEY + '.pending');
      this.generation = snap.generation; this.memory = snap;
      return { ok: true, generation: snap.generation };
    } catch (e) {
      console.warn('[checkpoint] write failed, keeping last complete checkpoint', e);
      this.memory = snap; // still usable for in-session retry
      return { ok: false, error: 'write failed' };
    }
  }
  read(slot) { try { const raw = this.storage.getItem(KEY + '.' + slot); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  load() {
    const latest = this.read('latest');
    if (latest && !this.validate(latest)) { this.generation = latest.generation; return (this.lastResult = { snapshot: latest, recovered: false }); }
    const backup = this.read('backup');
    if (backup && !this.validate(backup)) { this.generation = Math.max(backup.generation, latest && fin(latest.generation) ? latest.generation : 0); return (this.lastResult = { snapshot: backup, recovered: true, reason: latest ? 'latest checkpoint was invalid' : 'latest checkpoint missing' }); }
    if (this.memory && !this.validate(this.memory)) return { snapshot: this.memory, recovered: true, reason: 'storage unavailable; using session checkpoint' };
    return (this.lastResult = { snapshot: null, recovered: false, reason: latest || backup ? 'no valid checkpoint' : 'none' });
  }
  has() { return !!this.load().snapshot; }
  clear() { for (const s of ['latest', 'backup', 'pending']) this.storage.removeItem(KEY + '.' + s); this.memory = null; this.generation = 0; }
  // QA helper (QA-06): corrupt the latest snapshot to exercise recovery
  corruptLatest() { this.storage.setItem(KEY + '.latest', '{"schema":' + SAVE_SCHEMA + ',"broken":'); }
}

function safeStorage() {
  try { const k = '__rotd_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; }
  catch (e) { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
}
