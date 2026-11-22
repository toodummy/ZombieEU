function buildRoads(){
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
  for(const [ped,pts] of WD.paths){const pm=ped?MAT.pave:MAT.gravel;ribbon(bk(pm,pts[0],pts[1]),pts,ped?4:2.2,ped?PAVE_Y:.09,3,3);}
}
const PAVE_Y=.13,GROUND_Y=.06;
// surface height under a point (carriageway 0, pavement kerb-high, bridge decks, open ground)
function groundH(x,z){const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(!cell)return GROUND_Y;let pave=false;
  for(const c of cell){const ax=c[0],az=c[1],dx=c[2]-ax,dz=c[3]-az;const L2=dx*dx+dz*dz||1;const t=clamp(((x-ax)*dx+(z-az)*dz)/L2,0,1);const d=Math.hypot(x-ax-dx*t,z-az-dz*t);
    if(c[8]){if(d<c[4])return .035;continue;}if(d<c[7])return 0;if(c[9]<=4&&d<c[4])pave=true;}
  return pave?PAVE_Y:GROUND_Y;}
// solid line segments (walls, railings, river edges, bridge parapets)
const SEG=new Map();const SGC=16;
function segAdd(ax,az,bx,bz,t){const s={ax,az,bx,bz,t};for(let i=Math.floor((Math.min(ax,bx)-t)/SGC);i<=Math.floor((Math.max(ax,bx)+t)/SGC);i++)for(let j=Math.floor((Math.min(az,bz)-t)/SGC);j<=Math.floor((Math.max(az,bz)+t)/SGC);j++){const k=i+','+j;let a=SEG.get(k);if(!a)SEG.set(k,a=[]);a.push(s);}}
function segLine(pts,t){for(let i=0;i<pts.length/2-1;i++)segAdd(pts[i*2],pts[i*2+1],pts[i*2+2],pts[i*2+3],t);}
function segAt(x,z,r){const a=SEG.get(Math.floor(x/SGC)+','+Math.floor(z/SGC));if(!a)return null;let best=null;
  for(const s of a){const dx=s.bx-s.ax,dz=s.bz-s.az;const L2=dx*dx+dz*dz||1;const t=clamp(((x-s.ax)*dx+(z-s.az)*dz)/L2,0,1);const qx=s.ax+dx*t,qz=s.az+dz*t;let nx=x-qx,nz=z-qz;const d=Math.hypot(nx,nz);const m=r+s.t/2;
    if(d<m){if(d<1e-4){nx=-dz;nz=dx;}const l=Math.hypot(nx,nz)||1;const q={x:qx+nx/l*m,z:qz+nz/l*m,d:m-d};if(!best||q.d>best.d)best=q;}}return best;}
function onBridge(x,z,pad=2){const cell=RGRID.get(Math.floor(x/RG)+','+Math.floor(z/RG));if(!cell)return false;for(const c of cell){if(!c[8])continue;if(!capRes(c,x,z,-pad))return true;}return false;}
