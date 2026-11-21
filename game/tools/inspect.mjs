import { NodeIO, getBounds } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const d = await io.read(f); const r = d.getRoot(); const b = getBounds(r.listScenes()[0]);
  const tris = r.listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((s, p) => s + (p.getIndices()?.getCount() || p.getAttribute('POSITION').getCount()) / 3, 0), 0);
  console.log(f, 'min', b.min.map(v => v.toFixed(2)), 'max', b.max.map(v => v.toFixed(2)), 'tris', tris | 0);
  console.log(' textures', r.listTextures().map(t => `${t.getMimeType()} ${t.getSize()?.join('x')} ${(t.getImage().byteLength/1e6).toFixed(1)}MB`).join(' | '));
  console.log(' materials', r.listMaterials().map(m => m.getName()+':'+[m.getBaseColorTexture(),m.getNormalTexture(),m.getMetallicRoughnessTexture()].map(x=>x?1:0).join('')).join(' '));
  const skins = r.listSkins(); if (skins.length) console.log(' skin joints', skins[0].listJoints().length, skins[0].listJoints().slice(0, 30).map(j => j.getName()).join(','));
  for (const a of r.listAnimations()) console.log(' anim', a.getName(), a.listChannels().length, 'ch', a.listChannels().slice(0,3).map(c=>c.getTargetNode()?.getName()+'.'+c.getTargetPath()).join(','));
  console.log(' nodes', r.listNodes().slice(0,8).map(n=>n.getName()+(n.getMesh()?'[M]':'')+JSON.stringify(n.getRotation().map(v=>+v.toFixed(2)))).join(' '));
}
