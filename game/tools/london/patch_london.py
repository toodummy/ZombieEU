import re, sys
p = '/home/claude/game/dist/index.html'
s = open(p).read()
L = open('/home/claude/game/london.js').read()
def rep(a, b, cnt=1):
    global s
    n = s.count(a)
    assert n == cnt, (a[:100], n)
    s = s.replace(a, b)
def between(a, b):
    i = s.index(a); j = s.index(b, i); return s[i:j]

# ---------------------------------------------------------------- pull authored set pieces out of the old buildWorld
fore = between('  // ---------------- forecourt', '  // ---------------- high street')
port = between('  // ---------------- Dover port', '  // distant trees')
tb = between('function towerBridge(){', 'function skyline(){')
# old world builder → replaced entirely
bw0 = s.index('function buildWorld(){'); bw1 = s.index('function nearBuild(x,z){'); bw2 = s.index('\n', bw1) + 1
# Tower Bridge at real proportions (towers 72 m apart, side spans to 511/755), piers in the river
tb2 = tb.replace('const T=[606,660];', 'const T=[597,669];')
tb2 = tb2.replace('for(const [x0,x1,y0,y1] of [[562,T[0]-6,8,30],[T[1]+6,703,30,8]])', 'for(const [x0,x1,y0,y1] of [[513,T[0]-6,8,30],[T[1]+6,753,30,8]])')
tb2 = tb2.replace('for(const x of[560,705])for(const s of[-1,1]){box(4,10,4,stone,x,5,Z+s*12,0,scene,true,3);', 'for(const x of[511,755])for(const s of[-1,1]){box(4,10,4,stone,x,5,Z+s*12,0,scene,true,3);obBox(x-2,Z+s*12-2,x+2,Z+s*12+2,"anch");')
tb2 = tb2.replace('for(let x=572;x<700;x+=16)', 'for(let x=520;x<748;x+=16)')
tb2 = tb2.replace('    box(9,7,29,stone,tx,26.5,Z,0,scene,true,3);// portal head over the road', '    box(9,7,29,stone,tx,26.5,Z,0,scene,true,3);// portal head over the road\n    box(16,5,34,stone,tx,-2.6,Z,0,scene,false,3);// pier in the Thames')
tb2 = tb2.replace('function towerBridge(){', 'function towerBridgeReal(){')
assert 'T=[597,669]' in tb2 and '513,T[0]' in tb2 and 'pier in the Thames' in tb2
# forecourt: make west + south openings meet the real street network
fore2 = fore
# Dover port → evacuation staging yard at the south-east end of Old Kent Road
port2 = port.replace("const ps=new THREE.Mesh(new THREE.PlaneGeometry(14,2),signMat('PORT OF DOVER · FERRY EMBARKATION','#0b1f3a','#e6f1ff',1.4));", "const ps=new THREE.Mesh(new THREE.PlaneGeometry(14,2),signMat('EVAC STAGING · COACHES TO DOVER','#0b1f3a','#e6f1ff',1.4));")
i0 = port2.index('  // ferry hull'); i1 = port2.index("  lootSpot(940,494")
port2 = port2[:i0] + """  // evacuation convoy behind the gate: coaches + army trucks under floodlights
  placeBus(1022,462,Math.PI/2,{sign:'DOVER'});placeBus(1022,478,Math.PI/2+.04,{sign:'DOVER'});placeBus(1048,470,Math.PI/2,{sign:'EVACUATION'});
  for(const [x,z] of [[1004,458],[1004,482],[1040,456],[1040,484]]){const fl=new THREE.Group();fl.position.set(x,0,z);scene.add(fl);box(.25,8,.25,MAT.dark,0,4,0,0,fl);box(1.6,.8,.5,glow(0xfff4dd,2.4),0,8,0,0,fl,false);}
  {const fl=new THREE.PointLight(0xfff2d8,60,50,1.4);fl.position.set(1030,8,470);scene.add(fl);LIGHTS.push(fl);}
  // perimeter fencing (entrance on the west side, convoy pen east of the gate)
  {const fz=(x0,x1,z)=>{box(x1-x0,2.4,.08,MAT.fence,(x0+x1)/2,1.2,z,0,scene,false);box(x1-x0,.12,.12,MAT.metal,(x0+x1)/2,2.4,z);obBox(x0,z-.2,x1,z+.2,'fence');};
   const fx=(z0,z1,x)=>{box(.08,2.4,z1-z0,MAT.fence,x,1.2,(z0+z1)/2,0,scene,false);box(.12,.12,z1-z0,MAT.metal,x,2.4,(z0+z1)/2);obBox(x-.2,z0,x+.2,z1,'fence');};
   fz(880,991,426);fz(880,991,498);fx(426,447,880);fx(477,498,880);fz(991,1062,452);fz(991,1062,488);fx(452,488,1062);}
""" + port2[i1:]
port2 = port2.replace("  plane(400,400,MAT.water,1240,470,0,-.3);\n", "")
port2 = port2.replace("for(let z=426;z<498;z+=4){if(z>454&&z<486){}else box(.6,3,4,MAT.metal,991,1.5,z+2,0,scene,true,3);}", "for(let z=426;z<498;z+=4){if(z>454&&z<486){}else{box(.6,3,4,MAT.metal,991,1.5,z+2,0,scene,true,3);obBox(990.7,z,991.3,z+4,'wall');}}")
assert 'DOVER' in port2 and 'ferry hull' not in port2

NEWBW = r"""function buildWorld(){
  const SG=[['NEWS & WINE','#101418','#ffd34d'],['CHICKEN SHACK','#2a0d0d','#ff6a4d'],['LAUNDERETTE','#0c1a26','#7fd6ff'],['BOOKMAKERS','#0d2614','#7dff8f'],['PHARMACY','#0d1f12','#58ff8a'],['CAFE  ·  OPEN','#1d140a','#ffb35a'],['PHONE REPAIRS','#14101f','#c98bff'],['BARBER','#0a0a0a','#ff4d6d'],['OFF LICENCE','#1e1408','#ffc46a'],['TO LET','#ddd','#c0201a']];
  SIGNS=SG.map(([t,b,f],i)=>signMat(t,b,f,i%4===3?.1:.75));
  buildLondon();const A=WD.anchors;const S=A.s;
  const RA=(s,lat)=>{const p=routeAt(s);return[p.x+p.nx*lat,p.z+p.nz*lat,p.h];};
  // ---------------- forecourt (real petrol station off Dunton Road / Mandela Way)
  inFrame(A.fore,()=>{
__FORE__  });
  {const fr=A.foreRoad;const a=TF(A.fore,66,190),b=TF(A.fore,40,190);addCap(a[0],a[1],b[0],b[1],7,'conc','fore');addCap(b[0],b[1],fr[0],fr[1],6.5,'road','road');
   const vis=(p,q,w)=>{const gb=new GB();ribbon(gb,[p[0],p[1],q[0],q[1]],w,.014,5,5);const m=new THREE.Mesh(gb.geo(),MAT.road);m.receiveShadow=true;WORLDG.add(m);};vis(a,b,12);vis(b,[fr[0],fr[1]],11);
   const c=TF(A.fore,75,226),d=TF(A.fore,75,252);addCap(c[0],c[1],d[0],d[1],6.5,'road','road');vis(c,d,11);const nr=nearestRoadWide(d[0],d[1],80);if(nr){addCap(d[0],d[1],nr.qx,nr.qz,6,'road','road');vis(d,[nr.qx,nr.qz],10);}
   REG.push({F:A.fore,x0:58,z0:168,x1:116,z1:230,s:'conc',id:'fore'});
   // fuel station canopy plot cleared of the real kiosk: paint a concrete apron
   const ap=new THREE.Mesh(new THREE.PlaneGeometry(58,62).rotateX(-Math.PI/2),pbr('concrete',{color:0xa8a8a4}));const [ax,az]=TF(A.fore,87,199);ap.position.set(ax,.012,az);ap.rotation.y=A.fore.a;ap.receiveShadow=true;scene.add(ap);}
  // ---------------- Tower Bridge (real bascules), jack-knifed lorry, evacuation bus
  inFrame(A.bridge,()=>{towerBridgeReal();
    const g=new THREE.Group();g.position.set(632,0,456);g.rotation.y=Math.PI/2+.35;scene.add(g);box(2.5,3.4,12,new THREE.MeshStandardMaterial({color:0xd8d8d0,roughness:.6,metalness:.3}),0,2,0,0,g,true,3);box(2.4,2.4,3,new THREE.MeshStandardMaterial({color:0x2a4a8a,roughness:.5,metalness:.4}),0,1.5,7.6,0,g);
    for(let k=-5;k<=8;k+=2.2)obCircle(632+Math.sin(Math.PI/2+.35)*k,456+Math.cos(Math.PI/2+.35)*k,1.5);
    placeBus(690,462,Math.PI/2+.06,{sign:'EVACUATE'});wreck(600,462.5,Math.PI/2-.3,0x6a6a72);wreck(655,455,Math.PI/2+.5,0x8a2a22,{burn:1});fire(655,.5,455,true);lootSpot(600,465,{scrap:3,pistol:6});
    for(let i=0;i<6;i++)dynProp('cone',610+i*4,461+Math.sin(i)*1.5);});
  // ---------------- Mansell Street / Tower Hill: start, first wrecks
  {const [x,z,h]=RA(60,-4.2);wreck(x,z,h+.3,0x6a7a5a);lootSpot(x,z,{scrap:3,pistol:6});}
  {const [x,z,h]=RA(150,4);wreck(x,z,h-.2,0x8a8a92);lootSpot(x,z,{med:1});}
  {const [x,z,h]=RA(260,-3.6);wreck(x,z,h+2.6,0x5a2020,{burn:1});fire(x,.5,z,false);}
  {const [x,z,h]=RA(330,3.5);placeBus(x,z,h+.2,{burn:1,sign:''});fire(x,1,z,true);}
  // ---------------- Tower Bridge Road (the high street): abandoned cars, police car, buses
  const R=mulberry(77);const cols=[0x6a6a72,0x8a2a22,0x2a3a5a,0xa8a8a0,0x3a3a2a,0x223322,0x8a8470,0x1a2a4a];
  for(let s=860;s<2000;s+=38+R()*40){const side=R()<.5?-1:1;const [x,z,h]=RA(s,side*(3+R()*2));const o={};if(R()<.15)o.burn=1;else if(R()<.08)o.flip=1;wreck(x,z,h+(R()-.5)*.9,cols[(R()*cols.length)|0],o);if(o.burn)fire(x,.5,z,R()<.4);if(R()<.3)lootSpot(x+side*1.5,z,R()<.5?{scrap:3}:{med:1});}
  {const [x,z,h]=RA(1240,4.2);wreck(x,z,h-.4,0x1a2a4a,{police:1});lootSpot(x,z,{shotgun:1,shells:6},'Search police car');}
  {const [x,z,h]=RA(1460,-4);placeBus(x,z,h+.1,{sign:'42 BERMONDSEY'});}
  {const [x,z,h]=RA(1890,3);placeBus(x,z,h-.5,{burn:1,sign:''});fire(x,1,z,false);}
  // Bricklayers Arms & Old Kent Road west
  for(let s=2040;s<3300;s+=45+R()*50){const side=R()<.5?-1:1;const [x,z,h]=RA(s,side*(3.5+R()*2.5));wreck(x,z,h+(R()-.5)*1.2,cols[(R()*cols.length)|0],{burn:R()<.12});if(R()<.25)lootSpot(x+side*1.5,z,R()<.5?{scrap:4}:{pistol:8});}
  // ---------------- military checkpoint (overrun) across Old Kent Road
  inFrame(A.check,()=>{
    const cbar=new THREE.InstancedMesh(new THREE.BoxGeometry(3.6,1.1,.7),MAT.conc,40);let ci=0;
    for(let x=-26;x<=26;x+=4){if(Math.abs(x)<5)continue;_q.identity();_p.set(x,.55,0);cbar.setMatrixAt(ci++,_m4.compose(_p,_q,_s));obBox(x-1.8,-.35,x+1.8,.35,'cb');}cbar.count=ci;cbar.castShadow=cbar.receiveShadow=true;scene.add(cbar);
    for(const x of[-6,6])placeProp('barrier',x,0,0,1.2);
    const thr=new THREE.MeshBasicMaterial({color:0x5dff7a,transparent:true,opacity:.5});{const m=new THREE.Mesh(new THREE.PlaneGeometry(9,.5),thr);m.rotation.x=-Math.PI/2;m.position.set(0,.06,4);scene.add(m);}
    for(const x of[-11,11]){box(1.2,1.2,6,new THREE.MeshStandardMaterial({color:0x4a5030,roughness:.9}),x,.6,9);const fl=new THREE.Group();fl.position.set(x,0,6);scene.add(fl);box(.2,5,.2,MAT.dark,0,2.5,0,0,fl);box(1.2,.6,.4,glow(0xfff4dd),0,5,0,0,fl,false);}
    for(const x of[-9,9]){const sp=new THREE.SpotLight(0xfff2dd,180,70,.7,.5,1.3);sp.position.set(x,7,10);sp.target.position.set(0,0,-20);scene.add(sp,sp.target);LIGHTS.push(sp);}
    for(const [x,z,r] of [[-16,14,.2],[15,20,-.1],[-14,32,.3]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=r;scene.add(g);const am=new THREE.MeshStandardMaterial({color:0x3a4228,roughness:.9});box(2.5,2.2,3,am,0,1.5,3,0,g);box(2.6,2.8,6,new THREE.MeshStandardMaterial({color:0x4a5232,roughness:1}),0,2,-1.6,0,g);for(const sz of[-3,0,3])for(const sx of[-1.2,1.2]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.4,14),MAT.dark);w.rotation.z=Math.PI/2;w.position.set(sx,.55,sz);g.add(w);}
      const fx=Math.sin(r),fz=Math.cos(r);for(const k of[-3,0,3])obCircle(x+fx*k,z+fz*k,1.6);}
    {box(1.6,1,1.1,new THREE.MeshStandardMaterial({color:0x3a4a2a,roughness:.9}),9,.5,13);obBox(8.2,12.45,9.8,13.55,'crate');lootSpot(9,11.4,{shotgun:1,shells:8,med:2,can:1,pistol:12},'Open military supply crate');}
    const evs=signMat('EVAC MOVED ▸ STAGING YARD · OLD KENT RD','#2a0b0b','#ffd6cf',1.3);evs.side=THREE.DoubleSide;{const s=new THREE.Mesh(new THREE.PlaneGeometry(12,1.6),evs);s.position.set(0,6.2,-3);s.rotation.y=Math.PI;scene.add(s);box(.25,6.5,.25,MAT.dark,-6,3.2,-3);box(.25,6.5,.25,MAT.dark,6,3.2,-3);}
    fire(-3,.2,18,false);for(const [x,z] of [[-4,5],[3,6],[-2,9],[5,-4],[1,14]])dynProp('cone',x,z);});
  // ---------------- pile-up on Old Kent Road (slalom: clusters alternate sides, always one lane through)
  {let k=0;for(let s=S.pile0;s<S.pile1;s+=48,k++){const side=k%2?1:-1;const p=routeAt(s);const hw=6.5;
     for(let lat=1.4;lat<hw+1;lat+=2.6){const [x,z,h]=RA(s+(R()-.5)*6,side*lat);wreck(x,z,h+Math.PI/2+(R()-.5)*1.4,cols[(R()*cols.length)|0],{burn:R()<.25});if(R()<.35)lootSpot(x+side*1.2,z,R()<.4?{scrap:3}:(R()<.5?{pistol:8,shells:3}:{can:1}));}}
   for(let i=0;i<8;i++){const s=S.pile0+R()*(S.pile1-S.pile0);const [x,z,h]=RA(s,(R()-.5)*14);wreck(x,z,h+(R()-.5)*.8,cols[(R()*cols.length)|0],{flip:R()<.3});}
   {const [x,z]=RA(S.pile0+150,3);fire(x,.5,z,true);}{const [x,z]=RA(S.pile0+300,-3);fire(x,.5,z,false);}{const [x,z,h]=RA(S.pile0+220,2);placeBus(x,z,h+1.2,{burn:1,sign:''});}
   for(let i=0;i<14;i++){const [x,z]=RA(S.pile0+R()*(S.pile1-S.pile0),(R()-.5)*12);dynProp('cone',x,z);}}
  // ---------------- evacuation staging yard (end of the road)
  inFrame(A.port,()=>{
__PORT__  });
  {const a=TF(A.port,850,462),b=TF(A.port,890,462);addCap(a[0],a[1],b[0],b[1],8,'road','road');
   REG.push({F:A.port,x0:880,z0:426,x1:991,z1:498,s:'conc',id:'port'});REG.push({F:A.port,x0:990,z0:452,x1:1062,z1:488,s:'conc',id:'ferry',on:()=>portOpen});
   const ap=new THREE.Mesh(new THREE.PlaneGeometry(182,72).rotateX(-Math.PI/2),pbr('concrete',{color:0x9a9a96}));const [ax,az]=TF(A.port,971,462);ap.position.set(ax,.012,az);ap.rotation.y=A.port.a;ap.receiveShadow=true;scene.add(ap);}
  dressLondon();
  flushStatic();
  flushWindows();
  obGridBuild();
}
function addCap(ax,az,bx,bz,hw,s,id){const c=[ax,az,bx,bz,hw,s,id];RCAP.push(c);gridAdd(RGRID,RG,Math.min(ax,bx)-hw,Math.min(az,bz)-hw,Math.max(ax,bx)+hw,Math.max(az,bz)+hw,c);return c;}
function nearestRoadWide(x,z,rad){let best=null,bd=rad;for(const c of RCAP){if(c[6]==='path'||c[6]==='fore')continue;const ax=c[0],az=c[1],dx=c[2]-ax,dz=c[3]-az;const L2=dx*dx+dz*dz||1;const t=clamp(((x-ax)*dx+(z-az)*dz)/L2,0,1);const qx=ax+dx*t,qz=az+dz*t,d=Math.hypot(x-qx,z-qz);if(d<bd){bd=d;best={qx,qz,d};}}return best;}
// clutter along the real streets (bags, crates, tyres, manholes) — seeded
function dressLondon(){const R=mulberry(2024);const clutter=(x,z,n=3,spread=1.2)=>{for(let i=0;i<n;i++){const t=R();const k=t<.45?'trashbag':t<.6?'cardboard_box_01':t<.72?'plastic_crate_01':t<.84?'old_tyre':'wooden_crate_01';sprop(k,x+rnd(-spread,spread),z+rnd(-spread,spread),R()*6,k==='trashbag'?.9+R()*.5:1,0,k==='old_tyre'&&R()<.5?Math.PI/2:0);}};
  for(let s=20;s<ROUTE.len-40;s+=24+R()*26){const p=routeAt(s);const side=R()<.5?-1:1;const lat=side*(6.5+R()*2);if(bldAt(p.x+p.nx*lat,p.z+p.nz*lat,.6))continue;clutter(p.x+p.nx*lat,p.z+p.nz*lat,1+(R()*3|0),.9);
    if(R()<.25)sprop('water_manhole_cover',p.x+p.nx*(R()-.5)*4,p.z+p.nz*(R()-.5)*4,R()*6,1,.06);}
  // parked & covered cars along side streets near the route
  let n=0;for(const [cls,w,br,layer,name,pts] of WD.roads){if(cls<3||cls>4||br)continue;const m=pts.length/2;for(let i=0;i<m-1&&n<110;i++){const ax=pts[i*2],az=pts[i*2+1],bx=pts[i*2+2],bz=pts[i*2+3];const L=Math.hypot(bx-ax,bz-az);if(L<10)continue;const dx=(bx-ax)/L,dz=(bz-az)/L;
      if(routeS(ax,az).d>110)continue;for(let t=5;t<L-5;t+=5.4+R()*5){if(R()<.6)continue;const side=R()<.5?-1:1;const x=ax+dx*t+dz*side*(w/2-1.1),z=az+dz*t-dx*side*(w/2-1.1);if(bldAt(x,z,1))continue;const h=Math.atan2(dx,dz)+(side>0?0:Math.PI)+(R()-.5)*.08;
        if(R()<.3){if(sprop('covered_car',x,z,h)){obCircle(x+Math.sin(h)*1.2,z+Math.cos(h)*1.2,1);obCircle(x-Math.sin(h)*1.2,z-Math.cos(h)*1.2,1);n++;}}
        else{wreck(x,z,h,[0x6a6a72,0x8a2a22,0x2a3a5a,0xa8a8a0,0x3a3a2a,0x223322,0xd0d0c8,0x1a1a1c][(R()*8)|0]);n++;}}}}}
// pushObs acceleration grid for circles
const OGRID=new Map();let OGN=0;const OGC=12;
function obGridBuild(){OGRID.clear();for(const o of OBC){const k=Math.floor(o.x/OGC)+','+Math.floor(o.z/OGC);let a=OGRID.get(k);if(!a)OGRID.set(k,a=[]);a.push(o);}OGN=OBC.length;}
"""
NEWBW = NEWBW.replace('__FORE__', fore2).replace('__PORT__', port2)
s = s[:bw0] + NEWBW + s[bw2:]
# keep the old tower bridge function, add the real-proportions one + london module
s = s.replace('function skyline(){', tb2 + L + '\nfunction skyline(){', 1)

# ---------------------------------------------------------------- walkable areas / collision
old_caps = between('const CAPS=[', 'const OBC=[],OBB=[];')
new_caps = """const CAPS=[];const RECTS=[];const REG=[];
let gateOpen=false,portOpen=false;
const capOn=c=>true;const rectOn=R=>true;
function capRes(c,x,z,r){const ax=c[0],az=c[1],dx=c[2]-ax,dz=c[3]-az;let t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1);t=clamp(t,0,1);const qx=ax+dx*t,qz=az+dz*t,ex=x-qx,ez=z-qz,d=Math.hypot(ex,ez),m=c[4]-r;if(d<=m)return null;const k=m/(d||1);return{x:qx+ex*k,z:qz+ez*k,d:d-m};}
function regLocal(R,x,z){const F=R.F,c=Math.cos(F.a),s=Math.sin(F.a);const wx=x-F.ax,wz=z-F.az;return[wx*c-wz*s+F.ox,wx*s+wz*c+F.oz];}
function regRes(R,x,z,r){const [lx,lz]=regLocal(R,x,z);const cx=clamp(lx,R.x0+r,R.x1-r),cz=clamp(lz,R.z0+r,R.z1-r);if(cx===lx&&cz===lz)return null;const [wx,wz]=TF(R.F,cx,cz);return{x:wx,z:wz,d:Math.hypot(lx-cx,lz-cz)};}
function walkRes(x,z,r){let best=null;for(const R of REG){if(R.on&&!R.on())continue;const q=regRes(R,x,z,r);if(!q)return null;if(!best||q.d<best.d)best=q;}
  const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(cell)for(const c of cell){const q=capRes(c,x,z,r);if(!q)return null;if(!best||q.d<best.d)best=q;}
  const ac=AGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(ac)for(const A of ac){if(x<A.bb[0]||x>A.bb[2]||z<A.bb[1]||z>A.bb[3])continue;if(inRing(A.ring,x,z)&&!(A.holes||[]).some(h=>inRing(h,x,z)))return null;}
  return best;}
function constrain(x,z,r){return bldAt(x,z,r)||segAt(x,z,r);}
function regionAt(x,z){for(const R of REG){if(R.on&&!R.on())continue;const [lx,lz]=regLocal(R,x,z);if(lx>=R.x0&&lx<=R.x1&&lz>=R.z0&&lz<=R.z1)return{s:R.s,id:R.id};}
  const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(cell)for(const c of cell){if(!capRes(c,x,z,0))return{s:c[5],id:c[6]};}
  const ac=AGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(ac)for(const A of ac){if(inRing(A.ring,x,z))return{s:A.s,id:'area'};}
  return{s:'off',id:'off'};}
"""
s = s.replace(old_caps, new_caps)
# pushObs: grid for circles + oriented boxes
old_push = between('function pushObs(x,z,r){', '\n// ================================================================ world build')
new_push = """function pushObs(x,z,r){let nx=0,nz=0,hit=false;
  const circ=o=>{if(o.off)return;const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz),m=o.r+r;if(d<m&&d>1e-4){const p=m-d;x+=dx/d*p;z+=dz/d*p;nx+=dx/d;nz+=dz/d;hit=true;}};
  if(OGN){const gx=Math.floor(x/OGC),gz=Math.floor(z/OGC);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=OGRID.get((gx+i)+','+(gz+j));if(a)for(const o of a)circ(o);}for(let i=OGN;i<OBC.length;i++)circ(OBC[i]);}else for(const o of OBC)circ(o);
  for(const b of OBB){if(b.off)continue;let lx=x,lz=z,x0=b.x0,z0=b.z0,x1=b.x1,z1=b.z1,o=b.o;
    if(o){const dx=x-o.cx,dz=z-o.cz;if(Math.abs(dx)>o.hx+o.hz+r+1||Math.abs(dz)>o.hx+o.hz+r+1)continue;lx=dx*o.c-dz*o.s;lz=dx*o.s+dz*o.c;x0=-o.hx;x1=o.hx;z0=-o.hz;z1=o.hz;}
    const cx=clamp(lx,x0,x1),cz=clamp(lz,z0,z1);let dx=lx-cx,dz=lz-cz,d=Math.hypot(dx,dz);let px=lx,pz=lz,qx=0,qz=0,h=false;
    if(d<r){if(d<1e-4){const l=lx-x0,rr=x1-lx,t=lz-z0,bt=z1-lz,mn=Math.min(l,rr,t,bt);if(mn===l){px=x0-r;qx=-1;}else if(mn===rr){px=x1+r;qx=1;}else if(mn===t){pz=z0-r;qz=-1;}else{pz=z1+r;qz=1;}h=true;}
      else{const p=r-d;px+=dx/d*p;pz+=dz/d*p;qx=dx/d;qz=dz/d;h=true;}}
    if(h){hit=true;if(o){x=o.cx+px*o.c+pz*o.s;z=o.cz-px*o.s+pz*o.c;nx+=qx*o.c+qz*o.s;nz+=-qx*o.s+qz*o.c;}else{x=px;z=pz;nx+=qx;nz+=qz;}}}
  return hit?{x,z,nx,nz}:null;}
"""
s = s.replace(old_push, new_push)

# ---------------------------------------------------------------- loading, merge exclusion, per-frame chunk culling
rep("  for(const s of SFX_LIST)jobs.push(", "  jobs.push(track(fetch('assets/world.json').then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(j=>WD=j),'map'));\n  for(const s of SFX_LIST)jobs.push(")
rep("{const ex=[gateMesh,", "{const ex=[WORLDG,gateMesh,")
rep("updLightPool(dt);", "updChunks(dt);updLightPool(dt);")
camfar = "const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.1,1600);"
rep(camfar, "const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.25,2600);")
open(p, 'w').write(s)
print('ok', len(s))
