// Level and environment: fictional south-London district, Northgate forecourt, two escape routes,
// motorway checkpoint. Owns collision, surfaces, authored anchors and environment lighting.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OBB2, segmentOBB, mulberry32, clamp } from './mathutil.js';
import * as TX from './textures.js';
import { buildSedanMesh } from './vehicle.js';

const rnd = mulberry32(20261121);
const R = (a, b) => a + rnd() * (b - a);

// ---- authored layout (metres; -z is north) ----
const ROADS = [
  { id: 'apron', rect: [0, -1, 15, 13], surface: 'concrete', walls: false },
  { id: 'carver_rd', a: [0, -10], b: [0, -324], w: 9, side: 3.5, mark: 'dash', build: 'terrace' },
  { id: 'station_rd', a: [-8, -300], b: [448, -300], w: 9, side: 3.5, mark: 'dash', build: 'terrace' },
  { id: 'lot', rect: [210, -331, 42, 25], surface: 'concrete' },
  { id: 'high_street', a: [260, -292], b: [260, -812], w: 10, side: 3.5, mark: 'dash', build: 'shops' },
  { id: 'service_1', a: [440, -304], b: [440, -626], w: 7, side: 0, surface: 'gravel', build: 'industrial' },
  { id: 'service_2', a: [443.5, -622], b: [326.5, -622], w: 7, side: 0, surface: 'gravel', build: 'industrial' },
  { id: 'service_3', a: [330, -556], b: [330, -812], w: 7, side: 0, surface: 'gravel', build: 'industrial' },
  { id: 'yard_shortcut', a: [440, -405], b: [330, -560], w: 7, side: 0, surface: 'gravel', build: null },
  { id: 'motorway', a: [160, -814], b: [540, -814], w: 22, side: 2, mark: 'motorway', build: null },
];

export class World {
  constructor(scene, renderer, quality) {
    this.scene = scene; this.renderer = renderer; this.quality = quality;
    this.drivables = []; this.obstacles = []; this.lamps = []; this.dynamic = [];
    this.batches = new Map(); // material -> geometries (merged at the end)
    this.time = 0;
  }

  async build(progress = () => {}) {
    const s = this.scene; const t0 = performance.now(); let tl = t0;
    const prog = progress; progress = (p, m) => { const n = performance.now(); console.info(`[world] ${m} (+${Math.round(n - tl)} ms)`); tl = n; prog(p, m); };
    this.mats();
    progress(0.1, 'Painting the sky…'); this.buildSky(); await tick();
    progress(0.2, 'Laying roads…'); this.buildRoads(); await tick();
    progress(0.35, 'Raising terraces…'); this.buildBuildings(); await tick();
    progress(0.55, 'Northgate forecourt…'); this.buildStation(); await tick();
    progress(0.65, 'Wrecks and barricades…'); this.buildProps(); this.buildCheckpoint(); this.buildSkyline(); await tick();
    progress(0.8, 'Street lighting…'); this.buildLamps(); this.flushBatches(); await tick();
    this.ground();
    progress(0.9, 'Lighting…'); this.buildLights(); await tick();
    console.info(`[world] built in ${Math.round(performance.now() - t0)} ms · ${this.obstacles.length} colliders · ${this.lamps.length} light anchors`);
    return this;
  }

  mats() {
    const M = this.M = {};
    const road = TX.roadTextures('dash'); const mway = TX.roadTextures('motorway'); const gr = TX.gravelTextures(); const con = TX.concreteTextures();
    M.roadTex = road; M.mwayTex = mway; M.gravelTex = gr; M.concreteTex = con;
    M.paving = new THREE.MeshStandardMaterial({ map: TX.pavingTexture(), roughness: 0.55, metalness: 0, color: 0x9a9a9a });
    M.kerb = new THREE.MeshStandardMaterial({ color: 0x77777a, roughness: 0.6 });
    M.facades = ['brick', 'stock', 'render', 'brick', 'shop', 'shop', 'dark'].map((st, i) => {
      const t = TX.facadeTextures(st, i + 1);
      return new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emissive, emissive: 0xffc890, emissiveIntensity: 1.4, roughness: 0.82, metalness: 0 });
    });
    M.roof = new THREE.MeshStandardMaterial({ map: TX.roofTexture(), roughness: 0.6, color: 0x888888 });
    M.metal = new THREE.MeshStandardMaterial({ color: 0x5d636a, roughness: 0.5, metalness: 0.7 });
    M.darkMetal = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.55, metalness: 0.6 });
    M.wall = new THREE.MeshStandardMaterial({ color: 0x5a3b30, roughness: 0.9 });
    M.fence = new THREE.MeshStandardMaterial({ color: 0x4a4f52, roughness: 0.6, metalness: 0.5 });
    M.white = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.5 });
    M.red = new THREE.MeshStandardMaterial({ color: 0xb3241a, roughness: 0.45, metalness: 0.2 });
    M.yellow = new THREE.MeshStandardMaterial({ color: 0xd8a420, roughness: 0.5 });
    M.black = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.7 });
    M.olive = new THREE.MeshStandardMaterial({ color: 0x3d4430, roughness: 0.8 });
    M.sand = new THREE.MeshStandardMaterial({ color: 0x6d6250, roughness: 1 });
    M.lampHead = new THREE.MeshStandardMaterial({ color: 0x332a1a, emissive: 0xffa040, emissiveIntensity: 6 });
    M.lampDead = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    M.canopyLight = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 5 });
    M.kioskGlow = new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0xbfe0ff, emissiveIntensity: 1.6 });
    M.glass = new THREE.MeshPhysicalMaterial({ color: 0x0b141c, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55 });
    M.hazard = new THREE.MeshStandardMaterial({ color: 0xe0b020, emissive: 0x402a00, roughness: 0.5 });
    M.blueLight = new THREE.MeshStandardMaterial({ color: 0x113, emissive: 0x3a7bff, emissiveIntensity: 5 });
    M.redLight = new THREE.MeshStandardMaterial({ color: 0x300, emissive: 0xff2a1a, emissiveIntensity: 5 });
    M.fire = new THREE.MeshStandardMaterial({ color: 0x000, emissive: 0xff7a20, emissiveIntensity: 6, transparent: true, opacity: 0.9 });
    M.signGreen = (lines, o = {}) => new THREE.MeshStandardMaterial({ map: TX.signTexture(lines, o), roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.22, emissiveMap: null });
  }

  // ---------- batching ----------
  addStatic(geo, mat, matrix, { shadow = true, receive = true } = {}) {
    const g = geo.clone(); g.applyMatrix4(matrix);
    const key = mat.uuid + (shadow ? 's' : '') + (receive ? 'r' : '');
    if (!this.batches.has(key)) this.batches.set(key, { mat, geos: [], shadow, receive });
    // normalise attributes to position/normal/uv so merging works
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
    this.batches.get(key).geos.push(g);
  }
  box(w, h, d, x, y, z, mat, rotY = 0, opts) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(w, h, d));
    this.addStatic(BOX, mat, m, opts);
  }
  cyl(r, h, x, y, z, mat, seg = 10, opts) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(r, h, r));
    this.addStatic(seg > 10 ? CYL16 : CYL, mat, m, opts);
  }
  flushBatches() {
    for (const { mat, geos, shadow, receive } of this.batches.values()) {
      for (let i = 0; i < geos.length; i += 400) {
        const merged = mergeGeometries(geos.slice(i, i + 400), false);
        if (!merged) continue;
        merged.computeBoundingSphere();
        const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = shadow; mesh.receiveShadow = receive; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
        this.scene.add(mesh);
      }
    }
    this.batches.clear();
  }
  obstacle(cx, cz, hx, hz, rot = 0, data = {}) { const o = new OBB2(cx, cz, hx, hz, rot, data); this.obstacles.push(o); return o; }

  // ---------- sky & lights ----------
  buildSky() {
    this.sunDir = new THREE.Vector3(-0.78, 0.12, 0.45).normalize(); // low, west-south-west: dusk
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: this.sunDir }, uTime: { value: 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 uSun; uniform float uTime; varying vec3 vDir;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir); float y = d.y;
          float sd = max(dot(d, uSun), 0.0);
          vec3 top = vec3(0.07,0.09,0.14), mid = vec3(0.27,0.27,0.33), hor = vec3(0.86,0.46,0.24);
          vec3 col = mix(mid, top, smoothstep(0.0, 0.55, y));
          col = mix(col, hor, pow(1.0-clamp(y,0.0,1.0), 6.0) * (0.35 + 0.65*pow(sd, 2.0)));
          col += vec3(1.0,0.55,0.25) * pow(sd, 24.0) * 1.4 + vec3(1.0,0.75,0.45) * pow(sd, 400.0) * 4.0;
          vec2 uv = d.xz / max(y + 0.12, 0.05);
          float c = fbm(uv * 1.2 + vec2(uTime*0.01, 0.0));
          float cl = smoothstep(0.38, 0.75, c) * smoothstep(-0.02, 0.2, y);
          vec3 cloudCol = mix(vec3(0.12,0.12,0.15), vec3(0.75,0.38,0.2), pow(sd, 3.0) * (1.0 - smoothstep(0.0,0.4,y)));
          col = mix(col, cloudCol, cl * 0.85);
          col = mix(col, vec3(0.16,0.15,0.17), smoothstep(0.02, -0.15, y)); // below horizon haze
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.skyMat = skyMat;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1;
    this.sky = sky; this.scene.add(sky);
    // environment map for wet reflections, from the same sky
    const pm = new THREE.PMREMGenerator(this.renderer); const envScene = new THREE.Scene();
    const envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat); envScene.add(envSky);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffa860 })); glow.position.copy(this.sunDir).multiplyScalar(90); envScene.add(glow);
    this.envRT = pm.fromScene(envScene, 0.02); this.scene.environment = this.envRT.texture; pm.dispose();
    this.scene.fog = new THREE.FogExp2(0x3b3d48, 0.0105);
    this.scene.background = new THREE.Color(0x30323c);
  }
  buildLights() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight(0x8792b0, 0x2a2420, 0.75); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffa46a, 1.55);
    const q = this.quality;
    this.sun.castShadow = q !== 'low';
    const sz = q === 'high' ? 2048 : 1024; this.sun.shadow.mapSize.set(sz, sz);
    const c = this.sun.shadow.camera; c.left = -55; c.right = 55; c.top = 55; c.bottom = -55; c.near = 1; c.far = 260;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04;
    s.add(this.sun); s.add(this.sun.target);
    // pooled point lights reassigned to the nearest street lamps/fires (constant light count = no shader recompiles)
    const n = q === 'low' ? 3 : 6;
    this.pool = []; for (let i = 0; i < n; i++) { const l = new THREE.PointLight(0xffa040, 0, 30, 1.7); s.add(l); this.pool.push(l); }
    // forecourt canopy: fixed landmark lights
    this.canopyLights = [[204, -320], [220, -320], [212, -330]].map(([x, z]) => { const l = new THREE.PointLight(0xe8f0ff, 160, 34, 1.6); l.position.set(x, 5.0, z); s.add(l); return l; });
    this.flash = new THREE.PointLight(0xffd090, 0, 12, 2); s.add(this.flash); // muzzle flash
  }
  updateLights(dt, focus) {
    this.time += dt;
    this.skyMat.uniforms.uTime.value = this.time;
    this.sun.position.set(focus.x + this.sunDir.x * 120, this.sunDir.y * 120 + 30, focus.z + this.sunDir.z * 120);
    this.sun.target.position.set(focus.x, 0, focus.z);
    // assign pool every few frames
    this._poolT = (this._poolT || 0) - dt;
    if (this._poolT <= 0) {
      this._poolT = 0.25;
      const sorted = this.lamps.filter(l => l.on).map(l => [l, (l.x - focus.x) ** 2 + (l.z - focus.z) ** 2]).sort((a, b) => a[1] - b[1]);
      this.pool.forEach((pl, i) => { const e = sorted[i]; pl.userData.lamp = e ? e[0] : null; });
    }
    for (const pl of this.pool) {
      const L = pl.userData.lamp; if (!L) { pl.intensity = 0; continue; }
      pl.position.set(L.x, L.y, L.z); pl.color.setHex(L.color);
      let I = L.intensity; if (L.fire) I *= 0.75 + Math.sin(this.time * 13 + L.x) * 0.12 + Math.sin(this.time * 31) * 0.1;
      if (L.flicker) I *= (Math.sin(this.time * 47 + L.z) > 0.6 ? 0.15 : 1);
      pl.intensity = I; pl.distance = L.dist;
    }
    for (const f of this.fires) { f.mesh.scale.y = 1 + Math.sin(this.time * 9 + f.p) * 0.15; f.mesh.rotation.y += dt * 0.8; }
    this.flash.intensity = Math.max(0, this.flash.intensity - dt * 400);
    // gate animation
    if (this.gate) { const g = this.gate; g.t = clamp(g.t + (g.open ? dt : -dt) * 0.6, 0, 1); g.mesh.position.copy(g.closedPos).addScaledVector(g.slideDir, g.t * 7.2); }
    for (const b of this.beacons) b.material.emissiveIntensity = (Math.sin(this.time * 6 + b.userData.p) > 0 ? 6 : 0.3);
  }

  // ---------- roads ----------
  buildRoads() {
    this.beacons = []; this.fires = [];
    for (const rd of ROADS) {
      let obb;
      if (rd.rect) obb = new OBB2(rd.rect[0], rd.rect[1], rd.rect[2], rd.rect[3], 0, { id: rd.id, surface: rd.surface || 'asphalt' });
      else obb = segmentOBB(rd.a[0], rd.a[1], rd.b[0], rd.b[1], rd.w + 2 * rd.side, { id: rd.id, surface: rd.surface || 'asphalt' });
      obb.road = rd; this.drivables.push(obb);
    }
    this._roadsSoFar = this.drivables;
    this.drivables.forEach((obb, idx) => {
      const rd = obb.road;
      const y = 0.02 + idx * 0.004;
      if (rd.rect) {
        const t = this.M.concreteTex; const map = t.map.clone(), rough = t.rough.clone(); map.repeat.set(rd.rect[2] / 12, rd.rect[3] / 12); rough.repeat.copy(map.repeat); map.needsUpdate = rough.needsUpdate = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(rd.rect[2] * 2, rd.rect[3] * 2), new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: 0.75, metalness: 0, envMapIntensity: 0.9 }));
        m.rotation.x = -Math.PI / 2; m.position.set(rd.rect[0], y, rd.rect[1]); m.receiveShadow = true; this.scene.add(m);
        return;
      }
      const L = obb.hz * 2;
      const isGravel = rd.surface === 'gravel';
      const T = isGravel ? this.M.gravelTex : (rd.mark === 'motorway' ? this.M.mwayTex : this.M.roadTex);
      const map = T.map.clone(), rough = T.rough.clone(); const tile = isGravel ? 10 : rd.w * 1.6; map.repeat.set(isGravel ? rd.w / 10 : 1, L / tile); rough.repeat.copy(map.repeat); map.needsUpdate = rough.needsUpdate = true;
      const mat = new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: isGravel ? 0.95 : 0.55, metalness: 0, envMapIntensity: isGravel ? 0.4 : 1.25, color: isGravel ? 0xaaaaaa : 0xb8b8b8 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(rd.w, L), mat);
      m.rotation.x = -Math.PI / 2; m.rotation.z = obb.rot; // plane local Y -> world -Z, rotate about up
      m.position.set(obb.cx, y, obb.cz); m.receiveShadow = true; this.scene.add(m);
      // pavements/kerbs/walls are laid in short pieces and skipped where another road crosses
      const others = () => this.drivables.filter(o => o !== obb);
      const crosses = (lx, lz) => { const [x, z] = obb.world(lx, lz); return this._roadsSoFar.some(o => o !== obb && o.contains(x, z, 0.3)); };
      const STEP = 4;
      for (const sgn of [-1, 1]) {
        for (let s0 = -L / 2; s0 < L / 2 - 0.01; s0 += STEP) {
          const len = Math.min(STEP, L / 2 - s0), sc = s0 + len / 2;
          if (rd.side > 0) {
            const off = (rd.w / 2 + rd.side / 2) * sgn;
            if (crosses(off, sc) || crosses((rd.w / 2 + 0.3) * sgn, sc)) continue;
            const [px, pz] = obb.world(off, sc);
            const mm = new THREE.Matrix4().compose(new THREE.Vector3(px, 0.07, pz), new THREE.Quaternion().setFromAxisAngle(UP, obb.rot), new THREE.Vector3(rd.side, 0.14, len));
            this.addStatic(BOX_PAVE(rd.side, len), this.M.paving, mm, { shadow: false });
            const [kx, kz] = obb.world((rd.w / 2 + 0.1) * sgn, sc);
            this.box(0.2, 0.16, len, kx, 0.08, kz, this.M.kerb, obb.rot, { shadow: false });
          } else if (isGravel && rd.build) {
            if (crosses((rd.w / 2 + 0.4) * sgn, sc) || crosses((rd.w / 2 + 0.4) * sgn, sc - len / 2) || crosses((rd.w / 2 + 0.4) * sgn, sc + len / 2)) continue;
            const [px, pz] = obb.world((rd.w / 2 + 0.15) * sgn, sc);
            this.box(0.3, sgn > 0 ? 2.4 : 1.8, len, px, sgn > 0 ? 1.2 : 0.9, pz, sgn > 0 ? this.M.wall : this.M.fence, obb.rot);
          }
        }
      }
    });
    // yard shortcut: chain-link fences along both edges
    const ys = this.drivables.find(d => d.id === 'yard_shortcut');
    for (const sgn of [-1, 1]) { const [px, pz] = ys.world((3.6) * sgn, 2); this.box(0.08, 2.2, ys.hz * 2 - 20, px, 1.1, pz, this.M.fence, ys.rot); }
    // finish line paint
    for (const x of [260, 330]) { const w = x === 260 ? 10 : 7; for (let i = 0; i < w; i += 1) this.box(0.5, 0.03, 0.5, x - w / 2 + i + 0.25, 0.06, -782 + ((i % 2) ? 0.5 : 0), this.M.white, 0, { shadow: false }); }
  }

  ground() {
    const t = this.M.gravelTex.map.clone(); t.repeat.set(140, 140); t.needsUpdate = true;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ map: t, color: 0x3a3a34, roughness: 0.95 }));
    g.rotation.x = -Math.PI / 2; g.position.set(200, 0, -400); g.receiveShadow = true; this.scene.add(g);
  }

  // ---------- buildings ----------
  footprintClear(cx, cz, hx, hz, rot, m = 0.4) {
    const o = new OBB2(cx, cz, hx, hz, rot);
    for (let lx = -hx; lx <= hx + 0.01; lx += Math.max(1, hx / 4)) for (let lz = -hz; lz <= hz + 0.01; lz += Math.max(1, hz / 4)) {
      const [x, z] = o.world(lx, lz); if (this.drivables.some(d => d.contains(x, z, m))) return false;
    }
    return true;
  }
  addBuilding(cx, cz, w, d, h, rot, facade) {
    // w along local x (frontage), d along local z
    const parts = boxParts(w, h, d);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(cx, h / 2, cz), new THREE.Quaternion().setFromAxisAngle(UP, rot), new THREE.Vector3(1, 1, 1));
    this.addStatic(parts.walls, facade, m); this.addStatic(parts.roof, this.M.roof, m);
    if (rnd() < 0.5) this.box(w * 0.15, 1.6, 0.8, cx + R(-w / 3, w / 3) * Math.cos(rot), h + 0.8, cz - R(-w / 3, w / 3) * Math.sin(rot), this.M.wall, rot); // chimney
    this.obstacle(cx, cz, w / 2, d / 2, rot, { building: true });
  }
  buildBuildings() {
    const F = this.M.facades;
    for (const d of this.drivables) {
      const rd = d.road; if (!rd || !rd.build) continue;
      const half = d.hx; const L = d.hz * 2;
      for (const sgn of [-1, 1]) {
        let s = -L / 2;
        while (s < L / 2) {
          const ind = rd.build === 'industrial';
          const w = ind ? R(14, 24) : R(7, 12), dep = ind ? R(12, 20) : R(10, 15);
          const h = rd.build === 'shops' ? R(11, 17) : ind ? R(6, 9) : R(8.5, 13);
          const gap = ind ? 4 : (rd.build === 'industrial' ? 4 : 0.2);
          const off = half + (ind ? 3 : 0.7) + dep / 2;
          const [cx, cz] = d.world(off * sgn, s + w / 2);
          // building local x is frontage along the road (road local z); rotate accordingly
          const rot = d.rot + Math.PI / 2;
          if (this.footprintClear(cx, cz, w / 2, dep / 2, rot)) {
            const fac = rd.build === 'shops' ? F[4 + ((rnd() * 2) | 0)] : ind ? F[6] : F[(rnd() * 4) | 0];
            this.addBuilding(cx, cz, w, dep, h, rot, fac);
          }
          s += w + gap;
        }
      }
    }
    // safehouse at the start (warm lit windows) + blocks behind the motorway
    this.addBuilding(0, 22, 26, 14, 10, 0, F[1]);
    this.box(4, 3, 0.3, 0, 1.5, 14.9, this.M.darkMetal); // garage door
    for (let x = 170; x < 560; x += R(24, 40)) if (this.footprintClear(x, -846, 10, 7, 0)) this.addBuilding(x, -846, R(16, 26), 14, R(6, 10), 0, F[6]);
  }

  // ---------- forecourt ----------
  buildStation() {
    const M = this.M, cx = 212, cz = -324;
    // canopy
    this.box(34, 1.1, 20, cx, 5.8, cz, M.white);
    const brand = new THREE.MeshStandardMaterial({ map: TX.brandTexture(), emissive: 0xffffff, emissiveMap: TX.brandTexture(), emissiveIntensity: 0.9 });
    for (const sgn of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(34, 1.05), brand); m.position.set(cx, 5.8, cz + sgn * 10.02); m.rotation.y = sgn > 0 ? 0 : Math.PI; this.scene.add(m); }
    for (const sgn of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(20, 1.05), brand); m.position.set(cx + sgn * 17.02, 5.8, cz); m.rotation.y = sgn * Math.PI / 2; this.scene.add(m); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) this.box(2.6, 0.06, 1.2, cx - 12 + i * 8, 5.22, cz - 6 + j * 6, M.canopyLight, 0, { shadow: false });
    for (const [px, pz] of [[cx - 13, cz - 7], [cx + 13, cz - 7], [cx - 13, cz + 7], [cx + 13, cz + 7]]) { this.box(0.6, 5.3, 0.6, px, 2.65, pz, M.white); this.obstacle(px, pz, 0.32, 0.32); }
    this.canopy = new OBB2(cx, cz, 17, 10, 0);
    // pump islands (long axis N-S); bays either side
    this.pumps = [];
    [-12, 0, 12].forEach((dx, i) => {
      const x = cx + dx;
      this.box(1.5, 0.22, 6, x, 0.11, cz, M.kerb);
      this.box(0.9, 1.9, 0.6, x, 1.17, cz - 1.2, M.red); this.box(0.95, 0.5, 0.65, x, 2.2, cz - 1.2, M.white);
      this.box(0.9, 1.9, 0.6, x, 1.17, cz + 1.2, M.red); this.box(0.95, 0.5, 0.65, x, 2.2, cz + 1.2, M.white);
      this.box(0.06, 0.06, 1.2, x + 0.5, 1.4, cz - 1.2, M.black); this.box(0.06, 0.06, 1.2, x - 0.5, 1.4, cz + 1.2, M.black); // hoses
      this.box(0.25, 0.9, 0.25, x, 0.55, cz - 2.8, M.yellow); this.box(0.25, 0.9, 0.25, x, 0.55, cz + 2.8, M.yellow); // bollards
      this.obstacle(x, cz, 0.78, 3.0, 0, { pump: true });
      this.pumps.push({ id: 'pump' + (i + 1), x, z: cz - 1.2 }, { id: 'pump' + (i + 1) + 'b', x, z: cz + 1.2 });
    });
    // kiosk with rolling shutter (rescue)
    const kx = 205, kz = -346;
    const kiosk = boxParts(22, 4.2, 10); const km = new THREE.Matrix4().makeTranslation(kx, 2.1, kz);
    this.addStatic(kiosk.walls, M.facades[2], km); this.addStatic(kiosk.roof, M.roof, km);
    this.box(22.4, 0.9, 10.4, kx, 4.45, kz, M.red); // fascia
    const fasc = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.8), brand); fasc.position.set(kx, 4.45, kz + 5.22); this.scene.add(fasc);
    this.box(6, 2.6, 0.08, kx - 6.5, 1.5, kz + 5.03, M.kioskGlow, 0, { shadow: false }); this.box(6, 2.6, 0.08, kx + 6.5, 1.5, kz + 5.03, M.kioskGlow, 0, { shadow: false });
    this.obstacle(kx, kz, 11, 5);
    // shutter (dynamic mesh, raised on rescue)
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x7c8288, roughness: 0.45, metalness: 0.8 });
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.7, 0.1), shutterMat); shutter.position.set(kx, 1.35, kz + 5.1); shutter.castShadow = true; this.scene.add(shutter);
    for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 0.12), M.darkMetal); r.position.set(0, -1.3 + i * 0.22, 0.01); shutter.add(r); }
    this.shutter = { mesh: shutter, x: kx, z: kz + 6.2, open: false, baseY: 1.35 };
    // price pylon (fictional brand)
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.5), new THREE.MeshStandardMaterial({ map: TX.priceBoardTexture(), emissive: 0xffffff, emissiveMap: TX.priceBoardTexture(), emissiveIntensity: 0.6 }));
    pyl.position.set(174, 4, -310); pyl.castShadow = true; this.scene.add(pyl); this.box(0.4, 1.2, 0.4, 174, 0.6, -310, M.darkMetal); this.obstacle(174, -310, 1.0, 0.3);
    // perimeter low walls on west & north, props
    this.box(0.4, 0.9, 50, 168.2, 0.45, -331, M.wall); this.box(84, 0.9, 0.4, 210, 0.45, -355.8, M.wall);
    this.box(1.2, 1.1, 0.8, 222, 0.55, -340.5, M.white); this.obstacle(222, -340.5, 0.6, 0.4); // ice freezer
    this.box(0.8, 1.3, 0.6, 228, 0.65, -340.5, M.red); this.obstacle(228, -340.5, 0.4, 0.3); // air machine
    for (let i = 0; i < 6; i++) this.cyl(0.35, 1.0, 172 + i * 0.9, 0.5, -353, i % 2 ? M.darkMetal : M.olive);
    this.obstacle(174.3, -353, 2.8, 0.5);
    // abandoned hatchback blocking a bay (creates a blocked-door choice)
    const ab = buildSedanMesh(0x6b6f74, { wreck: true, rack: false }); ab.position.set(cx - 15.2, 0, cz + 1); ab.scale.set(0.95, 0.95, 0.88); this.scene.add(ab); this.shadowAll(ab);
    this.obstacle(cx - 15.2, cz + 1, 0.95, 2.1, 0);
    // directional sign on station road
    this.sign(['NORTHGATE FUEL', 'NEXT RIGHT ►'], -6.2, -250, 0, { bg: '#0d3f8a' });
    this.sign(['FUEL ◄', 'M-WAY via HIGH ST'], 150, -306.8, -Math.PI / 2, { bg: '#0d3f8a' });
  }

  sign(lines, x, z, rot, opts) {
    const mat = new THREE.MeshStandardMaterial({ map: TX.signTexture(lines, opts), roughness: 0.4, emissive: 0xffffff, emissiveMap: TX.signTexture(lines, opts), emissiveIntensity: 0.18 });
    const g = new THREE.Group(); const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), mat); board.position.y = 3.2; g.add(board);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), this.M.darkMetal); back.rotation.y = Math.PI; back.position.y = 3.2; g.add(back);
    for (const sx of [-1.3, 1.3]) { const p = new THREE.Mesh(BOX, this.M.darkMetal); p.scale.set(0.1, 2.4, 0.1); p.position.set(sx, 1.2, -0.02); g.add(p); }
    g.position.set(x, 0, z); g.rotation.y = rot; this.scene.add(g);
    for (const sx of [-1.3, 1.3]) this.obstacle(x + Math.cos(rot) * sx, z - Math.sin(rot) * sx, 0.12, 0.12);
    return g;
  }
  shadowAll(o) { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); }

  // ---------- props, wrecks, blockades ----------
  wreck(x, z, rot, color) {
    const w = buildSedanMesh(color ?? [0x5a1e1e, 0x2d3a2a, 0x6b6f74, 0x2a2a2e, 0x7a6a4a, 0x1d2a3a][(rnd() * 6) | 0], { wreck: true, rack: false });
    w.position.set(x, 0, z); w.rotation.y = rot; this.scene.add(w); this.shadowAll(w);
    this.obstacle(x, z, 0.95, 2.35, rot, { wreck: true });
    return w;
  }
  bus(x, z, rot, onSide = false) {
    const g = new THREE.Group();
    const red = this.M.red, glass = new THREE.MeshStandardMaterial({ color: 0x0c1015, roughness: 0.2, metalness: 0.4 });
    const add = (w, h, d, px, py, pz, m) => { const b = new THREE.Mesh(BOX, m); b.scale.set(w, h, d); b.position.set(px, py, pz); b.castShadow = b.receiveShadow = true; g.add(b); };
    add(2.5, 4.2, 11, 0, 2.4, 0, red); add(2.56, 0.9, 10.4, 0, 1.9, 0.1, glass); add(2.56, 0.9, 10.4, 0, 3.6, 0.1, glass); add(2.6, 0.5, 11.1, 0, 0.4, 0, this.M.black);
    for (const z2 of [-3.5, 3.5]) for (const x2 of [-1.15, 1.15]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), this.M.black); wh.rotation.z = Math.PI / 2; wh.position.set(x2, 0.5, z2); g.add(wh); }
    if (onSide) { g.rotation.z = Math.PI / 2; g.position.y = 1.25; }
    const outer = new THREE.Group(); outer.add(g); outer.position.set(x, 0, z); outer.rotation.y = rot; this.scene.add(outer);
    this.obstacle(x, z, onSide ? 2.4 : 1.3, 5.6, rot, { bus: true });
  }
  barrier(x, z, rot, len = 3) {
    this.box(len, 0.9, 0.5, x, 0.45, z, this.M.hazard, rot); this.obstacle(x, z, len / 2, 0.3, rot);
  }
  buildProps() {
    // blocked junction on Carver Road (north): overturned bus + police barriers
    this.bus(1, -315, Math.PI / 2 + 0.15, true);
    this.barrier(-4, -309, 0.1, 3.5); this.barrier(5, -308.5, -0.2, 3.5);
    this.policeCar = this.wreck(-6, -320, 0.6, 0x1a1a1f);
    this.addBeacon(-6, 1.6, -320);
    // safehouse street
    this.wreck(-6.2, -40, 0.05); this.wreck(6.4, -86, Math.PI + 0.1); this.wreck(3.0, -138, 0.5); this.wreck(-6, -175, 0.02);
    this.wreck(-2.5, -228, -0.9); this.wreck(6.3, -262, Math.PI);
    // station road
    this.wreck(90, -296, Math.PI / 2 + 0.2); this.wreck(118, -304.5, -Math.PI / 2); this.wreck(310, -297, Math.PI / 2 - 0.4); this.wreck(372, -303.5, Math.PI / 2);
    this.barrier(447, -300, Math.PI / 2, 9);
    // HIGH STREET — crowded, debris, a burning bus
    const hs = [[256, -380, 0.4], [265.5, -415, Math.PI - 0.1], [257, -455, 1.2], [264, -500, -0.5], [252.5, -530, 0.05], [259, -585, 1.45], [266, -615, 0.1], [253, -655, -0.3], [264.5, -735, 0.25]];
    hs.forEach(([x, z, r]) => this.wreck(x, z, r));
    this.bus(264.5, -690, 0.08, false);
    this.addFire(264.5, -690, 4.8);
    this.addFire(257, -455, 1.6);
    for (let i = 0; i < 26; i++) { const x = 260 + R(-7.5, 7.5), z = R(-340, -770); this.box(R(0.4, 1), R(0.2, 0.5), R(0.4, 1), x, 0.15, z, rnd() < 0.5 ? this.M.black : this.M.olive, R(0, 3), { shadow: false }); }
    // service lane: skips narrowing the turn, pallets
    this.box(1.8, 1.4, 3.6, 437.2, 0.7, -560, this.M.yellow, 0); this.obstacle(437.2, -560, 0.9, 1.8);
    this.box(3.4, 1.3, 1.8, 336, 0.65, -624.5, this.M.yellow, 0); this.obstacle(336, -624.5, 1.7, 0.9);
    this.wreck(332, -700, 0.05, 0x3a2f22);
    // yard shortcut gate (opened by the kiosk rescue)
    const ys = this.drivables.find(d => d.id === 'yard_shortcut');
    const [gx, gz] = ys.world(0, -ys.hz + 16);
    const gate = new THREE.Group(); const frame = new THREE.Mesh(BOX, this.M.fence); frame.scale.set(7.2, 2.2, 0.12); frame.position.y = 1.1; gate.add(frame);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), new THREE.MeshStandardMaterial({ map: TX.signTexture(['PRIVATE YARD', 'NO ENTRY'], { bg: '#c22', w: 512, h: 192 }) })); plate.position.set(0, 1.3, 0.08); gate.add(plate);
    gate.position.set(gx, 0, gz); gate.rotation.y = ys.rot + Math.PI; this.scene.add(gate); this.shadowAll(gate);
    const slide = new THREE.Vector3(Math.cos(ys.rot), 0, -Math.sin(ys.rot));
    this.gate = { mesh: gate, closedPos: gate.position.clone(), slideDir: slide, open: false, t: 0, obb: this.obstacle(gx, gz, 3.6, 0.2, ys.rot, { gate: true }) };
    this.sign(['SERVICE LANE ◄', 'narrow · loose gravel'], 433, -293.4, -Math.PI / 2, { bg: '#5a4a10' });
    this.sign(['HIGH STREET ▲', 'M-WAY 0.5 mi'], 251.6, -310, 0, { bg: '#0a5b2c' });
    // phone box & bus stop flavour
    this.box(1.0, 2.5, 1.0, -7, 1.25, -110, this.M.red); this.obstacle(-7, -110, 0.5, 0.5);
    this.box(1.0, 2.5, 1.0, 268, 1.25, -470, this.M.red); this.obstacle(268, -470, 0.5, 0.5);
  }
  addBeacon(x, y, z) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.3), this.M.blueLight.clone()); b.position.set(x, y, z); b.userData.p = rnd() * 6; this.scene.add(b); this.beacons.push(b);
    this.lamps.push({ x, y: y + 1, z, color: 0x3a6bff, intensity: 40, dist: 18, on: true, flicker: true });
  }
  addFire(x, z, y = 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.6, 8, 1, true), this.M.fire); cone.position.set(x, y + 1, z); this.scene.add(cone);
    const cone2 = cone.clone(); cone2.scale.set(0.6, 0.8, 0.6); cone2.position.x += 0.8; this.scene.add(cone2);
    this.fires.push({ mesh: cone, p: rnd() * 6, x, z, y }, { mesh: cone2, p: rnd() * 6, x, z, y });
    this.lamps.push({ x, y: y + 2, z, color: 0xff7a2a, intensity: 140, dist: 30, on: true, fire: true });
  }

  buildCheckpoint() {
    // military motorway checkpoint just past the finish threshold
    for (const x of [252, 268, 324, 336]) { this.box(1.2, 1.1, 2.4, x, 0.55, -790, this.M.sand); this.obstacle(x, -790, 0.6, 1.2); }
    for (const [x, z] of [[230, -808], [290, -806], [360, -808], [420, -810]]) { this.box(2.6, 2.8, 7, x, 1.6, z, this.M.olive, Math.PI / 2); }
    for (const x of [248, 272, 320, 340]) {
      this.box(0.3, 7, 0.3, x, 3.5, -792, this.M.darkMetal);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.4), this.M.canopyLight); head.position.set(x, 7, -792); head.rotation.x = 0.5; this.scene.add(head);
      this.lamps.push({ x, y: 6.5, z: -790, color: 0xeaf2ff, intensity: 220, dist: 40, on: true });
    }
    this.sign(['MOTORWAY CHECKPOINT', 'EVACUATION — KEEP MOVING'], 238, -786, 0, { bg: '#2a3a20' });
    // central reservation barrier
    this.box(380, 0.8, 0.4, 350, 0.4, -814, this.M.metal, 0, { shadow: false });
  }

  buildSkyline() {
    // distant silhouettes (no fog so they read against the dusk sky)
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a1c24, fog: false });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffb060, fog: false });
    const centre = new THREE.Vector2(200, -400);
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2 + R(-0.02, 0.02), r = R(560, 760);
      const x = centre.x + Math.cos(a) * r, z = centre.y + Math.sin(a) * r, h = R(20, 70) * (rnd() < 0.1 ? 2.2 : 1), w = R(20, 50);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion().setFromAxisAngle(UP, -a), new THREE.Vector3(w, h, 20));
      this.addStatic(BOX, mat, m, { shadow: false, receive: false });
      for (let k = 0; k < 3; k++) if (rnd() < 0.5) { const mw = new THREE.Matrix4().compose(new THREE.Vector3(x - Math.cos(a) * 10.5, R(4, h - 2), z - Math.sin(a) * 10.5), new THREE.Quaternion().setFromAxisAngle(UP, -a), new THREE.Vector3(1.2, 1.0, R(1, 4))); this.addStatic(BOX, winMat, mw, { shadow: false, receive: false }); }
    }
    // clock tower silhouette to the north-west (generic, not a replica)
    const tx = -250, tz = -700; const m1 = new THREE.Matrix4().compose(new THREE.Vector3(tx, 50, tz), new THREE.Quaternion(), new THREE.Vector3(14, 100, 14)); this.addStatic(BOX, mat, m1, { shadow: false, receive: false });
    const clock = new THREE.Mesh(new THREE.CircleGeometry(4, 20), new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false })); clock.position.set(tx + 7.1, 86, tz); clock.rotation.y = Math.PI / 2; this.scene.add(clock);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(9, 26, 4), mat); spire.position.set(tx, 113, tz); spire.rotation.y = Math.PI / 4; this.scene.add(spire);
    // smoke columns
    const smokeTex = smokeTexture();
    this.smokes = [];
    for (const [x, z, s] of [[-180, -900, 1.3], [640, -560, 1], [420, -1100, 1.6], [100, 380, 0.9]]) {
      for (let k = 0; k < 4; k++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0x2a2626, transparent: true, opacity: 0.75, fog: false, depthWrite: false }));
        sp.position.set(x + k * 12, 40 + k * 55 * s, z); sp.scale.set(90 * s + k * 30, 110 * s + k * 30, 1); this.scene.add(sp); this.smokes.push(sp);
      }
      this.lamps.push({ x, y: 10, z, color: 0xff6a20, intensity: 0, dist: 1, on: false });
    }
  }

  buildLamps() {
    for (const d of this.drivables) {
      const rd = d.road; if (!rd || rd.rect || rd.id === 'yard_shortcut') continue;
      const L = d.hz * 2, step = rd.id === 'motorway' ? 40 : 30;
      let k = 0;
      for (let s = -L / 2 + 8; s < L / 2 - 4; s += step, k++) {
        const sgn = k % 2 ? 1 : -1; const off = rd.side > 0 ? d.hx - 0.6 : d.hx + 0.3;
        const [x, z] = d.world(off * sgn, s);
        if (this.obstacles.some(o => o.contains(x, z, 0.6))) continue;
        const dead = rnd() < 0.25; const flick = !dead && rnd() < 0.12;
        this.cyl(0.09, 7, x, 3.5, z, this.M.darkMetal);
        const [hx, hz] = d.world((off - 1.1) * sgn, s);
        this.box(1.4, 0.12, 0.3, (x + hx) / 2, 7, (z + hz) / 2, this.M.darkMetal, d.rot + Math.PI / 2);
        this.box(0.6, 0.14, 0.32, hx, 6.9, hz, dead ? this.M.lampDead : this.M.lampHead, d.rot + Math.PI / 2, { shadow: false });
        this.obstacle(x, z, 0.15, 0.15);
        this.lamps.push({ x: hx, y: 6.6, z: hz, color: 0xffa040, intensity: 90, dist: 26, on: !dead, flicker: flick });
      }
    }
  }

  // ---------- queries ----------
  isWalkable(x, z, m = 0) { for (const d of this.drivables) if (d.contains(x, z, m)) return true; return false; }
  surfaceAt(x, z) {
    let best = null;
    for (const d of this.drivables) if (d.contains(x, z)) { if (d.surface !== 'gravel') return d.surface; best = d.surface; }
    return best || 'offroad';
  }
  roadAt(x, z) { for (const d of this.drivables) if (d.contains(x, z)) return d.id; return null; }
  nearObstacles(x, z, r) { return this.obstacles.filter(o => !o.disabled && Math.abs(o.cx - x) < r + o.r && Math.abs(o.cz - z) < r + o.r); }
  // penetration of a point into walls/obstacles: [nx, nz, depth] or null
  penetration(x, z) {
    for (const o of this.obstacles) {
      if (o.disabled) continue;
      if (Math.abs(o.cx - x) > o.r || Math.abs(o.cz - z) > o.r) continue;
      if (o.contains(x, z)) return o.pushCircle(x, z, 0.0) || [0, 0, 0];
    }
    if (!this.isWalkable(x, z)) {
      for (let r = 0.2; r <= 3; r += 0.2) for (let a = 0; a < 8; a++) {
        const ang = a * Math.PI / 4, nx = Math.cos(ang), nz = Math.sin(ang);
        if (this.isWalkable(x + nx * r, z + nz * r)) return [nx, nz, r];
      }
      return [0, 0, 0];
    }
    return null;
  }
  penetrationAny(pts) { return pts.some(([x, z]) => { const p = this.penetration(x, z); return p && p[2] > 0.05; }); }
  // circle mover for characters: slides along walls
  moveCircle(x, z, dx, dz, r, extra = []) {
    let nx = x + dx, nz = z + dz;
    if (!this.isWalkable(nx, nz, -r * 0.5)) { if (this.isWalkable(x + dx, z, -r * 0.5)) nz = z; else if (this.isWalkable(x, z + dz, -r * 0.5)) nx = x; else { nx = x; nz = z; } }
    for (const o of [...this.nearObstacles(nx, nz, 2), ...extra]) {
      if (o.disabled) continue;
      const p = o.pushCircle(nx, nz, r); if (p) { nx += p[0] * p[2]; nz += p[1] * p[2]; }
    }
    if (!this.isWalkable(nx, nz, -r * 0.3)) { nx = x; nz = z; }
    return [nx, nz];
  }
  underCanopy(x, z) { return this.canopy && this.canopy.contains(x, z); }
  lineClear(ax, az, bx, bz) { // ground-level visibility vs buildings (for spawn occlusion)
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 3);
    for (let i = 1; i < steps; i++) { const t = i / steps, x = ax + (bx - ax) * t, z = az + (bz - az) * t; if (this.obstacles.some(o => o.building && o.contains(x, z))) return false; }
    return true;
  }
  setGate(open) { if (!this.gate) return; this.gate.open = open; this.gate.obb.disabled = open; if (!open) this.gate.t = 0; else this.gate.t = Math.max(this.gate.t, 0); }
  setShutter(open) { if (!this.shutter) return; this.shutter.open = open; this.shutter.mesh.position.y = open ? 3.6 : this.shutter.baseY; this.shutter.mesh.scale.y = open ? 0.25 : 1; }
}

// ---------- shared geometry helpers ----------
const UP = new THREE.Vector3(0, 1, 0);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 8);
const CYL16 = new THREE.CylinderGeometry(1, 1, 1, 16);
const paveCache = new Map();
function BOX_PAVE(w, L) { // unit box whose UVs tile the paving texture per metre
  const key = w + ':' + Math.round(L);
  if (paveCache.has(key)) return paveCache.get(key);
  const g = new THREE.BoxGeometry(1, 1, 1); const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2, uv.getY(i) * L / 2);
  paveCache.set(key, g); return g;
}
// box split into walls (facade texture, UVs in metres/tile) and roof
function boxParts(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const idx = g.index.array;
  // face order: +x, -x, +y, -y, +z, -z ; 4 verts each
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / 8, uv.getY(i) * dims[f][1] / 12); }
  const pick = faces => { const ng = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv']) ng.setAttribute(k, g.attributes[k]); const ii = []; for (const f of faces) for (let k = 0; k < 6; k++) ii.push(idx[f * 6 + k]); ng.setIndex(ii); return ng; };
  return { walls: pick([0, 1, 4, 5]), roof: pick([2]) };
}
function smokeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 30; i++) { const x = 64 + (Math.random() - 0.5) * 50, y = 64 + (Math.random() - 0.5) * 50, r = 20 + Math.random() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tick() { return new Promise(r => setTimeout(r, 0)); }
