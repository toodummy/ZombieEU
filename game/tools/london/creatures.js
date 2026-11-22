// ================================================================ infected roster: extra human bodies (retargeted), dogs, foxes, cats, rats
const MIXN={Hips:'Hips',Spine02:'Spine',Spine01:'Spine1',Spine:'Spine2',neck:'Neck',Head:'Head',head_end:'HeadTop_End',LeftShoulder:'LeftShoulder',LeftArm:'LeftArm',LeftForeArm:'LeftForeArm',LeftHand:'LeftHand',RightShoulder:'RightShoulder',RightArm:'RightArm',RightForeArm:'RightForeArm',RightHand:'RightHand',LeftUpLeg:'LeftUpLeg',LeftLeg:'LeftLeg',LeftFoot:'LeftFoot',LeftToeBase:'LeftToeBase',RightUpLeg:'RightUpLeg',RightLeg:'RightLeg',RightFoot:'RightFoot',RightToeBase:'RightToeBase'};
function boneOf(o,n){return o.getObjectByName(n)||o.getObjectByName('mixamorig'+(MIXN[n]||n))||o.getObjectByName('mixamorig:'+(MIXN[n]||n));}
// world-space retarget: replays each source bone's rotation (relative to its rest pose) on the target, after aligning rest directions (T-pose vs A-pose)
function retargetWorld(srcScene,srcClip,tgtScene,fps=24){const S=skClone(srcScene),T=skClone(tgtScene);const holder=new THREE.Group();holder.add(S,T);holder.updateMatrixWorld(true);
  const Q=()=>new THREE.Quaternion(),V=()=>new THREE.Vector3();const pairs=[];
  for(const n of Object.keys(MIXN)){const sb=S.getObjectByName(n),tb=boneOf(T,n);if(!sb||!tb||!sb.isBone||!tb.isBone)continue;
    const sc=sb.children.find(c=>c.isBone),tc=tb.children.find(c=>c.isBone);let C=Q();
    if(sc&&tc){const ds=sc.getWorldPosition(V()).sub(sb.getWorldPosition(V())).normalize(),dt=tc.getWorldPosition(V()).sub(tb.getWorldPosition(V())).normalize();if(ds.lengthSq()>.5&&dt.lengthSq()>.5)C.setFromUnitVectors(dt,ds);}
    pairs.push({n,sb,tb,qs0:sb.getWorldQuaternion(Q()),qt0:tb.getWorldQuaternion(Q()),C,depth:(()=>{let d=0,p=tb;while(p.parent){d++;p=p.parent;}return d;})()});}
  pairs.sort((a,b)=>a.depth-b.depth);const hip=pairs.find(p=>p.n==='Hips');
  const sh0=hip?hip.sb.getWorldPosition(V()):null,th0=hip?hip.tb.getWorldPosition(V()):null;const ratio=hip?th0.y/Math.max(.01,sh0.y):1;
  const mixer=new THREE.AnimationMixer(S);mixer.clipAction(srcClip).play();const n=Math.max(2,Math.ceil(srcClip.duration*fps)+1);const times=new Float32Array(n);const Qv={},Pv=new Float32Array(n*3);for(const p of pairs)Qv[p.n]=new Float32Array(n*4);
  const q1=Q(),q2=Q(),v1=V();
  for(let i=0;i<n;i++){const t=Math.min(srcClip.duration,i/fps);times[i]=t;mixer.setTime(t);S.updateMatrixWorld(true);
    for(const p of pairs){p.sb.getWorldQuaternion(q1);const D=q1.clone().multiply(p.qs0.clone().invert());const want=D.multiply(p.C).multiply(p.qt0);p.tb.parent.getWorldQuaternion(q2);p.tb.quaternion.copy(q2.invert().multiply(want));p.tb.updateMatrixWorld(true);const a=Qv[p.n];a[i*4]=p.tb.quaternion.x;a[i*4+1]=p.tb.quaternion.y;a[i*4+2]=p.tb.quaternion.z;a[i*4+3]=p.tb.quaternion.w;}
    if(hip){hip.sb.getWorldPosition(v1);const w=th0.clone();w.y+=(v1.y-sh0.y)*ratio;const loc=hip.tb.parent.worldToLocal(w.clone());Pv[i*3]=hip.tb.position.x;Pv[i*3+1]=loc.y;Pv[i*3+2]=hip.tb.position.z;}}
  const tracks=pairs.map(p=>new THREE.QuaternionKeyframeTrack(p.tb.name+'.quaternion',times,Qv[p.n]));if(hip)tracks.push(new THREE.VectorKeyframeTrack(hip.tb.name+'.position',times,Pv));
  mixer.stopAllAction();return new THREE.AnimationClip(srcClip.name+'_rt',srcClip.duration,tracks);}
const ZBASES={};
function initBases(){ZBASES.zombie={scene:AS.zombie&&AS.zombie.scene,clips:ZCLIPS,low:AS.zLowGeo,w:3};if(AS.alex&&AS.aLowGeo)ZBASES.alex={scene:AS.alex.scene,clips:ZCLIPS,low:AS.aLowGeo,hands:.74,w:2.4};
  for(const k of ['michelle','soldier']){const g=AS.cre&&AS.cre[k];if(!g||!AS.zombie)continue;const clips={};for(const c of ['walk','run','attack','die','scream'])if(ZCLIPS[c])try{clips[c]=retargetWorld(AS.zombie.scene,ZCLIPS[c],g.scene);}catch(e){console.warn('retarget',k,c,e);}
    let low=null;const lg=AS.cre[k+'_low'];if(lg)lg.scene.traverse(c=>{if(c.isSkinnedMesh&&!low)low=c.geometry;});ZBASES[k]={scene:g.scene,clips,low,w:k==='michelle'?2.6:1.6,female:k==='michelle'};}}
function pickBase(type,hint){if(hint&&ZBASES[hint])return ZBASES[hint];if(type==='brute')return ZBASES.zombie;if(type==='screamer')return Math.random()<.6&&ZBASES.michelle?ZBASES.michelle:ZBASES.zombie;
  const L=Object.values(ZBASES).filter(b=>b.scene);let s=0;for(const b of L)s+=b.w;let r=Math.random()*s;for(const b of L){r-=b.w;if(r<=0)return b;}return L[0];}
// ---------------------------------------------------------------- animals
const ANIMAL={dog:{hp:45,speed:6.4,dmg:11,h:.78},fox:{hp:28,speed:5.6,dmg:7,h:.5},cat:{hp:18,speed:5.2,dmg:5,h:.34},rat:{hp:4,speed:3.4,dmg:3,h:.12}};
const DOGMAP={walk:'Walk',run:'Gallop',attack:'Attack',die:'Death',scream:'Idle_2_HeadLow',idle:'Idle'},FOXMAP={walk:'Walk',run:'Run',attack:'Run',scream:'Survey',idle:'Survey'};
function prepAnimal(g){// smooth the low-poly shading and strip root motion
  g.scene.traverse(c=>{if(c.isSkinnedMesh&&!c.userData.sm){c.userData.sm=true;let geo=c.geometry;geo.deleteAttribute('normal');geo=BGU.mergeVertices(geo,1e-4);geo.computeVertexNormals();c.geometry=geo;}});
  for(const a of g.animations){a.tracks=a.tracks.filter(t=>!(/\.position$/.test(t.name)&&/(Body|Root|root|_rootJoint|b_Root)/.test(t.name))||true);for(const t of a.tracks){if(/\.position$/.test(t.name)&&/^(Body|b_Root_00|_rootJoint)\./.test(t.name)){for(let i=0;i<t.values.length;i+=3){t.values[i]=t.values[0];t.values[i+2]=t.values[2];}}}}}
function eyesOn(head,hr,g){if(!head)return;const em=new THREE.MeshBasicMaterial({color:0xff2a10});for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(hr,6,4),em);g.updateMatrixWorld(true);const p=head.getWorldPosition(new THREE.Vector3());e.position.set(p.x+s*hr*2.6,p.y+hr*1.2,p.z+hr*5);g.add(e);e.updateMatrixWorld(true);head.attach(e);}}
function makeAnimalModel(type){const R=mulberry((Math.random()*1e9)|0);
  if(type==='dog'||type==='fox'){const src=type==='fox'?AS.cre.fox:[AS.cre.husky,AS.cre.shibainu,AS.cre.wolf][(R()*3)|0];const o=skClone(src.scene);const map=type==='fox'?FOXMAP:DOGMAP;
    const tint=new THREE.Color().setHSL(.07+R()*.05,.25+R()*.3,.25+R()*.35);o.traverse(c=>{if(c.isMesh&&c.material){const f=m=>{const n=m.clone();if(!n.map)n.color.multiply(tint).multiplyScalar(.9);else n.color.setScalar(.75+R()*.2);n.roughness=1;if(R()<.5)n.color.lerp(new THREE.Color(0x5a0c08),.18);return n;};c.material=Array.isArray(c.material)?c.material.map(f):f(c.material);c.castShadow=true;c.frustumCulled=false;}});
    const g=new THREE.Group();g.add(o);const mixer=new THREE.AnimationMixer(o);const acts={};for(const k in map){const cl=src.animations.find(a=>a.name===map[k]);if(cl)acts[k]=mixer.clipAction(cl);}
    const head=o.getObjectByName('Head')||o.getObjectByName('b_Head_05');eyesOn(head,type==='fox'?.012:.018,o);
    return{g,mixer,acts,head,skinned:true,animal:type,noDie:!acts.die,tsk:.9+R()*.25};}
  // procedural cat / rat: jointed body animated in code
  const cat=type==='cat';const L=cat?.46:.2,Hh=cat?.2:.075;const col=cat?[0x161616,0xb8642a,0x6a6660,0xe8e0d0,0x3a2a20][(R()*5)|0]:[0x3a332c,0x4a4038,0x2a2622][(R()*3)|0];
  const fur=new THREE.MeshStandardMaterial({color:col,roughness:.95});const dark=new THREE.MeshStandardMaterial({color:0x111111,roughness:.8});const pink=new THREE.MeshStandardMaterial({color:0xb87a78,roughness:.7});
  const g=new THREE.Group();const body=new THREE.Group();g.add(body);const legH=cat?.2:.045;body.position.y=legH+Hh*.5;
  const torso=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),fur);torso.scale.set(Hh*.55,Hh*.5,L*.5);body.add(torso);
  const head=new THREE.Group();head.position.set(0,Hh*.35,L*.48);body.add(head);const hs=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),fur);hs.scale.set(cat?.075:.035,cat?.07:.03,cat?.08:.05);head.add(hs);
  if(!cat){const sn=new THREE.Mesh(new THREE.ConeGeometry(.018,.05,8),fur);sn.rotation.x=Math.PI/2;sn.position.z=.05;head.add(sn);}
  for(const s of[-1,1]){const ear=new THREE.Mesh(cat?new THREE.ConeGeometry(.03,.06,4):new THREE.SphereGeometry(.014,6,4),cat?fur:pink);ear.position.set(s*(cat?.045:.022),cat?.065:.025,cat?-.01:0);head.add(ear);
    const e=new THREE.Mesh(new THREE.SphereGeometry(cat?.012:.006,6,4),new THREE.MeshBasicMaterial({color:cat?0xffe040:0xff2010}));e.position.set(s*(cat?.03:.015),cat?.02:.01,cat?.065:.035);head.add(e);}
  const legs=[];for(const [x,z] of [[-1,1],[1,1],[-1,-1],[1,-1]]){const p=new THREE.Group();p.position.set(x*Hh*.35,0,z*L*.32);body.add(p);const l=new THREE.Mesh(new THREE.CylinderGeometry(cat?.018:.007,cat?.014:.005,legH+Hh*.3,6),cat?fur:pink);l.position.y=-(legH+Hh*.3)/2;p.add(l);legs.push(p);}
  const tail=[];let parent=body;const tl=cat?.07:.045;const tp=new THREE.Group();tp.position.set(0,Hh*.2,-L*.5);body.add(tp);parent=tp;for(let i=0;i<6;i++){const s=new THREE.Group();if(i)s.position.z=-tl;parent.add(s);const m=new THREE.Mesh(new THREE.CylinderGeometry((cat?.016:.008)*(1-i*.12),(cat?.016:.008)*(1-(i+1)*.12),tl,5),cat?fur:pink);m.rotation.x=Math.PI/2;m.position.z=-tl/2;s.add(m);tail.push(s);parent=s;}
  g.traverse(c=>{if(c.isMesh)c.castShadow=cat;});
  const proc=(z,dt,mv)=>{z.ph+=dt*(4+mv*(cat?3:9));const s=Math.sin(z.ph),c=Math.cos(z.ph);const k=Math.min(1,mv/1.5);
    legs[0].rotation.x=s*.8*k;legs[3].rotation.x=s*.8*k;legs[1].rotation.x=-s*.8*k;legs[2].rotation.x=-s*.8*k;body.position.y=legH+Hh*.5+Math.abs(c)*.02*k*(cat?1:.4);
    for(let i=0;i<tail.length;i++){tail[i].rotation.y=Math.sin(z.ph*.5-i*.6)*(.25+.2*(1-k));tail[i].rotation.x=cat?(i===0?-.6:.12):.05;}
    head.rotation.x=z.atkT>.35?-.4:Math.sin(z.ph*.5)*.08;if(cat&&z.alert&&mv<.5){body.rotation.x=-.15;}else body.rotation.x=0;};
  return{g,skinned:false,proc,animal:type,noDie:true};}
function sfxAnimal(z){if(!AU.on)return;const t=AC.currentTime,p=_pan(z.x,z.z);
  if(z.animal==='rat'){for(let i=0;i<3;i++)tone(p,t+i*.06,rnd(3200,5200),.05,.05,'triangle',rnd(2500,4000));}
  else if(z.animal==='cat'){noiseBurst(p,t,.5,3200,.6,.25,'highpass');tone(p,t,rnd(500,700),.4,.05,'sawtooth',rnd(300,400));}
  else if(z.animal==='dog'||z.animal==='fox'){for(let i=0;i<(z.alert?2+(Math.random()*3|0):1);i++){const tt=t+i*rnd(.22,.35);tone(p,tt,z.animal==='fox'?rnd(700,900):rnd(260,380),.14,.18,'sawtooth',z.animal==='fox'?400:130);noiseBurst(p,tt,.12,z.animal==='fox'?1800:900,1.2,.22);}}}
