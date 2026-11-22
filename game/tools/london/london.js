// ================================================================ REAL LONDON — built from OpenStreetMap data (© OpenStreetMap contributors, ODbL)
// Tower Hill → Tower Bridge → Tower Bridge Road → Bricklayers Arms → Old Kent Road. Units: metres, x = east, z = south.
let WD=null;const WORLDG=new THREE.Group();WORLDG.name='london';
const ROUTE={pts:[],cum:[],len:0,last:1};
function routeInit(){const r=WD.route;for(let i=0;i<r.length;i+=2)ROUTE.pts.push([r[i],r[i+1]]);let c=0;ROUTE.cum=[0];for(let i=1;i<ROUTE.pts.length;i++){c+=Math.hypot(ROUTE.pts[i][0]-ROUTE.pts[i-1][0],ROUTE.pts[i][1]-ROUTE.pts[i-1][1]);ROUTE.cum.push(c);}ROUTE.len=c;}
function routeAt(s){s=clamp(s,0,ROUTE.len);let i=1;while(i<ROUTE.cum.length-1&&ROUTE.cum[i]<s)i++;const a=ROUTE.pts[i-1],b=ROUTE.pts[i];const L=(ROUTE.cum[i]-ROUTE.cum[i-1])||1;const t=(s-ROUTE.cum[i-1])/L;const dx=(b[0]-a[0])/L,dz=(b[1]-a[1])/L;return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx,dz,nx:dz,nz:-dx,h:Math.atan2(dx,dz)};}
function routeS(x,z){let best=1e18,bs=0;for(let i=1;i<ROUTE.pts.length;i++){const a=ROUTE.pts[i-1],b=ROUTE.pts[i];const dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/L2;t=clamp(t,0,1);const qx=a[0]+dx*t,qz=a[1]+dz*t,d=(x-qx)**2+(z-qz)**2;if(d<best){best=d;bs=ROUTE.cum[i-1]+t*Math.sqrt(L2);}}return{s:bs,d:Math.sqrt(best)};}
// authored set pieces live in rotated frames
function TF(F,x,z){const c=Math.cos(F.a),s=Math.sin(F.a),lx=x-F.ox,lz=z-F.oz;return[F.ax+lx*c+lz*s,F.az-lx*s+lz*c];}
function TFv(F,x,z){const p=TF(F,x,z);return{x:p[0],z:p[1]};}
function orientBox(b,F){const c=Math.cos(F.a),s=Math.sin(F.a);const [cx,cz]=TF(F,(b.x0+b.x1)/2,(b.z0+b.z1)/2);b.o={cx,cz,hx:(b.x1-b.x0)/2,hz:(b.z1-b.z0)/2,c,s};}
function inFrame(F,fn){const G=new THREE.Group();const c=Math.cos(F.a),s=Math.sin(F.a);G.position.set(F.ax-(F.ox*c+F.oz*s),0,F.az-(-F.ox*s+F.oz*c));G.rotation.y=F.a;scene.add(G);
  const add0=scene.add;scene.add=function(...o){G.add(...o);return scene;};
  const n={obc:OBC.length,obb:OBB.length,loot:LOOT.length,pumps:PUMPS.length,dyn:DYN.length,fires:FIRES.length};
  try{fn(G);}finally{delete scene.add;if(scene.add!==add0)scene.add=add0;}
  for(let i=n.obc;i<OBC.length;i++){const o=OBC[i];[o.x,o.z]=TF(F,o.x,o.z);}
  for(let i=n.obb;i<OBB.length;i++)orientBox(OBB[i],F);
  for(let i=n.loot;i<LOOT.length;i++){const o=LOOT[i];[o.x,o.z]=TF(F,o.x,o.z);}
  for(let i=n.pumps;i<PUMPS.length;i++){const o=PUMPS[i];[o.x,o.z]=TF(F,o.x,o.z);}
  for(let i=n.fires;i<FIRES.length;i++){const o=FIRES[i];[o.x,o.z]=TF(F,o.x,o.z);}
  G.updateMatrixWorld(true);
  for(let i=n.dyn;i<DYN.length;i++){const d=DYN[i];[d.x,d.z]=TF(F,d.x,d.z);d.x0=d.x;d.z0=d.z;d.ry0+=F.a;G.remove(d.o);scene.add(d.o);d.o.position.set(d.x,0,d.z);d.o.rotation.set(0,d.ry0,0);}
  return G;}

// ---------------------------------------------------------------- geometry buckets (merged per material + 160 m chunk)
class GB{constructor(){this.p=[];this.n=[];this.u=[];this.i=[];}
  v(x,y,z,nx,ny,nz,u,w){this.p.push(x,y,z);this.n.push(nx,ny,nz);this.u.push(u,w);return this.p.length/3-1;}
  geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setIndex(this.i);g.computeBoundingSphere();return g;}}
const CH=160,BUCK=new Map(),CHUNKS=[];
function bk(mat,x,z,opt={}){const key=mat.uuid+'|'+Math.floor(x/CH)+','+Math.floor(z/CH)+(opt.cast?'c':'')+(opt.far?'f':'');let b=BUCK.get(key);if(!b){b={gb:new GB(),mat,cast:!!opt.cast,far:!!opt.far,ro:opt.ro||0};BUCK.set(key,b);}return b.gb;}
function flushBuckets(){for(const [,b] of BUCK){if(!b.gb.i.length)continue;const m=new THREE.Mesh(b.gb.geo(),b.mat);m.castShadow=b.cast;m.receiveShadow=!b.far;m.renderOrder=b.ro;m.matrixAutoUpdate=false;m.updateMatrix();WORLDG.add(m);CHUNKS.push({m,far:b.far,c:m.geometry.boundingSphere.center.clone(),r:m.geometry.boundingSphere.radius});}BUCK.clear();}
let chunkT=0;function updChunks(dt){chunkT-=dt;if(chunkT>0)return;chunkT=.3;const c=camera.position;const lim=Q.high?430:330;for(const k of CHUNKS){if(k.far){k.m.visible=true;continue;}const d=Math.hypot(k.c.x-c.x,k.c.z-c.z)-k.r;k.m.visible=d<lim;}}
const area2=r=>{let a=0;for(let i=0;i<r.length;i+=2){const j=(i+2)%r.length;a+=r[i]*r[j+1]-r[j]*r[i+1];}return a/2;};
const ringV2=r=>{const o=[];for(let i=0;i<r.length;i+=2)o.push(new THREE.Vector2(r[i],r[i+1]));return o;};
// flat polygon (with holes) at height y, normal up
function flatPoly(gb,ring,holes,y,us=4,ny=1){if(ring.length<6)return;let R=ringV2(ring);const H=(holes||[]).filter(h=>h.length>=6).map(ringV2);const tris=THREE.ShapeUtils.triangulateShape(R,H);const all=R.concat(...H);const base=gb.p.length/3;
  for(const p of all)gb.v(p.x,y,p.y,0,ny,0,p.x/us,p.y/us);for(const [a,b,c] of tris){const A=all[a],B=all[b],C=all[c];const cr=(B.y-A.y)*(C.x-A.x)-(B.x-A.x)*(C.y-A.y);if((cr>0)===(ny>0))gb.i.push(base+a,base+b,base+c);else gb.i.push(base+a,base+c,base+b);}}

// ---------------------------------------------------------------- facade textures (painted at load: London stock brick, red brick, council, Portland stone, glass...)
const FAC={};const TILE_W=14.4,FLOOR=3.15;
function facadeSet(){
  const img=n=>AS.tex[n]&&AS.tex[n].d&&AS.tex[n].d.image;
  const W=1024,Hh=768,bay=W/4,fl=Hh/3;const ppm=W/TILE_W;
  const mk=(name,o)=>{const col=document.createElement('canvas');col.width=W;col.height=Hh;const x=col.getContext('2d');
    const em=document.createElement('canvas');em.width=W;em.height=Hh;const e=em.getContext('2d');e.fillStyle='#000';e.fillRect(0,0,W,Hh);
    const rg=document.createElement('canvas');rg.width=W;rg.height=Hh;const r=rg.getContext('2d');r.fillStyle='#e0e0e0';r.fillRect(0,0,W,Hh);
    // wall base
    const bi=img(o.tex);if(bi){const pat=x.createPattern(bi,'repeat');const sc=o.texScale*ppm/bi.width;pat.setTransform(new DOMMatrix().scale(sc,sc));x.fillStyle=pat;x.fillRect(0,0,W,Hh);}else{x.fillStyle='#777';x.fillRect(0,0,W,Hh);}
    x.globalCompositeOperation='multiply';x.fillStyle=o.tint;x.fillRect(0,0,W,Hh);x.globalCompositeOperation='source-over';
    // subtle grime streaks + per-floor soot
    for(let i=0;i<60;i++){x.fillStyle=`rgba(20,16,12,${Math.random()*.08})`;const gx=Math.random()*W;x.fillRect(gx,Math.random()*Hh*.3,2+Math.random()*10,Hh*Math.random());}
    const R=mulberry(name.length*131+7);
    for(let f=0;f<3;f++)for(let b=0;b<4;b++){const X=b*bay,Y=Hh-(f+1)*fl;o.draw(x,e,r,X,Y,bay,fl,R,f,b);}
    if(o.bands)for(let f=0;f<=3;f++){x.fillStyle=o.bands;x.fillRect(0,Hh-f*fl-o.bandH,W,o.bandH);r.fillStyle='#d0d0d0';}
    const t=new THREE.CanvasTexture(col);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;
    const te=new THREE.CanvasTexture(em);te.colorSpace=THREE.SRGBColorSpace;te.wrapS=te.wrapT=THREE.RepeatWrapping;
    const tr=new THREE.CanvasTexture(rg);tr.wrapS=tr.wrapT=THREE.RepeatWrapping;
    const nm=AS.tex[o.tex]?AS.tex[o.tex].n.clone():null;if(nm){nm.wrapS=nm.wrapT=THREE.RepeatWrapping;nm.repeat.set(TILE_W/o.texScale,FLOOR*3/o.texScale);nm.needsUpdate=true;}
    const m=new THREE.MeshStandardMaterial({map:t,emissiveMap:te,emissive:0xffffff,emissiveIntensity:o.emi??1.6,roughnessMap:tr,roughness:1,metalness:o.metal??0,normalMap:nm,envMapIntensity:o.env??.9});
    if(nm)m.normalScale.set(.8,.8);
    FAC[name]=m;};
  // sash window (Georgian / Victorian)
  const glassGrad=(x,X,Y,w,h,R)=>{const g=x.createLinearGradient(X,Y,X,Y+h);g.addColorStop(0,'#3a4450');g.addColorStop(.5,'#151a20');g.addColorStop(1,'#0b0e12');x.fillStyle=g;x.fillRect(X,Y,w,h);};
  const lit=(e,X,Y,w,h,R,p=.16)=>{if(R()<p){const warm=R()<.8;e.fillStyle=warm?`rgb(${200+R()*55|0},${130+R()*60|0},${60+R()*40|0})`:'rgb(90,130,200)';e.fillRect(X,Y,w,h);if(R()<.5){e.fillStyle='rgba(0,0,0,.55)';e.fillRect(X,Y,w*(.2+R()*.4),h);}}};
  const sash=(frame,lintel,arch)=>(x,e,r,X,Y,bay,fl,R,f,b)=>{const w=bay*.36,h=fl*.6,wx=X+(bay-w)/2,wy=Y+fl*.2;
    if(lintel){x.fillStyle=lintel;x.fillRect(wx-6,wy-14,w+12,14);x.fillRect(wx-8,wy+h,w+16,9);}
    if(arch){x.fillStyle='rgba(60,30,20,.6)';x.beginPath();x.arc(wx+w/2,wy+4,w/2+6,Math.PI,0);x.fill();}
    glassGrad(x,wx,wy,w,h,R);r.fillStyle='#1a1a1a';r.fillRect(wx,wy,w,h);lit(e,wx,wy,w,h,R,f===0?.08:.17);
    if(R()<.25){x.fillStyle=['#6a2a24','#c8b89a','#2a3a4a','#8a7a5a'][R()*4|0];x.fillRect(wx+3,wy+3,w*.25,h-6);x.fillRect(wx+w*.75-3,wy+3,w*.25,h-6);}
    x.fillStyle=frame;x.fillRect(wx,wy,w,5);x.fillRect(wx,wy+h-5,w,5);x.fillRect(wx,wy,5,h);x.fillRect(wx+w-5,wy,5,h);x.fillRect(wx,wy+h/2-3,w,6);x.fillRect(wx+w/2-2,wy,4,h);
    for(const k of[1,2])x.fillRect(wx+k*w/3-1,wy,2,h);
    if(R()<.06){x.fillStyle='#4a3a28';x.fillRect(wx,wy,w,h);}// boarded
    if(R()<.08){x.strokeStyle='rgba(220,230,240,.7)';x.lineWidth=1.5;x.beginPath();x.moveTo(wx+R()*w,wy);x.lineTo(wx+R()*w,wy+h);x.stroke();}};
  mk('stock',{tex:'brick2',texScale:2.4,tint:'#d9c7a0',draw:sash('#e8e4da','#d6cdbb')});
  mk('red',{tex:AS.tex.brick2k?'brick2k':'brick',texScale:2.4,tint:'#c98e78',draw:sash('#ecebe4','#cfc6b2',true)});
  mk('darkbrick',{tex:'brick',texScale:2.2,tint:'#8a7466',draw:sash('#d8d6cc','#a89c88')});
  mk('stucco',{tex:'plaster',texScale:3,tint:'#e9e3d6',bands:'rgba(255,250,240,.5)',bandH:8,draw:sash('#f4f2ec',null)});
  mk('warehouse',{tex:'brick',texScale:2,tint:'#7a5a4a',draw:(x,e,r,X,Y,bay,fl,R,f,b)=>{const w=bay*.3,h=fl*.48,wx=X+(bay-w)/2,wy=Y+fl*.25;x.fillStyle='#5a3a2a';x.beginPath();x.arc(wx+w/2,wy+6,w/2+5,Math.PI,0);x.fill();glassGrad(x,wx,wy,w,h,R);r.fillStyle='#202020';r.fillRect(wx,wy,w,h);lit(e,wx,wy,w,h,R,.08);x.fillStyle='#2a2420';for(let k=1;k<4;k++)x.fillRect(wx+k*w/4,wy,3,h);for(let k=1;k<3;k++)x.fillRect(wx,wy+k*h/3,w,3);if(b===1&&R()<.6){x.fillStyle='#3a4a3a';x.fillRect(X+bay*.3,Y+fl*.1,bay*.4,fl*.8);}}});
  mk('council',{tex:'brick',texScale:2.2,tint:'#9a7a62',bands:'#b8b4aa',bandH:22,draw:(x,e,r,X,Y,bay,fl,R,f,b)=>{const w=bay*.78,h=fl*.42,wx=X+(bay-w)/2,wy=Y+fl*.28;glassGrad(x,wx,wy,w,h,R);r.fillStyle='#202020';r.fillRect(wx,wy,w,h);lit(e,wx,wy,w,h,R,.14);x.fillStyle='#e8e6e0';x.fillRect(wx,wy,w,4);x.fillRect(wx,wy+h-4,w,4);for(let k=0;k<=3;k++)x.fillRect(wx+k*w/3-2,wy,4,h);
    if(b%2===0&&R()<.7){x.fillStyle='rgba(40,40,40,.85)';x.fillRect(X+4,Y+fl*.68,bay-8,fl*.3);x.fillStyle='#c8c4b8';for(let k=X+8;k<X+bay-6;k+=9)x.fillRect(k,Y+fl*.7,2,fl*.28);x.fillRect(X+4,Y+fl*.68,bay-8,4);if(R()<.4){x.fillStyle=['#c03030','#3060a0','#e0e0e0'][R()*3|0];x.fillRect(X+20+R()*80,Y+fl*.72,30,fl*.18);}}}});
  mk('portland',{tex:'concrete',texScale:3,tint:'#e4ddcc',bands:'#d8d0bc',bandH:10,draw:(x,e,r,X,Y,bay,fl,R,f,b)=>{const w=bay*.42,h=fl*.62,wx=X+(bay-w)/2,wy=Y+fl*.18;x.fillStyle='rgba(120,110,90,.35)';x.fillRect(wx-10,wy-10,w+20,h+20);glassGrad(x,wx,wy,w,h,R);r.fillStyle='#181818';r.fillRect(wx,wy,w,h);lit(e,wx,wy,w,h,R,.12);x.fillStyle='#3a3a36';x.fillRect(wx+w/2-2,wy,4,h);x.fillRect(wx,wy+h*.3,w,4);}});
  mk('glass',{tex:'metal',texScale:3,tint:'#5a6670',metal:.6,env:1.6,emi:1.3,draw:(x,e,r,X,Y,bay,fl,R,f,b)=>{const g=x.createLinearGradient(X,Y,X+bay,Y+fl);g.addColorStop(0,'#5a7088');g.addColorStop(.6,'#223040');g.addColorStop(1,'#3a4a5a');x.fillStyle=g;x.fillRect(X,Y+fl*.12,bay,fl*.82);r.fillStyle='#0c0c0c';r.fillRect(X,Y+fl*.12,bay,fl*.82);for(let k=0;k<3;k++)lit(e,X+k*bay/3+3,Y+fl*.14,bay/3-6,fl*.78,R,.1);x.fillStyle='#7a828a';for(let k=0;k<=3;k++)x.fillRect(X+k*bay/3-2,Y,4,fl);x.fillStyle='#2a3036';x.fillRect(X,Y,bay,fl*.12);}});
  mk('cladding',{tex:'metal',texScale:2.5,tint:'#8a9098',bands:'#5a6068',bandH:6,draw:(x,e,r,X,Y,bay,fl,R,f,b)=>{const pc=['#7a8a96','#a8a49a','#5a6a5a','#9a7a5a'];x.fillStyle=pc[(b+f*3)%4];x.globalAlpha=.35;x.fillRect(X,Y,bay,fl);x.globalAlpha=1;const w=bay*.5,h=fl*.5,wx=X+(bay-w)/2,wy=Y+fl*.25;glassGrad(x,wx,wy,w,h,R);r.fillStyle='#181818';r.fillRect(wx,wy,w,h);lit(e,wx,wy,w,h,R,.12);x.fillStyle='#d0d0d0';x.fillRect(wx,wy,w,3);x.fillRect(wx+w/2-1,wy,3,h);}});
  mk('ragstone',{tex:AS.tex.stonewall?'stonewall':'concrete',texScale:2.6,tint:'#c8c0ae',draw:(x,e,r,X,Y,bay,fl,R,f,b)=>{if((b+f)%2)return;const w=bay*.16,h=fl*.5,wx=X+(bay-w)/2,wy=Y+fl*.25;x.fillStyle='#5a5448';x.beginPath();x.moveTo(wx-6,wy+8);x.lineTo(wx+w/2,wy-20);x.lineTo(wx+w+6,wy+8);x.fill();glassGrad(x,wx,wy,w,h,R);r.fillStyle='#181818';r.fillRect(wx,wy,w,h);lit(e,wx,wy,w,h,R,.05);}});
  // ground-floor shopfront strip: 4 units x 4 m, 4.2 m high
  {const W2=1024,H2=272;const col=document.createElement('canvas');col.width=W2;col.height=H2;const x=col.getContext('2d');const em=document.createElement('canvas');em.width=W2;em.height=H2;const e=em.getContext('2d');e.fillStyle='#000';e.fillRect(0,0,W2,H2);
   const rg=document.createElement('canvas');rg.width=W2;rg.height=H2;const r=rg.getContext('2d');r.fillStyle='#c0c0c0';r.fillRect(0,0,W2,H2);const R=mulberry(99);const u=W2/4;
   for(let k=0;k<4;k++){const X=k*u;x.fillStyle='#1a1614';x.fillRect(X,0,u,H2);x.fillStyle=['#2a1414','#14202a','#1a2a18','#2a2410'][k];x.fillRect(X+6,10,u-12,52);// fascia (sign meshes sit on top)
     const kind=[0,1,2,1][k];
     if(kind===0){const g=x.createLinearGradient(X,70,X,H2);g.addColorStop(0,'#2a3440');g.addColorStop(1,'#0a0c10');x.fillStyle=g;x.fillRect(X+10,70,u-20,H2-80);r.fillStyle='#101010';r.fillRect(X+10,70,u-20,H2-80);e.fillStyle='rgb(150,170,150)';e.fillRect(X+14,74,u-28,(H2-90)*.5);x.fillStyle='#8a8a8a';x.fillRect(X+u*.55,70,5,H2-80);x.fillStyle='#ddd';x.font='bold 22px sans-serif';x.fillText('OPEN',X+20,110);}
     else if(kind===1){x.fillStyle='#7d8082';x.fillRect(X+8,66,u-16,H2-70);for(let y=66;y<H2;y+=8){x.fillStyle='#5a5d5f';x.fillRect(X+8,y,u-16,3);}r.fillStyle='#909090';r.fillRect(X+8,66,u-16,H2-70);x.globalAlpha=.85;x.lineWidth=8;x.strokeStyle=['#c83030','#30a0c8','#e0c020','#40c040'][R()*4|0];x.beginPath();x.moveTo(X+20,H2-50);x.bezierCurveTo(X+70,120,X+150,H2-20,X+u-20,140);x.stroke();x.globalAlpha=1;}
     else{x.fillStyle='#8a6a40';x.fillRect(X+8,66,u-16,H2-70);for(let i=0;i<5;i++){x.fillStyle=`rgba(60,40,20,${.2+R()*.3})`;x.fillRect(X+8+i*(u-16)/5,66,2,H2-70);}x.fillStyle='#e8e8e8';x.font='bold 26px Oswald, Impact';x.fillText(['KEEP OUT','HELP','NO FOOD'][R()*3|0],X+20,170);}
     x.fillStyle='#2a2420';x.fillRect(X,0,8,H2);}
   const t=new THREE.CanvasTexture(col);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;const te=new THREE.CanvasTexture(em);te.colorSpace=THREE.SRGBColorSpace;te.wrapS=THREE.RepeatWrapping;const tr=new THREE.CanvasTexture(rg);tr.wrapS=THREE.RepeatWrapping;
   FAC.shop=new THREE.MeshStandardMaterial({map:t,emissiveMap:te,emissive:0xffffff,emissiveIntensity:1.4,roughnessMap:tr,roughness:1,metalness:.2,envMapIntensity:1.1});}
  FAC.flat=pbr('gravel',{color:0x4a4844,rough:1,env:.3,fallback:0x2a2a2a});FAC.slate=MAT.slate;
  FAC.far=new THREE.MeshBasicMaterial({color:new THREE.Color(SKY.silhouette).lerp(new THREE.Color(SKY.fog),.35),fog:false});
  FAC.farWin=new THREE.MeshBasicMaterial({color:0xffb860,fog:false});
}
const STYLES=['stock','red','warehouse','council','portland','glass','stucco','ragstone','cladding','darkbrick'];

// ---------------------------------------------------------------- buildings
const BLD=[];const BGRID=new Map();const BG=40;
function gridAdd(G,cell,x0,z0,x1,z1,v){for(let i=Math.floor(x0/cell);i<=Math.floor(x1/cell);i++)for(let j=Math.floor(z0/cell);j<=Math.floor(z1/cell);j++){const k=i+','+j;let a=G.get(k);if(!a)G.set(k,a=[]);a.push(v);}}
function buildBuildings(){
  for(const b of WD.buildings){const [h,mh,roof,sty,shop,lv,ring,holes,signs,name]=b;if(ring.length<6)continue;
    let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<ring.length;i+=2){x0=Math.min(x0,ring[i]);x1=Math.max(x1,ring[i]);z0=Math.min(z0,ring[i+1]);z1=Math.max(z1,ring[i+1]);}
    const cx=(x0+x1)/2,cz=(z0+z1)/2;const rs=routeS(cx,cz);const far=rs.d>380;
    if(far){if(h<40)continue;farBuilding(ring,h,cx,cz);continue;}
    if(mh<.5){const B={ring,x0,z0,x1,z1,h};BLD.push(B);gridAdd(BGRID,BG,x0,z0,x1,z1,B);}
    building(ring,holes,h,mh,roof,STYLES[sty]||'stock',shop,signs,cx,cz,rs.d);}
}
function farBuilding(ring,h,cx,cz){const gb=bk(FAC.far,cx,cz,{far:true});let r=ring;if(area2(r)>0){const q=[];for(let i=r.length-2;i>=0;i-=2)q.push(r[i],r[i+1]);r=q;}
  const n=r.length/2;for(let i=0;i<n;i++){const ax=r[i*2],az=r[i*2+1],bx=r[((i+1)%n)*2],bz=r[((i+1)%n)*2+1];const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1;const nx=-dz/L,nz=dx/L;const a=gb.v(ax,-1,az,nx,0,nz,0,0),b=gb.v(bx,-1,bz,nx,0,nz,0,0),c=gb.v(bx,h,bz,nx,0,nz,0,0),d=gb.v(ax,h,az,nx,0,nz,0,0);gb.i.push(a,b,c,a,c,d);}
  flatPoly(gb,r,[],h,4);}
function building(ring,holes,h,mh,roof,sty,shop,signs,cx,cz,dRoute){
  // ensure clockwise (math orientation) → outward normal (-dz,dx)
  let r=ring;if(area2(r)>0){const q=[];for(let i=r.length-2;i>=0;i-=2)q.push(r[i],r[i+1]);r=q;}
  const n=r.length/2;const fm=FAC[sty]||FAC.stock;const cast=dRoute<120;
  const gW=bk(fm,cx,cz,{cast}),gS=shop?bk(FAC.shop,cx,cz,{cast}):null;
  // roof geometry decisions
  let minE=1e9,edges=[];for(let i=0;i<n;i++){const ax=r[i*2],az=r[i*2+1],bx=r[((i+1)%n)*2],bz=r[((i+1)%n)*2+1];const L=Math.hypot(bx-ax,bz-az);edges.push(L);minE=Math.min(minE,L);}
  let pitched=roof>0&&h<26&&!(holes&&holes.length);let gable=pitched&&roof===1&&n===4;
  let depth=0;if(gable){depth=Math.min(edges[0],edges[1]);}
  let rh=pitched?clamp((gable?depth:Math.sqrt(Math.abs(area2(r))))*.32,1.4,4.2):0;if(pitched&&h-rh<2.6)rh=Math.max(0,h-2.6);
  const he=h-rh;
  const gy=shop&&he>5.2?4.2:0;
  // walls
  const wallRing=(rr,hole)=>{const m=rr.length/2;for(let i=0;i<m;i++){const ax=rr[i*2],az=rr[i*2+1],bx=rr[((i+1)%m)*2],bz=rr[((i+1)%m)*2+1];const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);if(L<.05)continue;const nx=-dz/L,nz=dx/L;
      const nb=Math.max(0,Math.round(L/3.6));const u1=nb?nb/4:.012;// whole bays per edge
      const band=(gb,y0,y1,v0,v1,uu)=>{const a=gb.v(ax,y0,az,nx,0,nz,0,v0),b=gb.v(bx,y0,bz,nx,0,nz,uu,v0),c=gb.v(bx,y1,bz,nx,0,nz,uu,v1),d=gb.v(ax,y1,az,nx,0,nz,0,v1);gb.i.push(a,b,c,a,c,d);};
      const y0=Math.max(mh,0)-(mh<.5?.3:0);
      if(gy&&!hole){band(gS,y0,gy,0,1,Math.max(1,Math.round(L/4))/4);}
      const yb=gy&&!hole?gy:y0;if(he>yb+.2){const nf=Math.max(1,Math.round((he-yb)/FLOOR));band(gW,yb,he,(gy&&!hole?0:(mh<.5?-.3/(FLOOR*3):0)),nf/3,u1);}
      // gable end
      if(gable&&!hole&&(i===gIdx[0]||i===gIdx[1])){const mx=(ax+bx)/2,mz=(az+bz)/2;const a=gW.v(ax,he,az,nx,0,nz,0,0),b=gW.v(bx,he,bz,nx,0,nz,u1,0),c=gW.v(mx,h,mz,nx,0,nz,u1/2,rh/(FLOOR*3));gW.i.push(a,b,c);}}};
  let gIdx=[-1,-1];if(gable){gIdx=edges[0]<edges[1]?[0,2]:[1,3];}
  wallRing(r,false);
  for(const ho of holes||[]){let q=ho;if(area2(q)<0){const t=[];for(let i=q.length-2;i>=0;i-=2)t.push(q[i],q[i+1]);q=t;}wallRing(q,true);}
  // roofs
  if(dRoute<90&&mh<.5&&!gable)buildingDetail(r,h,he,mh,gy,sty,pitched,cx,cz,dRoute,null);
  if(!pitched){const gr=bk(FAC.flat,cx,cz);flatPoly(gr,r,holes,h,6);
    // parapet coping (thin stone line) for brick styles
    return;}
  const gr=bk(FAC.slate,cx,cz,{cast});
  if(gable){const s=gIdx[0];const P=k=>[r[(k%4)*2],r[(k%4)*2+1]];const a0=P(s),a1=P(s+1),b0=P(s+2),b1=P(s+3);// short edges s and s+2
    const m1=[(a0[0]+a1[0])/2,(a0[1]+a1[1])/2],m2=[(b0[0]+b1[0])/2,(b0[1]+b1[1])/2];
    const slope=(p,q,mA,mB)=>{// eave edge p->q, ridge mB->mA
      const ex=q[0]-p[0],ez=q[1]-p[1];const L=Math.hypot(ex,ez)||1;let nx=-ez/L,nz=ex/L;const run=depth/2;const len=Math.hypot(run,rh);const ny=run/len,ns=rh/len;
      const a=gr.v(p[0],he,p[1],nx*ns,ny,nz*ns,0,0),b=gr.v(q[0],he,q[1],nx*ns,ny,nz*ns,L/3,0),c=gr.v(mA[0],h,mA[1],nx*ns,ny,nz*ns,L/3,len/3),d=gr.v(mB[0],h,mB[1],nx*ns,ny,nz*ns,0,len/3);gr.i.push(a,b,c,a,c,d);};
    slope(a1,b0,m2,m1);slope(b1,a0,m1,m2);if(dRoute<90&&mh<.5)buildingDetail(r,h,he,mh,gy,sty,true,cx,cz,dRoute,[m1[0],m1[1],m2[0],m2[1]]);return;}
  // hipped: inset ring
  const d=Math.min(rh*1.4,minE*.45,6);const inner=[];let ok=true;
  for(let i=0;i<n;i++){const p=[r[i*2],r[i*2+1]],a=[r[((i-1+n)%n)*2],r[((i-1+n)%n)*2+1]],b=[r[((i+1)%n)*2],r[((i+1)%n)*2+1]];
    const e1=[p[0]-a[0],p[1]-a[1]],e2=[b[0]-p[0],b[1]-p[1]];const l1=Math.hypot(...e1)||1,l2=Math.hypot(...e2)||1;const n1=[-e1[1]/l1,e1[0]/l1],n2=[-e2[1]/l2,e2[0]/l2];let m=[n1[0]+n2[0],n1[1]+n2[1]];const ml=Math.hypot(...m);if(ml<.2){ok=false;break;}m=[m[0]/ml,m[1]/ml];const k=d/Math.max(.35,m[0]*n1[0]+m[1]*n1[1]);inner.push(p[0]-m[0]*k,p[1]-m[1]*k);}
  if(!ok||area2(inner)>=0||Math.abs(area2(inner))<Math.abs(area2(r))*.04){flatPoly(bk(FAC.flat,cx,cz),r,holes,he,6);return;}
  for(let i=0;i<n;i++){const j=(i+1)%n;const ax=r[i*2],az=r[i*2+1],bx=r[j*2],bz=r[j*2+1],cx2=inner[j*2],cz2=inner[j*2+1],dx2=inner[i*2],dz2=inner[i*2+1];const ex=bx-ax,ez=bz-az,L=Math.hypot(ex,ez)||1;const nx=-ez/L,nz=ex/L;const len=Math.hypot(d,rh);const ny=d/len,ns=rh/len;
    const a=gr.v(ax,he,az,nx*ns,ny,nz*ns,0,0),b=gr.v(bx,he,bz,nx*ns,ny,nz*ns,L/3,0),c=gr.v(cx2,h,cz2,nx*ns,ny,nz*ns,L/3,len/3),dd=gr.v(dx2,h,dz2,nx*ns,ny,nz*ns,0,len/3);gr.i.push(a,b,c,a,c,dd);}
  flatPoly(gr,inner,[],h,3);
  // shop signs
}

// ---------------------------------------------------------------- 3D facade detail for buildings near the route
const SILL={stock:[.2,.8],red:[.2,.8],darkbrick:[.2,.8],stucco:[.2,.8],warehouse:[.27,.73],council:[.3,.72],portland:[.18,.8],ragstone:[0,0],glass:[0,0],cladding:[.25,.75]};
let DM=null;function detMats(){if(DM)return DM;DM={stone:pbr('concrete',{color:0xdcd4c4,fallback:0xbbb2a2}),conc:pbr('concrete',{color:0xb8b4ac,fallback:0x9a968e}),dark:new THREE.MeshStandardMaterial({color:0x202326,roughness:.5,metalness:.6}),
  brick:pbr('brick',{color:0x9a6a52,fallback:0x6a4030}),pot:new THREE.MeshStandardMaterial({color:0x8a4a30,roughness:.9}),plant:new THREE.MeshStandardMaterial({color:0x8a8e92,roughness:.5,metalness:.7}),
  awn:[0x1f4a2a,0x6a1a1a,0x1a2a5a,0x3a3a3a,0x7a5a1a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.85,side:THREE.DoubleSide}))};return DM;}
function boxW(gb,cx,cy,cz,w,h,d,dx,dz){// oriented box: w along (dx,dz), d along normal
  const nx=-dz,nz=dx;const hw=w/2,hd=d/2;const P=(a,y,b)=>[cx+dx*a+nx*b,cy+y,cz+dz*a+nz*b];
  const F=[[[-hw,0,hd],[hw,0,hd],[hw,h,hd],[-hw,h,hd],[nx,0,nz]],[[hw,0,-hd],[-hw,0,-hd],[-hw,h,-hd],[hw,h,-hd],[-nx,0,-nz]],[[hw,0,hd],[hw,0,-hd],[hw,h,-hd],[hw,h,hd],[dx,0,dz]],[[-hw,0,-hd],[-hw,0,hd],[-hw,h,hd],[-hw,h,-hd],[-dx,0,-dz]],[[-hw,h,hd],[hw,h,hd],[hw,h,-hd],[-hw,h,-hd],[0,1,0]],[[-hw,0,-hd],[hw,0,-hd],[hw,0,hd],[-hw,0,hd],[0,-1,0]]];
  for(const f of F){const n=f[4];const id=f.slice(0,4).map(([a,y,b],k)=>{const p=P(a,y,b);return gb.v(p[0],p[1],p[2],n[0],n[1],n[2],k===1||k===2?w/2:0,k>=2?h/2:0);});gb.i.push(id[0],id[1],id[2],id[0],id[2],id[3]);}}
function buildingDetail(r,h,he,mh,gy,sty,pitched,cx,cz,dRoute,ridge){const D=detMats();const n=r.length/2;const R=mulberry(H32(cx+'|'+cz));
  const trim=(sty==='council'||sty==='cladding'||sty==='glass')?D.conc:D.stone;const gT=bk(trim,cx,cz,{cast:dRoute<60}),gD=bk(D.dark,cx,cz);
  const near=dRoute<55;const sl=SILL[sty]||[0,0];
  for(let i=0;i<n;i++){const ax=r[i*2],az=r[i*2+1],bx=r[((i+1)%n)*2],bz=r[((i+1)%n)*2+1];const L=Math.hypot(bx-ax,bz-az);if(L<2.5)continue;const dx=(bx-ax)/L,dz=(bz-az)/L,nx=-dz,nz=dx;
    const at=(t,o)=>[ax+dx*t+nx*o,az+dz*t+nz*o];
    // cornice / eaves band and parapet
    if(!pitched){const [x,z]=at(L/2,.12);boxW(gT,x,h-.42,z,L+.3,.42,.32,dx,dz);const [px,pz]=at(L/2,-.08);boxW(gT,px,h,pz,L,.75,.22,dx,dz);}
    else{const [x,z]=at(L/2,.14);boxW(gT,x,he-.25,z,L+.4,.25,.34,dx,dz);}
    // shop fascia cornice + canopy
    if(gy){const [x,z]=at(L/2,.18);boxW(gT,x,gy-.05,z,L,.3,.4,dx,dz);if(near&&R()<.35&&L>4){const w=Math.min(L-1,6+R()*4);const [ax2,az2]=at(L/2,.9);const am=D.awn[(R()*D.awn.length)|0];const g=bk(am,cx,cz);
        const p0=at(L/2-w/2,.15),p1=at(L/2+w/2,.15),p2=at(L/2+w/2,1.5),p3=at(L/2-w/2,1.5);const y0=gy-.35,y1=gy-1.1;const a=g.v(p0[0],y0,p0[1],0,1,0,0,0),b=g.v(p1[0],y0,p1[1],0,1,0,1,0),c=g.v(p2[0],y1,p2[1],0,1,0,1,1),d=g.v(p3[0],y1,p3[1],0,1,0,0,1);g.i.push(a,c,b,a,d,c);}}
    // floor bands (string courses) for brick and stucco
    const yb=gy||Math.max(mh,0);const nf=Math.max(1,Math.round((he-yb)/FLOOR));const fh=(he-yb)/nf;
    if(sty!=='glass'&&sty!=='cladding'){for(let f=1;f<nf;f++){if(sty!=='stucco'&&sty!=='council'&&f!==1)continue;const [x,z]=at(L/2,.05);boxW(gT,x,yb+f*fh-.08,z,L,.14,.1,dx,dz);}}
    if(!near||!sl[0])continue;
    // window sills and lintels, per bay and floor (matches the facade texture grid)
    const nb=Math.max(0,Math.round(L/3.6));if(!nb)continue;const bw=L/nb;const ww=bw*(sty==='council'?.8:sty==='warehouse'?.32:.4);
    for(let f=gy?0:(sty==='council'?0:0);f<nf;f++){const y0=yb+f*fh;if(f===0&&!gy&&(sty==='stock'||sty==='red')&&R()<.1)continue;
      for(let k=0;k<nb;k++){const t=(k+.5)*bw;const [x,z]=at(t,.06);boxW(gT,x,y0+fh*sl[0]-.07,z,ww+.12,.08,.16,dx,dz);
        if(sty==='stock'||sty==='red'||sty==='darkbrick'||sty==='portland')boxW(gT,x,y0+fh*sl[1]+.02,z,ww+.16,.16,.08,dx,dz);
        if(sty==='council'&&f>0&&k%2===0){const [bx2,bz2]=at(t,.55);boxW(gT,bx2,y0-.08,bz2,bw*.92,.16,1.1,dx,dz);const [rx,rz]=at(t,1.08);boxW(gD,rx,y0+.08,rz,bw*.92,.95,.05,dx,dz);}}}}
  // roofs: chimney stacks along the ridge, plant on big flat roofs
  if(pitched&&ridge){const [x0,z0,x1,z1]=ridge;const L=Math.hypot(x1-x0,z1-z0);const k=Math.max(1,Math.floor(L/7));const dx=(x1-x0)/(L||1),dz=(z1-z0)/(L||1);const gB=bk(D.brick,cx,cz,{cast:true}),gP=bk(D.pot,cx,cz);
    for(let i=0;i<k;i++){if(R()<.3)continue;const t=(i+.5)/k;const x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;boxW(gB,x,h-.6,z,.95,1.8,.55,dx,dz);boxW(gT,x,h+1.2,z,1.05,.1,.65,dx,dz);for(const o of[-.22,.22])cyl(gP,x+dx*o,z+dz*o,.09,.45,6,h+1.3);}}
  else if(!pitched){const A=Math.abs(area2(r));if(A>250){const gp=bk(D.plant,cx,cz);const m=Math.min(4,1+(A/600|0));for(let i=0;i<m;i++){const t=R(),u=R();const p=[r[0]+(cx-r[0])*(.3+u*.5),r[1]+(cz-r[1])*(.3+t*.5)];boxW(gp,p[0],h,p[1],1.4+R()*1.6,.9+R()*.8,1+R(),1,0);}if(R()<.3)cyl(gp,cx,cz,1.1,2.2,10,h+.5);}}}

// shop fascia signs — atlas of labels
function buildSigns(){const labels=new Map();const list=[];
  for(const b of WD.buildings){const sg=b[8];if(!sg||!sg.length||b[4]===0)continue;let r=b[6];if(area2(r)>0){const q=[];for(let i=r.length-2;i>=0;i-=2)q.push(r[i],r[i+1]);r=q;}const n=r.length/2;
    for(const [k0,lab] of sg){let k=k0;if(area2(b[6])>0)k=(n-2-k0+n)%n;// re-index after reversal
      const ax=r[k*2],az=r[k*2+1],bx=r[((k+1)%n)*2],bz=r[((k+1)%n)*2+1];const L=Math.hypot(bx-ax,bz-az);if(L<3)continue;const t=lab||'';if(!labels.has(t)&&labels.size<120)labels.set(t,labels.size);list.push([ax,az,bx,bz,L,labels.has(t)?labels.get(t):(H32(t)%Math.max(1,labels.size))]);}}
  if(!list.length)return;const cols=4,rows=Math.ceil(labels.size/cols),CW=512,CHh=72;
  const c=document.createElement('canvas');c.width=CW*cols;c.height=CHh*Math.max(rows,1);const x=c.getContext('2d');
  const pal=[['#101418','#ffd34d'],['#2a0d0d','#ff6a4d'],['#0c1a26','#7fd6ff'],['#0d2614','#7dff8f'],['#1d140a','#ffb35a'],['#14101f','#c98bff'],['#0a0a0a','#ff4d6d'],['#f0ece0','#1a2a6a'],['#1a3a1a','#f0e8c0'],['#5a0e0e','#f4e4c8']];
  for(const [t,i] of labels){const X=(i%cols)*CW,Y=(i/cols|0)*CHh;const p=pal[H32(t)%pal.length];x.fillStyle=p[0];x.fillRect(X,Y,CW,CHh);x.fillStyle=p[1];const fs=t.length>14?34:44;x.font=`bold ${fs}px Oswald, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(t,X+CW/2,Y+CHh/2+2,CW-30);x.strokeStyle=p[1];x.globalAlpha=.5;x.lineWidth=3;x.strokeRect(X+5,Y+5,CW-10,CHh-10);x.globalAlpha=1;}
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
  const mat=new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:0xffffff,emissiveIntensity:.9,roughness:.5});
  for(const [ax,az,bx,bz,L,i] of list){const gb=bk(mat,(ax+bx)/2,(az+bz)/2);const dx=(bx-ax)/L,dz=(bz-az)/L;const nx=-dz,nz=dx;const w=Math.min(L-.8,8.5),m0=(L-w)/2;const o=.12;const X0=ax+dx*m0+nx*o,Z0=az+dz*m0+nz*o,X1=ax+dx*(m0+w)+nx*o,Z1=az+dz*(m0+w)+nz*o;
    const u0=(i%cols)/cols,u1=u0+1/cols,v1=1-(i/cols|0)/Math.max(rows,1),v0=v1-1/Math.max(rows,1);const y0=3.25,y1=4.0;
    const a=gb.v(X0,y0,Z0,nx,0,nz,u0,v0),b=gb.v(X1,y0,Z1,nx,0,nz,u1,v0),cc=gb.v(X1,y1,Z1,nx,0,nz,u1,v1),d=gb.v(X0,y1,Z0,nx,0,nz,u0,v1);gb.i.push(a,b,cc,a,cc,d);}}
const H32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};

// ---------------------------------------------------------------- roads, pavements, markings
const RCAP=[];const RGRID=new Map();const RG=40;
function ribbon(gb,pts,w,y,us,vs,uoff=0){// pts flat [x,z,...]
  const n=pts.length/2;if(n<2)return;let acc=0;let prev=null;
  for(let i=0;i<n;i++){const x=pts[i*2],z=pts[i*2+1];let tx=0,tz=0;if(i>0){const dx=x-pts[i*2-2],dz=z-pts[i*2-1],l=Math.hypot(dx,dz)||1;tx+=dx/l;tz+=dz/l;}if(i<n-1){const dx=pts[i*2+2]-x,dz=pts[i*2+3]-z,l=Math.hypot(dx,dz)||1;tx+=dx/l;tz+=dz/l;}
    const tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;let nx=tz,nz=-tx;let k=1;if(i>0&&i<n-1){const dx=x-pts[i*2-2],dz=z-pts[i*2-1],l=Math.hypot(dx,dz)||1;const dot=(dz/l)*nx+(-dx/l)*nz;k=1/Math.max(.55,dot);}
    if(i>0)acc+=Math.hypot(x-pts[i*2-2],z-pts[i*2-1]);const hw=w/2*k;
    const a=gb.v(x+nx*hw,y,z+nz*hw,0,1,0,uoff+w/2/us,acc/vs),b=gb.v(x-nx*hw,y,z-nz*hw,0,1,0,uoff-w/2/us,acc/vs);
    if(prev!==null)gb.i.push(prev[0],prev[1],a,prev[1],b,a);prev=[a,b];}}
function offsetLine(pts,off){const n=pts.length/2,o=[];for(let i=0;i<n;i++){const x=pts[i*2],z=pts[i*2+1];let tx=0,tz=0;if(i>0){const dx=x-pts[i*2-2],dz=z-pts[i*2-1],l=Math.hypot(dx,dz)||1;tx+=dx/l;tz+=dz/l;}if(i<n-1){const dx=pts[i*2+2]-x,dz=pts[i*2+3]-z,l=Math.hypot(dx,dz)||1;tx+=dx/l;tz+=dz/l;}const tl=Math.hypot(tx,tz)||1;o.push(x+tz/tl*off,z-tx/tl*off);}return o;}
function buildRoads(){
  MAT.pave=MAT.pave||pbr('pavement',{color:0x96a2ae,fallback:0x5a5c5e,rough:.8,env:.9});
  const yel=new THREE.MeshStandardMaterial({color:0xd8b020,roughness:.55});const kerbM=pbr('concrete',{color:0xb8b4ac,fallback:0x8a8a86});
  // capsules: [ax,az,bx,bz,hwOuter,surface,id,hwCarriage,bridge,cls]
  for(const [cls,w,br,layer,name,pts] of WD.roads){const n=pts.length/2;if(n<2)continue;const tb=name==='Tower Bridge';
    for(let i=0;i<n-1;i++){const ax=pts[i*2],az=pts[i*2+1],bx=pts[i*2+2],bz=pts[i*2+3];const hw=w/2+(cls<=4?3.2:1.2)+(tb?2.5:0);const c=[ax,az,bx,bz,hw,br?'bridge':'road',cls<=2?'main':'road',w/2+(tb?2.5:0),br,cls];RCAP.push(c);gridAdd(RGRID,RG,Math.min(ax,bx)-hw,Math.min(az,bz)-hw,Math.max(ax,bx)+hw,Math.max(az,bz)+hw,c);}
    if(!br)continue;
    // bridge decks: concrete deck + stone parapets (solid) + underside fascia
    let start=0;for(let i=1;i<n;i++){const L=Math.hypot(pts[i*2]-pts[start*2],pts[i*2+1]-pts[start*2+1]);if(L>120||i===n-1){const seg=pts.slice(start*2,i*2+2);const mx=seg[0],mz=seg[1];const dw=tb?w+10:w+4;
        ribbon(bk(MAT.road,mx,mz),seg,w,.035,5,5);ribbon(bk(MAT.pave,mx,mz),seg,dw,.03,3,3);
        for(const s of[-1,1]){const e=offsetLine(seg,s*(dw/2-.2));wallLine(bk(MAT.stone,mx,mz,{cast:true}),e,-.4,1.15,.5,3);segLine(e,.5);const u=offsetLine(seg,s*(dw/2));wallLine(bk(MAT.conc,mx,mz),u,-2.6,.03,.3,3);}
        start=i;}}}
  // unioned carriageways (clean junctions) + raised pavements with kerb faces
  for(const [ring,holes] of WD.carr){let x0=ring[0],z0=ring[1];// split huge polygons into chunks by bucket of first vertex (meshes are big but few)
    flatPoly(bk(MAT.road,x0,z0),ring,holes,0,5);}
  for(const [ring,holes] of WD.pave){flatPoly(bk(MAT.pave,ring[0],ring[1]),ring,holes,PAVE_Y,3);}
  for(const pts of WD.kerb){wallLine(bk(kerbM,pts[0],pts[1]),pts,-.02,PAVE_Y,.22,1.2);}
  for(const pts of WD.yellow){ribbon(bk(yel,pts[0],pts[1]),pts,.1,.008,1,1);}
  const dashes=[];for(const pts of WD.dash){let acc=0;for(let k=1;k<pts.length/2;k++){const ax=pts[k*2-2],az=pts[k*2-1],bx=pts[k*2],bz=pts[k*2+1];const L=Math.hypot(bx-ax,bz-az);const ry=Math.atan2(bx-ax,bz-az);for(let t=(4-acc%9+9)%9;t<L-1.5;t+=9)dashes.push([ax+(bx-ax)*(t+1.5)/L,.01,az+(bz-az)*(t+1.5)/L,ry]);acc+=L;}}
  const dg=new THREE.PlaneGeometry(.15,3);dg.rotateX(-Math.PI/2);
  const byChunk=new Map();for(const d of dashes){const k=Math.floor(d[0]/CH)+','+Math.floor(d[2]/CH);if(!byChunk.has(k))byChunk.set(k,[]);byChunk.get(k).push(d);}
  for(const [,L] of byChunk){const I=new THREE.InstancedMesh(dg,MAT.paint,L.length);L.forEach(([x,y,z,ry],i)=>{_q.setFromAxisAngle(_up,ry);_p.set(x,y,z);I.setMatrixAt(i,_m4.compose(_p,_q,_s));});I.receiveShadow=true;I.computeBoundingSphere();WORLDG.add(I);CHUNKS.push({m:I,c:I.boundingSphere.center.clone(),r:I.boundingSphere.radius});}
  // paths (parks, estates)
  for(const [ped,pts] of WD.paths){const pm=ped?MAT.pave:MAT.gravel;ribbon(bk(pm,pts[0],pts[1]),pts,ped?4:2.2,ped?PAVE_Y+.004:.09,3,3);}
}
const PAVE_Y=.13,GROUND_Y=.06;
// surface height under a point (carriageway 0, pavement kerb-high, bridge decks, open ground)
function groundH(x,z){const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(!cell)return GROUND_Y;let pave=false;
  for(const c of cell){const ax=c[0],az=c[1],dx=c[2]-ax,dz=c[3]-az;const L2=dx*dx+dz*dz||1;const t=clamp(((x-ax)*dx+(z-az)*dz)/L2,0,1);const d=Math.hypot(x-ax-dx*t,z-az-dz*t);
    if(c[8]){if(d<c[4])return .035;continue;}if(d<c[7])return 0;if(c[9]<=4&&d<c[4])pave=true;}
  return pave?PAVE_Y:GROUND_Y;}
// solid line segments (walls, railings, river edges, bridge parapets)
const SEG=new Map();const SGC=16;
function segAdd(ax,az,bx,bz,t,p=null){const s={ax,az,bx,bz,t,p};for(let i=Math.floor((Math.min(ax,bx)-t)/SGC);i<=Math.floor((Math.max(ax,bx)+t)/SGC);i++)for(let j=Math.floor((Math.min(az,bz)-t)/SGC);j<=Math.floor((Math.max(az,bz)+t)/SGC);j++){const k=i+','+j;let a=SEG.get(k);if(!a)SEG.set(k,a=[]);a.push(s);}}
function segLine(pts,t){for(let i=0;i<pts.length/2-1;i++)segAdd(pts[i*2],pts[i*2+1],pts[i*2+2],pts[i*2+3],t);}
function segAt(x,z,r){const a=SEG.get(Math.floor(x/SGC)+','+Math.floor(z/SGC));if(!a)return null;let best=null;
  for(const s of a){if(s.p&&!s.p.alive)continue;const dx=s.bx-s.ax,dz=s.bz-s.az;const L2=dx*dx+dz*dz||1;const t=clamp(((x-s.ax)*dx+(z-s.az)*dz)/L2,0,1);const qx=s.ax+dx*t,qz=s.az+dz*t;let nx=x-qx,nz=z-qz;const d=Math.hypot(nx,nz);const m=r+s.t/2;
    if(d<m){if(d<1e-4){nx=-dz;nz=dx;}const l=Math.hypot(nx,nz)||1;const q={x:qx+nx/l*m,z:qz+nz/l*m,d:m-d,seg:s};if(!best||q.d>best.d)best=q;}}return best;}
function onBridge(x,z,pad=2){const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(!cell)return false;for(const c of cell){if(!c[8])continue;if(!capRes(c,x,z,-pad))return true;}return false;}

// vertical strip along a polyline (walls, parapets, viaduct sides): thickness t, from y0 to y1
function wallLine(gb,pts,y0,y1,t,us){const n=pts.length/2;let acc=0;for(let i=0;i<n-1;i++){const ax=pts[i*2],az=pts[i*2+1],bx=pts[i*2+2],bz=pts[i*2+3];const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);if(L<.05)continue;const nx=-dz/L*t/2,nz=dx/L*t/2;
    for(const s of[1,-1]){const ox=nx*s,oz=nz*s;const A=[ax+ox,az+oz],B=[bx+ox,bz+oz];const nnx=s*-dz/L,nnz=s*dx/L;let a,b,c,d;
      if(s>0){a=gb.v(A[0],y0,A[1],nnx,0,nnz,acc/us,y0/us);b=gb.v(B[0],y0,B[1],nnx,0,nnz,(acc+L)/us,y0/us);c=gb.v(B[0],y1,B[1],nnx,0,nnz,(acc+L)/us,y1/us);d=gb.v(A[0],y1,A[1],nnx,0,nnz,acc/us,y1/us);}
      else{a=gb.v(B[0],y0,B[1],nnx,0,nnz,(acc+L)/us,y0/us);b=gb.v(A[0],y0,A[1],nnx,0,nnz,acc/us,y0/us);c=gb.v(A[0],y1,A[1],nnx,0,nnz,acc/us,y1/us);d=gb.v(B[0],y1,B[1],nnx,0,nnz,(acc+L)/us,y1/us);}
      gb.i.push(a,b,c,a,c,d);}
    const t0=gb.v(ax+nx,y1,az+nz,0,1,0,0,0),t1=gb.v(bx+nx,y1,bz+nz,0,1,0,L/us,0),t2=gb.v(bx-nx,y1,bz-nz,0,1,0,L/us,t/us),t3=gb.v(ax-nx,y1,az-nz,0,1,0,0,t/us);gb.i.push(t0,t1,t2,t0,t2,t3);acc+=L;}}

// ---------------------------------------------------------------- ground, river, parks
function buildAreas(){
  const gm=pbr('concrete',{color:0x8a8a88,fallback:0x3a3a38,rough:.9});
  for(const [ring,holes] of WD.ground){flatPoly(bk(gm,0,0,{}),ring,holes,GROUND_Y,3.2);}
  const water=new THREE.MeshStandardMaterial({color:0x0b1418,roughness:.08,metalness:.3,envMapIntensity:1.5,normalMap:AS.tex.mud?AS.tex.mud.n:null});if(water.normalMap){water.normalMap=water.normalMap.clone();water.normalMap.wrapS=water.normalMap.wrapT=THREE.RepeatWrapping;water.normalMap.repeat.set(40,40);water.normalMap.needsUpdate=true;water.normalScale.set(.25,.25);}
  MAT.river=water;
  const mats={1:MAT.grass,2:MAT.grass,3:pbr('grass',{color:0x6a8a5a,fallback:0x2a3a22}),4:pbr('asphalt',{color:0x6a6a6a,rough:.7,env:1}),5:MAT.pave,6:pbr('grass',{color:0x5a6a48}),7:MAT.gravel,8:pbr('mud',{color:0xa09080,fallback:0x3a3028})};
  const ys={1:.08,2:.08,3:.085,4:.02,5:PAVE_Y+.002,6:.07,7:.07,8:.07};
  for(const [k,ring,holes] of WD.areas){if(k===0){// river / docks: water + embankment walls
      let x0=ring[0],z0=ring[1];const wg=bk(water,x0,z0,{far:false});flatPoly(wg,ring,holes,-2.6,40);
      const emb=bk(MAT.stone,x0,z0,{cast:false});const lineOf=r=>r.concat([r[0],r[1]]);for(const r of [ring,...(holes||[])]){const L=lineOf(r);wallLine(emb,L,-3.2,.55,.6,3);for(let i=0;i<L.length/2-1;i++){const mx=(L[i*2]+L[i*2+2])/2,mz=(L[i*2+1]+L[i*2+3])/2;if(!onBridge(mx,mz,3))segAdd(L[i*2],L[i*2+1],L[i*2+2],L[i*2+3],.6);}}continue;}
    const m=mats[k]||MAT.grass;flatPoly(bk(m,ring[0],ring[1]),ring,holes,ys[k]??-.1,k===4?5:4);
    if(k===4||k===5||k===2||k===1||k===3){// walkable zones
      AREA.push({ring,holes,s:k===4||k===5?'conc':'grass',k});}}
  for(const A of AREA){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<A.ring.length;i+=2){x0=Math.min(x0,A.ring[i]);x1=Math.max(x1,A.ring[i]);z0=Math.min(z0,A.ring[i+1]);z1=Math.max(z1,A.ring[i+1]);}A.bb=[x0,z0,x1,z1];gridAdd(AGRID,RG,x0,z0,x1,z1,A);}
}
const AREA=[],AGRID=new Map();
function inRing(r,x,z){let c=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const xi=r[i],zi=r[i+1],xj=r[j],zj=r[j+1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c;}return c;}

// ---------------------------------------------------------------- railways (brick viaducts out of London Bridge)
function buildRails(){
  const at=c=>{const ch=document.createElement('canvas');ch.width=512;ch.height=256;const x=ch.getContext('2d');const bi=AS.tex.brick&&AS.tex.brick.d.image;if(bi){const p=x.createPattern(bi,'repeat');p.setTransform(new DOMMatrix().scale(512/8/bi.width*2.2,256/4/bi.height*2.2));x.fillStyle=p;x.fillRect(0,0,512,256);}x.globalCompositeOperation='multiply';x.fillStyle='#8a6a58';x.fillRect(0,0,512,256);x.globalCompositeOperation='source-over';
    // one arch per 8 m tile (tile = 8 m x 8 m)
    x.fillStyle='#0c0a08';x.beginPath();x.moveTo(80,256);x.lineTo(80,120);x.arc(256,120,176,Math.PI,0);x.lineTo(432,256);x.fill();
    x.fillStyle='rgba(40,30,24,.7)';x.fillRect(0,40,512,10);if(c){x.fillStyle='#3a4450';x.fillRect(150,170,212,86);x.fillStyle='#c0c0c0';x.font='bold 30px Oswald, Impact';x.fillText(['MOT  ·  TYRES','STORAGE','GYM','BREWERY'][c%4],170,215);}
    const t=new THREE.CanvasTexture(ch);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;};
  const vm=new THREE.MeshStandardMaterial({map:at(0),roughness:.95,normalMap:AS.tex.brick?AS.tex.brick.n:null});
  const top=MAT.gravel;
  for(const [br,pts] of WD.rails){if(!br){ribbon(bk(MAT.gravel,pts[0],pts[1]),pts,3.2,-.05,3,3);continue;}
    // cut into 4 m pieces; leave headroom where streets pass underneath
    const n=pts.length/2;for(let i=0;i<n-1;i++){const ax=pts[i*2],az=pts[i*2+1],bx=pts[i*2+2],bz=pts[i*2+3];const L=Math.hypot(bx-ax,bz-az);const k=Math.max(1,Math.ceil(L/4));
      for(let j=0;j<k;j++){const x0=ax+(bx-ax)*j/k,z0=az+(bz-az)*j/k,x1=ax+(bx-ax)*(j+1)/k,z1=az+(bz-az)*(j+1)/k;const mx=(x0+x1)/2,mz=(z0+z1)/2;
        const under=roadUnder(mx,mz);const g=bk(vm,mx,mz,{cast:true});wallSeg(g,x0,z0,x1,z1,under?5.4:0,7.4,7,8);ribbon(bk(top,mx,mz),[x0,z0,x1,z1],7,7.41,3,3);
        if(!under){const B={ring:quadRing(x0,z0,x1,z1,3.5),x0:Math.min(x0,x1)-4,z0:Math.min(z0,z1)-4,x1:Math.max(x0,x1)+4,z1:Math.max(z0,z1)+4,h:7.4};BLD.push(B);gridAdd(BGRID,BG,B.x0,B.z0,B.x1,B.z1,B);}}}}}
function quadRing(x0,z0,x1,z1,hw){const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz)||1,nx=-dz/L*hw,nz=dx/L*hw;return[x0+nx,z0+nz,x1+nx,z1+nz,x1-nx,z1-nz,x0-nx,z0-nz];}
function wallSeg(gb,x0,z0,x1,z1,y0,y1,t,us){wallLine(gb,[x0,z0,x1,z1],y0,y1,t,us);}
function roadUnder(x,z){const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(!cell)return false;for(const c of cell){if(c[6]==='path')continue;if(!capRes(c,x,z,-.5))return true;}return false;}

// ---------------------------------------------------------------- walls, fences, railings
const WP=[],WT={};
function buildWalls(){const rail=(()=>{const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,128,128);x.fillStyle='#111';for(let i=0;i<128;i+=16){x.fillRect(i+6,6,4,122);x.beginPath();x.moveTo(i+4,10);x.lineTo(i+8,0);x.lineTo(i+12,10);x.fill();}x.fillRect(0,18,128,5);x.fillRect(0,110,128,5);const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.repeat.set(2,1);return t;})();
  const railM=new THREE.MeshStandardMaterial({color:0x1a1c1e,map:rail,alphaTest:.5,side:THREE.DoubleSide,roughness:.5,metalness:.6});
  const bw=pbr('brick2',{color:0xb09070,fallback:0x5a4030});const brickW=bw.clone();if(bw.map){brickW.map=bw.map.clone();brickW.map.repeat.set(1.2,1);brickW.map.needsUpdate=true;}
  Object.assign(WT,{0:{mat:brickW,h:1.9,t:.3,brk:9,dmg:9,mass:.35,snd:'brick'},1:{mat:railM,h:1.3,t:.06,brk:4.5,dmg:2.5,mass:.1,plane:true,snd:'metal'},2:{mat:MAT.hedge,h:1.6,t:1,brk:2.5,dmg:.6,mass:.12,snd:'leaf'},4:{mat:MAT.metal,h:.55,t:.1,brk:6.5,dmg:4,mass:.2,y0:.3,snd:'metal'}});
  for(const [t,h,pts] of WD.walls){if(t===3){wallLine(bk(MAT.stone,pts[0],pts[1],{cast:true}),pts,0,h||6,2.2,3);segLine(pts,2.2);continue;}const T=WT[t];if(!T)continue;const hh=Math.min(h||T.h,3);
    for(let i=0;i<pts.length/2-1;i++){const ax=pts[i*2],az=pts[i*2+1],bx=pts[i*2+2],bz=pts[i*2+3];const L=Math.hypot(bx-ax,bz-az);if(L<.2)continue;const n=Math.max(1,Math.round(L/2.5));
      for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n,z0=az+(bz-az)*k/n,x1=ax+(bx-ax)*(k+1)/n,z1=az+(bz-az)*(k+1)/n;const P={t,x0,z0,x1,z1,h:hh,L:L/n,alive:true,y:groundH((x0+x1)/2,(z0+z1)/2)};WP.push(P);segAdd(x0,z0,x1,z1,T.t,P);}}}
  const by=new Map();for(const P of WP){const k=P.t+'|'+Math.floor(P.x0/CH)+','+Math.floor(P.z0/CH);if(!by.has(k))by.set(k,[]);by.get(k).push(P);}
  const box=new THREE.BoxGeometry(1,1,1);box.translate(0,.5,0);const pl=new THREE.PlaneGeometry(1,1);pl.rotateY(Math.PI/2);pl.translate(0,.5,0);
  for(const [k,L] of by){const T=WT[L[0].t];const I=new THREE.InstancedMesh(T.plane?pl:box,T.mat,L.length);L.forEach((P,i)=>{_q.setFromAxisAngle(_up,Math.atan2(P.x1-P.x0,P.z1-P.z0));_p.set((P.x0+P.x1)/2,P.y+(T.y0||0),(P.z0+P.z1)/2);I.setMatrixAt(i,_m4.compose(_p,_q,_v3.set(T.plane?1:T.t,P.h,P.L+.02)));P.mesh=I;P.idx=i;});
    I.castShadow=!T.plane;I.receiveShadow=true;I.computeBoundingSphere();WORLDG.add(I);CHUNKS.push({m:I,c:I.boundingSphere.center.clone(),r:I.boundingSphere.radius});}}
function breakWall(P,sp,vx,vz){if(!P.alive)return null;P.alive=false;const T=WT[P.t];P.mesh.setMatrixAt(P.idx,_zero);P.mesh.instanceMatrix.needsUpdate=true;const cx=(P.x0+P.x1)/2,cz=(P.z0+P.z1)/2;const ry=Math.atan2(P.x1-P.x0,P.z1-P.z0);
  const n=P.t===0?7:P.t===2?3:2;for(let i=0;i<n;i++){const g=P.t===1?new THREE.PlaneGeometry(.06,P.h,P.L/2).rotateY(0):new THREE.BoxGeometry(P.t===0?T.t:T.t*.8,P.t===0?rnd(.3,.6):P.h*.6,P.t===0?rnd(.4,.8):P.L/2);
    const geo=P.t===1?new THREE.BoxGeometry(.04,P.h,P.L/2):g;geo.computeBoundingBox();const m=new THREE.Mesh(geo,T.mat);const t=(i+.5)/n-.5;m.position.set(cx+Math.sin(ry)*t*P.L,P.y+(P.t===0?rnd(.3,1.4):P.h/2),cz+Math.cos(ry)*t*P.L);m.rotation.y=ry;m.castShadow=true;scene.add(m);
    const k=1-T.mass;DEBRIS.push({m,v:new THREE.Vector3(vx*(.6+k*.3)+rnd(-1.5,1.5),rnd(1,3)+sp*.08,vz*(.6+k*.3)+rnd(-1.5,1.5)),w:new THREE.Vector3(rnd(-3,3),rnd(-2,2),rnd(-3,3)),bb:geo.boundingBox,sleep:0});}
  while(DEBRIS.length>140){const o=DEBRIS.shift();o.sleep=99;}
  if(T.snd==='leaf'){for(let i=0;i<24;i++)emit(cx,1,cz,vx*.3+rnd(-2,2),rnd(.5,3),vz*.3+rnd(-2,2),1.2,.12,.25,.35,.15,1,4);if(AU.on)noiseBurst(_pan(cx,cz),AC.currentTime,.5,1400,.6,.5,'lowpass');}
  else{for(let i=0;i<16;i++)emit(cx,.8,cz,vx*.3+rnd(-2,2),rnd(.5,3),vz*.3+rnd(-2,2),1.4,.25,.55,.48,.42,.6,3,.6);if(T.snd==='metal')sfxClang(cx,cz,.8);else{snd('crash',cx,cz,.9,.6);if(AU.on)noiseBurst(_pan(cx,cz),AC.currentTime,.9,500,.5,.7,'lowpass');}}
  return T;}
function tryBreakWall(P,sp,vx,vz,isCar){const T=WT[P.t];if(!T||sp<T.brk)return false;breakWall(P,sp,vx,vz);if(isCar){const L=toLocal(Math.sin(car.h),Math.cos(car.h));damageCar(T.dmg*clamp(sp/15,.5,1.6),{x:0,z:1},true);const slow=1-T.mass*clamp(sp/20,.4,1);car.vx*=slow;car.vz*=slow;shake=Math.max(shake,.15+T.mass);}return true;}

// ---------------------------------------------------------------- trees (London planes, autumn), street furniture, lamps
function buildTrees(){const T=WD.nodes.filter(n=>n[0]==='tree');if(!T.length)return;
  if(!AS.trees){buildTreesFallback(T);return;}
  // baked ez-tree variants (MIT, github.com/dgreenheck/ez-tree): name_lod_{bark,leaf}
  const V={};AS.trees.updateMatrixWorld(true);AS.trees.traverse(o=>{if(!o.isMesh)return;const m=/^(\w+?)_(hi|lo)_(bark|leaf)/.exec(o.name)||/^(\w+?)_(hi|lo)_(bark|leaf)/.exec(o.parent&&o.parent.name||'');if(!m)return;const g=deq(o.geometry.clone());g.applyMatrix4(o.matrixWorld);
    const mat=o.material;if(m[3]==='leaf'){mat.side=THREE.DoubleSide;mat.alphaTest=.45;mat.transparent=false;mat.roughness=.85;mat.envMapIntensity=.35;
      if(!mat.userData.sway){mat.userData.sway=true;mat.onBeforeCompile=sh=>{sh.uniforms.uT=TREE_T;sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec4 wp=instanceMatrix*vec4(position,1.);\n#else\nvec4 wp=vec4(position,1.);\n#endif\nfloat sw=sin(uT*1.7+wp.x*.21+wp.z*.17)*.08+sin(uT*3.1+wp.x*.7)*.03;transformed.x+=sw*position.y*.06;transformed.z+=sw*position.y*.04;');};}}
    else{mat.roughness=.95;mat.envMapIntensity=.3;}
    (V[m[1]]=V[m[1]]||{})[m[2]+'_'+m[3]]={g,mat};});
  const names=Object.keys(V).filter(n=>V[n].hi_bark&&V[n].lo_bark);if(!names.length){buildTreesFallback(T);return;}
  const TC=80;const by=new Map();
  for(const t of T){const R=mulberry(H32(t[1]+','+t[2]));const r=R();const v=r<.45?'plane':r<.68?'lime':r<.88?'ash':'bare';const name=names.includes(v)?v:names[0];const s=.72+R()*.45;const key=name+'|'+Math.floor(t[1]/TC)+','+Math.floor(t[2]/TC);if(!by.has(key))by.set(key,[]);by.get(key).push([t[1],groundH(t[1],t[2]),t[2],R()*6.28,s]);
    OBC.push({x:t[1],z:t[2],r:.38*s});}
  // far LOD = impostor: the detailed tree rendered once into a texture, shown on crossed cards (always grounded, ~4 tris)
  const IMP={};for(const name of names){const hb=V[name].hi_bark,hl=V[name].hi_leaf;const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0x9aa0b8,0x3a3028,1.4));const dl=new THREE.DirectionalLight(0xffb27a,2.2);dl.position.set(4,6,8);sc.add(dl);
    const m1=new THREE.Mesh(hb.g,hb.mat),m2=hl?new THREE.Mesh(hl.g,hl.mat):null;sc.add(m1);if(m2)sc.add(m2);const bb=new THREE.Box3().setFromObject(sc);const w=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z),h=bb.max.y;
    const cam=new THREE.OrthographicCamera(-w/2,w/2,h,0,-50,50);cam.position.set(0,0,20);cam.lookAt(0,0,0);const rt=new THREE.WebGLRenderTarget(256,512,{samples:0});rt.texture.colorSpace=THREE.SRGBColorSpace;
    const tm=renderer.toneMapping;renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(sc,cam);renderer.setRenderTarget(null);renderer.toneMapping=tm;
    const geo=BGU.mergeGeometries([0,1].map(i=>{const g=new THREE.PlaneGeometry(w,h);g.translate(0,h/2,0);g.rotateY(i*Math.PI/2);return g;}));
    IMP[name]={geo,mat:new THREE.MeshBasicMaterial({map:rt.texture,alphaTest:.5,side:THREE.DoubleSide,color:0xc8b8a8})};}
  for(const [key,L] of by){const name=key.split('|')[0];const parts={hi:[],lo:[]};
    for(const k of ['bark','leaf']){const P=V[name]['hi_'+k];if(!P)continue;const I=new THREE.InstancedMesh(P.g,P.mat,L.length);
      L.forEach(([x,y,z,r,s],i)=>{_q.setFromAxisAngle(_up,r);_p.set(x,y,z);I.setMatrixAt(i,_m4.compose(_p,_q,_v3.set(s,s,s)));});I.castShadow=true;I.receiveShadow=true;I.computeBoundingSphere();WORLDG.add(I);parts.hi.push(I);}
    {const P=IMP[name];const I=new THREE.InstancedMesh(P.geo,P.mat,L.length);L.forEach(([x,y,z,r,s],i)=>{_q.setFromAxisAngle(_up,r);_p.set(x,y,z);I.setMatrixAt(i,_m4.compose(_p,_q,_v3.set(s,s,s)));});I.computeBoundingSphere();WORLDG.add(I);parts.lo.push(I);}
    const c=parts.lo[0].boundingSphere.center.clone(),r=parts.lo[0].boundingSphere.radius;TREECH.push({hi:parts.hi,lo:parts.lo,c,r});}}
function deq(g){for(const k of Object.keys(g.attributes)){const a=g.attributes[k];if(a.array instanceof Float32Array&&!a.normalized)continue;const n=a.count,sz=a.itemSize,f=new Float32Array(n*sz);for(let i=0;i<n;i++)for(let j=0;j<sz;j++)f[i*sz+j]=a.getComponent?a.getComponent(i,j):[a.getX(i),a.getY(i),a.getZ(i),a.getW(i)][j];g.setAttribute(k,new THREE.BufferAttribute(f,sz));}return g;}
const TREECH=[],TREE_T={value:0};const _v3=new THREE.Vector3();
function updTrees(dt){TREE_T.value+=dt;const c=camera.position;const nearR=Q.high?75:45,farR=Q.high?330:260;for(const k of TREECH){const d=Math.hypot(k.c.x-c.x,k.c.z-c.z)-k.r;const hi=d<nearR,lo=!hi&&d<farR;for(const m of k.hi)m.visible=hi;for(const m of k.lo)m.visible=lo;}}

function buildTreesFallback(T){
  const fol=new THREE.IcosahedronGeometry(1,1);{const P=fol.attributes.position;for(let i=0;i<P.count;i++){const v=new THREE.Vector3().fromBufferAttribute(P,i);const n=1+.25*Math.sin(v.x*5.1)*Math.cos(v.y*4.3)+.18*Math.sin(v.z*7.7);v.multiplyScalar(n);P.setXYZ(i,v.x,v.y,v.z);}fol.computeVertexNormals();}
  const trunk=new THREE.CylinderGeometry(.16,.34,7,6);trunk.translate(0,3.5,0);const bark=pbr('planks',{color:0x6a5e50,fallback:0x3a2e24});
  const FM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,envMapIntensity:.4});const cols=[0x6a7a2a,0x9a7a22,0xa8561c,0x5a6a2a,0x8a6a24,0x8a3a18,0xb08a30];
  const byC=new Map();for(const t of T){const k=Math.floor(t[1]/CH)+','+Math.floor(t[2]/CH);if(!byC.has(k))byC.set(k,[]);byC.get(k).push(t);}
  for(const [,L] of byC){const TI=new THREE.InstancedMesh(trunk,bark,L.length),FI=new THREE.InstancedMesh(fol,FM,L.length*3);let fi=0;
    L.forEach((t,i)=>{const R=mulberry(H32(t[1]+','+t[2]));const s=.8+R()*.6;_q.setFromAxisAngle(_up,R()*6);_p.set(t[1],groundH(t[1],t[2]),t[2]);TI.setMatrixAt(i,_m4.compose(_p,_q,new THREE.Vector3(s,s*(.9+R()*.4),s)));
      const bare=R()<.25;for(let k=0;k<3;k++){const a=R()*6.3,d=k?1.6*s:0;_p.set(t[1]+Math.cos(a)*d,(7+(k?-.8:1.4)+R())*s,t[2]+Math.sin(a)*d);const sc=(k?2.3:3)*s*(bare?.55:1);FI.setMatrixAt(fi,_m4.compose(_p,_q,new THREE.Vector3(sc,sc*.8,sc)));FI.setColorAt(fi,new THREE.Color(cols[(R()*cols.length)|0]).multiplyScalar(bare?.45:.7+R()*.35));fi++;}
      OBC.push({x:t[1],z:t[2],r:.35});});
    TI.receiveShadow=FI.receiveShadow=true;TI.castShadow=true;TI.computeBoundingSphere();FI.computeBoundingSphere();WORLDG.add(TI,FI);CHUNKS.push({m:TI,c:TI.boundingSphere.center.clone(),r:TI.boundingSphere.radius+10});CHUNKS.push({m:FI,c:FI.boundingSphere.center.clone(),r:FI.boundingSphere.radius});}}
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
  for(const k of Object.keys(signTex))T(k,signParts(k),{r:.12,mass:.04,dmg:1.2,mat:'metal'});
  for(const [k,o] of [['trashbag',{r:.35,mass:.02,dmg:0,mat:'soft',min:.8}],['cardboard_box_01',{r:.35,mass:.02,dmg:0,mat:'soft',min:.8}],['plastic_crate_01',{r:.35,mass:.03,dmg:.2,mat:'soft',min:1}],['wooden_crate_01',{r:.45,mass:.08,dmg:.6,mat:'wood',min:1.5}],['old_tyre',{r:.4,mass:.05,dmg:.3,mat:'soft',min:1}]]){const g=kit(k);if(!g)continue;const parts=g.children.filter(c=>c.isMesh).map(c=>[c.geometry.clone(),c.material]);if(parts.length)T('k_'+k,parts,Object.assign(o,{kick:true}));}}
function buildFurniture(){brkTypes();
  const items=[];
  const pool=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'rgba(255,190,120,.55)');g.addColorStop(.5,'rgba(255,160,90,.18)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
  const poolM=new THREE.MeshBasicMaterial({map:pool,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-4});const pg=new THREE.PlaneGeometry(10,10);pg.rotateX(-Math.PI/2);const pools=[];
  for(const [k,x,z,a] of WD.nodes){if(k==='tree'||k==='cctv')continue;const R=mulberry(H32(k+x+'|'+z));let t=k,ry=a||0;
    if(k==='lamp'){t=R()<.45?'lampL':'lampD';}else if(k==='signal'){t=R()<.7?'signalA':'signalR';}
    else if(!a){const nr=nearestRoadDir(x,z);if(nr)ry=Math.atan2(nr.qx-x,nr.qz-z);}
    if(!BRKT[t])continue;const y=groundH(x,z);const it={t,x,z,y,ry,alive:true,obs:[]};items.push(it);
    if(t==='lampL'){const hx=x+Math.sin(ry)*1.08,hz=z+Math.cos(ry)*1.08;it.src={p:new THREE.Vector3(hx,y+4.9,hz),c:new THREE.Color(0xffb46a),i:34,d:24,dec:1.6,base:34};LSRC.push(it.src);it.pool=pools.length;pools.push([hx,hz]);}}
  lampPools(items,pools,pg,poolM);BRKQ.push(...items);
}
const BRKQ=[];
function flushBrk(){const items=BRKQ.splice(0);
  const by=new Map();for(const it of items){const key=it.t+'|'+Math.floor(it.x/CH)+','+Math.floor(it.z/CH);if(!by.has(key))by.set(key,[]);by.get(key).push(it);}
  for(const [key,L] of by){const T=BRKT[L[0].t];const I=new THREE.InstancedMesh(T.geo,T.mats,L.length);L.forEach((it,i)=>{_q.setFromAxisAngle(_up,it.ry);_p.set(it.x,it.y,it.z);I.setMatrixAt(i,_m4.compose(_p,_q,_v3.setScalar(it.sc||1)));it.mesh=I;it.idx=i;});
    I.castShadow=L[0].t!=='busstop';I.receiveShadow=true;I.computeBoundingSphere();WORLDG.add(I);CHUNKS.push({m:I,c:I.boundingSphere.center.clone(),r:I.boundingSphere.radius});}
  for(const it of items){const T=BRKT[it.t];const c=Math.cos(it.ry),s=Math.sin(it.ry);const circ=T.circ||[[0,0]];for(const [lx,lz] of circ){const o={x:it.x+lx*c+lz*s,z:it.z-lx*s+lz*c,r:T.r*(it.sc||1),brk:it};OBC.push(o);it.obs.push(o);}BRK.push(it);}
}
function lampPools(items,pools,pg,poolM){
  {const by2=new Map();pools.forEach((p,i)=>{const k=Math.floor(p[0]/CH)+','+Math.floor(p[1]/CH);if(!by2.has(k))by2.set(k,[]);by2.get(k).push([p,i]);});POOLI.length=pools.length;
   for(const [,L] of by2){const I=new THREE.InstancedMesh(pg,poolM,L.length);_q.identity();L.forEach(([p,i],j)=>{_p.set(p[0],PAVE_Y+.03,p[1]);I.setMatrixAt(j,_m4.compose(_p,_q,_s));POOLI[i]=[I,j];});I.renderOrder=2;I.computeBoundingSphere();WORLDG.add(I);CHUNKS.push({m:I,c:I.boundingSphere.center.clone(),r:I.boundingSphere.radius});}}
}
const POOLI=[];const _zero=new THREE.Matrix4().makeScale(0,0,0);
function breakProp(it,sp,hx,hz,cvx=car.vx,cvz=car.vz){if(!it.alive)return;it.alive=false;const T=BRKT[it.t];for(const o of it.obs)o.off=true;
  it.mesh.setMatrixAt(it.idx,_zero);it.mesh.instanceMatrix.needsUpdate=true;if(it.src){it.src.i=0;it.src.base=0;const P=POOLI[it.pool];if(P){P[0].setMatrixAt(P[1],_zero);P[0].instanceMatrix.needsUpdate=true;}}
  // debris rigid body
  const m=new THREE.Mesh(T.geo,T.mats.map(x=>x));m.position.set(it.x,it.y,it.z);m.rotation.y=it.ry;m.castShadow=true;scene.add(m);
  const dx=it.x-hx,dz=it.z-hz,l=Math.hypot(dx,dz)||1;const k=1-T.mass;
  const d={m,v:new THREE.Vector3(cvx*(.75+k*.3)+dx/l*2,1.5+sp*.12*(1-T.mass),cvz*(.75+k*.3)+dz/l*2),w:new THREE.Vector3(rnd(-1,1),rnd(-.4,.4),rnd(-1,1)).normalize().multiplyScalar(sp*.35+2),bb:T.geo.boundingBox,sleep:0};DEBRIS.push(d);if(DEBRIS.length>60){const o=DEBRIS.shift();o.sleep=99;}
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
function carBreak(){const sp=Math.hypot(car.vx,car.vz);if(sp<.8)return;const hl=CARDIM.len/2;const fx=Math.sin(car.h),fz=Math.cos(car.h);
  for(const off of[hl-.6,0,-hl+.6]){const px=car.x+fx*off,pz=car.z+fz*off;const gx=Math.floor(px/OGC),gz=Math.floor(pz/OGC);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=OGRID.get((gx+i)+','+(gz+j));if(!a)continue;for(const o of a){if(o.off||!o.brk||!o.brk.alive)continue;if(Math.hypot(o.x-px,o.z-pz)>o.r+1.15)continue;if(sp<(BRKT[o.brk.t].min||3.2))continue;
      const T=breakProp(o.brk,sp,px,pz);if(!T)continue;const kk=clamp(sp/14,.5,1.6);const L=toLocal(o.x-car.x,o.z-car.z);damageCar(T.dmg*kk,{x:clamp(L.x,-1,1),z:L.z>0?1:-1},false);
      const slow=1-T.mass*clamp(sp/18,.4,1.1);car.vx*=slow;car.vz*=slow;shake=Math.max(shake,.12+T.mass*.9);
      propImpactSound(T.mat,o.x,o.z,sp,T.mass);for(let n=0;n<10;n++)emit(o.x,.8,o.z,rnd(-3,3)+car.vx*.3,rnd(1,4),rnd(-3,3)+car.vz*.3,.6,.08,T.mat==='glass'?.8:1,T.mat==='glass'?.9:.75,T.mat==='glass'?1:.4,1,12);}}}}
function propImpactSound(mat,x,z,sp,mass){const v=clamp(sp/16,.3,1);if(mat==='soft'){if(AU.on)noiseBurst(_pan(x,z),AC.currentTime,.18,700,.7,.4*v,'lowpass');return;}if(mat==='glass'){if(typeof sfxGlass==='function')sfxGlass(x,z,v);snd('crash',x,z,v*.5,1.5);}else if(mat==='wood')snd('crash',x,z,v*.35,1.25);else if(mat==='heavy')snd('crash',x,z,v*.9,.8);else{snd('crash',x,z,v*(.35+mass),1.35);if(typeof sfxClang==='function')sfxClang(x,z,v);}}

function nearestRoadDir(x,z){const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(!cell)return null;let best=null,bd=1e9;for(const c of cell){if(c[6]==='path')continue;const ax=c[0],az=c[1],dx=c[2]-ax,dz=c[3]-az;const L2=dx*dx+dz*dz||1;let t=clamp(((x-ax)*dx+(z-az)*dz)/L2,0,1);const qx=ax+dx*t,qz=az+dz*t,d=Math.hypot(x-qx,z-qz);if(d<bd){bd=d;best={qx,qz,d,ry:Math.atan2(dx,dz),hw:c[4],dx,dz};}}return best;}
function cyl(gb,x,z,r,h,seg,y0=0,disc=false,ry=0){if(disc){// flat roundel facing along ry
    const nx=Math.sin(ry),nz=Math.cos(ry);const c=gb.v(x,y0,z,nx,0,nz,.5,.5);const base=gb.p.length/3;for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;const px=Math.cos(a)*r,py=Math.sin(a)*r;gb.v(x+Math.cos(ry)*px,y0+py,z-Math.sin(ry)*px,nx,0,nz,.5+px,.5+py);}for(let i=0;i<seg;i++)gb.i.push(c,base+i,base+i+1);return;}
  const base=gb.p.length/3;for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,c=Math.cos(a),s=Math.sin(a);gb.v(x+c*r,y0,z+s*r,c,0,s,i/seg,0);gb.v(x+c*r,y0+h,z+s*r,c,0,s,i/seg,1);}
  for(let i=0;i<seg;i++){const a=base+i*2;gb.i.push(a,a+1,a+3,a,a+3,a+2);}const top=gb.v(x,y0+h,z,0,1,0,.5,.5);for(let i=0;i<seg;i++){gb.i.push(top,base+i*2+3,base+i*2+1);}}
function boxG(gb,x,z,w,h,d,ry,y0){const c=Math.cos(ry),s=Math.sin(ry);const P=(lx,y,lz)=>[x+lx*c+lz*s,y,z-lx*s+lz*c];const hw=w/2,hd=d/2;const F=[[[ -hw,0,hd],[hw,0,hd],[hw,h,hd],[-hw,h,hd],[0,0,1]],[[hw,0,-hd],[-hw,0,-hd],[-hw,h,-hd],[hw,h,-hd],[0,0,-1]],[[hw,0,hd],[hw,0,-hd],[hw,h,-hd],[hw,h,hd],[1,0,0]],[[-hw,0,-hd],[-hw,0,hd],[-hw,h,hd],[-hw,h,-hd],[-1,0,0]],[[-hw,h,hd],[hw,h,hd],[hw,h,-hd],[-hw,h,-hd],[0,1,0]]];
  for(const f of F){const n=f[4];const nx=n[0]*c+n[2]*s,nz=-n[0]*s+n[2]*c;const ids=f.slice(0,4).map(([a,b,e],k)=>{const p=P(a,b+y0,e);return gb.v(p[0],p[1],p[2],nx,n[1],nz,k===1||k===2?1:0,k>=2?1:0);});gb.i.push(ids[0],ids[1],ids[2],ids[0],ids[2],ids[3]);}}

// ---------------------------------------------------------------- building collision
function bldAt(x,z,r){const cell=BGRID.get(Math.floor(x/BG)+','+Math.floor(z/BG));if(!cell)return null;
  for(const B of cell){if(x<B.x0-r||x>B.x1+r||z<B.z0-r||z>B.z1+r)continue;const R=B.ring;const inside=inRing(R,x,z);let bd=1e9,qx=0,qz=0;
    for(let i=0,j=R.length-2;i<R.length;j=i,i+=2){const ax=R[j],az=R[j+1],dx=R[i]-ax,dz=R[i+1]-az;const L2=dx*dx+dz*dz||1;const t=clamp(((x-ax)*dx+(z-az)*dz)/L2,0,1);const px=ax+dx*t,pz=az+dz*t,d=Math.hypot(x-px,z-pz);if(d<bd){bd=d;qx=px;qz=pz;}}
    if(inside||bd<r){let nx=x-qx,nz=z-qz;const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;if(inside){nx=-nx;nz=-nz;}return{x:qx+nx*(r+.01),z:qz+nz*(r+.01),d:inside?bd+r:r-bd};}}
  return null;}

// ---------------------------------------------------------------- skyline: the City across the river (real towers, simplified)
function cityTowers(){const g=(lon,lat)=>{const [L0,A0]=WD.origin;const KX=Math.cos(A0*Math.PI/180)*111320;return[(lon-L0)*KX,-(lat-A0)*110574];};
  const far=FAC.far,win=FAC.farWin;const add=(geo,x,z,y)=>{const m=new THREE.Mesh(geo,far);m.position.set(x,y,z);WORLDG.add(m);return m;};
  // 30 St Mary Axe (the Gherkin)
  {const [x,z]=g(-0.08031,51.51448);const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push(new THREE.Vector2(Math.sin(Math.min(1,t*1.15)*Math.PI*.55+.35)*28*(1-t*t*.35)*(t>.92?(1-t)*12.5:1),t*180));}add(new THREE.LatheGeometry(pts,24),x,z,0);}
  // 122 Leadenhall (Cheesegrater) — wedge
  {const [x,z]=g(-0.08218,51.51366);const s=new THREE.Shape();s.moveTo(-24,0);s.lineTo(24,0);s.lineTo(24,40);s.lineTo(-24,225);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:40,bevelEnabled:false});geo.translate(0,0,-20);const m=add(geo,x,z,0);m.rotation.y=.5;}
  // 22 Bishopsgate, Heron Tower, Tower 42, 20 Fenchurch (Walkie-Talkie)
  for(const [lon,lat,w,d,h] of [[-0.08325,51.51450,50,45,278],[-0.08099,51.51603,36,36,230],[-0.08354,51.51522,40,40,183],[-0.0790,51.5150,30,30,150],[-0.0815,51.5125,34,30,120]]){const [x,z]=g(lon,lat);add(new THREE.BoxGeometry(w,h,d),x,z,h/2);}
  {const [x,z]=g(-0.08367,51.51121);const s=new THREE.Shape();s.moveTo(-28,0);s.lineTo(28,0);s.lineTo(38,160);s.lineTo(-38,160);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:44,bevelEnabled:false});geo.translate(0,0,-22);add(geo,x,z,0);}
  // the Shard
  {const [x,z]=g(-0.08652,51.50452);const geo=new THREE.ConeGeometry(34,310,4,1,true);const m=add(geo,x,z,155);m.rotation.y=.3;for(let i=0;i<40;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.4),win);const y=10+Math.random()*230;const a=(Math.random()*4|0)*Math.PI/2+.3+Math.PI/4;const rr=34*(1-y/310)+.4;p.position.set(x+Math.sin(a)*rr*.72,y,z+Math.cos(a)*rr*.72);p.rotation.y=a;WORLDG.add(p);}}
  // City windows sprinkled on the towers
}

// ---------------------------------------------------------------- top level
function buildLondon(){routeInit();facadeSet();scene.add(WORLDG);
  buildRoads();buildAreas();buildBuildings();buildSigns();buildRails();buildWalls();buildTrees();buildFurniture();cityTowers();flushBuckets();
  // minimap backdrop
  buildMiniMap();}
let MINI=null;
function buildMiniMap(){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<WD.route.length;i+=2){x0=Math.min(x0,WD.route[i]);x1=Math.max(x1,WD.route[i]);z0=Math.min(z0,WD.route[i+1]);z1=Math.max(z1,WD.route[i+1]);}x0-=500;z0-=500;x1+=500;z1+=500;
  const S=.7;const c=document.createElement('canvas');c.width=Math.ceil((x1-x0)*S);c.height=Math.ceil((z1-z0)*S);const g=c.getContext('2d');g.fillStyle='#0e1210';g.fillRect(0,0,c.width,c.height);g.setTransform(S,0,0,S,-x0*S,-z0*S);
  const poly=(r,fill)=>{g.beginPath();for(let i=0;i<r.length;i+=2)i?g.lineTo(r[i],r[i+1]):g.moveTo(r[i],r[i+1]);g.closePath();g.fillStyle=fill;g.fill();};
  for(const [k,r] of WD.areas){if(k===0)poly(r,'#1e3a52');else if(k<=3||k===6)poly(r,'#1e3020');}
  for(const b of WD.buildings)poly(b[6],'#2c2f2e');
  g.lineCap='round';g.lineJoin='round';for(const [cls,w,br,l,n,p] of WD.roads){g.strokeStyle=cls<=2?'#8a8c86':cls<=4?'#5e605c':'#44474a';g.lineWidth=w;g.beginPath();for(let i=0;i<p.length;i+=2)i?g.lineTo(p[i],p[i+1]):g.moveTo(p[i],p[i+1]);g.stroke();}
  g.strokeStyle='rgba(213,232,112,.55)';g.lineWidth=4;g.beginPath();for(let i=0;i<WD.route.length;i+=2)i?g.lineTo(WD.route[i],WD.route[i+1]):g.moveTo(WD.route[i],WD.route[i+1]);g.stroke();
  MINI={c,x0,z0,S};}

// the player kicks clutter out of the way
function kickClutter(){if(PL.inCar)return;const sp=Math.hypot(PL.vx||0,PL.vz||0);if(sp<1.2)return;const gx=Math.floor(PL.x/OGC),gz=Math.floor(PL.z/OGC);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=OGRID.get((gx+i)+','+(gz+j));if(!a)continue;for(const o of a){if(o.off||!o.brk||!o.brk.alive||!BRKT[o.brk.t].kick)continue;if(Math.hypot(o.x-PL.x,o.z-PL.z)<o.r+.55){breakProp(o.brk,sp,PL.x,PL.z,PL.vx*1.6,PL.vz*1.6);propImpactSound(BRKT[o.brk.t].mat,o.x,o.z,sp,.02);}}}}
