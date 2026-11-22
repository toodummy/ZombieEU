// Convert fetched CC0 textures/props into web-ready files under dist/assets
import fs from 'fs'; import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress, prune, dedup, weld, simplify } from '@gltf-transform/functions'; import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
const SRC='/home/claude/zombieeu/assets', OUT='/home/claude/game/dist/assets';
const only = process.argv[2];
if (!only || only === 'tex') for (const f of fs.readdirSync(SRC+'/tex')) {
  const mm = f.replace(/\.\w+$/,'').match(/^(.+?)_(diffuse|nor_gl|rough)$/); if (!mm) continue; const [, name, map] = mm; const isN = map.startsWith('nor');
  const big = name.endsWith('2k'); const size = map==='rough'?(big?1024:512):(big?2048:1024);
  const out = `${OUT}/textures/${name}_${isN?'n':map==='rough'?'r':'d'}.webp`; if (fs.existsSync(out)) continue;
  await sharp(SRC+'/tex/'+f).resize(size,size).webp({quality:isN?88:80}).toFile(out); console.log('tex', out.split('/').pop());
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const tris = d => d.getRoot().listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((s, p) => s + (p.getIndices()?.getCount() || p.getAttribute('POSITION').getCount()) / 3, 0), 0);
if (!only || only === 'models') for (const m of fs.readdirSync(SRC+'/models')) {
  const out = `${OUT}/models/${m}.glb`; if (fs.existsSync(out)) continue;
  const doc = await io.read(`${SRC}/models/${m}/${m}.gltf`); const t0 = tris(doc); const cap = m.includes('facade') || m.includes('fire_escape') ? 40000 : 12000;
  const tr = [dedup()]; if (t0 > cap) tr.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: cap / t0, error: 0.02 }));
  tr.push(prune(), textureCompress({encoder: sharp, targetFormat:'webp', resize: m.includes('facade')?[1024,1024]:[512,512], quality:80}));
  await doc.transform(...tr); await io.write(out, doc); console.log(m, t0|0, '->', tris(doc)|0, (fs.statSync(out).size/1e6).toFixed(2)+'MB');
}
