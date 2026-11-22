set -e
cd /home/claude/game
cp v31_backup.html dist/index.html && python3 patch_london.py && python3 patch_mission.py && python3 patch_v5.py
cd dist && python3 - <<'PY'
s=open('index.html').read()
s=s.replace("window.__G={snap(){","window.__G={WP,get LS(){return LASTSHOT},WB,worldShot,explode,wd:()=>WD,TREECH,AU,AC,BRK,groundH,breakProp,DEBRIS,plEnt,PLB,get camYaw(){return camYaw},set camYaw(v){camYaw=v},scene,camera,THREE,rt(s,lat=0){const p=routeAt(s);return[p.x+p.nx*lat,p.z+p.nz*lat,p.h];},ms(){return{phase:MS.phase,s:carS.s,d:carS.d,fuel:car.fuel,reg:regionAt(car.x,car.z)};},anc(){return WD.anchors;},info(){const i=renderer.info;let L=0,S=0,M=0;scene.traverse(o=>{if(o.isLight)L++;if(o.isSkinnedMesh&&o.visible)S++;if(o.isMesh)M++;});return{calls:i.render.calls,tris:i.render.triangles,lights:L,skinnedVis:S,meshes:M,zombies:Z.length,pr:+renderer.getPixelRatio().toFixed(2)};},snap(){",1)
open('test.html','w').write(s.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/','/node_modules/three/'))
PY
cd /home/claude/game/dist && python3 - <<'PY'
s=open('test.html').read()
s=s.replace("  if(composer&&Q.high)composer.render();else renderer.render(scene,camera);KP=new Set(K);","  if(window.__camOv){const o=window.__camOv;camera.position.set(...o.p);camera.lookAt(...o.t);}if(composer&&Q.high)composer.render();else renderer.render(scene,camera);KP=new Set(K);",1)
open('test.html','w').write(s)
PY
