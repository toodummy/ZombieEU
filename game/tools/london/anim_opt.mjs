import fs from 'fs';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {resample,prune,dedup} from '@gltf-transform/functions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const [,,i,o,keep]=process.argv;const d=await io.read(i);const K=keep?keep.split(','):null;
for(const a of d.getRoot().listAnimations())if(K&&!K.includes(a.getName()))a.dispose();
await d.transform(resample({tolerance:1e-3}),dedup(),prune());await io.write(o,d);console.log(o.split('/').pop(),(fs.statSync(o).size/1e3|0)+'KB',d.getRoot().listAnimations().map(a=>a.getName()).join(','));
