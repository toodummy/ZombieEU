import fs from 'fs';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dedup,prune,textureCompress,weld,quantize} from '@gltf-transform/functions';import sharp from 'sharp';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const d=await io.read(process.argv[2]);
await d.transform(dedup(),prune(),quantize(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:80}));
await io.write(process.argv[3],d);console.log((fs.statSync(process.argv[3]).size/1e6).toFixed(2)+'MB',d.getRoot().listTextures().length,'textures',d.getRoot().listMaterials().length,'materials');
