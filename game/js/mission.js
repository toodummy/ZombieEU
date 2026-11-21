// Mission director: owns phase, objective, route, rescue flag, checkpoint eligibility and end reason.
// Consumes domain events once and reports state to presentation and the checkpoint service.
import { RouteTune, VehicleTune } from './config.js';

export const PHASES = ['drive_to_station', 'approach', 'refuel', 'escape', 'complete', 'failed'];
const FORECOURT = { x: 212, z: -326 };

export class MissionDirector {
  constructor(hooks) { this.hooks = hooks; this.reset(); }
  reset(flags) {
    const f = flags || {};
    this.phase = f.phase || 'drive_to_station';
    this.rescue = f.rescue || 'none';
    this.route = f.route || null;
    this.workerCalled = !!f.workerCalled;
    this.refuelStarted = !!f.refuelStarted;
    this.fueled = f.fueled || 0;
    this.canisters = { ...(f.canisters || Object.fromEntries(RouteTune.canisters.map(c => [c.id, 'world']))) };
    this.kit = f.kit || 'world';
    this.elapsed = f.elapsed || 0;
    this.spoken = new Set(f.spoken || []);
    this.queue = []; this.once = new Set();
    this.endReason = null; this.completed = false; this.screamerSeen = false; this.rescueProgress = 0;
    this.loiter = 0; this.outOfFuelNotified = false; this.stats = { kills: 0, impacts: 0 };
  }
  flags() { return { phase: this.phase, rescue: this.rescue, route: this.route, workerCalled: this.workerCalled, refuelStarted: this.refuelStarted, fueled: +this.fueled.toFixed(3), canisters: { ...this.canisters }, kit: this.kit, elapsed: +this.elapsed.toFixed(1), spoken: [...this.spoken] }; }
  emit(type, data = {}, onceKey) { if (onceKey) { if (this.once.has(onceKey)) return; this.once.add(onceKey); } this.queue.push({ type, ...data }); }
  say(id, speaker, text, dur = 4, radio = false) { if (this.spoken.has(id)) return; this.spoken.add(id); this.hooks.say(speaker, text, dur, radio); }
  setPhase(p) { if (this.phase === p) return; this.phase = p; this.hooks.phaseChanged(p); }

  update(dt, g) {
    if (this.phase === 'complete' || this.phase === 'failed') return;
    this.elapsed += dt;
    const car = g.car, inCar = g.playerInCar;
    // ---- poll world for domain events (each fires once) ----
    if (this.phase === 'drive_to_station') {
      if (this.elapsed > 1.5) this.say('intro1', 'Kesh (radio)', 'Alex, the motorway checkpoint is still letting cars through. Not for long. Get out of the city.', 5, true);
      if (this.elapsed > 7.5) this.say('intro2', 'Alex', "Tank's nearly dry. Northgate on Station Road, then I'm gone.", 4);
      if (car.z < -255 && car.x < 20) this.say('blocked', 'Alex', "Bus has the junction blocked. Right turn, then. Follow the fuel signs.", 4);
      if (car.fuel < VehicleTune.lowFuel) this.emit('low_fuel', {}, 'low_fuel');
      if (car.x > RouteTune.forecourtThresholdX && car.z < -280 && car.z > -360) this.emit('forecourt_threshold', {}, 'forecourt_threshold');
    }
    if (this.phase === 'approach' || this.phase === 'refuel') {
      const nearStation = Math.hypot(g.player.x - FORECOURT.x, g.player.z - FORECOURT.z) < 45;
      if (!inCar && nearStation) { this.loiter += dt; if (!this.workerCalled && this.loiter > 3) this.emit('worker_calls', {}, 'worker_calls'); }
      if (inCar && this.refuelStarted || inCar && this.phase === 'refuel') {
        const away = Math.hypot(car.x - FORECOURT.x, car.z - FORECOURT.z) > 42;
        if (away) this.emit('departed', {}, 'departed');
      }
      if (inCar && this.phase === 'approach' && Math.hypot(car.x - FORECOURT.x, car.z - FORECOURT.z) > 70 && (car.x > 268 || car.z < -390)) this.emit('departed', {}, 'departed');
    }
    if (this.phase === 'escape' || this.phase === 'refuel' || this.phase === 'approach') {
      const road = g.world.roadAt(car.x, car.z);
      let r = null;
      if (road === 'yard_shortcut') r = 'service_shortcut';
      else if (road === 'high_street' && car.z < -330) r = 'high_street';
      else if ((road === 'service_1' && car.z < -320) || road === 'service_2' || road === 'service_3') r = this.route === 'service_shortcut' ? 'service_shortcut' : 'service_lane';
      if (r && r !== this.route) this.emit('route_entered', { route: r });
      if (inCar && car.engineOn && car.z < RouteTune.finishZ && (road === 'high_street' || road === 'service_3')) this.emit('finish', {}, 'finish');
    }
    // failure checks
    if (g.player.health <= 0) this.emit('fail', { reason: 'player_down' }, 'fail');
    else if (car.engine <= 0) this.emit('fail', { reason: 'car_wrecked' }, 'fail');
    else if (car.fuel <= 0) {
      const avail = RouteTune.canisters.some(c => this.canisters[c.id] !== 'used');
      if (!avail) this.emit('fail', { reason: 'out_of_fuel' }, 'fail');
      else if (!this.outOfFuelNotified) { this.outOfFuelNotified = true; this.hooks.say('Alex', "Engine's dead — out of fuel. There was a jerrycan back there…", 4); this.hooks.chime('bad'); }
    } else this.outOfFuelNotified = false;
    // ---- consume events once ----
    for (const e of this.queue.splice(0)) this.consume(e, g);
  }
  consume(e, g) {
    switch (e.type) {
      case 'low_fuel': this.hooks.chime('warn'); this.hooks.say('Alex', 'Fuel light. Come on, come on…', 3); break;
      case 'forecourt_threshold':
        this.setPhase('approach');
        this.say('approach', 'Alex', "Canopy lights are still on. Park close to a pump, get out, fill up.", 4.5);
        this.hooks.checkpoint('forecourt');
        break;
      case 'worker_calls':
        this.workerCalled = true;
        this.say('worker1', 'Worker (Priya)', "Hey! Is someone out there? The kiosk shutter's jammed — please, get me out!", 5);
        this.hooks.chime('info');
        break;
      case 'fuel_started':
        if (!this.refuelStarted) { this.refuelStarted = true; this.setPhase('refuel'); this.say('fuel1', 'Alex', 'Pump still has power. Watch the gauge… and the street.', 3.5); }
        break;
      case 'fuel_stopped': this.fueled += e.amount || 0; break;
      case 'screamer_arrived':
        this.screamerSeen = true;
        this.say('screamer', 'Alex', "Screamer! If it finishes that call, every one of them comes running.", 4);
        break;
      case 'scream_complete': this.say('screamDone', 'Alex', 'Too late — they heard it. Finish up or go!', 3); break;
      case 'rescue_complete':
        if (this.rescue === 'success') break;
        this.rescue = 'success';
        this.hooks.setShortcut(true);
        this.hooks.say('Worker (Priya)', "Thank you! I've unlocked the yard gate off the service lane — it cuts straight through to the motorway.", 5.5);
        this.hooks.say('Kesh (radio)', 'Copy, Alex — survivor at Northgate. The service-lane yard gate shows open on our map.', 5, true);
        this.hooks.chime('good');
        break;
      case 'departed':
        this.setPhase('escape');
        if (g.car.fuel < 9) this.hooks.say('Alex', 'Not much in the tank… pick the route carefully.', 3.5);
        else this.say('depart', 'Alex', 'High Street is quicker but packed. The service lane is longer — tight, loose gravel.', 5);
        break;
      case 'route_entered':
        this.route = e.route;
        if (e.route === 'high_street') this.say('r_high', 'Alex', 'High Street. Keep it moving, don\'t stop for anything.', 3.5);
        if (e.route === 'service_lane') this.say('r_serv', 'Alex', 'Service lane. Easy on the throttle — this gravel is loose.', 3.5);
        if (e.route === 'service_shortcut') this.say('r_short', 'Alex', 'Yard gate is open. Thanks, Priya.', 3);
        break;
      case 'finish':
        if (this.completed) break; // single completion event
        this.completed = true; this.setPhase('complete'); this.hooks.complete(this.debrief(g));
        break;
      case 'fail':
        if (this.completed || this.phase === 'failed') break;
        this.endReason = e.reason; this.setPhase('failed'); this.hooks.fail(e.reason);
        break;
    }
  }
  debrief(g) {
    return {
      route: this.route ? RouteTune.routes[this.route].label : 'Unknown',
      fuel: g.car.fuel, engine: g.car.engine, wheels: g.car.wheels.slice(), condition: g.car.condition,
      rescue: this.rescue === 'success' ? 'Priya rescued' : 'Not attempted', time: this.elapsed, fueled: this.fueled,
      kills: this.stats.kills,
    };
  }
  objective(g) {
    const car = g.car, inCar = g.playerInCar;
    const canTarget = () => { let best = null, bd = 1e9; for (const c of RouteTune.canisters) { if (this.canisters[c.id] !== 'world') continue; const d = Math.hypot(c.x - g.player.x, c.z - g.player.z); if (d < bd) { bd = d; best = c; } } return best; };
    if (car.fuel <= 0 && this.phase !== 'complete') {
      if (g.inventory.canister) return { text: 'Pour the jerrycan into the sedan', sub: 'Hold F beside the car', target: { x: car.x, z: car.z } };
      const c = canTarget(); if (c) return { text: 'Out of fuel — fetch a jerrycan', sub: 'Get out and follow the marker', target: c };
    }
    const optional = this.workerCalled && this.rescue === 'none' && (this.phase === 'approach' || this.phase === 'refuel') ? 'Optional · Pry open the kiosk shutter (hold E)' : '';
    switch (this.phase) {
      case 'drive_to_station': return { text: 'Drive to the Northgate fuel station', sub: car.fuel < VehicleTune.lowFuel ? 'LOW FUEL · follow the blue signs' : 'Follow the blue signs · Carver Rd → Station Rd', target: { x: 205, z: -318 } };
      case 'approach': case 'refuel': {
        if (inCar && !this.refuelStarted) return { text: 'Park beside a pump and get out', sub: 'Press E when stopped · a blocked door uses the other side', target: { x: 212, z: -324 }, optional };
        if (!inCar && g.fuelHint) return { text: car.fuel >= VehicleTune.recommendedFill ? 'Tank has a safe margin — get back in the car' : 'Refuel the sedan', sub: `Hold F at a pump · ${car.fuel.toFixed(1)} / ${VehicleTune.tank} L · recommended ${VehicleTune.recommendedFill} L · release to stop`, target: { x: car.x, z: car.z }, optional };
        if (!inCar) return { text: 'Walk to a pump next to the car', sub: 'Pumps sit under the canopy · or return to the car (E)', target: g.nearestPump || { x: 212, z: -324 }, optional };
        return { text: 'Choose your escape route', sub: 'High Street (short, crowded) or Service Lane (long, narrow gravel)' + (this.rescue === 'success' ? ' · yard shortcut open' : ''), target: { x: 260, z: -330 }, optional };
      }
      case 'escape': {
        if (!inCar) return { text: 'Get back in the car', sub: 'E near either door', target: { x: car.x, z: car.z } };
        const tgt = this.route && this.route.startsWith('service') ? { x: 330, z: -785 } : this.route === 'high_street' ? { x: 260, z: -785 } : { x: 260, z: -320 };
        return { text: 'Reach the motorway checkpoint', sub: this.route ? RouteTune.routes[this.route].label + ' · ' + RouteTune.routes[this.route].blurb : 'High Street ▲ north · Service Lane ► east then north', target: tgt };
      }
      default: return { text: '', sub: '' };
    }
  }
}
