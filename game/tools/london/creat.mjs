import fs from 'fs';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dedup,prune,textureCompress} from '@gltf-transform/functions';import sharp from 'sharp';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const [,,i,o,res]=process.argv;const d=await io.read(i);
await d.transform(dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[+res||1024,+res||1024],quality:82}));await io.write(o,d);console.log(o.split('/').pop(),(fs.statSync(o).size/1e3|0)+'KB');
