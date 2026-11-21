// Prepare generated GLBs: compress textures, decimate, and strip clip-only files down to animation data
import fs from 'fs'; import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress, prune, dedup, simplify, weld } from '@gltf-transform/functions'; import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
const SRC='/home/claude/zombieeu/assets/gen', OUT='/home/claude/game/dist/assets/models';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const tex = (size, q=80) => textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality: q });
const simp = (ratio) => simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.004 });
async function full(src, out, size, ratio) { if (!fs.existsSync(`${SRC}/${src}`)) return console.log('missing', src);
  const d = await io.read(`${SRC}/${src}`); const t = [dedup()]; if (ratio < 1) t.push(weld(), simp(ratio)); t.push(prune(), tex(size)); await d.transform(...t); await io.write(`${OUT}/${out}`, d); console.log(out, (fs.statSync(`${OUT}/${out}`).size/1e6).toFixed(2)+'MB'); }
async function clip(src, out) { if (!fs.existsSync(`${SRC}/${src}`)) return console.log('missing', src);
  const d = await io.read(`${SRC}/${src}`); const r = d.getRoot();
  for (const n of r.listNodes()) { if (n.getMesh()) n.setMesh(null); if (n.getSkin()) n.setSkin(null); }
  for (const m of r.listMeshes()) m.dispose(); for (const s of r.listSkins()) s.dispose(); for (const m of r.listMaterials()) m.dispose(); for (const t of r.listTextures()) t.dispose();
  await d.transform(prune({ keepLeaves: true })); await io.write(`${OUT}/${out}`, d); console.log(out, (fs.statSync(`${OUT}/${out}`).size/1e3).toFixed(0)+'KB'); }
const what = process.argv[2] || 'all';
if (what==='all'||what==='car') { await full('car.glb','car.glb',1024,1); await full('car.glb','car_lod.glb',256,.22); }
if (what==='all'||what==='alex') { await full('alex_run.glb','alex.glb',1024,1); for (const c of ['walk','idle','swing']) await clip(`alex_${c}.glb`,`alex_${c}.glb`); }
if (what==='all'||what==='zombie') { await full('zombie_walk.glb','zombie.glb',1024,.55); for (const c of ['run','attack','die','scream']) await clip(`zombie_${c}.glb`,`zombie_${c}.glb`); }
