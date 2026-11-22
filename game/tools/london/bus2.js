// London double-decker (New Routemaster-style): rounded extruded body, inset glazing with interior, stair glazing,
// wheel arches, detailed wheels, doors, mirrors, lights, destination blinds. Built once per variant and cloned.
const BUSCACHE={};
// painted livery for the bus sides (ExtrudeGeometry caps use shape coordinates in metres as UVs)
const BUSTEX={};
function busSideTex(burn,seed){const key=(burn?'b':'r')+seed%4;if(BUSTEX[key])return BUSTEX[key];const L=11.2,H=4.38,W=2048,Hh=820;const R=mulberry(seed);
  const t=cv(W,Hh,(x)=>{const X=m=>(m+L/2)/L*W,Y=m=>Hh-m/H*Hh;
    if(!burn){const g=x.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#c2170f');g.addColorStop(.6,'#b5130e');g.addColorStop(1,'#8c100b');x.fillStyle=g;x.fillRect(0,0,W,Hh);}
    else{x.fillStyle='#2a2420';x.fillRect(0,0,W,Hh);for(let i=0;i<900;i++){const r=R();x.fillStyle=r<.4?`rgba(90,40,20,${R()*.5})`:r<.7?`rgba(10,8,6,${R()*.7})`:`rgba(140,70,40,${R()*.25})`;x.beginPath();x.arc(R()*W,R()*Hh,4+R()*40,0,7);x.fill();}
      for(let i=0;i<14;i++){x.fillStyle=`rgba(150,30,20,${.2+R()*.3})`;x.beginPath();x.ellipse(R()*W,Hh*(.3+R()*.6),30+R()*120,15+R()*50,R(),0,7);x.fill();}}
    // panel seams + rivets
    x.strokeStyle=burn?'rgba(0,0,0,.6)':'rgba(60,0,0,.55)';x.lineWidth=2;for(let m=-L/2+.9;m<L/2-.5;m+=1.15){x.beginPath();x.moveTo(X(m),Y(.55));x.lineTo(X(m),Y(1.25));x.stroke();x.beginPath();x.moveTo(X(m),Y(2.36));x.lineTo(X(m),Y(2.98));x.stroke();}
    for(const y of [1.25,2.36,2.98,H-.2]){x.beginPath();x.moveTo(0,Y(y));x.lineTo(W,Y(y));x.stroke();}
    x.fillStyle='rgba(30,0,0,.5)';for(let m=-L/2+.3;m<L/2;m+=.22)for(const y of [1.22,2.39]){x.beginPath();x.arc(X(m),Y(y),1.6,0,7);x.fill();}
    // rubbing strip + skirt
    x.fillStyle=burn?'#1a1612':'#202020';x.fillRect(0,Y(.75),W,Y(.55)-Y(.75));
    if(!burn){// operator branding, fleet number, advert panel between decks, graffiti
      x.fillStyle='#f2ede0';x.font='bold 34px Oswald, Impact, sans-serif';x.fillText('CITYLINE',X(L/2-3.1),Y(1.45));x.font='bold 26px Arial';x.fillText('LT '+(100+seed%900),X(L/2-1.2),Y(.95));
      const ads=[['THE RAIN SEASON','NOW SHOWING','#1a2a3a','#f0e6c8'],['CALL HOME TONIGHT','#14532d','#e8ffd8'],['THAMES WATER — BOIL IT FIRST','#0a3a6a','#ffffff'],['LAST ORDERS','THE BRIDGE HOUSE','#3a1a0a','#ffd27a']];const a=ads[seed%ads.length];
      const ax0=X(-L/2+1.6),ax1=X(L/2-2.6),ay0=Y(2.95),ay1=Y(2.42);x.fillStyle=a[a.length-2];x.fillRect(ax0,ay0,ax1-ax0,ay1-ay0);x.fillStyle=a[a.length-1];x.font='bold 46px Oswald, Impact, sans-serif';x.textBaseline='middle';x.fillText(a[0],ax0+30,(ay0+ay1)/2-(a.length>3?10:0));if(a.length>3){x.font='24px Arial';x.fillText(a[1],ax0+34,(ay0+ay1)/2+28);}x.textBaseline='alphabetic';
      if(R()<.7){x.save();x.globalAlpha=.85;x.strokeStyle=['#e8e8e8','#30ff60','#ffe030','#111'][(R()*4)|0];x.lineWidth=10;x.font='bold 70px Impact';x.fillStyle=x.strokeStyle;x.translate(X(-L/2+2+R()*4),Y(1.0+R()*.2));x.rotate(-.08+R()*.16);x.fillText(['RUN','NO EVAC','THEY HEAR YOU','DOVER?','GOD SAVE US'][(R()*5)|0],0,0);x.restore();}}
    // road spray, streaks, wheel-arch dirt
    const gg=x.createLinearGradient(0,Y(1.3),0,Hh);gg.addColorStop(0,'rgba(40,30,20,0)');gg.addColorStop(1,'rgba(40,30,20,.6)');x.fillStyle=gg;x.fillRect(0,Y(1.3),W,Hh-Y(1.3));
    for(let i=0;i<70;i++){x.fillStyle=`rgba(30,20,15,${R()*.18})`;const sx=R()*W,sy=Y(H-.3)+R()*Hh*.5;x.fillRect(sx,sy,2+R()*5,40+R()*200);}
    for(const m of [L/2-2.35,-L/2+2.75]){const rg=x.createRadialGradient(X(m),Y(.5),20,X(m),Y(.5),150);rg.addColorStop(0,'rgba(20,15,10,.7)');rg.addColorStop(1,'rgba(20,15,10,0)');x.fillStyle=rg;x.fillRect(X(m)-160,Y(1.7),320,Hh-Y(1.7));}
    if(!burn)for(let i=0;i<6;i++){x.fillStyle=`rgba(90,0,0,${.35+R()*.3})`;x.beginPath();x.ellipse(R()*W,Y(.8+R()*1.3),8+R()*30,4+R()*14,R(),0,7);x.fill();}});
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.repeat.set(1/L,1/H);t.offset.set(.5,0);t.anisotropy=8;BUSTEX[key]=t;return t;}

function busModel(o={}){const key=(o.burn?'b':'r')+'|'+(o.sign||'');if(BUSCACHE[key])return BUSCACHE[key].clone(true);
  const g=new THREE.Group();const burn=!!o.burn;
  const red=burn?new THREE.MeshStandardMaterial({color:0x2a2420,roughness:1,metalness:.3,map:AS.tex.rust?AS.tex.rust.d:null,normalMap:AS.tex.rust?AS.tex.rust.n:null}):new THREE.MeshPhysicalMaterial({color:0xb5130f,roughness:.32,metalness:.1,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.1});
  const black=new THREE.MeshStandardMaterial({color:0x0e0f10,roughness:.5,metalness:.4});
  const glass=burn?new THREE.MeshStandardMaterial({color:0x050505,roughness:1}):new THREE.MeshPhysicalMaterial({color:0x0b1014,roughness:.04,metalness:.1,transmission:0,envMapIntensity:1.6,clearcoat:1});
  const interior=new THREE.MeshStandardMaterial({color:burn?0x0a0807:0x2a1a1c,emissive:burn?0:0x3a2a20,emissiveIntensity:.6,roughness:.9});
  const seatM=new THREE.MeshStandardMaterial({color:burn?0x111111:0x6a1820,roughness:.9});
  const grey=new THREE.MeshStandardMaterial({color:0x6a6e72,roughness:.5,metalness:.6});const rubber=new THREE.MeshStandardMaterial({color:0x161616,roughness:.9});const rim=new THREE.MeshStandardMaterial({color:0x9a9ea2,roughness:.3,metalness:.9});
  const L=11.2,W=2.54,H=4.38;
  // side profile with rounded corners, extruded across the width with bevelled edges
  const sh=new THREE.Shape();const r1=.55,r2=.9;sh.moveTo(-L/2+.25,.45);sh.lineTo(L/2-.25,.45);sh.quadraticCurveTo(L/2,.45,L/2,.75);sh.lineTo(L/2,H-r2);sh.quadraticCurveTo(L/2,H,L/2-r2,H);sh.lineTo(-L/2+r1,H);sh.quadraticCurveTo(-L/2,H,-L/2,H-r1);sh.lineTo(-L/2,.75);sh.quadraticCurveTo(-L/2,.45,-L/2+.25,.45);
  // wheel arches
  for(const ax of[L/2-2.35,-L/2+2.75]){sh.holes=sh.holes||[];}
  const bg=new THREE.ExtrudeGeometry(sh,{depth:W-.16,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:3,curveSegments:10});bg.translate(0,0,-(W-.16)/2);bg.rotateY(-Math.PI/2);// profile x -> world z
  {const uv=bg.attributes.uv,nm=bg.attributes.normal,g0=bg.groups[0];for(let i=g0.start;i<g0.start+g0.count;i++){const vi=bg.index?bg.index.getX(i):i;if(nm.getX(vi)>.5&&!uv.__f){}}const seen=new Set();for(let i=g0.start;i<g0.start+g0.count;i++){const vi=bg.index?bg.index.getX(i):i;if(seen.has(vi))continue;seen.add(vi);if(nm.getX(vi)>.5)uv.setX(vi,-uv.getX(vi));}uv.needsUpdate=true;}
  const sideM=red.clone();sideM.map=busSideTex(burn,H32(o.sign||'x')+(burn?7:0));if(burn){sideM.normalMap=null;}const body=new THREE.Mesh(bg,[sideM,red]);body.castShadow=body.receiveShadow=true;g.add(body);
  const add=(geo,m,x,y,z,ry=0,rx=0,rz=0)=>{const ms=new THREE.Mesh(geo,m);ms.position.set(x,y,z);ms.rotation.set(rx,ry,rz);g.add(ms);return ms;};
  const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  // glazing bands: black surround + dark glass + interior plane + seat backs visible through
  for(const s of[-1,1]){const x=s*(W/2+.005);
    for(const [y,h,z0,z1] of [[1.85,1.08,-L/2+.6,L/2-1.6],[3.48,.95,-L/2+.5,L/2-.5]]){const len=z1-z0,zc=(z0+z1)/2;
      add(B(.03,h+.16,len+.16),black,x,y,zc);add(new THREE.PlaneGeometry(len,h),glass,x+s*.018,y,zc,s*Math.PI/2);
      add(new THREE.PlaneGeometry(len,h),interior,s*(W/2-.35),y,zc,s*Math.PI/2);
      for(let zz=z0+.5;zz<z1;zz+=.85)add(B(.08,.55,.55),seatM,s*(W/2-.55),y-h/2+.35,zz);
      for(let zz=z0+1.6;zz<z1-.2;zz+=1.6)add(B(.04,h,.06),black,x+s*.02,y,zz);}
    // stair glazing (diagonal) towards the rear on the nearside
    if(s<0){const sg=new THREE.Shape();sg.moveTo(0,0);sg.lineTo(1.6,1.25);sg.lineTo(1.6,2.1);sg.lineTo(.6,2.1);sg.lineTo(0,1.5);sg.closePath();const geo=new THREE.ShapeGeometry(sg);const m=new THREE.Mesh(geo,glass);m.rotation.y=-Math.PI/2;m.position.set(x-.02,1.4,-L/2+.8);g.add(m);}
    // doors (front and middle) on the kerb side
    if(s>0){for(const z of[L/2-1.55,-.6]){add(B(.04,2.05,1.15),black,x+.01,1.5,z);add(new THREE.PlaneGeometry(.5,1.85),glass,x+.035,1.55,z-.27,Math.PI/2);add(new THREE.PlaneGeometry(.5,1.85),glass,x+.035,1.55,z+.27,Math.PI/2);}}
    // livery: thin skirt + fleet stripe
    add(B(.02,.06,L-.4),grey,x+s*.01,1.22,0);
    // wheel arches + wheels
    for(const z of[L/2-2.35,-L/2+2.75]){const arch=new THREE.Mesh(new THREE.RingGeometry(.56,.7,20,1,0,Math.PI),black);arch.rotation.y=s>0?Math.PI/2:-Math.PI/2;arch.position.set(x+s*.012,.5,z);g.add(arch);
      const tyre=new THREE.Mesh(new THREE.TorusGeometry(.4,.14,10,24),rubber);tyre.rotation.y=Math.PI/2;tyre.position.set(s*(W/2-.2),.52,z);g.add(tyre);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.12,16),rim);hub.rotation.z=Math.PI/2;hub.position.set(s*(W/2-.17),.52,z);g.add(hub);for(let i=0;i<8;i++){const n=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.05,6),grey);n.rotation.z=Math.PI/2;const a=i/8*Math.PI*2;n.position.set(s*(W/2-.1),.52+Math.sin(a)*.18,z+Math.cos(a)*.18);g.add(n);}}}
  // front: big wrap windscreen (lower), upper front window, destination blinds, lights, grille, wipers
  const fz=L/2+.07;add(B(W-.2,1.55,.04),black,0,1.75,fz-.02);add(new THREE.PlaneGeometry(W-.36,1.4),glass,0,1.72,fz+.005);
  add(B(W-.2,1.0,.04),black,0,3.5,fz-.25);{const m=add(new THREE.PlaneGeometry(W-.36,.88),glass,0,3.5,fz-.22);m.rotation.x=-.12;}
  const blind=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.3),burn?black:signMat(o.sign||'38 VICTORIA','#111','#ffb22a',1.6));blind.position.set(0,2.72,fz+.01);g.add(blind);
  if(!burn){const rn=new THREE.Mesh(new THREE.PlaneGeometry(.5,.3),signMat((o.sign||'38').split(' ')[0],'#111','#ffb22a',1.6));rn.position.set(0,3.08,fz-.2);g.add(rn);}
  for(const s of[-1,1]){add(B(.32,.16,.05),new THREE.MeshStandardMaterial({color:0x222,emissive:burn?0:0xfff1cc,emissiveIntensity:burn?0:1.5}),s*.88,.82,fz);add(B(.14,.1,.05),new THREE.MeshStandardMaterial({color:0x331a00,emissive:burn?0:0xff8a10,emissiveIntensity:1}),s*1.12,.82,fz);
    // mirrors on stalks
    const arm=add(B(.05,.05,.6),black,s*(W/2+.15),2.55,L/2-.15,s*.4);const mh=add(B(.1,.42,.24),black,s*(W/2+.32),2.3,L/2+.05);
    // rear lights
    add(B(.18,.5,.04),new THREE.MeshStandardMaterial({color:0x300,emissive:burn?0:0xff2010,emissiveIntensity:.9}),s*1.05,1.3,-L/2-.07);}
  add(B(1.8,.3,.04),black,0,.9,fz);// grille
  add(B(.06,.04,.9),black,-.45,1.1,fz+.03,0,0,.5);add(B(.06,.04,.9),black,.45,1.1,fz+.03,0,0,-.5);// wipers
  // rear: engine louvres + window
  add(B(W-.5,.8,.04),black,0,3.4,-L/2-.06);add(new THREE.PlaneGeometry(W-.7,.65),glass,0,3.4,-L/2-.085,Math.PI);for(let i=0;i<7;i++)add(B(W-.6,.04,.04),grey,0,.75+i*.1,-L/2-.07);
  // roof details: vents
  for(const z of[-2,2])add(B(.8,.08,.6),grey,0,H+.04,z);
  if(burn){for(let i=0;i<6;i++){const m=add(B(.9+Math.random(),.02,.6+Math.random()),black,(Math.random()-.5)*2,H+.01,(Math.random()-.5)*8);m.rotation.y=Math.random();}}
  g.traverse(c=>{if(c.isMesh){c.castShadow=c!==body?false:true;c.receiveShadow=true;}});body.castShadow=true;
  BUSCACHE[key]=g;return g.clone(true);}
