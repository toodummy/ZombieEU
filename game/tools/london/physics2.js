// ================================================================ rigid-body wrecks, explosions, world damage (bullets, melee, impacts)
const WB=[],DYNOBC=[];let PUSH_NOWR=false;const CAR_M=1400;
function physWrecks(){scene.updateMatrixWorld(true);const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
  for(const g of WRECKS){const ud=g.userData;if(!ud.obs)continue;g.matrixWorld.decompose(p,q,s);scene.attach(g);const e=new THREE.Euler().setFromQuaternion(q,'YXZ');
    const b={g,x:p.x,z:p.z,h:e.y,vx:0,vz:0,w:0,m:ud.burn?900:1150,hp:ud.burn?30:100,obs:ud.obs,awake:false,sleepT:0,burn:!!ud.burn,state:0,smokeT:0};b.I=b.m*(4.3*4.3+1.8*1.8)/12;b.rz=g.rotation.z;for(const o of b.obs)o.wr=b;WB.push(b);}}
function cellOf(o){return Math.floor(o.x/OGC)+','+Math.floor(o.z/OGC);}
function wakeBody(b){if(b.awake)return;b.awake=true;b.sleepT=0;for(const o of b.obs){const a=OGRID.get(cellOf(o));if(a){const i=a.indexOf(o);if(i>=0)a.splice(i,1);}DYNOBC.push(o);}}
function sleepBody(b){if(!b.awake)return;b.awake=false;for(const o of b.obs){const i=DYNOBC.indexOf(o);if(i>=0)DYNOBC.splice(i,1);const k=cellOf(o);let a=OGRID.get(k);if(!a)OGRID.set(k,a=[]);a.push(o);}}
function bodyCircles(b){const fx=Math.sin(b.h),fz=Math.cos(b.h);return[[b.x+fx*1.2,b.z+fz*1.2],[b.x-fx*1.2,b.z-fz*1.2]];}
function syncBody(b){const C=bodyCircles(b);b.obs[0].x=C[0][0];b.obs[0].z=C[0][1];if(b.obs[1]){b.obs[1].x=C[1][0];b.obs[1].z=C[1][1];}b.g.position.x=b.x;b.g.position.z=b.z;b.g.rotation.y=b.h;}
// impulse between body A (or the player car when A===null) and body B at contact point (cx,cz) with normal n pointing from B to A
function resolve(A,B,cx,cz,nx,nz,pen,e=.18){const va=A?[A.vx+A.w*(cz-A.z),A.vz-A.w*(cx-A.x)]:[car.vx,car.vz];const vb=[B.vx+B.w*(cz-B.z),B.vz-B.w*(cx-B.x)];
  const vn=(va[0]-vb[0])*nx+(va[1]-vb[1])*nz;const ma=A?A.m:CAR_M;const rbx=cx-B.x,rbz=cz-B.z,rnB=rbz*nx-rbx*nz;let k=1/ma+1/B.m+rnB*rnB/B.I;let rnA=0;if(A){const rax=cx-A.x,raz=cz-A.z;rnA=raz*nx-rax*nz;k+=rnA*rnA/A.I;}
  const ca=B.m/(ma+B.m),cb=ma/(ma+B.m);if(A){A.x+=nx*pen*ca;A.z+=nz*pen*ca;}else{car.x+=nx*pen*ca;car.z+=nz*pen*ca;}B.x-=nx*pen*cb;B.z-=nz*pen*cb;
  if(vn>=0)return 0;const j=-(1+e)*vn/k;
  if(A){A.vx+=j*nx/A.m;A.vz+=j*nz/A.m;A.w+=rnA*j/A.I;}else{car.vx+=j*nx/CAR_M;car.vz+=j*nz/CAR_M;}
  B.vx-=j*nx/B.m;B.vz-=j*nz/B.m;B.w-=rnB*j/B.I;
  // tangential friction (metal on metal) so glancing hits spin the wreck
  const tx=-nz,tz=nx;const vt=(va[0]-vb[0])*tx+(va[1]-vb[1])*tz;const jt=clamp(-vt/k,-j*.35,j*.35);B.vx-=jt*tx/B.m;B.vz-=jt*tz/B.m;B.w-=(rbz*tx-rbx*tz)*jt/B.I;
  return -vn;}
function carVsWrecks(){const off=CARDIM.len/2-1.05;const fx=Math.sin(car.h),fz=Math.cos(car.h);const CC=[[car.x+fx*off,car.z+fz*off],[car.x,car.z],[car.x-fx*off,car.z-fz*off]];let worst=0,wx=0,wz=0;
  for(const b of WB){if(Math.abs(b.x-car.x)>7||Math.abs(b.z-car.z)>7)continue;for(const [wcx,wcz] of bodyCircles(b))for(const [ccx,ccz] of CC){const dx=ccx-wcx,dz=ccz-wcz,d=Math.hypot(dx,dz);const m=1.15+1.0;if(d>=m||d<1e-4)continue;
      const nx=dx/d,nz=dz/d;const cx=wcx+nx*1.15,cz=wcz+nz*1.15;wakeBody(b);const imp=resolve(null,b,cx,cz,nx,nz,m-d);if(imp>.5){damageWreck(b,imp,cx,cz,-nx,-nz);if(imp>worst){worst=imp;wx=-nx;wz=-nz;}}}}
  if(worst>3.2){const L=toLocal(wx,wz);damageCar((worst-2.6)*1.7,{x:L.x,z:L.z},true);snd('crash',car.x,car.z,clamp(worst/13,.3,1.2),rnd(.85,1.05));sfxClang(car.x+wx*2,car.z+wz*2,clamp(worst/12,.3,1));shake=Math.max(shake,clamp(worst/11,.15,.9));
    for(let i=0;i<10;i++)emit(car.x+wx*2,.7,car.z+wz*2,rnd(-3,3),rnd(1,4),rnd(-3,3),.4,.09,1,.8,.4,1,10);}}
function updWrecks(dt){for(const b of WB){if(!b.awake){if(b.state>=1)wreckFx(b,dt);continue;}
    const sp=Math.hypot(b.vx,b.vz);const dec=Math.min(sp,(b.flipped?9:4.5)*dt);if(sp>1e-4){b.vx-=b.vx/sp*dec;b.vz-=b.vz/sp*dec;}b.vx*=Math.exp(-.8*dt);b.vz*=Math.exp(-.8*dt);b.w*=Math.exp(-2.6*dt);
    b.x+=b.vx*dt;b.z+=b.vz*dt;b.h+=b.w*dt;
    // world: buildings, walls, river edges
    for(const [cx,cz] of bodyCircles(b)){let c=constrain(cx,cz,1.15);if(c&&c.seg&&c.seg.p&&tryBreakWall(c.seg.p,sp,b.vx,b.vz,false))c=null;if(c){const dx=c.x-cx,dz=c.z-cz,d=Math.hypot(dx,dz)||1;const nx=dx/d,nz=dz/d;b.x+=dx;b.z+=dz;const vn=b.vx*nx+b.vz*nz;if(vn<0){b.vx-=nx*vn*1.2;b.vz-=nz*vn*1.2;b.w*=.6;if(-vn>3)damageWreck(b,-vn*.8,cx-nx,cz-nz,-nx,-nz);}}
      // knock over street furniture / clutter
      if(sp>2.5){const gx=Math.floor(cx/OGC),gz=Math.floor(cz/OGC);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=OGRID.get((gx+i)+','+(gz+j));if(!a)continue;for(const o of a){if(o.off||!o.brk||!o.brk.alive)continue;if(Math.hypot(o.x-cx,o.z-cz)<o.r+1.15){breakProp(o.brk,sp,cx,cz,b.vx,b.vz);propImpactSound(BRKT[o.brk.t].mat,o.x,o.z,sp,BRKT[o.brk.t].mass);b.vx*=.9;b.vz*=.9;}}}}
      // run over infected
      if(sp>4)for(const zz of Z){if(zz.state==='dead')continue;if(Math.abs(zz.x-cx)<1.6&&Math.abs(zz.z-cz)<1.6&&Math.hypot(zz.x-cx,zz.z-cz)<1.5){if(sp>7)killZ(zz,[b.vx*.6,3,b.vz*.6]);else hurtZ(zz,sp*6,cx,cz,'car');}}}
    // other wrecks
    for(const o of WB){if(o===b||Math.abs(o.x-b.x)>6||Math.abs(o.z-b.z)>6)continue;for(const [ax,az] of bodyCircles(b))for(const [bx,bz] of bodyCircles(o)){const dx=ax-bx,dz=az-bz,d=Math.hypot(dx,dz);if(d>=2.3||d<1e-4)continue;const nx=dx/d,nz=dz/d;wakeBody(o);const imp=resolve(b,o,bx+nx*1.15,bz+nz*1.15,nx,nz,2.3-d,.12);if(imp>3){damageWreck(o,imp,bx+nx*1.15,bz+nz*1.15,nx,nz);damageWreck(b,imp*.6,bx+nx*1.15,bz+nz*1.15,-nx,-nz);sfxClang(bx,bz,clamp(imp/12,.2,.8));}}}
    syncBody(b);wreckFx(b,dt);
    if(sp<.08&&Math.abs(b.w)<.05){b.sleepT+=dt;if(b.sleepT>.8){b.vx=b.vz=b.w=0;sleepBody(b);}}else b.sleepT=0;}}
// dents: displace vertices of the near-LOD mesh around the impact point
function dentWreck(b,wx,wz,dx,dz,depth){const lod=b.g.userData.model;if(!lod||!lod.levels)return;const hi=lod.levels[0].object;
  hi.traverse(m=>{if(!m.isMesh)return;if(!m.userData.own){m.geometry=deq(m.geometry.clone());m.userData.own=true;}const P=m.geometry.attributes.position;m.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(m.matrixWorld).invert();
    const c=new THREE.Vector3(wx,.75,wz).applyMatrix4(inv);const dir=new THREE.Vector3(dx,0,dz).transformDirection(inv);const R=1.05/Math.cbrt(Math.abs(m.matrixWorld.determinant()));const v=new THREE.Vector3();let ch=false;
    for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const d=v.distanceTo(c);if(d>R)continue;const f=(1-d/R)**2*depth/Math.cbrt(Math.abs(m.matrixWorld.determinant()))*(0.75+((i*2654435761)>>>0)%100/200);v.addScaledVector(dir,f);P.setXYZ(i,v.x,v.y,v.z);ch=true;}
    if(ch){P.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingSphere();}});}
function damageWreck(b,imp,wx,wz,dx,dz){if(imp<1.5)return;const dmg=imp*(b.burn?1.2:2.6);b.hp-=dmg;if(imp>3)dentWreck(b,wx,wz,dx,dz,Math.min(.28,imp*.022));
  if(!b.scuffed&&b.hp<80){b.scuffed=true;b.g.traverse(c=>{if(c.isMesh&&c.material){c.material.color.multiplyScalar(.82);c.material.roughness=Math.min(1,(c.material.roughness||.5)+.2);}});}
  if(b.hp<70&&!b.glass){b.glass=true;sfxGlass(wx,wz,.7);for(let i=0;i<14;i++)emit(wx,1.1,wz,rnd(-2.5,2.5),rnd(1,3),rnd(-2.5,2.5),.5,.06,.8,.9,1,1,12);}
  if(b.hp<45&&b.state<1)b.state=1;if(b.hp<18&&b.state<2){b.state=2;b.fireT=rnd(5,9);b.fl=new THREE.PointLight(0xff7a2a,40,16,1.6);b.fl.position.set(0,1.4,0);b.g.add(b.fl);}
  if(b.hp<=0&&b.state<3){b.state=3;explode(b.x,b.z,1,b);}}
function wreckFx(b,dt){if(!b.state)return;b.smokeT-=dt;const fx=Math.sin(b.h)*1.6,fz=Math.cos(b.h)*1.6;
  if(b.smokeT<=0){b.smokeT=b.state>=2?.05:.18;if(b.state===1)emit(b.x+fx,1.1,b.z+fz,rnd(-.3,.3),rnd(1,2),rnd(-.3,.3),2.4,.6,.35,.33,.32,.45,-.4,1.6);
    else{emit(b.x+fx+rnd(-.5,.5),1,b.z+fz+rnd(-.5,.5),rnd(-.4,.4),rnd(1.5,3),rnd(-.4,.4),.7,.5,1,.55,.15,1,-1,-.3);emit(b.x+fx,1.6,b.z+fz,rnd(-.3,.3),rnd(2,3),rnd(-.3,.3),3,.8,.12,.11,.1,.6,-.5,2);}}
  if(b.fl)b.fl.intensity=34+Math.random()*16;
  if(b.state===2){b.fireT-=dt;if(b.fireT<=0){b.state=3;explode(b.x,b.z,1,b);}}}
// explosion: fireball, shockwave, damage everything nearby, pushes wrecks and debris
function explode(x,z,power=1,src=null){const C=AC,t=C?C.currentTime:0;
  if(AU.on){const p=_pan(x,z);const s=C.createGain();s.gain.value=.8;p.connect(s);s.connect(AU.rv);noiseBurst(p,t,1.6,180,.7,1.4*power,'lowpass');tone(p,t,90,1.1,.9*power,'sine',28);noiseBurst(p,t,.35,2400,.6,.6*power);snd('crash',x,z,1.2,.55);}
  for(let i=0;i<60;i++){const a=Math.random()*6.28,v=rnd(3,12)*power;emit(x,1,z,Math.cos(a)*v,rnd(3,10),Math.sin(a)*v,rnd(.6,1.2),rnd(.3,.8),1,rnd(.35,.7),.1,1,i<30?8:3);}
  for(let i=0;i<30;i++)emit(x+rnd(-1,1),1.5,z+rnd(-1,1),rnd(-1.5,1.5),rnd(2,5),rnd(-1.5,1.5),rnd(3,5),rnd(1,2),.1,.09,.08,.7,-.6,2.2);
  {const L=new THREE.PointLight(0xffa040,400*power,40,1.5);L.position.set(x,3,z);scene.add(L);let k=0;const f=()=>{k+=.05;L.intensity*=.82;if(k<1.2)setTimeout(f,40);else scene.remove(L);};f();}
  shake=Math.max(shake,clamp(1.2-Math.hypot(camera.position.x-x,camera.position.z-z)/40,0,1));
  const R=8*power;for(const zz of Z){if(zz.state==='dead')continue;const d=Math.hypot(zz.x-x,zz.z-z);if(d<R){const k=1-d/R;if(k>.35)killZ(zz,[(zz.x-x)/d*12*k,6*k,(zz.z-z)/d*12*k]);else hurtZ(zz,80*k,x,z,'blast');}}
  {const d=Math.hypot(car.x-x,car.z-z);if(d<R+1){const k=1-d/(R+1);const L=toLocal((x-car.x)/(d||1),(z-car.z)/(d||1));damageCar(30*k,{x:L.x,z:L.z},true);car.vx+=(car.x-x)/(d||1)*8*k;car.vz+=(car.z-z)/(d||1)*8*k;}}
  if(!PL.inCar){const d=Math.hypot(PL.x-x,PL.z-z);if(d<R)hurtPlayer(55*(1-d/R),x,z);}
  for(const b of WB){if(b===src)continue;const dx=b.x-x,dz=b.z-z,d=Math.hypot(dx,dz);if(d<R*1.4&&d>.1){wakeBody(b);const k=(1-d/(R*1.4))*7*power;b.vx+=dx/d*k;b.vz+=dz/d*k;b.w+=rnd(-1,1)*k*.2;damageWreck(b,k*2.2,b.x-dx/d,b.z-dz/d,dx/d,dz/d);}}
  for(const o of OBC){if(!o.brk||!o.brk.alive)continue;const d=Math.hypot(o.x-x,o.z-z);if(d<R)breakProp(o.brk,10,x,z,(o.x-x)/(d||1)*10,(o.z-z)/(d||1)*10);}
  for(const P of WP){if(!P.alive)continue;const d=Math.hypot((P.x0+P.x1)/2-x,(P.z0+P.z1)/2-z);if(d<R*.8)breakWall(P,12,((P.x0+P.x1)/2-x)/(d||1)*9,((P.z0+P.z1)/2-z)/(d||1)*9);}
  for(const d of DEBRIS){const dx=d.m.position.x-x,dz=d.m.position.z-z,l=Math.hypot(dx,dz);if(l<R){d.v.x+=dx/l*10;d.v.z+=dz/l*10;d.v.y+=6;d.sleep=0;}}
  for(const d of DYN){const dx=d.x-x,dz=d.z-z,l=Math.hypot(dx,dz);if(l<R&&l>.1){d.vx=(d.vx||0)+dx/l*9;d.vz=(d.vz||0)+dz/l*9;}}
  if(src){src.burn=true;src.g.traverse(c=>{if(c.isMesh&&c.material){c.material.color.setHex(0x2a2622);c.material.roughness=1;c.material.metalness=.1;}});src.vx+=rnd(-1,1);src.vz+=rnd(-1,1);src.w+=rnd(-2,2);wakeBody(src);
    fire(src.x,.6,src.z,true);if(src.fl){src.g.remove(src.fl);src.fl=null;}src.state=4;}
  noise(x,z,140);}
// ---------------------------------------------------------------- bullets & melee against the world
const HOLES={i:0,mesh:null};
function holeMesh(){if(HOLES.mesh)return HOLES.mesh;const tex=cv(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,1,32,32,30);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.25,'rgba(20,16,12,.95)');g.addColorStop(.45,'rgba(70,60,50,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
  const m=new THREE.InstancedMesh(new THREE.PlaneGeometry(.22,.22),new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:1}),240);m.count=240;for(let i=0;i<240;i++)m.setMatrixAt(i,_zero);m.frustumCulled=false;scene.add(m);HOLES.mesh=m;return m;}
function addHole(x,y,z,nx,nz){const m=holeMesh();_q.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(nx,0,nz).normalize());_p.set(x+nx*.02,y,z+nz*.02);m.setMatrixAt(HOLES.i,_m4.compose(_p,_q,_v3.set(1,1,1).multiplyScalar(.7+Math.random()*.6)));HOLES.i=(HOLES.i+1)%240;m.instanceMatrix.needsUpdate=true;}
const BRK_HP={lampL:5,lampD:5,signalA:4,signalR:4,busstop:3,bench:3,bollard:7,bin:2,postbox:14,phone:5,bikes:2};
function hitProp(it,dmg,fx,fz,sx,sz){if(!it.alive)return;it.hp=(it.hp??(BRK_HP[it.t]??(it.t.startsWith('sign')?1.5:it.t.startsWith('k_')?1:3)))-dmg;const T=BRKT[it.t];
  if(T.mat==='glass'&&!it.cracked){it.cracked=true;sfxGlass(it.x,it.z,.5);}else sfxClang(it.x,it.z,.35);
  if(it.hp<=0){breakProp(it,6,sx,sz,fx*5,fz*5);propImpactSound(T.mat,it.x,it.z,6,T.mass);}}
// march a shot through the world; returns true if something solid stopped it
let LASTSHOT='';function worldShot(ox,oz,dx,dz,maxD,dmg){const y=1.35;LASTSHOT='none';for(let d=.6;d<maxD;d+=.35){const x=ox+dx*d,z=oz+dz*d;
    for(const b of WB){if(Math.abs(b.x-x)>3||Math.abs(b.z-z)>3)continue;for(const [cx,cz] of bodyCircles(b))if(Math.hypot(cx-x,cz-z)<1.05){LASTSHOT='wreck@'+d.toFixed(1);damageWreck(b,dmg*2.2,x,z,dx,dz);wakeBody(b);b.vx+=dx*.15*dmg;b.vz+=dz*.15*dmg;sfxClang(x,z,.5);for(let i=0;i<6;i++)emit(x,y-.3,z,-dx*rnd(1,3)+rnd(-1,1),rnd(.5,2),-dz*rnd(1,3)+rnd(-1,1),.25,.05,1,.85,.5,1,14);return true;}}
    const a=OGRID.get(Math.floor(x/OGC)+','+Math.floor(z/OGC));if(a)for(const o of a){if(o.off||Math.hypot(o.x-x,o.z-z)>o.r+.05)continue;if(o.brk&&o.brk.alive){LASTSHOT='prop@'+d.toFixed(1);hitProp(o.brk,dmg,dx,dz,ox,oz);return true;}if(!o.brk&&!o.wr){LASTSHOT='obs@'+d.toFixed(1)+':'+o.r;for(let i=0;i<5;i++)emit(x,y,z,-dx*2+rnd(-1,1),rnd(0,2),-dz*2+rnd(-1,1),.3,.05,.55,.45,.35,.8,8);return true;}}
    const c=bldAt(x,z,.04)||segAt(x,z,.04);if(c){LASTSHOT='wall@'+d.toFixed(1);let nx=c.x-x,nz=c.z-z;const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;addHole(c.x,y+rnd(-.25,.25),c.z,nx,nz);for(let i=0;i<8;i++)emit(c.x,y,c.z,nx*rnd(1,3)+rnd(-.6,.6),rnd(-.2,1.5),nz*rnd(1,3)+rnd(-.6,.6),.45,.08,.62,.55,.45,.8,3);if(AU.on)noiseBurst(_pan(c.x,c.z),AC.currentTime,.08,3200,1.5,.25);return true;}}
  return false;}
function worldMelee(){const fx=Math.sin(PL.h),fz=Math.cos(PL.h);const x=PL.x+fx*1.3,z=PL.z+fz*1.3;let hit=false;
  for(const b of WB){for(const [cx,cz] of bodyCircles(b))if(Math.hypot(cx-x,cz-z)<1.5){damageWreck(b,2.2,x,z,fx,fz);sfxClang(x,z,.6);shake=Math.max(shake,.15);hit=true;break;}if(hit)break;}
  const a=OGRID.get(Math.floor(x/OGC)+','+Math.floor(z/OGC));if(a)for(const o of a){if(o.off||!o.brk||!o.brk.alive)continue;if(Math.hypot(o.x-x,o.z-z)<o.r+.9){hitProp(o.brk,1.6,fx,fz,PL.x,PL.z);hit=true;}}
  if(!hit){const c=bldAt(x,z,.3)||segAt(x,z,.3);if(c){sfxClang(c.x,c.z,.3);for(let i=0;i<6;i++)emit(c.x,1.3,c.z,rnd(-1,1),rnd(0,2),rnd(-1,1),.3,.06,.62,.55,.45,.8,6);hit=true;}}
  return hit;}

function hurtPlayer(d,x,z){if(PL.dead)return;PL.hp-=d;shake=Math.max(shake,.4);const dx=PL.x-x,dz=PL.z-z,l=Math.hypot(dx,dz)||1;PL.vx=(PL.vx||0)+dx/l*6;PL.vz=(PL.vz||0)+dz/l*6;}
