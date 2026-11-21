// Presentation: HUD, subtitles, threat cues, minimap. Reads authoritative state; never completes actions itself.
import { VehicleTune as T } from './config.js';
const $ = id => document.getElementById(id);

export class HUD {
  constructor() {
    this.el = {}; for (const id of ['hud', 'objText', 'objSub', 'speedVal', 'fuelBar', 'fuelText', 'fuelMark', 'engineBar', 'engineText', 'condText', 'vehiclePanel', 'footPanel', 'hpBar', 'stBar', 'weaponName', 'ammoText', 'invText', 'prompt', 'promptKey', 'promptText', 'promptBar', 'promptSub', 'crosshair', 'subtitle', 'subSpeaker', 'subLine', 'warnings', 'toast', 'threats', 'damageVignette', 'fps', 'minimap', 'engDot']) this.el[id] = $(id);
    this.el.fuelMark.style.left = (T.recommendedFill / T.tank * 100) + '%';
    this.subs = []; this.subT = 0; this.cur = null; this.toastT = 0; this.mm = this.el.minimap.getContext('2d');
    this.subtitlesOn = true; this.soundCues = true; this.showFps = false; this.threatEls = new Map(); this.frames = 0; this.fpsT = 0;
  }
  show(on) { this.el.hud.classList.toggle('hidden', !on); }
  say(speaker, text, dur = 4, radio = false) { this.subs.push({ speaker, text, dur, radio }); }
  clearSubs() { this.subs = []; this.cur = null; this.el.subtitle.classList.remove('on'); }
  toast(text, color) { this.el.toast.textContent = text; this.el.toast.style.color = color || ''; this.el.toast.classList.add('on'); this.toastT = 2.8; }

  update(dt, g) {
    const e = this.el, car = g.car;
    // fps
    this.frames++; this.fpsT += dt; if (this.fpsT > 0.5) { e.fps.textContent = this.showFps ? Math.round(this.frames / this.fpsT) + ' fps' : ''; this.frames = 0; this.fpsT = 0; }
    // objective
    const o = g.objective; const tgt = o.target;
    e.objText.textContent = o.text || '';
    let sub = o.sub || '';
    if (tgt) { const px = g.playerInCar ? car.x : g.player.x, pz = g.playerInCar ? car.z : g.player.z; const d = Math.hypot(tgt.x - px, tgt.z - pz); if (d > 12) sub += ` · ${Math.round(d)} m`; }
    e.objSub.innerHTML = escapeHtml(sub) + (o.optional ? `<br><span style="color:#ffcf8a">${escapeHtml(o.optional)}</span>` : '');
    // vehicle panel
    e.speedVal.textContent = Math.round(car.kmh);
    e.fuelBar.style.width = (car.fuel / T.tank * 100) + '%';
    e.fuelBar.style.background = car.fuel < T.lowFuel ? 'var(--red)' : '';
    e.fuelText.textContent = car.fuel.toFixed(1) + ' L';
    e.engineBar.style.width = car.engine + '%'; e.engineBar.style.background = car.engine < 30 ? 'var(--red)' : car.engine < 60 ? 'var(--amber)' : '';
    e.engineText.textContent = Math.round(car.engine) + '%';
    car.wheels.forEach((w, i) => { const el = document.getElementById('w' + i); el.style.fill = w < T.flatWheel ? '#ff4b3e' : w < 35 ? '#ff8c3e' : w < 70 ? '#ffb347' : '#7ddc8a'; });
    e.engDot.style.fill = car.engine < 30 ? '#ff4b3e' : car.engine < 60 ? '#ffb347' : '#7ddc8a';
    const wmin = Math.min(...car.wheels);
    e.condText.textContent = car.engine <= 0 ? 'WRECKED' : (car.engine < 30 || wmin < T.flatWheel) ? 'CRITICAL' : (car.engine < 60 || wmin < 35) ? 'DAMAGED' : 'GOOD';
    // foot panel
    e.footPanel.classList.toggle('hidden', g.playerInCar);
    e.hpBar.style.width = Math.max(0, g.player.health) + '%'; e.stBar.style.width = g.player.stamina + '%';
    e.weaponName.textContent = g.player.aiming ? 'PISTOL' : 'CROWBAR';
    e.ammoText.textContent = g.player.reloading ? 'RELOADING' : `${g.player.mag} / ${g.player.reserve}`;
    const inv = []; if (g.inventory.canister) inv.push('⛽ Jerrycan'); if (g.inventory.kit) inv.push('🔧 Tyre kit'); e.invText.textContent = inv.join('  ·  ');
    e.crosshair.classList.toggle('on', !g.playerInCar && g.player.aiming);
    // prompt
    const p = g.prompt;
    if (p) {
      e.prompt.classList.remove('hidden'); e.promptKey.textContent = p.key; e.promptText.textContent = p.text; e.promptSub.textContent = p.sub || '';
      e.promptKey.style.display = p.key ? '' : 'none';
      e.promptBar.style.display = p.progress !== undefined ? 'block' : 'none'; if (p.progress !== undefined) e.promptBar.firstChild.style.width = (p.progress * 100) + '%';
      e.prompt.style.borderColor = p.blocked ? 'var(--red)' : '';
    } else e.prompt.classList.add('hidden');
    // warnings (colour + icon + word)
    const warns = [];
    if (car.fuel < T.lowFuel) warns.push(['⛽ LOW FUEL', '']);
    if (car.engine < 30 && car.engine > 0) warns.push(['⚙ ENGINE FAILING', '']);
    else if (car.engine < 60) warns.push(['⚙ ENGINE DAMAGED', 'amber']);
    if (wmin < T.flatWheel) warns.push(['◎ FLAT TYRE', '']); else if (wmin < 35) warns.push(['◎ TYRE DAMAGED', 'amber']);
    if (!g.playerInCar && g.player.health < 35) warns.push(['✚ BADLY HURT', '']);
    if (g.screaming && this.soundCues) warns.push(['📢 SCREAMER CALLING', '']);
    const html = warns.map(([t, c]) => `<div class="warn-chip ${c}">${t}</div>`).join('');
    if (html !== this._warnHtml) { e.warnings.innerHTML = html; this._warnHtml = html; }
    // damage vignette
    e.damageVignette.style.boxShadow = `inset 0 0 180px ${40 + g.hurt * 60}px rgba(170,0,0,${Math.min(0.75, g.hurt)})`;
    // subtitles
    if (!this.cur && this.subs.length) { this.cur = this.subs.shift(); this.subT = this.cur.dur; g.onSubtitle && g.onSubtitle(this.cur); }
    if (this.cur) {
      this.subT -= dt;
      if (this.subtitlesOn) { e.subSpeaker.textContent = (this.cur.radio ? '📻 ' : '') + this.cur.speaker; e.subLine.textContent = this.cur.text; e.subtitle.classList.add('on'); }
      if (this.subT <= 0) { this.cur = null; e.subtitle.classList.remove('on'); }
    }
    // toast
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) e.toast.classList.remove('on'); }
    this.threatCues(g);
    this.minimap(g);
  }

  threatCues(g) { // directional indicators for infected outside the centre of view + screamer (visual sound cue)
    const live = new Set();
    if (this.soundCues) for (const t of g.threats) {
      live.add(t.id);
      let el = this.threatEls.get(t.id);
      if (!el) { el = document.createElement('div'); el.className = 'threat ' + t.kind; el.innerHTML = `<div class="arrow">${t.kind === 'screamer' ? 'SCREAMER' : ''}</div>`; this.el.threats.appendChild(el); this.threatEls.set(t.id, el); }
      const W = innerWidth, H = innerHeight, r = Math.min(W, H) * 0.36;
      el.style.left = (W / 2 + Math.sin(t.angle) * r) + 'px'; el.style.top = (H / 2 - Math.cos(t.angle) * r) + 'px';
      el.style.transform = `rotate(${t.angle}rad)`; el.style.opacity = t.strength.toFixed(2);
    }
    for (const [id, el] of this.threatEls) if (!live.has(id)) { el.remove(); this.threatEls.delete(id); }
  }

  minimap(g) {
    const c = this.mm, S = 200, scale = 0.62; // px per metre
    const px = g.playerInCar ? g.car.x : g.player.x, pz = g.playerInCar ? g.car.z : g.player.z;
    c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S / 2);
    const P = (x, z) => [(x - px) * scale, (z - pz) * scale];
    for (const d of g.world.drivables) {
      c.save(); const [x, y] = P(d.cx, d.cz); c.translate(x, y); c.rotate(-d.rot);
      c.fillStyle = d.surface === 'gravel' ? 'rgba(170,140,90,.75)' : d.id === 'lot' ? 'rgba(200,200,210,.55)' : 'rgba(210,215,225,.6)';
      if (d.id === 'yard_shortcut' && !g.shortcutOpen) c.fillStyle = 'rgba(120,60,60,.5)';
      c.fillRect(-d.hx * scale, -d.hz * scale, d.hx * 2 * scale, d.hz * 2 * scale); c.restore();
    }
    // forecourt + finish markers
    let [x, y] = P(212, -324); c.fillStyle = '#ff6a3d'; c.fillRect(x - 5, y - 4, 10, 8);
    c.fillStyle = '#7ddc8a'; for (const fx of [260, 330]) { [x, y] = P(fx, -782); c.fillRect(x - 6, y - 2, 12, 4); }
    // canisters
    c.fillStyle = '#ffb347'; for (const cn of g.canisterMarkers) { [x, y] = P(cn.x, cn.z); c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
    // infected
    for (const i of g.infected) { if (i.dead) continue; [x, y] = P(i.x, i.z); if (Math.abs(x) > 100 || Math.abs(y) > 100) continue; c.fillStyle = i.type === 'screamer' ? '#ff2a2a' : 'rgba(255,90,70,.85)'; c.beginPath(); c.arc(x, y, i.type === 'screamer' ? 4 : 2.2, 0, 7); c.fill(); }
    // car
    [x, y] = P(g.car.x, g.car.z); c.save(); c.translate(x, y); c.rotate(-g.car.heading); c.fillStyle = '#5aa0ff'; c.fillRect(-3, -6, 6, 12); c.restore();
    // objective arrow/marker
    const t = g.objective.target;
    if (t) {
      let [tx, ty] = P(t.x, t.z); const d = Math.hypot(tx, ty);
      if (d > 88) { tx = tx / d * 88; ty = ty / d * 88; }
      c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(tx, ty - 7); c.lineTo(tx + 6, ty); c.lineTo(tx, ty + 7); c.lineTo(tx - 6, ty); c.closePath(); c.fill();
    }
    // player
    c.save(); c.rotate(-(g.playerInCar ? g.car.heading : g.player.yaw)); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
    c.restore();
  }
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
