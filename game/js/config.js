// Data contracts from docs/technical-design.md: VehicleTune, RouteTune, EncounterTune.
// All values are playtest hypotheses, kept as editable data rather than code.

export const VehicleTune = {
  id: 'sedan_hero',
  halfWidth: 0.95, halfLength: 2.3, wheelbase: 2.7,
  maxForward: 31,      // m/s (~112 km/h)
  maxReverse: 7,
  engineForce: 8.2,    // m/s^2 at low speed
  brakeForce: 17,
  coastDrag: 0.9, airDrag: 0.0042,
  maxSteer: 0.58, steerRate: 2.6, steerReturn: 3.4,
  surfaces: {          // grip response per surface (paved/wet/gravel)
    asphalt: { grip: 0.86, drag: 0 },
    concrete: { grip: 0.9, drag: 0 },
    gravel: { grip: 0.5, drag: 0.6 },
    offroad: { grip: 0.45, drag: 2.5 },
  },
  handbrakeGrip: 0.18,
  tank: 45,
  startFuel: 8.5,
  fuelPerMeter: 0.0105,
  fuelIdlePerSec: 0.006,
  refuelRate: 1.5,       // litres per second at the pump
  recommendedFill: 16,   // HUD marker; enough for either route with margin
  lowFuel: 4,
  canisterLitres: 6,
  impactDamageThreshold: 3.5, // m/s
  engineDamagePerMs: 1.7,
  wheelDamagePerMs: 2.6,
  infectedHitEngine: 1.2,
  limpEngine: 30,   // below this % engine power is reduced
  flatWheel: 8,
};

export const PlayerTune = {
  walk: 3.4, sprint: 6.4, aimWalk: 2.2, radius: 0.38,
  health: 100, stamina: 100, staminaRegen: 22, sprintCost: 16,
  melee: { damage: 36, range: 2.1, arc: 1.9, cost: 16, time: 0.55, hitAt: 0.22, stagger: 0.6 },
  pistol: { damage: 42, headMult: 3, mag: 12, startReserve: 24, fireTime: 0.22, reload: 1.4, noise: 55, range: 70 },
  enterTime: 0.75, exitTime: 0.6, maxExitSpeed: 1.6,
  pumpReach: 2.6, hoseReach: 7.5,
};

export const EncounterTune = {
  walker: { hp: 70, speedMin: 1.0, speedMax: 2.1, chaseMult: 1.35, awareness: 24, attackRange: 1.35, windup: 0.7, damage: 13, carDamage: 2.2 },
  screamer: { hp: 55, speed: 2.6, standoff: 14, warning: 3.4, cooldown: 14 },
  activeBudget: 34,
  forecourtBudget: 16,
  reinforcementWave: 6,
  pressureDelay: 5,       // seconds of fuelling before the screamer arrives
  escalationEvery: 22,
  cleanupDistance: 150,
};

// Route identifiers are independent of scene object names so checkpoints survive level revisions.
export const RouteTune = {
  checkpoints: {
    start:     { id: 'start',     label: 'Safehouse',  car: { x: 0, z: -6, heading: 0 }, phase: 'drive_to_station' },
    forecourt: { id: 'forecourt', label: 'Forecourt approach', car: { x: 150, z: -300, heading: -Math.PI / 2 }, phase: 'approach' },
  },
  forecourtThresholdX: 150,
  finishZ: -782,
  routes: {
    high_street: { label: 'High Street', blurb: 'short, crowded' },
    service_lane: { label: 'Service Lane', blurb: 'long, narrow, loose gravel' },
    service_shortcut: { label: 'Service Lane via yard shortcut', blurb: 'rescue shortcut' },
  },
  canisters: [
    { id: 'can_forecourt', x: 236, z: -347 },
    { id: 'can_high', x: 252.6, z: -560 },
    { id: 'can_service', x: 442.4, z: -470 },
  ],
  repairKit: { id: 'kit_kiosk', x: 189, z: -346 },
};

export const SAVE_SCHEMA = 3;
