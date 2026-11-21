// Convert fetched CC0 textures/props + SFX into web-ready files under dist/assets
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress, prune, dedup, weld } from '@gltf-transform/functions';
const SRC='/home/claude/zombieeu/assets', OUT='/home/claude/game/dist/assets';
for (const f of fs.readdirSync(SRC+'/tex')) {
  const [, name, map] = f.replace(/\.\w+$/,'').match(/^(.+?)_(diffuse|nor_gl|rough)$/); const isN = map.startsWith('nor');
  const size = map==='rough'?512:1024;
  await sharp(SRC+'/tex/'+f).resize(size,size).webp({quality:isN?88:78}).toFile(`${OUT}/textures/${name}_${isN?'n':map==='rough'?'r':'d'}.webp`);
}
fs.copyFileSync(SRC+'/hdri/night.hdr', OUT+'/night.hdr');
for (const f of fs.readdirSync(SRC+'/sfx')) fs.copyFileSync(SRC+'/sfx/'+f, OUT+'/sfx/'+f);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const m of fs.readdirSync(SRC+'/models')) {
  const doc = await io.read(`${SRC}/models/${m}/${m}.gltf`);
  await doc.transform(dedup(), prune(), textureCompress({encoder: sharp, targetFormat:'webp', resize:[512,512], quality:80}));
  await io.write(`${OUT}/models/${m}.glb`, doc);
}
console.log('ok');
