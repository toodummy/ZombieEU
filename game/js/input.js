// Keyboard, mouse (pointer lock) and gamepad. Produces an abstract action state each frame.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();   // edge-triggered this frame
    this.mouseDX = 0; this.mouseDY = 0;
    this.mouseL = false; this.mouseR = false; this.mouseLPressed = false;
    this.locked = false;
    this.sens = 1; this.invertY = false;
    this.pad = null; this.padPrev = {};
    this.onPauseRequest = null;
    this.enabled = true;
    addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if ((e.code === 'Escape' || e.code === 'KeyP') && this.onPauseRequest) this.onPauseRequest();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouseL = this.mouseR = false; });
    canvas.addEventListener('mousedown', e => {
      if (!this.locked && this.wantLock) this.requestLock();
      if (e.button === 0) { this.mouseL = true; this.mouseLPressed = true; }
      if (e.button === 2) this.mouseR = true;
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.mouseL = false; if (e.button === 2) this.mouseR = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('mousemove', e => {
      if (this.locked) { this.mouseDX += e.movementX; this.mouseDY += e.movementY; }
    });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (was && !this.locked && this.wantLock && this.onPauseRequest) this.onPauseRequest(true);
    });
    this.wantLock = false;
  }
  requestLock() { try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* headless / unsupported */ } }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }
  down(...codes) { return codes.some(c => this.keys.has(c)); }
  hit(...codes) { return codes.some(c => this.pressed.has(c)); }

  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.pad = null;
    for (const p of pads) if (p && p.connected) { this.pad = p; break; }
  }
  padBtn(i) { return !!(this.pad && this.pad.buttons[i] && this.pad.buttons[i].pressed); }
  padVal(i) { return this.pad && this.pad.buttons[i] ? this.pad.buttons[i].value : 0; }
  padAxis(i) { if (!this.pad) return 0; const v = this.pad.axes[i] || 0; return Math.abs(v) < 0.15 ? 0 : v; }
  padHit(i) { return this.padBtn(i) && !this.padPrev[i]; }

  // Called once per frame by the game; returns a frozen snapshot of abstract actions
  sample() {
    this.pollPad();
    const k = (...c) => this.down(...c);
    const a = {
      throttle: k('KeyW', 'ArrowUp') ? 1 : 0,
      brake: k('KeyS', 'ArrowDown') ? 1 : 0,
      steer: (k('KeyA', 'ArrowLeft') ? 1 : 0) - (k('KeyD', 'ArrowRight') ? 1 : 0),
      moveX: (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0),
      moveY: (k('KeyW') ? 1 : 0) - (k('KeyS') ? 1 : 0),
      handbrake: k('Space'),
      sprint: k('ShiftLeft', 'ShiftRight'),
      interact: this.hit('KeyE'), interactHeld: k('KeyE'),
      fuelHeld: k('KeyF'),
      lights: this.hit('KeyL'), horn: k('KeyH'),
      reload: this.hit('KeyR'),
      aim: this.mouseR, fire: this.mouseLPressed, fireHeld: this.mouseL,
      melee: false,
      lookX: this.mouseDX * 0.0022 * this.sens,
      lookY: this.mouseDY * 0.0022 * this.sens * (this.invertY ? -1 : 1),
      pause: false,
    };
    if (this.pad) {
      const lx = this.padAxis(0), ly = this.padAxis(1), rx = this.padAxis(2), ry = this.padAxis(3);
      const rt = this.padVal(7), lt = this.padVal(6);
      a.throttle = Math.max(a.throttle, rt); a.brake = Math.max(a.brake, lt);
      if (lx) a.steer = -lx;
      if (lx) a.moveX = lx; if (ly) a.moveY = -ly;
      a.lookX += rx * 0.05 * this.sens; a.lookY += ry * 0.04 * this.sens * (this.invertY ? -1 : 1);
      a.handbrake = a.handbrake || this.padBtn(1);
      a.interact = a.interact || this.padHit(0); a.interactHeld = a.interactHeld || this.padBtn(0);
      a.fuelHeld = a.fuelHeld || this.padBtn(3);
      a.sprint = a.sprint || this.padBtn(10) || this.padBtn(4);
      a.aim = a.aim || lt > 0.4;
      a.fire = a.fire || (rt > 0.5 && !this.padPrev.rt);
      a.melee = this.padHit(2);
      a.reload = a.reload || this.padHit(1);
      a.lights = a.lights || this.padHit(13);
      a.horn = a.horn || this.padBtn(11);
      if (this.padHit(9) && this.onPauseRequest) this.onPauseRequest();
      this.padPrev = {}; this.pad.buttons.forEach((b, i) => this.padPrev[i] = b.pressed); this.padPrev.rt = rt > 0.5;
    }
    this.pressed.clear(); this.mouseDX = this.mouseDY = 0; this.mouseLPressed = false;
    return a;
  }
}
