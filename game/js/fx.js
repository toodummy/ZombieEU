// Rain, ground splashes, particle pools and the post-processing chain.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const CANOPY = 'uniform vec4 uCanopy; bool underCanopy(vec3 p){ return p.x > uCanopy.x && p.x < uCanopy.y && p.z > uCanopy.z && p.z < uCanopy.w && p.y < 5.3; }';

export class Rain {
  constructor(scene, count, canopy) {
    const pos = new Float32Array(count * 6), end = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) { const x = Math.random(), y = Math.random(), z = Math.random(); pos.set([x, y, z, x, y, z], i * 6); end[i * 2 + 1] = 1; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    this.uniforms = { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(64, 30, 64) }, uWind: { value: new THREE.Vector2(2.5, 1.2) }, uSpeed: { value: 17 }, uCanopy: { value: canopy } };
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: this.uniforms,
      vertexShader: `attribute float aEnd; uniform float uTime; uniform vec3 uCam; uniform vec3 uBox; uniform vec2 uWind; uniform float uSpeed; varying float vA; ${CANOPY}
        void main(){ float t = uTime; vec3 b = position * uBox;
          vec3 p; p.x = uCam.x + mod(b.x - uCam.x + uWind.x * t, uBox.x) - uBox.x*0.5;
          p.z = uCam.z + mod(b.z - uCam.z + uWind.y * t, uBox.z) - uBox.z*0.5;
          p.y = mod(b.y - t * uSpeed, uBox.y) + max(uCam.y - uBox.y*0.5, -2.0);
          vec3 vel = vec3(uWind.x, -uSpeed, uWind.y);
          p -= vel * 0.032 * aEnd;
          vA = underCanopy(p) ? 0.0 : 1.0 - smoothstep(10.0, 32.0, distance(p, uCam));
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(0.72,0.78,0.88, 0.32*vA); }',
    });
    this.mesh = new THREE.LineSegments(g, m); this.mesh.frustumCulled = false; scene.add(this.mesh);
    // splashes
    const n = Math.floor(count / 8); const sp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) sp.set([Math.random(), Math.random(), Math.random()], i * 3);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.splash = new THREE.Points(sg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: this.uniforms,
      vertexShader: `uniform float uTime; uniform vec3 uCam; varying float vC; varying float vA; ${CANOPY}
        void main(){ float S = 34.0; vec3 b = position;
          float cyc = fract(uTime * 1.7 + b.y * 7.0); float cell = floor(uTime * 1.7 + b.y * 7.0);
          vec2 o = fract(vec2(b.x, b.z) + vec2(sin(cell*12.9898+b.x*78.0), cos(cell*78.233+b.z*37.0)) * 0.37);
          vec3 p = vec3(uCam.x + mod(o.x*S - uCam.x, S) - S*0.5, 0.06, uCam.z + mod(o.y*S - uCam.z, S) - S*0.5);
          vC = cyc; vA = underCanopy(p) ? 0.0 : (1.0 - smoothstep(6.0, 17.0, distance(p.xz, uCam.xz)));
          vec4 mv = viewMatrix * vec4(p, 1.0); gl_PointSize = clamp((1.5 + cyc * 7.0) * (14.0 / -mv.z), 1.0, 28.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float ring = smoothstep(0.5, 0.42, d) * smoothstep(0.28, 0.4, d); gl_FragColor = vec4(vec3(0.6,0.65,0.75) * ring * (1.0 - vC) * 0.22 * vA, 1.0); }`,
    }));
    this.splash.frustumCulled = false; scene.add(this.splash);
  }
  update(dt, cam) { this.uniforms.uTime.value += dt; this.uniforms.uCam.value.copy(cam); }
}

// CPU particle pool rendered as point sprites
export class Particles {
  constructor(scene, max = 1500, additive = false) {
    this.max = max; this.n = 0;
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3); this.c = new Float32Array(max * 3); this.s = new Float32Array(max); this.a = new Float32Array(max); this.life = new Float32Array(max); this.maxLife = new Float32Array(max); this.grow = new Float32Array(max); this.grav = new Float32Array(max); this.drag = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.c, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.s, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.a, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, vertexColors: true,
      vertexShader: 'attribute float size; attribute float alpha; varying vec3 vC; varying float vA; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * (420.0 / -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if (d > 0.5) discard; float f = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC, vA * f); }',
    });
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; scene.add(this.points);
  }
  emit(x, y, z, o = {}) {
    const n = o.count || 1;
    for (let k = 0; k < n; k++) {
      if (this.n >= this.max) return;
      const i = this.n++; const sp = o.spread ?? 0.5, vs = o.speed ?? 1;
      this.p[i * 3] = x + (Math.random() - 0.5) * (o.jitter ?? 0.2); this.p[i * 3 + 1] = y + (Math.random() - 0.5) * (o.jitter ?? 0.2); this.p[i * 3 + 2] = z + (Math.random() - 0.5) * (o.jitter ?? 0.2);
      const d = o.dir || [0, 1, 0];
      this.v[i * 3] = (d[0] + (Math.random() - 0.5) * sp * 2) * vs; this.v[i * 3 + 1] = (d[1] + (Math.random() - 0.5) * sp * 2) * vs; this.v[i * 3 + 2] = (d[2] + (Math.random() - 0.5) * sp * 2) * vs;
      const col = o.color || [1, 1, 1]; const cv = o.colorVar ?? 0.1;
      this.c[i * 3] = col[0] * (1 - cv + Math.random() * cv); this.c[i * 3 + 1] = col[1] * (1 - cv + Math.random() * cv); this.c[i * 3 + 2] = col[2] * (1 - cv + Math.random() * cv);
      this.s[i] = (o.size ?? 0.3) * (0.7 + Math.random() * 0.6); this.life[i] = this.maxLife[i] = (o.life ?? 1) * (0.7 + Math.random() * 0.6);
      this.grow[i] = o.grow ?? 0; this.grav[i] = o.gravity ?? 0; this.drag[i] = o.drag ?? 0.5; this.a[i] = o.alpha ?? 1; this.baseA = this.baseA || new Float32Array(this.max); this.baseA[i] = o.alpha ?? 1;
    }
  }
  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.swap(i, --this.n); continue; }
      const dr = Math.exp(-this.drag[i] * dt);
      this.v[i * 3] *= dr; this.v[i * 3 + 1] = this.v[i * 3 + 1] * dr - this.grav[i] * dt; this.v[i * 3 + 2] *= dr;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      if (this.p[i * 3 + 1] < 0.02) { this.p[i * 3 + 1] = 0.02; this.v[i * 3 + 1] *= -0.2; }
      this.s[i] += this.grow[i] * dt;
      const t = this.life[i] / this.maxLife[i]; this.a[i] = this.baseA[i] * Math.min(1, t * 2.5);
      i++;
    }
    this.geo.setDrawRange(0, this.n);
    for (const k of ['position', 'color', 'size', 'alpha']) this.geo.attributes[k].needsUpdate = true;
  }
  swap(i, j) {
    for (const arr of [this.p, this.v, this.c]) { arr[i * 3] = arr[j * 3]; arr[i * 3 + 1] = arr[j * 3 + 1]; arr[i * 3 + 2] = arr[j * 3 + 2]; }
    for (const arr of [this.s, this.a, this.life, this.maxLife, this.grow, this.grav, this.drag, this.baseA]) arr[i] = arr[j];
  }
  clear() { this.n = 0; this.geo.setDrawRange(0, 0); }
}

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uDamage: { value: 0 }, uThreat: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uDamage; uniform float uThreat; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float r = dot(c, c);
      float ca = 0.0015 + uDamage * 0.004;
      vec3 col = vec3(texture2D(tDiffuse, vUv + c*ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - c*ca).b);
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(col, col * vec3(0.92,1.0,1.08), smoothstep(0.5, 0.0, l) * 0.35);   // cool shadows
      col = mix(col, col * vec3(1.06,1.0,0.9), smoothstep(0.35, 1.0, l) * 0.3);    // warm highlights
      col = mix(vec3(l), col, 0.88);                                               // slight desaturation
      col *= 1.0 - r * (1.05 + uThreat * 0.6);                                     // vignette
      col = mix(col, vec3(0.45,0.02,0.02), clamp(uDamage,0.0,1.0) * smoothstep(0.08, 0.5, r));
      col += (h(vUv * 800.0 + uTime) - 0.5) * 0.035;                               // grain
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class PostFX {
  constructor(renderer, scene, camera, quality) {
    this.renderer = renderer; this.enabled = quality !== 'low';
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    const size = renderer.getSize(new THREE.Vector2());
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.55, 0.55, 0.88);
    this.bloom.enabled = quality === 'high' || quality === 'medium';
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader); this.composer.addPass(this.grade);
  }
  setSize(w, h) { this.composer.setSize(w, h); }
  render(dt, damage, threat) {
    if (!this.enabled) return false;
    this.grade.uniforms.uTime.value += dt; this.grade.uniforms.uDamage.value = damage; this.grade.uniforms.uThreat.value = threat;
    this.composer.render(dt); return true;
  }
}
