import fs from 'fs';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {prune,compactPrimitive} from '@gltf-transform/functions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const [,,i,o]=process.argv;const d=await io.read(i);
for(const t of d.getRoot().listTextures())t.dispose();for(const m of d.getRoot().listMeshes())for(const p of m.listPrimitives())compactPrimitive(p);await d.transform(prune());await io.write(o,d);console.log(o,(fs.statSync(o).size/1e3|0)+'KB');
