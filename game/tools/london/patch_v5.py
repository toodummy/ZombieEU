p='/home/claude/game/dist/index.html'
s=open(p).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:100],n);s=s.replace(a,b)
# breakables + kerb bumps
rep("  // collisions\n  let impact=0,inx=0,inz=0;const hl=CARDIM.len/2-1.0;","  carBreak();\n  // collisions\n  let impact=0,inx=0,inz=0;const hl=CARDIM.len/2-1.0;")
rep("  if(PL.inCar&&pressed('horn')){snd('horn',car.x,car.z,1);noise(car.x,car.z,60);}\n}",
"""  if(PL.inCar&&pressed('horn')){snd('horn',car.x,car.z,1);noise(car.x,car.z,60);}
  // ride height: kerbs, pavements and bridge decks — mount a kerb with a little hop
  {const hb=CARDIM.len/2-.8;const gF=groundH(car.x+fx*hb,car.z+fz*hb),gR=groundH(car.x-fx*hb,car.z-fz*hb);const g=Math.max(gF,gR);car.vy=(car.vy||0)-20*dt;car.y=(car.y||0)+car.vy*dt;
   if(car.y<g){const step=g-car.y;if(step>.06&&sp>1.5){car.vy=Math.min(3.4,.9+sp*.13);car.pv-=Math.sign(vf)*(1.2+sp*.08);car.rv+=rnd(-1,1)*.8;if(typeof sfxThump==='function')sfxThump(car.x,car.z,clamp(sp/18,.25,1));else snd('crash',car.x,car.z,.15,.6);shake=Math.max(shake,.08+sp*.006);if(sp>13){car.wheel=Math.max(0,car.wheel-(sp-13)*.25);}}else if(car.vy<-2.5&&typeof sfxThump==='function')sfxThump(car.x,car.z,clamp(-car.vy/8,.15,.6));if(car.vy<0)car.vy=0;car.y=g;}
   car.pitchK=(gF-gR)*.35;}
}""")
rep("function updVisuals(dt){carG.position.set(car.x,0,car.z);carG.rotation.y=car.h;carBody.rotation.x=clamp(car.pitch,-.05,.05);",
    "function updVisuals(dt){carG.position.set(car.x,car.y||0,car.z);carG.rotation.y=car.h;carBody.rotation.x=clamp(car.pitch,-.07,.07)-(car.pitchK||0);updDebris(dt);")
rep("function animPlayer(speed,dt){const g=plEnt.g;g.position.set(PL.x,0,PL.z);", "function animPlayer(speed,dt){const g=plEnt.g;PL.gy=lerp(PL.gy||0,groundH(PL.x,PL.z),1-Math.exp(-14*dt));g.position.set(PL.x,PL.gy,PL.z);")
rep("    g.position.set(z.x,0,z.z);const face=", "    if(!(frameN%4)||z.gy===undefined)z.gy=groundH(z.x,z.z);g.position.set(z.x,z.gy,z.z);const face=")
# wrecks / buses sit on the surface they are placed on
rep("function wreck(x,z,ry,col,o={}){const g=new THREE.Group();g.position.set(x,0,z);", "function wreck(x,z,ry,col,o={}){const g=new THREE.Group();g.position.set(x,(typeof groundH==='function'&&WD)?groundH(x,z):0,z);")
# dead lamps never take a pool slot
rep(".filter(a=>a[1]<(a[0].d+60)**2)", ".filter(a=>a[0].i>0&&a[1]<(a[0].d+60)**2)")
open(p,'w').write(s);print('v5 ok')
s=open(p).read()
# --- player: rescale borrowed clips to Alex's hip height (fixes sinking to the knees when idle / walking)
rep("for(const c of ['walk','idle','swing'])jobs.push(track(loadGLB(murl('alex_'+c)).then(g=>{if(g.animations[0])AS.aclips[c]=g.animations[0];",
    "for(const c of ['walk','idle','swing'])jobs.push(track(loadGLB(murl('alex_'+c)).then(g=>{const hb=g.scene.getObjectByName('Hips');if(hb)(AS.aBind=AS.aBind||{})[c]=hb.position.y;if(g.animations[0])AS.aclips[c]=g.animations[0];")
rep("jobs.push(track(loadGLB(murl('alex')).then(g=>{AS.alex=g;", "jobs.push(track(loadGLB(murl('alex')).then(g=>{AS.alex=g;{const hb=g.scene.getObjectByName('Hips');if(hb)(AS.aBind=AS.aBind||{}).alex=hb.position.y;}")
rep("for(const k of ['run','walk','idle','swing'])ACLIPS[k]=prepClip(AS.aclips[k],k);}",
    """for(const k of ['run','walk','idle','swing']){ACLIPS[k]=prepClip(AS.aclips[k],k);const B=AS.aBind||{};const c=ACLIPS[k];if(c&&B[k]&&B.alex){const r=B.alex/B[k];const pt=c.tracks.find(t=>/Hips\\.position$/.test(t.name));if(pt&&Math.abs(r-1)>.05){for(let i=0;i<pt.values.length;i++)pt.values[i]*=r;}}}}""")
# --- hands at a natural size + procedural crowbar swing
rep("    o.traverse(b=>{if(b.isBone&&/right.?hand$/i.test(b.name))handBone=b;});",
    "    o.traverse(b=>{if(b.isBone&&/^(Left|Right)Hand$/.test(b.name))b.scale.setScalar(.74);if(b.isBone)PLB[b.name]=b;});o.updateMatrixWorld(true);\n    o.traverse(b=>{if(b.isBone&&/right.?hand$/i.test(b.name))handBone=b;});")
rep("if(plEnt.acts)play(plEnt,'swing',{fade:.08,once:true,ts:(ACLIPS.swing?ACLIPS.swing.duration/.6:1)});","")
rep("    plEnt.mixer.update(dt);g.rotation.x=PL.dodgeT>0?.25:0;}", "    plEnt.mixer.update(dt);g.rotation.x=PL.dodgeT>0?.25:0;g.updateMatrixWorld(true);if(PL.atkT>0)swingPose(1-PL.atkT/.55);else if(PL.fireT>-.4&&PL.wep)aimPose();}")
rep("const muzzle=new THREE.PointLight(0xffc070,0,14,2);scene.add(muzzle);", r"""const muzzle=new THREE.PointLight(0xffc070,0,14,2);scene.add(muzzle);
// ---------------------------------------------------------------- procedural upper-body animation (axis-agnostic: aims bones at character-space directions)
const PLB={};const _bq=new THREE.Quaternion(),_bq2=new THREE.Quaternion(),_bv1=new THREE.Vector3(),_bv2=new THREE.Vector3(),_bv3=new THREE.Vector3(),_pq=new THREE.Quaternion();
function boneWorldRot(bone,qDelta){bone.parent.getWorldQuaternion(_pq);const wq=bone.getWorldQuaternion(_bq2);const nq=qDelta.clone().multiply(wq);bone.quaternion.copy(_pq.invert().multiply(nq));bone.updateMatrixWorld(true);}
function aimBone(bone,child,dirLocal,w){if(!bone||!child||w<=0)return;const g=plEnt.g;bone.getWorldPosition(_bv1);child.getWorldPosition(_bv2);const cur=_bv2.sub(_bv1).normalize();const tgt=_bv3.copy(dirLocal).normalize().applyQuaternion(g.quaternion);
  const q=new THREE.Quaternion().setFromUnitVectors(cur,tgt);q.slerp(new THREE.Quaternion(),1-w);boneWorldRot(bone,q);}
function twistSpine(a,lean){const sp=PLB.Spine02||PLB.Spine01;if(!sp)return;const q=new THREE.Quaternion().setFromAxisAngle(_bv1.set(0,1,0),a);const q2=new THREE.Quaternion().setFromAxisAngle(_bv2.set(1,0,0).applyQuaternion(plEnt.g.quaternion),lean);boneWorldRot(sp,q2.multiply(q));}
const SWK=[// t, upper-arm dir, fore-arm dir, spine twist, lean  (character space: +z forward, +x left, +y up)
  [0,   [-.35,-.9,.15],[-.1,-.8,.5], 0,0],
  [.28, [-.55,.75,-.35],[-.05,.35,-.95],.55,-.05],
  [.42, [.15,.15,.95],[.35,-.35,.9],-.35,.18],
  [.58, [.45,-.6,.6],[.55,-.7,.4],-.55,.12],
  [1,   [-.35,-.9,.15],[-.1,-.8,.5], 0,0]];
const sm=t=>t*t*(3-2*t);
function swingPose(t){t=clamp(t,0,1);let i=0;while(i<SWK.length-2&&SWK[i+1][0]<t)i++;const A=SWK[i],B=SWK[i+1];const u=sm(clamp((t-A[0])/(B[0]-A[0]),0,1));const L=(a,b)=>new THREE.Vector3(...a).lerp(new THREE.Vector3(...b),u);
  const w=Math.min(1,Math.min(t,1-t)*10);twistSpine((A[3]+(B[3]-A[3])*u)*w,(A[4]+(B[4]-A[4])*u)*w);aimBone(PLB.RightArm,PLB.RightForeArm,L(A[1],B[1]),w);aimBone(PLB.RightForeArm,PLB.RightHand,L(A[2],B[2]),w);
  aimBone(PLB.LeftArm,PLB.LeftForeArm,new THREE.Vector3(.5,-.7,.4),w*.6);}
function aimPose(){const w=clamp((PL.fireT+.4)/.4,0,1);const f=new THREE.Vector3(-.12,.02,1);aimBone(PLB.RightArm,PLB.RightForeArm,f,w);aimBone(PLB.RightForeArm,PLB.RightHand,f,w);if(PL.wep==='shotgun'){aimBone(PLB.LeftArm,PLB.LeftForeArm,new THREE.Vector3(-.4,-.1,.9),w);aimBone(PLB.LeftForeArm,PLB.LeftHand,new THREE.Vector3(-.2,0,1),w);}}
""")
open(p,'w').write(s);print('player ok')
s=open(p).read()
# ---------------------------------------------------------------- UX: field guide in pause menu, world markers, one-time hints
rep('<div class="screen" id="pause"><div class="card">\n  <span class="tag">PAUSED</span><h2>Out of London</h2>',
'''<div class="screen" id="pause"><div class="card" style="max-width:720px">
  <span class="tag">PAUSED</span><h2>Out of London</h2>
  <div class="guide">
   <div><b>⛽ Fuel</b> The tank is nearly dry. Reach the petrol station off Dunton Road (follow the yellow beacon). Park beside a pump, get out (<kbd>F</kbd>) and hold <kbd>E</kbd>. Red canisters on the map add +6 L.</div>
   <div><b>🔧 Scrap &amp; repairs</b> Wrecks with a <span class="mk">🔧</span> marker can be searched: get out and hold <kbd>E</kbd> next to them. Scrap repairs the sedan: stand next to it on foot and hold <kbd>E</kbd> — 2 scrap restores +18% to the most damaged part (body, engine or wheels).</div>
   <div><b>🔫 Weapons</b> The crowbar is always in hand (<kbd>Click</kbd> / <kbd>J</kbd>). The pistol fires with <kbd>Right-click</kbd> / <kbd>K</kbd> — loud, it draws the horde. Find the <b>shotgun</b> in the police car on Tower Bridge Road or the army crate at the Old Kent Road checkpoint (marked <span class="mk">🔫</span>). <kbd>Q</kbd> swaps, <kbd>R</kbd> reloads.</div>
   <div><b>✚ Health</b> Medkits come from searched wrecks; <kbd>G</kbd> heals. <kbd>Space</kbd> dodges on foot, <kbd>Shift</kbd> sprints.</div>
   <div><b>🚗 Driving</b> You can mount kerbs and plough through signs, lamps, bollards and bus shelters — small props cost little damage, heavy ones (post boxes, phone boxes, shelters) cost a lot. Infected clinging to the car are shaken off by swerving.</div>
   <div><b>☣ Infected</b> Runners sprint, brutes shrug off the crowbar, and screamers call the whole street if you let them finish — kill them first.</div>
  </div>''')
rep("</style>", """.guide{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;text-align:left;font-size:13px;line-height:1.45;margin:12px 0 16px;color:#d8dccf}.guide b{color:#d5e870}.guide kbd{display:inline-block;padding:0 5px;border:1px solid rgba(213,232,112,.45);border-radius:4px;font:600 11px Inter,sans-serif;color:#fff;background:rgba(255,255,255,.06)}.mk{filter:saturate(1.4)}
@media (max-width:700px){.guide{grid-template-columns:1fr;font-size:12px}}
#marks{position:fixed;inset:0;pointer-events:none;z-index:5}.wm{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;font:700 11px Inter,sans-serif;color:#fff;text-shadow:0 1px 3px #000;white-space:nowrap}
.wm i{font-style:normal;font-size:18px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(10,14,12,.72);border:1.5px solid rgba(213,232,112,.8);box-shadow:0 0 12px rgba(213,232,112,.35)}.wm.near i{border-color:#fff;box-shadow:0 0 16px rgba(255,255,255,.6)}.wm span{margin-top:3px;padding:1px 6px;border-radius:4px;background:rgba(0,0,0,.45)}.wm:after{content:'';width:2px;height:10px;background:rgba(213,232,112,.6)}
#hint{position:fixed;left:50%;bottom:205px;transform:translateX(-50%) translateY(20px);max-width:min(560px,90vw);padding:12px 16px 12px 14px;border-radius:12px;background:rgba(10,14,12,.88);border:1px solid rgba(213,232,112,.4);color:#e8ecdf;font:500 14px/1.45 Inter,sans-serif;opacity:0;transition:opacity .35s,transform .35s;z-index:7;pointer-events:none;display:flex;gap:10px;align-items:flex-start}
#hint.on{opacity:1;transform:translateX(-50%)}#hint .hi{font-size:22px;line-height:1}#hint b{color:#d5e870}
</style>""")
rep('  <div id="prompt" class="panel">', '  <div id="marks"></div><div id="hint"><div class="hi" id="hintI"></div><div id="hintT"></div></div>\n  <div id="prompt" class="panel">')
rep("const mini=$('mini'),mx=mini.getContext('2d');", r"""const mini=$('mini'),mx=mini.getContext('2d');
// ---- one-time hints (persist across runs)
const HINTS=(()=>{try{return JSON.parse(localStorage.getItem('rotd_hints')||'{}');}catch(e){return{};}})();let hintQ=[],hintT=0;
function hint(id,icon,html,dur=7){if(HINTS[id])return;HINTS[id]=1;try{localStorage.setItem('rotd_hints',JSON.stringify(HINTS));}catch(e){}hintQ.push({icon,html,dur});}
function updHints(dt){if(hintT>0){hintT-=dt;if(hintT<=0)$('hint').classList.remove('on');return;}const h=hintQ.shift();if(!h)return;$('hintI').textContent=h.icon;$('hintT').innerHTML=h.html;$('hint').classList.add('on');hintT=h.dur;}
const K_=(d,t)=>isTouch?t:d;
function hintTriggers(){const px=PL.inCar?car.x:PL.x,pz=PL.inCar?car.z:PL.z;
  if(MS.time>9)hint('fuel','⛽',`Fuel is critical. Follow the <b>yellow beacon</b> to the petrol station off Dunton Road — over Tower Bridge and down the Old Kent Road.`,8);
  if(MS.time>20)hint('props','🚗',`You can ride up kerbs and smash through <b>signs, lamps, bollards and bus shelters</b>. Light props barely scratch the car; post boxes, phone boxes and shelters hurt.`,8);
  const l=LOOT.find(l=>!l.done&&Math.hypot(l.x-px,l.z-pz)<28);if(l)hint('loot','🔧',`Wrecks marked <b>🔧</b> can be searched for scrap, ammo and medkits. Stop, get out (${K_('<b>F</b>','<b>EXIT</b>')}) and hold ${K_('<b>E</b>','<b>USE</b>')} next to it.`,8);
  if(PL.scrap>0)hint('scrap','🔩',`Scrap repairs the sedan: on foot, stand by the car and hold ${K_('<b>E</b>','<b>USE</b>')}. 2 scrap = +18% to the worst part (body, engine or wheels).`,8);
  if(Math.min(car.body,car.engine,car.wheel)<60&&PL.scrap>=2)hint('repair','🛠',`The car is hurting and you have scrap — get out and hold ${K_('<b>E</b>','<b>USE</b>')} beside it to repair.`,7);
  if(!PL.inCar)hint('foot','🗡',`On foot: ${K_('<b>Click / J</b> swings the crowbar, <b>Right-click / K</b> fires the pistol (loud!)','<b>ATTACK</b> swings, <b>FIRE</b> shoots (loud!)')}. ${K_('<b>Space</b> dodges, <b>G</b> uses a medkit.','')} Pause for the full field guide.`,8);
  if(PL.hasShotgun)hint('shotgun','🔫',`Shotgun! ${K_('<b>Q</b> swaps weapons, <b>R</b> reloads.','<b>SWAP</b> changes weapon.')} Shells are scarce — search police cars and army crates.`,7);
  if(MS.screamer&&MS.screamer.state!=='dead')hint('scream','📢','A <b>screamer</b>. If it finishes its call the whole street comes running — kill it first.',6);
  if(Z.some(z=>z.type==='brute'&&z.state!=='dead'&&Math.hypot(z.x-px,z.z-pz)<35))hint('brute','💪','A <b>brute</b>. The crowbar barely staggers it — use the shotgun, or ram it at speed.',6);
  if(PL.carry)hint('can','🛢',`Carry the canister back to the car and hold ${K_('<b>E</b>','<b>USE</b>')} beside it to pour (+6 L).`,6);}
// ---- world markers (HTML overlay, projected)
const MK=[];const _mv=new THREE.Vector3();
function mkEl(){const e=document.createElement('div');e.className='wm';e.innerHTML='<i></i><span></span>';$('marks').appendChild(e);return e;}
function lootIcon(l){const I=l.items;return I.shotgun?'🔫':I.med&&!I.scrap?'✚':I.can?'🛢':I.pistol&&!I.scrap?'🔫':'🔧';}
function updMarks(){const px=PL.inCar?car.x:PL.x,pz=PL.inCar?car.z:PL.z;const list=[];
  for(const l of LOOT){if(l.done)continue;const d=Math.hypot(l.x-px,l.z-pz);if(d<45)list.push({x:l.x,y:1.9,z:l.z,i:lootIcon(l),t:d<4?(isTouch?'hold USE':'hold E'):(l.label.replace('Search ','').replace('Open ','')+' · '+Math.round(d)+'m'),d});}
  for(const c of MS.canisters){if(c.taken)continue;const d=Math.hypot(c.x-px,c.z-pz);if(d<60)list.push({x:c.x,y:1.2,z:c.z,i:'🛢',t:'fuel +6 L · '+Math.round(d)+'m',d});}
  if(!PL.inCar){const w=worstPart();const d=Math.hypot(car.x-px,car.z-pz);if(w.v<85)list.push({x:car.x,y:2,z:car.z,i:'🛠',t:PL.scrap>=2?`repair ${w.n} · hold ${isTouch?'USE':'E'}`:`need 2 scrap (${PL.scrap})`,d});}
  list.sort((a,b)=>a.d-b.d);while(MK.length<list.length&&MK.length<10)MK.push(mkEl());
  MK.forEach((e,i)=>{const m=list[i];if(!m){e.style.display='none';return;}_mv.set(m.x,m.y+(PL.inCar?.6:0),m.z).project(camera);if(_mv.z>1||Math.abs(_mv.x)>1.1||Math.abs(_mv.y)>1.1){e.style.display='none';return;}
    e.style.display='flex';e.style.left=((_mv.x+1)/2*innerWidth)+'px';e.style.top=((1-_mv.y)/2*innerHeight)+'px';e.classList.toggle('near',m.d<4);const s=clamp(1.15-m.d/80,.6,1.15);e.style.transform=`translate(-50%,-100%) scale(${s})`;e.firstChild.textContent=m.i;e.lastChild.textContent=m.t;});}
""")
rep("function updHUD(dt){const o=objective();", "function updHUD(dt){updMarks();hintTriggers();updHints(dt);const o=objective();")
# clearer loot feedback
rep("toast(got.join(' · ')||'Nothing useful',2.2,'#d5e870');", "toast(got.join(' · ')||'Nothing useful',3,'#d5e870');if(I.scrap)say('',`[Scrap: ${PL.scrap}. 2 scrap repairs the car — hold ${isTouch?'USE':'E'} beside it]`,3.5);")
open(p,'w').write(s);print('ux ok')
s=open(p).read()
# ---------------------------------------------------------------- zombie variety: two base bodies, per-instance clothing/grime/blood shader, proportions, posture, accessories
rep("AS.zLowGeo=c.geometry;});}),'zlow'));", "AS.zLowGeo=c.geometry;});}),'zlow'));\n  jobs.push(track(loadGLB(murl('alex_low')).then(g=>{g.scene.traverse(c=>{if(c.isSkinnedMesh&&!AS.aLowGeo)AS.aLowGeo=c.geometry;});}),'alow'));")
old=s[s.index('function makeZombieModel(type){'):s.index('// fallback box humans')]
new=r"""const ZGLSL=`uniform float zHue,zSat,zDirt,zBlood,zBright,zSeed,zInf;
float zh21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float zvn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(zh21(i),zh21(i+vec2(1.,0.)),f.x),mix(zh21(i+vec2(0.,1.)),zh21(i+1.),f.x),f.y);}
float zfbm(vec2 p){return zvn(p)*.5+zvn(p*2.13)*.3+zvn(p*4.37)*.2;}
vec3 zHueRot(vec3 c,float a){vec3 y=vec3(dot(c,vec3(.299,.587,.114)),dot(c,vec3(.596,-.274,-.322)),dot(c,vec3(.211,-.523,.312)));float h=atan(y.z,y.y)+a;float ch=length(y.yz);vec3 q=vec3(y.x,ch*cos(h),ch*sin(h));return vec3(q.x+.956*q.y+.621*q.z,q.x-.272*q.y-.647*q.z,q.x-1.106*q.y+1.703*q.z);}
`;
const ZFRAG=`#include <map_fragment>
{vec3 c=diffuseColor.rgb;float l=dot(c,vec3(.299,.587,.114));vec3 y=vec3(l,dot(c,vec3(.596,-.274,-.322)),dot(c,vec3(.211,-.523,.312)));float ang=atan(y.z,y.y);float ch=length(y.yz);
 float skin=smoothstep(.02,.06,ch)*smoothstep(1.05,.55,abs(ang-.35));float m=smoothstep(.03,.09,ch)*(1.-skin)+(1.-smoothstep(.02,.05,ch))*.35;
 vec3 h=zHueRot(c,zHue);h=mix(vec3(l),h,zSat);c=mix(c,h,clamp(m,0.,1.));
 c=mix(c,vec3(l)*vec3(.82,.9,.78)*1.08,skin*zInf*.85);c*=zBright;
 float n=zfbm(vMapUv*vec2(9.,11.)+zSeed);c*=1.-zDirt*.6*smoothstep(.38,.82,n);
 float b=zfbm(vMapUv*vec2(6.,7.)+zSeed*1.73);float bl=smoothstep(.74-zBlood*.2,.8-zBlood*.2,b);c=mix(c,vec3(.2,.015,.01),bl*.88);
 diffuseColor.rgb=c;}`;
function zVarMat(m,R,type,inf){const c=m.clone();if(!m.map){c.color=c.color.clone().multiplyScalar(.6+R()*.4);return c;}const u={zHue:(R()-.5)*2.6,zSat:.5+R()*.55,zDirt:.25+R()*.6,zBlood:type==='screamer'?.2:.15+R()*.75,zBright:(type==='brute'?.75:.78)+R()*.4,zSeed:R()*100,zInf:inf?1:.35};
  if(type==='screamer'){u.zSat=.15;u.zBright=1.15;}c.roughness=(m.roughness??1)*(.7+R()*.4);c.envMapIntensity=.25+R()*.7;if(type==='screamer')c.emissive=new THREE.Color(0x200008);
  c.onBeforeCompile=sh=>{for(const k in u)sh.uniforms[k]={value:u[k]};sh.fragmentShader=ZGLSL+sh.fragmentShader.replace('#include <map_fragment>',ZFRAG);};c.customProgramCacheKey=()=>'zvar1';return c;}
// accessories (attached to bones in bind pose so they follow the animation)
const ACC={};
function accInit(){const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
  const vestTex=cv(256,128,(x,w,h)=>{x.fillStyle='#c8e81a';x.fillRect(0,0,w,h);x.fillStyle='#b8bcc0';x.fillRect(0,36,w,12);x.fillRect(0,84,w,12);x.fillStyle='rgba(60,50,30,.35)';for(let i=0;i<60;i++)x.fillRect(Math.random()*w,Math.random()*h,6,6);});
  ACC.vestM=new THREE.MeshStandardMaterial({map:vestTex,emissive:0x2a3a00,roughness:.7,side:THREE.DoubleSide});
  ACC.cols=[0x1a2a44,0x3a1a1a,0x2a3a2a,0x5a5048,0x111111,0x6a1a1a,0x2a2a3a,0x7a6a4a];ACC.M=M;}
function addAccessories(o,type,R){if(!ACC.M)accInit();const B=n=>o.getObjectByName(n);const head=B('Head'),top=B('head_end'),sp=B('Spine')||B('Spine01');if(!head)return;o.updateMatrixWorld(true);
  const hp=head.getWorldPosition(new THREE.Vector3()),tp=top?top.getWorldPosition(new THREE.Vector3()):hp.clone().add(new THREE.Vector3(0,.2,0));const hr=Math.max(.08,hp.distanceTo(tp)*.62);const c=hp.clone().lerp(tp,.55);
  const add=(mesh,bone,pos)=>{mesh.position.copy(pos);o.add(mesh);mesh.updateMatrixWorld(true);bone.attach(mesh);mesh.castShadow=true;};
  const k=R();const col=ACC.cols[(R()*ACC.cols.length)|0];
  if(type!=='screamer'){
    if(k<.16){const g=new THREE.SphereGeometry(hr*1.1,14,8,0,Math.PI*2,0,Math.PI*.55);add(new THREE.Mesh(g,ACC.M(col,{roughness:1})),head,c.clone().add(new THREE.Vector3(0,hr*.05,-hr*.05)));}// beanie
    else if(k<.26){const g=new THREE.Group();const cap=new THREE.Mesh(new THREE.SphereGeometry(hr*1.08,12,6,0,Math.PI*2,0,Math.PI*.42),ACC.M(col));const brim=new THREE.Mesh(new THREE.CylinderGeometry(hr*.9,hr*.9,.012,14,1,false,-.9,1.8),ACC.M(col));brim.position.set(0,hr*.18,hr*.55);g.add(cap,brim);add(g,head,c.clone().add(new THREE.Vector3(0,hr*.12,0)));}// cap
    else if(k<.34){const g=new THREE.Group();const m=ACC.M(R()<.6?0xe8c21a:0xeeeeee,{roughness:.4});g.add(new THREE.Mesh(new THREE.SphereGeometry(hr*1.15,14,8,0,Math.PI*2,0,Math.PI*.5),m));const br=new THREE.Mesh(new THREE.CylinderGeometry(hr*1.32,hr*1.32,.015,16),m);br.position.y=hr*.06;g.add(br);add(g,head,c.clone().add(new THREE.Vector3(0,hr*.15,0)));}// hard hat
    else if(k<.40){const prof=[[0,1.55],[.22,1.5],[.55,1.25],[.86,.8],[1.02,.2],[1.08,0],[1.12,-.06]].map(([r,y])=>new THREE.Vector2(r*hr*1.1,y*hr*1.1));const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.LatheGeometry(prof,16),ACC.M(0x14182a,{roughness:.55})));const badge=new THREE.Mesh(new THREE.CircleGeometry(hr*.28,6),ACC.M(0xd0d4d8,{metalness:.9,roughness:.3}));badge.position.set(0,hr*.75,hr*.95);badge.rotation.x=-.35;g.add(badge);add(g,head,c.clone().add(new THREE.Vector3(0,0,0)));}// Met police helmet
    if(R()<.12){const g=new THREE.Mesh(new THREE.SphereGeometry(hr*.95,12,6,-.9,1.8,Math.PI*.45,Math.PI*.3),ACC.M(0x9ab8d0,{roughness:.9}));add(g,head,hp.clone().add(new THREE.Vector3(0,-hr*.25,hr*.12)));}// face mask
    if(sp&&R()<.1){const s=sp.getWorldPosition(new THREE.Vector3());const g=new THREE.Mesh(new THREE.CylinderGeometry(hr*1.45,hr*1.55,hr*3.1,14,1,true),ACC.vestM);g.scale.z=.72;add(g,sp,s.clone().add(new THREE.Vector3(0,-hr*.9,0)));}// hi-vis vest
    if(sp&&R()<.18){const s=sp.getWorldPosition(new THREE.Vector3());const g=new THREE.Mesh(new THREE.BoxGeometry(hr*2.4,hr*3,hr*1.2),ACC.M(ACC.cols[(R()*8)|0],{roughness:.9}));add(g,sp,s.clone().add(new THREE.Vector3(0,-hr*.6,-hr*1.6)));}}// backpack
}
const ZPOSE=['Spine02','neck','Head','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftShoulder','RightShoulder'];
function makeZombieModel(type){
  const useAlex=AS.alex&&AS.aLowGeo&&type!=='brute'&&type!=='screamer'&&Math.random()<.45;const base=useAlex?AS.alex:AS.zombie;
  if(base){const seed=(Math.random()*1e9)|0;const R=mulberry(seed);const o=skClone(base.scene);const mats=new Map();
    o.traverse(c=>{if(c.isMesh&&c.material){const f=m=>{if(!mats.has(m))mats.set(m,zVarMat(m,R,type,useAlex));return mats.get(m);};c.material=Array.isArray(c.material)?c.material.map(f):f(c.material);}});
    let hi=null;o.traverse(c=>{if(c.isSkinnedMesh&&!hi)hi=c;});let lo=null;const lg=useAlex?AS.aLowGeo:AS.zLowGeo;
    if(hi&&lg){lo=new THREE.SkinnedMesh(lg,hi.material);lo.bind(hi.skeleton,hi.bindMatrix);lo.position.copy(hi.position);lo.quaternion.copy(hi.quaternion);lo.scale.copy(hi.scale);lo.frustumCulled=false;lo.castShadow=false;hi.parent.add(lo);lo.visible=false;}
    if(hi)hi.frustumCulled=false;
    // proportions
    const Bn=n=>o.getObjectByName(n);const sc=(n,v)=>{const b=Bn(n);if(b)b.scale.multiplyScalar(v);};
    sc('Head',.9+R()*.22);for(const n of['LeftHand','RightHand'])sc(n,useAlex?.74:.85+R()*.15);const arm=.92+R()*.16;sc('LeftArm',arm);sc('RightArm',arm);sc('Spine01',.95+R()*.12);
    addAccessories(o,type,R);
    // posture offsets (applied after each animation update)
    const pose=[];for(const n of ZPOSE){const b=Bn(n);if(!b)continue;const amt=n==='Spine02'?.22:n.includes('Arm')?.35:n==='Head'||n==='neck'?.3:.15;const e=new THREE.Euler((R()-.5)*amt*2,(R()-.5)*amt*2,(R()-.5)*amt*2);pose.push([b,new THREE.Quaternion().setFromEuler(e)]);}
    if(R()<.25){const side=R()<.5?'Left':'Right';const b=Bn(side+'Arm');if(b)pose.push([b,new THREE.Quaternion().setFromEuler(new THREE.Euler(.9*(R()-.5),0,(side==='Left'?1:-1)*(.6+R()*.5)))]);}// dangling broken arm
    const g=new THREE.Group();g.add(o);g.scale.set(ZTYPES[type].scale*(.94+R()*.14),ZTYPES[type].scale*(.9+R()*.18),ZTYPES[type].scale*(.94+R()*.14));
    const mixer=new THREE.AnimationMixer(o);const acts={};for(const k in ZCLIPS)if(ZCLIPS[k])acts[k]=mixer.clipAction(ZCLIPS[k]);
    let head=null;o.traverse(b=>{if(b.isBone&&!head&&/head/i.test(b.name))head=b;});return{g,mixer,acts,head,skinned:true,hi,lo,lodT:0,pose,tsk:.82+R()*.4,seed};}
  const h=makeBoxHuman(type);h.g.scale.setScalar(ZTYPES[type].scale);return{g:h.g,box:h,skinned:false};}
function applyPose(z){if(z.pose)for(const [b,q] of z.pose)b.quaternion.multiply(q);}
"""
s=s.replace(old,new)
rep("z.mixer.update(z.mt);z.mt=0;","z.mixer.update(z.mt*(z.tsk||1));z.mt=0;applyPose(z);")
rep("z.mixer.update(dt);if(z.deadT>16){removeZ(z);","z.mixer.update(dt);applyPose(z);if(z.deadT>16){removeZ(z);")
open(p,'w').write(s);print('zombie ok')
s=open(p).read()
# ---------------------------------------------------------------- audio engine v2
A=open('/home/claude/game/audio2.js').read()
a=s.index('const AU={on:false,c:AC};');b=s.index('// ================================================================ input')
updA=A[A.index('function updAudio(dt){'):]
A2=A[:A.index('function updAudio(dt){')]
s=s[:a]+A2+'\n'+s[b:]
a=s.index('function updAudio(dt){');b=s.index('function updVisuals(dt){')
s=s[:a]+updA+'\n'+s[b:]
# footsteps
s=s.replace("g.position.set(PL.x,PL.gy,PL.z);g.rotation.y=PL.h;","g.position.set(PL.x,PL.gy,PL.z);g.rotation.y=PL.h;if(!PL.inCar&&speed>.5){AU.step=(AU.step||0)+dt*(1.15+speed*.3);if(AU.step>=1){AU.step=0;sfxStep(PL.x,PL.z,speed>4);}}",1)
# CC0 footsteps if present
s=s.replace("  for(const s of SFX_LIST)jobs.push(","  AS.sfx2={step_concrete:[],step_grass:[]};for(const [k,n] of [['step_concrete','footstep_concrete_00'],['step_grass','footstep_grass_00']])for(let i=0;i<5;i++)jobs.push(fetch(`assets/sfx/${n}${i}.mp3`).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();}).then(b=>AC.decodeAudioData(b)).then(buf=>AS.sfx2[k].push(buf)).catch(()=>{}));\n  for(const s of SFX_LIST)jobs.push(",1)
open(p,'w').write(s);print('audio ok')
s=open(p).read()
rep("  jobs.push(track(loadGLB(murl('alex_low'))", "  jobs.push(track(loadGLB(murl('trees')).then(g=>{AS.trees=g.scene;}),'trees'));\n  jobs.push(track(loadGLB(murl('alex_low'))")
rep("updChunks(dt);updLightPool(dt);","updChunks(dt);if(WD)updTrees(dt);updLightPool(dt);")
open(p,'w').write(s);print('trees ok')
s=open(p).read()
a=s.index('function busModel(o={}){');b=s.index('function placeBus(x,z,ry,o={})')
s=s[:a]+open('/home/claude/game/bus2.js').read()+'\n'+s[b:]
rep("function placeBus(x,z,ry,o={}){const g=busModel(o);g.position.set(x,0,z);","function placeBus(x,z,ry,o={}){const g=busModel(o);g.position.set(x,(typeof groundH==='function'&&WD)?groundH(x,z):0,z);")
open(p,'w').write(s);print('bus ok')
s=open(p).read()
import re as _re
m=_re.search(r'const BLOB=\{(.*?)\};',s,_re.S);body=m.group(1)
for k,v in {'trees':'ffdd48049699d9663db53dcbb1a037e9','alex_low':'c5cfbf6803839e12e0eba1d9e110956f','zombie_low':'3fb6c85224c381ed049cfb52063cf0bc'}.items():
    pat=_re.compile(r'(["\']?)'+k+r'\1\s*:\s*["\'][0-9a-f]{32}["\']')
    body=pat.sub(f'{k}:"{v}"',body,1) if pat.search(body) else body.rstrip().rstrip(',')+f',{k}:"{v}"'
s=s[:m.start(1)]+body+s[m.end(1):]
open(p,'w').write(s);print('blob ok')
