// ---------------------------------------------------------------- breakable street furniture (instanced; knocked over by the car)
const BRK=[],DEBRIS=[];const BRKT={};
function brkTypes(){
  const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.4},o));
  const ironG=M(0x1c2420,{roughness:.45,metalness:.7}),black=M(0x15171a,{roughness:.45,metalness:.6}),red=M(0xb5120c,{roughness:.35,metalness:.25}),grey=M(0x8a8e92,{roughness:.4,metalness:.8}),gold=M(0xc8a040,{roughness:.3,metalness:.9});
  const glassL=new THREE.MeshStandardMaterial({color:0x332a1a,emissive:0xffc27a,emissiveIntensity:3.2,roughness:.2});const glassD=new THREE.MeshStandardMaterial({color:0x20262a,roughness:.1,metalness:.3,envMapIntensity:1.4});
  const shelterGlass=new THREE.MeshStandardMaterial({color:0x9ab0b8,roughness:.05,metalness:.1,transparent:true,opacity:.28,envMapIntensity:1.5,depthWrite:false});
  const wood=pbr('planks',{color:0x8a6a48,fallback:0x5a4030});
  const amber=new THREE.MeshStandardMaterial({color:0x221500,emissive:0xffa21a,emissiveIntensity:3});const redL=new THREE.MeshStandardMaterial({color:0x220400,emissive:0xff2a1a,emissiveIntensity:3});const darkL=M(0x101010,{roughness:.2});
  const C=(rt,rb,h,seg,y,x=0,z=0)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg);g.translate(x,y,z);return g;};
  const B=(w,h,d,x,y,z)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g;};
  const build=parts=>{const geos=parts.map(p=>{let g=p[0];g=g.index?g.toNonIndexed():g;for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);return g;});const geo=BGU.mergeGeometries(geos,true);geo.computeBoundingBox();geo.computeBoundingSphere();return{geo,mats:parts.map(p=>p[1])};};
  // classic London lamp column (tapered fluted shaft, plinth, scroll bracket, lantern)
  const lampParts=glass=>{const prof=[[.24,0],[.26,.12],[.2,.2],[.17,.75],[.21,.85],[.12,1.0],[.1,1.2],[.075,5.3],[.1,5.4],[.06,5.55],[0,5.6]].map(([r,y])=>new THREE.Vector2(r,y));
    const shaft=new THREE.LatheGeometry(prof,14);const arm=B(.07,.07,1.15,0,5.42,.55);const scroll=new THREE.TorusGeometry(.22,.025,6,14,Math.PI);scroll.rotateY(Math.PI/2);scroll.translate(0,5.2,.28);
    const lantern=C(.2,.12,.5,8,5.05,0,1.08);const cap=new THREE.ConeGeometry(.3,.28,8);cap.translate(0,5.44,1.08);const fin=C(.02,.02,.2,6,5.68,0,1.08);
    return[[shaft,ironG],[arm,ironG],[scroll,ironG],[lantern,glass],[cap,ironG],[fin,gold]];};
  const sigParts=lit=>{const h=B(.3,.92,.22,0,2.8,0);const vis=[0,1,2].map(i=>{const v=B(.26,.04,.16,0,3.12-i*.28,.15);return v;});const lights=[0,1,2].map(i=>{const g=new THREE.CircleGeometry(.09,14);g.translate(0,3.0-i*.28,.112);return g;});
    return[[C(.06,.07,3.35,8,1.675),grey],[h,black],...vis.map(v=>[v,black]),[lights[0],lit==='R'?redL:darkL],[lights[1],lit==='A'?amber:darkL],[lights[2],darkL]];};
  const stop=(()=>{const roundel=new THREE.TorusGeometry(.24,.06,8,24);roundel.translate(2.3,2.9,0);const bar=B(.66,.13,.04,2.3,2.9,0);const parts=[];
    for(const x of[-1.7,1.7])for(const z of[-.65,.6])parts.push([B(.06,2.4,.06,x,1.2,z),grey]);parts.push([B(3.6,.08,1.5,0,2.44,0),grey]);parts.push([B(3.4,1.9,.02,0,1.3,-.66),shelterGlass]);parts.push([B(.02,1.9,1.2,-1.7,1.3,0),shelterGlass]);
    parts.push([B(1.2,.08,.35,-.6,.5,-.45),grey]);parts.push([B(.12,1.9,1.25,1.72,1.25,0),new THREE.MeshStandardMaterial({color:0x223040,emissive:0xbfe0ff,emissiveIntensity:1.1,roughness:.3})]);
    parts.push([C(.035,.035,3.1,6,1.55,2.3,0),grey],[roundel,red],[bar,M(0x1a2a8a)]);return parts;})();
  const bench=[[B(1.8,.06,.45,0,.45,0),wood],[B(1.8,.4,.05,0,.72,-.21),wood],[B(.07,.47,.52,-.8,.23,0),black],[B(.07,.47,.52,.8,.23,0),black]];
  const bollard=[[C(.1,.12,.85,10,.425),black],[new THREE.SphereGeometry(.1,10,6,0,Math.PI*2,0,Math.PI/2).translate(0,.85,0),black],[C(.125,.125,.05,10,.7),gold]];
  const bin=[[C(.27,.23,.95,14,.475),black],[C(.28,.28,.07,14,.82),gold],[C(.29,.29,.05,14,.97),black]];
  const postbox=(()=>{const dome=new THREE.SphereGeometry(.31,16,8,0,Math.PI*2,0,Math.PI/2);dome.scale(1,.55,1);dome.translate(0,1.5,0);return[[C(.27,.27,1.36,18,.76),red],[C(.33,.3,.14,18,1.44),red],[dome,red],[C(.3,.32,.1,18,.05),black],[B(.24,.035,.06,0,1.18,.27),black],[B(.16,.12,.02,0,.95,.272),M(0xf0ead8,{metalness:0})]];})();
  const phone=(()=>{const win=cv(128,256,(x,w,h)=>{x.fillStyle='#b5120c';x.fillRect(0,0,w,h);x.fillStyle='#1a2026';for(let r=0;r<8;r++)for(let c=0;c<3;c++)x.fillRect(10+c*38,10+r*30,32,24);});const winM=new THREE.MeshStandardMaterial({map:win,roughness:.3,metalness:.2});
    const parts=[[B(1.02,2.45,1.02,0,1.225,0),red],[B(1.12,.18,1.12,0,2.54,0),red],[new THREE.SphereGeometry(.56,16,6,0,Math.PI*2,0,Math.PI/2).scale(1,.35,1).translate(0,2.63,0),red],[B(.96,.16,1.06,0,2.25,0),new THREE.MeshStandardMaterial({color:0xf0f0e8,emissive:0xfff8e0,emissiveIntensity:1.2})]];
    for(const [rx,ox,oz] of [[0,0,.515],[Math.PI,0,-.515],[Math.PI/2,.515,0],[-Math.PI/2,-.515,0]]){const g=new THREE.PlaneGeometry(.78,1.62);g.rotateY(rx);g.translate(ox,1.2,oz);parts.push([g,winM]);}return parts;})();
  const signTex={};const st=(k,f)=>signTex[k]=cv(128,128,f);
  st('sign_20',(x)=>{x.fillStyle='#fff';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.strokeStyle='#d01010';x.lineWidth=14;x.beginPath();x.arc(64,64,54,0,7);x.stroke();x.fillStyle='#111';x.font='bold 54px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('20',64,68);});
  st('sign_noentry',(x)=>{x.fillStyle='#d01010';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.fillStyle='#fff';x.fillRect(18,52,92,24);});
  st('sign_giveway',(x)=>{x.fillStyle='#d01010';x.beginPath();x.moveTo(64,124);x.lineTo(4,12);x.lineTo(124,12);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(64,100);x.lineTo(24,24);x.lineTo(104,24);x.fill();});
  st('sign_keepleft',(x)=>{x.fillStyle='#1a4aa8';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=14;x.beginPath();x.moveTo(86,40);x.lineTo(44,82);x.stroke();x.fillStyle='#fff';x.beginPath();x.moveTo(30,96);x.lineTo(34,62);x.lineTo(64,92);x.fill();});
  st('sign_bus',(x)=>{x.fillStyle='#1a4aa8';x.fillRect(4,24,120,80);x.fillStyle='#fff';x.font='bold 38px Arial';x.textAlign='center';x.fillText('BUS',64,62);x.font='bold 20px Arial';x.fillText('LANE',64,92);});
  st('sign_nostop',(x)=>{x.fillStyle='#1a4aa8';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.strokeStyle='#d01010';x.lineWidth=14;x.beginPath();x.arc(64,64,54,0,7);x.stroke();x.beginPath();x.moveTo(26,26);x.lineTo(102,102);x.moveTo(102,26);x.lineTo(26,102);x.stroke();});
  const signParts=k=>{const plate=new THREE.PlaneGeometry(.72,.72);plate.translate(0,2.25,.045);const back=new THREE.PlaneGeometry(.72,.72);back.rotateY(Math.PI);back.translate(0,2.25,.04);const mat=new THREE.MeshStandardMaterial({map:signTex[k],transparent:true,alphaTest:.5,roughness:.4,metalness:.1});
    return[[C(.035,.035,2.6,8,1.3),grey],[plate,mat],[back,new THREE.MeshStandardMaterial({color:0x7a7e82,roughness:.5,metalness:.7,transparent:true,alphaTest:.5,alphaMap:signTex[k]})]];};
  const bikes=(()=>{const a=new THREE.TorusGeometry(.38,.025,6,14,Math.PI);a.translate(-.35,.42,0);const b=new THREE.TorusGeometry(.38,.025,6,14,Math.PI);b.translate(.35,.42,0);return[[a,grey],[b,grey]];})();
  const T=(k,parts,o)=>{BRKT[k]=Object.assign(build(parts),o);};
  T('lampL',lampParts(glassL),{r:.24,mass:.2,dmg:5,mat:'metal'});T('lampD',lampParts(glassD),{r:.24,mass:.2,dmg:5,mat:'metal'});
  T('signalA',sigParts('A'),{r:.18,mass:.16,dmg:4,mat:'metal'});T('signalR',sigParts('R'),{r:.18,mass:.16,dmg:4,mat:'metal'});
  T('busstop',stop,{r:.85,mass:.3,dmg:9,mat:'glass',circ:[[-1.1,0],[0,0],[1.1,0]]});T('bench',bench,{r:.55,mass:.08,dmg:2,mat:'wood',circ:[[-.55,0],[.55,0]]});
  T('bollard',bollard,{r:.14,mass:.16,dmg:3.5,mat:'metal'});T('bin',bin,{r:.3,mass:.05,dmg:1,mat:'metal'});T('postbox',postbox,{r:.34,mass:.32,dmg:12,mat:'heavy'});
  T('phone',phone,{r:.62,mass:.36,dmg:13,mat:'glass'});T('bikes',bikes,{r:.45,mass:.05,dmg:1.5,mat:'metal'});
  for(const k of Object.keys(signTex))T(k,signParts(k),{r:.12,mass:.04,dmg:1.2,mat:'metal'});}
function buildFurniture(){brkTypes();
  const items=[];
  const pool=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'rgba(255,190,120,.55)');g.addColorStop(.5,'rgba(255,160,90,.18)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
  const poolM=new THREE.MeshBasicMaterial({map:pool,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-4});const pg=new THREE.PlaneGeometry(10,10);pg.rotateX(-Math.PI/2);const pools=[];
  for(const [k,x,z,a] of WD.nodes){if(k==='tree'||k==='cctv')continue;const R=mulberry(H32(k+x+'|'+z));let t=k,ry=a||0;
    if(k==='lamp'){t=R()<.45?'lampL':'lampD';}else if(k==='signal'){t=R()<.7?'signalA':'signalR';}
    else if(!a){const nr=nearestRoadDir(x,z);if(nr)ry=Math.atan2(nr.qx-x,nr.qz-z);}
    if(!BRKT[t])continue;const y=groundH(x,z);const it={t,x,z,y,ry,alive:true,obs:[]};items.push(it);
    if(t==='lampL'){const hx=x+Math.sin(ry)*1.08,hz=z+Math.cos(ry)*1.08;it.src={p:new THREE.Vector3(hx,y+4.9,hz),c:new THREE.Color(0xffb46a),i:34,d:24,dec:1.6,base:34};LSRC.push(it.src);it.pool=pools.length;pools.push([hx,hz]);}}
  // instanced meshes per type + chunk
  const by=new Map();for(const it of items){const key=it.t+'|'+Math.floor(it.x/CH)+','+Math.floor(it.z/CH);if(!by.has(key))by.set(key,[]);by.get(key).push(it);}
  for(const [key,L] of by){const T=BRKT[L[0].t];const I=new THREE.InstancedMesh(T.geo,T.mats,L.length);L.forEach((it,i)=>{_q.setFromAxisAngle(_up,it.ry);_p.set(it.x,it.y,it.z);I.setMatrixAt(i,_m4.compose(_p,_q,_s));it.mesh=I;it.idx=i;});
    I.castShadow=L[0].t!=='busstop';I.receiveShadow=true;I.computeBoundingSphere();WORLDG.add(I);CHUNKS.push({m:I,c:I.boundingSphere.center.clone(),r:I.boundingSphere.radius});}
  {const by2=new Map();pools.forEach((p,i)=>{const k=Math.floor(p[0]/CH)+','+Math.floor(p[1]/CH);if(!by2.has(k))by2.set(k,[]);by2.get(k).push([p,i]);});POOLI.length=pools.length;
   for(const [,L] of by2){const I=new THREE.InstancedMesh(pg,poolM,L.length);_q.identity();L.forEach(([p,i],j)=>{_p.set(p[0],PAVE_Y+.03,p[1]);I.setMatrixAt(j,_m4.compose(_p,_q,_s));POOLI[i]=[I,j];});I.renderOrder=2;I.computeBoundingSphere();WORLDG.add(I);CHUNKS.push({m:I,c:I.boundingSphere.center.clone(),r:I.boundingSphere.radius});}}
  // collision circles (solid when slow, breakable when fast)
  for(const it of items){const T=BRKT[it.t];const c=Math.cos(it.ry),s=Math.sin(it.ry);const circ=T.circ||[[0,0]];for(const [lx,lz] of circ){const o={x:it.x+lx*c+lz*s,z:it.z-lx*s+lz*c,r:T.r,brk:it};OBC.push(o);it.obs.push(o);}BRK.push(it);}
}
const POOLI=[];const _zero=new THREE.Matrix4().makeScale(0,0,0);
function breakProp(it,sp,hx,hz){if(!it.alive)return;it.alive=false;const T=BRKT[it.t];for(const o of it.obs)o.off=true;
  it.mesh.setMatrixAt(it.idx,_zero);it.mesh.instanceMatrix.needsUpdate=true;if(it.src){it.src.i=0;it.src.base=0;const P=POOLI[it.pool];if(P){P[0].setMatrixAt(P[1],_zero);P[0].instanceMatrix.needsUpdate=true;}}
  // debris rigid body
  const m=new THREE.Mesh(T.geo,T.mats.map(x=>x));m.position.set(it.x,it.y,it.z);m.rotation.y=it.ry;m.castShadow=true;scene.add(m);
  const dx=it.x-hx,dz=it.z-hz,l=Math.hypot(dx,dz)||1;const k=1-T.mass;
  const d={m,v:new THREE.Vector3(car.vx*(.75+k*.3)+dx/l*2,1.5+sp*.12*(1-T.mass),car.vz*(.75+k*.3)+dz/l*2),w:new THREE.Vector3(rnd(-1,1),rnd(-.4,.4),rnd(-1,1)).normalize().multiplyScalar(sp*.35+2),bb:T.geo.boundingBox,sleep:0};DEBRIS.push(d);if(DEBRIS.length>60){const o=DEBRIS.shift();o.sleep=99;}
  return T;}
const _c8=[...Array(8)].map(()=>new THREE.Vector3()),_dq=new THREE.Quaternion(),_dv=new THREE.Vector3();
function updDebris(dt){for(const d of DEBRIS){if(d.sleep>2)continue;const m=d.m;d.v.y-=18*dt;m.position.addScaledVector(d.v,dt);const wl=d.w.length();if(wl>1e-3){_dq.setFromAxisAngle(_dv.copy(d.w).divideScalar(wl),wl*dt);m.quaternion.premultiply(_dq);}
    m.updateMatrixWorld();const b=d.bb;let i=0;for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])_c8[i++].set(x,y,z).applyMatrix4(m.matrixWorld);
    let minY=1e9,low=null;for(const c of _c8)if(c.y<minY){minY=c.y;low=c;}const g=groundH(m.position.x,m.position.z);
    if(minY<g){m.position.y+=g-minY;if(d.v.y<0)d.v.y*=-.22;d.v.x*=.78;d.v.z*=.78;// torque from ground contact tips it over
      d.w.x+=(low.z-m.position.z)*.8*dt*20;d.w.z-=(low.x-m.position.x)*.8*dt*20;d.w.multiplyScalar(.82);
      if(d.v.length()<.4&&d.w.length()<.4){d.sleep+=dt;}else d.sleep=0;}
    // the car can shove debris again
    const cx=m.position.x-car.x,cz=m.position.z-car.z;if(cx*cx+cz*cz<6&&Math.hypot(car.vx,car.vz)>2){d.v.x=car.vx*.9+cx;d.v.z=car.vz*.9+cz;d.v.y=2;d.sleep=0;}}}
// car vs breakables: called each car update before regular collision
function carBreak(){const sp=Math.hypot(car.vx,car.vz);if(sp<3.2)return;const hl=CARDIM.len/2;const fx=Math.sin(car.h),fz=Math.cos(car.h);
  for(const off of[hl-.6,0,-hl+.6]){const px=car.x+fx*off,pz=car.z+fz*off;const gx=Math.floor(px/OGC),gz=Math.floor(pz/OGC);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=OGRID.get((gx+i)+','+(gz+j));if(!a)continue;for(const o of a){if(o.off||!o.brk||!o.brk.alive)continue;if(Math.hypot(o.x-px,o.z-pz)>o.r+1.15)continue;
      const T=breakProp(o.brk,sp,px,pz);if(!T)continue;const kk=clamp(sp/14,.5,1.6);const L=toLocal(o.x-car.x,o.z-car.z);damageCar(T.dmg*kk,{x:clamp(L.x,-1,1),z:L.z>0?1:-1},false);
      const slow=1-T.mass*clamp(sp/18,.4,1.1);car.vx*=slow;car.vz*=slow;shake=Math.max(shake,.12+T.mass*.9);
      propImpactSound(T.mat,o.x,o.z,sp,T.mass);for(let n=0;n<10;n++)emit(o.x,.8,o.z,rnd(-3,3)+car.vx*.3,rnd(1,4),rnd(-3,3)+car.vz*.3,.6,.08,T.mat==='glass'?.8:1,T.mat==='glass'?.9:.75,T.mat==='glass'?1:.4,1,12);}}}}
function propImpactSound(mat,x,z,sp,mass){const v=clamp(sp/16,.3,1);if(mat==='glass'){if(typeof sfxGlass==='function')sfxGlass(x,z,v);snd('crash',x,z,v*.5,1.5);}else if(mat==='wood')snd('crash',x,z,v*.35,1.25);else if(mat==='heavy')snd('crash',x,z,v*.9,.8);else{snd('crash',x,z,v*(.35+mass),1.35);if(typeof sfxClang==='function')sfxClang(x,z,v);}}
