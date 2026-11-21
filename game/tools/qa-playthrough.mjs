// Scripted playthrough used for QA: serve the repo root (python3 -m http.server 8931), then
//   npm i playwright-core && npx playwright-core install chromium   (or set CHROME=/path/to/chrome)
//   node game/tools/qa-playthrough.mjs [low|medium|high] [width] [height]
// Checks: no console errors, frames render, mission start, drive, forecourt checkpoint, exit car,
// interruptible refuel (exactly-once credit), re-entry, checkpoint restore, High Street escape, debrief, replay.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT || 'qa-shots'; mkdirSync(OUT, { recursive: true });
const base = (process.env.BASE || 'http://127.0.0.1:8931') + '/game/index.html?qa=1&quality=' + (process.argv[2] || 'low');
const W = +(process.argv[3] || 960), H = +(process.argv[4] || 540);
const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
const S = () => page.evaluate(() => window.__ROTD ? window.__ROTD.state : { ready: false });
const until = async (fn, label, timeout = 180000, poll = 500) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await S(); if (fn(s)) { console.log('OK  ', label, `(${((Date.now() - t0) / 1000).toFixed(1)}s)`); return s; } await page.waitForTimeout(poll); } const s = await S(); console.log('FAIL', label, JSON.stringify(s)); throw new Error('timeout: ' + label); };
const shot = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('     screenshot', n); };
let ok = true;
try {
  await page.goto(base, { waitUntil: 'commit' });
  await until(s => s.ready, 'game ready', 300000);
  const f0 = (await S()).frames; await page.waitForTimeout(2000); await until(s => s.frames > f0, 'renders frames on title');
  if (process.argv[5] === 'title') { await shot('title-live'); throw new Error('done'); }
  await page.click('#btnNew'); await page.waitForTimeout(300);
  await until(s => s.screen === 'intro', 'intro screen');
  await page.click('#btnIntroGo');
  let s = await until(s => s.screen === 'playing' && s.checkpoint === 'start', 'mission started, start checkpoint saved');
  const z0 = s.car.z, fuel0 = s.car.fuel;
  await page.keyboard.down('KeyW');
  s = await until(s => s.car.z < z0 - 6, 'car drives forward under keyboard throttle');
  await page.waitForTimeout(1500);
  await shot('01-driving');
  await page.keyboard.up('KeyW');
  s = await S(); console.log('     fuel', fuel0.toFixed(3), '->', s.car.fuel.toFixed(3), 'kmh', s.car.kmh.toFixed(1));
  if (!(s.car.fuel < fuel0)) throw new Error('fuel did not decrease while driving');
  await page.keyboard.down('KeyS'); await until(s => s.car.kmh < 6, 'brakes to a stop', 180000, 60); await page.keyboard.up('KeyS');
  // jump to the forecourt (QA hook), parked beside pump island 2 so the driver door faces the pump
  await page.evaluate(() => window.__ROTD.qa.parkAt(215.2, -324, Math.PI));
  await until(s => s.phase === 'approach' && s.checkpoint === 'forecourt', 'forecourt threshold → approach phase + forecourt checkpoint');
  await page.waitForTimeout(800);
  await page.keyboard.press('KeyE');
  s = await until(s => !s.inCar && !s.transition, 'exited car on foot');
  console.log('     player at', s.player.x.toFixed(2), s.player.z.toFixed(2), 'prompt:', s.prompt);
  await page.waitForTimeout(1000);
  const before = (await S()).car.fuel;
  await page.keyboard.down('KeyF');
  s = await until(s => s.fueling && s.car.fuel > before + 0.6, 'refuelling transfers fuel while F is held');
  await shot('02-refuelling');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyF');
  s = await until(s => !s.fueling, 'releasing F cancels the transfer');
  const transferred = s.car.fuel - before;
  await page.waitForTimeout(800);
  const s2 = await S();
  console.log(`     transferred ${transferred.toFixed(3)} L · mission credited ${s2.fueled.toFixed(3)} L · tank ${s2.car.fuel.toFixed(3)} L · phase ${s2.phase}`);
  if (Math.abs(s2.fueled - transferred) > 0.02) throw new Error('fuel credited != transferred (exactly-once violated)');
  if (Math.abs(s2.car.fuel - s.car.fuel) > 0.01) throw new Error('fuel changed after cancel');
  await page.keyboard.press('KeyE');
  s = await until(s => s.inCar && !s.transition, 're-entered the car');
  await shot('03-forecourt-back-in-car');
  // pause + restart from checkpoint restores the forecourt snapshot
  await page.keyboard.press('KeyP');
  await until(s => s.screen === 'paused', 'paused');
  await page.click('#btnRestartCp');
  s = await until(s => s.screen === 'playing' && s.phase === 'approach' && s.fueled === 0 && Math.abs(s.car.fuel - s2.car.fuel) > 0.3, 'restart restores forecourt checkpoint (pre-fuel state)');
  console.log('     restored fuel', s.car.fuel.toFixed(3), 'phase', s.phase, 'inCar', s.inCar);
  // escape: drive off the forecourt onto High Street, then up to the motorway threshold
  await page.evaluate(() => window.__ROTD.qa.parkAt(260, -420, 0));
  s = await until(s => s.phase === 'escape' && s.route === 'high_street', 'departed forecourt → escape phase, High Street route chosen');
  await page.evaluate(() => window.__ROTD.qa.parkAt(260, -755, 0));
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2500);
  await shot('04-escape-high-street');
  s = await until(s => s.screen === 'won', 'crossed motorway threshold → debrief');
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(800);
  await shot('05-debrief');
  console.log('     debrief:', (await page.textContent('#debrief')).replace(/\s+/g, ' ').slice(0, 300));
  await page.click('#btnReplay');
  s = await until(s => s.screen === 'intro' || s.screen === 'playing', 'replay offered after completion');
  if (s.screen === 'intro') await page.click('#btnIntroGo');
  s = await until(s => s.screen === 'playing' && s.phase === 'drive_to_station', 'replay restarts mission');
} catch (e) { if (e.message !== 'done') { ok = false; console.log('ERROR', e.message); await shot('zz-failure'); } }
console.log('console errors/warnings:', errors.length ? errors : 'none');
await browser.close();
process.exit(ok && !errors.length ? 0 : 1);
