p = '/home/claude/game/dist/index.html'
s = open(p).read()
def rep(a, b, cnt=1):
    global s
    n = s.count(a)
    assert n == cnt, (a[:110], n)
    s = s.replace(a, b)
def between(a, b):
    i = s.index(a); j = s.index(b, i); return s[i:j]

# helpers: frame points used by mission logic
rep("let state='loading';", """let state='loading';
const FC=(x,z)=>TF(WD.anchors.fore,x,z),PT=(x,z)=>TF(WD.anchors.port,x,z),CK=(x,z)=>TF(WD.anchors.check,x,z);
const FUEL0=9.6,FUELK=.17;let carS={s:0,d:0},carSt=0;
function updRouteS(dt){carSt-=dt;if(carSt>0)return;carSt=.15;const px=PL.inCar?car.x:PL.x,pz=PL.inCar?car.z:PL.z;carS=routeS(px,pz);}""")

# hordes along the real route
old_sets = between('const SETS={', 'const SPAWNED={};')
new_sets = """let SETS={};
function setsInit(){const A=WD.anchors,S=A.s;const RA=(s,lat)=>{const p=routeAt(s);return[p.x+p.nx*lat,p.z+p.nz*lat];};
  const strip=(s0,s1,n,lat,mix)=>r=>{const o=[];for(let i=0;i<n;i++){const [x,z]=RA(s0+r()*(s1-s0),(r()-.5)*2*lat);o.push([x,z,mix(r)]);}return o;};
  const c=s=>{const p=routeAt(s);return[p.x,p.z];};
  SETS={
    res:{c:c(120),r:170,gen:strip(40,300,16,5,r=>r()<.1?'runner':'walker')},
    bridge:{c:c(S.bridge),r:150,gen:r=>{const o=strip(S.bridge-90,S.bridge+110,16,5,r=>r()<.25?'runner':'walker')(r);const [x,z]=RA(S.bridge+60,2);o.push([x,z,'runner']);return o;}},
    high:{c:c(1250),r:190,gen:r=>{const o=strip(900,1650,44,6,r=>r()<.18?'runner':'walker')(r);for(let i=0;i<8;i++){const [x,z]=RA(1550+r()*120,(r()-.5)*8);o.push([x,z,'runner']);}return o;}},
    high2:{c:c(1850),r:170,gen:strip(1700,2150,26,6,r=>r()<.2?'runner':'walker')},
    okr:{c:c(2500),r:180,gen:strip(2300,2800,22,6,r=>r()<.15?'runner':'walker')},
    fore:{c:FC(87,199),r:150,list:[[61,172],[113,175],[110,227],[62,226],[100,169],[60,186],[114,203],[96,229]].map(([x,z])=>FC(x,z))},
    mil:{c:c(S.check+20),r:170,gen:r=>{const o=[];for(let i=0;i<14;i++){const p=CK((r()-.5)*40,-6+r()*40);o.push([p[0],p[1],i===3?'brute':i===12?'runner':'walker']);}return o;}},
    pile:{c:c((S.pile0+S.pile1)/2),r:200,gen:r=>{const o=strip(S.pile0,S.pile1,50,7,r=>r()<.22?'runner':'walker')(r);const [x,z]=RA(S.pile0+380,3);o.push([x,z,'brute']);const [x2,z2]=RA(S.pile0+150,-3);o.push([x2,z2,'brute']);return o;}},
    port:{c:PT(935,462),r:140,list:[[910,440],[960,485],[925,470],[970,452],[895,455],[945,438],[915,490],[975,480],[930,450],[955,470]].map(([x,z])=>PT(x,z))},
  };}
"""
s = s.replace(old_sets, new_sets)
rep("function updSets(px,pz){for(const k in SETS){", "function updSets(px,pz){if(!SETS.res)setsInit();for(const k in SETS){")

# canisters along the real streets
rep("const CANS_DEF=[[70.6,381],[193,414],[600,466]];let canMeshes=[];", "let CANS_DEF=null;let canMeshes=[];")
rep("function setupCans(taken=[]){", "function setupCans(taken=[]){if(!CANS_DEF){const RA=(s,lat)=>{const p=routeAt(s);return[p.x+p.nx*lat,p.z+p.nz*lat];};CANS_DEF=[RA(1320,-6.8),RA(2260,6.8),RA(WD.anchors.s.pile0+260,5.5)];}")

# start / restore
rep("Object.assign(car,{x:0,z:2,h:0,fuel:5.2,body:100,engine:100,wheel:100});", "Object.assign(car,{x:WD.anchors.start[0],z:WD.anchors.start[1],h:WD.anchors.start[2],fuel:FUEL0,body:100,engine:100,wheel:100});")
rep("say('Radio · Dispatch','…any survivors south of the river: evacuation is running from the M-Route checkpoint tonight. Repeat, tonight only.',5);say('Alex','Tank\\'s on fumes. The Roadstar on Kestrel Lane — that\\'s my only shot.',4.5);",
    "say('Radio · Dispatch','…any survivors north of the river: cross at Tower Bridge. Evacuation convoy leaves from the Old Kent Road checkpoint tonight. Repeat, tonight only.',6);say('Alex','Tank\\'s nearly dry. Petrol station off the Old Kent Road, by Dunton Road — over the bridge and three miles south.',5);")
rep("const car={x:0,z:2,h:0,", "const car={x:0,z:0,h:0,")

# fuel use (real distances are ~5 km)
rep("car.fuel=Math.max(0,car.fuel-dist*(.0102+.004*inp.thr)-dt*.004);", "car.fuel=Math.max(0,car.fuel-dist*(.0102+.004*inp.thr)*FUELK-dt*.0015);")

# interactions at the station / yard
rep("Math.hypot(72.3-px,214-pz)<2.2", "Math.hypot(FC(72.3,214)[0]-px,FC(72.3,214)[1]-pz)<2.2")
rep("Math.hypot(983-px,437.4-pz)<2.2", "Math.hypot(PT(983,437.4)[0]-px,PT(983,437.4)[1]-pz)<2.2")
rep("snd('shutter',72,214,.5,rnd(.9,1.1))", "snd('shutter',...FC(72,214),.5,rnd(.9,1.1))")
rep("snd('gate',990,470,.6,.8)", "snd('gate',...PT(990,470),.6,.8)")
rep("snd('shutter',72,214,1);", "snd('shutter',...FC(72,214),1);")
rep("w.g.position.set(70,0,214);", "{const q=FC(70,214);w.g.position.set(q[0],0,q[1]);}")
rep("g.position.set(70,0,214);scene.add(g);", "{const q=FC(70,214);g.position.set(q[0],0,q[1]);}scene.add(g);")
rep("MS.worker={g,mixer:mx,x:72,z:214,t:0};", "MS.worker={g,mixer:mx,x:FC(72,214)[0],z:FC(72,214)[1],t:0};")
rep("MS.worker={g:w.g,box:w,x:72,z:214,t:0};", "MS.worker={g:w.g,box:w,x:FC(72,214)[0],z:FC(72,214)[1],t:0};")
rep("const ddx=118-w.x,ddz=221-w.z", "const ddx=FC(118,221)[0]-w.x,ddz=FC(118,221)[1]-w.z")
rep("snd('gate',116,221,1);", "snd('gate',...FC(116,221),1);")
rep("say('Kiosk worker','Oh thank God — three days in there! The yard gate behind the shop cuts straight through to the service lane. I\\'ll open it!',5.5);", "say('Kiosk worker','Oh thank God — three days in there! I\\'ll get the yard gate open for you, then I\\'m running for Mandela Way.',5.5);")
rep("say('Radio · Dispatch','Copy, one survivor at the Roadstar — we\\'ll send a van. Yard shortcut is open on your map, Alex.',5);toast('Shortcut unlocked',2,'#c49bff');", "say('Radio · Dispatch','Copy, one survivor at the Dunton Road station — we\\'ll send a van.',5);toast('Yard gate open',2,'#c49bff');")
rep("snd('gate',990,470,1.2);MS.phase='board';toast('GATE OPEN',2.2,'#7dff9a');say('Dover Control','Gate\\'s up! Get that car on the ramp, Alex — we cast off in ninety seconds!',5);",
    "snd('gate',...PT(990,470),1.2);MS.phase='board';toast('GATE OPEN',2.2,'#7dff9a');say('Convoy Control','Gate\\'s up! Drive in behind the coaches, Alex — we roll for Dover in ninety seconds!',5);")
rep("if(MS.phase==='fuel'&&!MS.scrSpawned&&Math.hypot(PL.x-85,PL.z-199)<40)spawnScreamer();", "if(MS.phase==='fuel'&&!MS.scrSpawned&&Math.hypot(PL.x-FC(85,199)[0],PL.z-FC(85,199)[1])<40)spawnScreamer();")
rep("const c=[[108,227],[61,227],[113,170]].sort(", "const c=[[108,227],[61,227],[113,170]].map(([x,z])=>FC(x,z)).sort(")
old_entr = between('const ENTR={', '\nconst frustum=')
s = s.replace(old_entr, "let ENTR=null;function entrInit(){ENTR={fore:[[60.5,170],[62,228],[116,199],[75,246],[112,169],[58,190],[100,229]].map(([x,z])=>FC(x,z)),port:[[886,430],[886,494],[945,497],[945,428],[975,497]].map(([x,z])=>PT(x,z))};}")
rep("const tx=PL.inCar?car.x:PL.x,tz=PL.inCar?car.z:PL.z;const E=ENTR[where];", "const tx=PL.inCar?car.x:PL.x,tz=PL.inCar?car.z:PL.z;if(!ENTR)entrInit();const E=ENTR[where];")

# mission flow on the real route
old_mis = between("  if(MS.phase==='drive'){if(!MS.lowSaid&&car.z>40)", "  // HUD toasts / subs")
new_mis = """  updRouteS(dt);const S=WD.anchors.s,cs=carS.s;
  if(MS.phase==='drive'){if(!MS.lowSaid&&cs>60){MS.lowSaid=true;toast('LOW FUEL',2.2,'#ff9b4a');}
    if(!MS.said.tb&&cs>S.bridge-170){MS.said.tb=true;say('Alex','Tower Bridge… a lorry\\'s jack-knifed across it. Single lane — don\\'t stop on it.',4.5);}
    if(!MS.said.hs&&cs>900){MS.said.hs=true;say('Radio · Dispatch','Tower Bridge Road is crawling — keep your speed up. If they grab the car, swerve hard.',4.5);}
    if(!MS.said.ba&&cs>2000){MS.said.ba=true;say('Alex','Bricklayers Arms. Old Kent Road from here — station\\'s off Dunton Road, on the left.',4.5);}
    if(reg.id==='fore'||regionAt(px,pz).id==='fore'){MS.phase='fuel';snapshot('fore');MS.cp.phase='fuel';toast('Checkpoint',1.6,'#d5e870');
      say('Radio · Dispatch','Alex, those pumps still have power — but they\\'re loud. The army checkpoint is back on the Old Kent Road, heading south-east. Fill up.',5.5);}}
  if(MS.phase==='fuel'){MS.foreT+=dt;if(!MS.scrSpawned&&MS.foreT>70)spawnScreamer();if(PL.inCar&&reg.id!=='fore'&&MS.fuelIn>.5)MS.phase='escape';}
  if((MS.phase==='escape'||MS.phase==='fuel')&&cs>S.check+6&&carS.d<25){MS.phase='east';snapshot('mil');toast('Checkpoint',1.6,'#d5e870');say('Alex','The checkpoint\\'s… gone. Overrun.',3);say('Radio · Convoy Control','Anyone on the Old Kent Road: the convoy moved to the staging yard at the far end. Last coaches to Dover are loading now. Gate is on manual — you\\'ll have to crank it.',6.5);say('Alex','There\\'s a supply crate by the trucks. Worth a look.',3.5);}
  if(MS.phase==='east'&&!MS.said.pile&&cs>S.pile0-40){MS.said.pile=true;say('Alex','Pile-up. Thread it — and watch for runners.',3.5);}
  if(MS.phase==='east'&&regionAt(px,pz).id==='port'){MS.phase='port';snapshot('port');toast('Checkpoint',1.6,'#d5e870');say('Convoy Control','We see you! The gate winch is by the yellow box — left side. Crank it and we\\'ll hold the coaches. They\\'re coming over the fences!',6);MS.waveT=4;}
  if(MS.phase==='port'){$('hold').style.display='block';$('holdBar').style.width=(MS.winch/30*100)+'%';$('holdT').textContent=`OPENING YARD GATE — ${Math.round(MS.winch/30*100)}%`;
    if(MS.winch>0||!PL.inCar){MS.waveT-=dt;if(MS.waveT<=0){MS.wave++;MS.waveT=9;const t=MS.wave===2?['brute','walker','walker','runner']:MS.wave%3===0?['runner','runner','walker']:['walker','walker','runner'];reinforce(MS.wave===2?7:6,'port',t);if(MS.wave===2)say('','[Heavy footsteps — something big]',3);}}}
  else $('hold').style.display='none';
  if(MS.phase==='board'&&PL.inCar&&car.engine>0&&!MS.done){const R=REG.find(r=>r.id==='ferry');const [lx]=regLocal(R,car.x,car.z);const [,lz]=regLocal(R,car.x,car.z);if(lx>1003&&lz>452&&lz<488){snd('horn',...PT(1040,470),.6,.6);complete();}}
"""
s = s.replace(old_mis, new_mis)

# objectives
old_obj = between("function objective(){const P=MS.phase;", "function updHUD(dt){")
new_obj = """function objective(){const P=MS.phase;const A=WD.anchors;const ck=routeAt(A.s.check+8);const yd=PT(905,462);
  if(P==='drive'){const f=FC(85,195);return{t:'Reach the petrol station off Dunton Road',tx:f[0],tz:f[1],o:carS.s<A.s.bridge?'Cross Tower Bridge':''};}
  if(P==='fuel'){const f=FC(85,195);if(MS.fuelIn<.5)return{t:PL.inCar?(isTouch?'Park beside a pump, EXIT CAR and refuel':'Park beside a pump, exit (F) and refuel'):(isTouch?'Hold USE at a pump to refuel':'Hold E at a pump to refuel'),tx:f[0],tz:f[1],o:MS.rescue?'':'Optional: someone is trapped behind the kiosk shutter'};return{t:'Fill up, then get back on the Old Kent Road — army checkpoint south-east',tx:ck.x,tz:ck.z,o:MS.rescue?'':'Optional: free the worker behind the kiosk shutter'};}
  if(P==='escape')return{t:'Reach the army checkpoint on the Old Kent Road',tx:ck.x,tz:ck.z};
  if(P==='east'){const cr=CK(9,12);return{t:'Drive to the evacuation staging yard',tx:yd[0],tz:yd[1],o:LOOT.some(l=>!l.done&&l.items.shotgun&&Math.hypot(l.x-cr[0],l.z-cr[1])<4)&&carS.s<A.s.check+120?'Optional: search the military supply crate':''};}
  if(P==='port'){const w=PT(983,437);return{t:portOpen?'Get in the car':'Crank the gate winch (yellow box) — survive the horde',tx:w[0],tz:w[1]};}
  const b=PT(1015,470);return{t:'Drive in behind the coaches',tx:b[0],tz:b[1]};}
"""
s = s.replace(old_obj, new_obj)

# HUD fuel estimates
old_need = between("  if(MS.phase==='fuel'||MS.phase==='escape'){const toDover=", "  if(need)for(const v of need)")
new_need = """  {const A=WD.anchors;const rate=.0122*FUELK;const left=Math.max(0,A.s.port-carS.s);
   if(MS.phase==='fuel'||MS.phase==='escape'){need=[(left+(MS.phase==='fuel'?220:0))*rate];$('fneed').textContent=`To the evacuation yard ≈ ${need[0].toFixed(1)} L`;}
   else if(MS.phase==='east'){need=[left*rate];$('fneed').textContent=`To the evacuation yard ≈ ${need[0].toFixed(1)} L`;}
   else if(MS.phase==='drive'){const f=FC(85,199);const px2=PL.inCar?car.x:PL.x,pz2=PL.inCar?car.z:PL.z;const d=carS.s<2700?2890-carS.s+170:Math.hypot(f[0]-px2,f[1]-pz2)*1.25;need=[d*rate];$('fneed').textContent=`Petrol station ≈ ${(d/1000).toFixed(1)} km · needs ≈ ${need[0].toFixed(1)} L`;}else $('fneed').textContent='';}
"""
s = s.replace(old_need, new_need)
rep("const fb=$('fbar');fb.querySelectorAll('.tick').forEach(t=>t.remove());const rate=.0128;let need=null;", "const fb=$('fbar');fb.querySelectorAll('.tick').forEach(t=>t.remove());let need=null;")

# minimap: pre-rendered real map
old_mm = between("  for(const c of CAPS){if(!capOn(c))", "  {mx.fillStyle='#d5e870';mx.beginPath();mx.arc(o.tx,o.tz,4,0,7);mx.fill();}")
s = s.replace(old_mm, "  if(MINI)mx.drawImage(MINI.c,MINI.x0,MINI.z0,MINI.c.width/MINI.S,MINI.c.height/MINI.S);\n")
rep("const W=340,sc=1.4;", "const W=340,sc=1.15;")

# debrief
rep("const route=(MS.route.short>0?'Service lane via kiosk yard shortcut':(MS.route.lane>MS.route.high?'Service lane (long, low grip)':'High street (short, crowded)'))+' → M-Route east → Dover';", "const route='Mansell St → Tower Bridge → Tower Bridge Rd → Old Kent Rd → Dover convoy';")
rep("$('dbq').textContent=MS.rescue?'Dover Control: \"You\\'re the last car aboard, Alex — and the Roadstar worker made it out on our van. Next stop: Calais.\"':'Dover Control: \"Ramp\\'s closing behind you, Alex. You made the last ferry. Next stop: Calais.\"';",
    "$('dbq').textContent=MS.rescue?'Convoy Control: \"You\\'re the last car in, Alex — and the station worker made it out on our van. Next stop: Dover.\"':'Convoy Control: \"Gate\\'s closing behind you, Alex. You made the last convoy. Next stop: Dover.\"';")
open(p, 'w').write(s)
print('mission ok')
s=open(p).read()
def rep2(a,b):
    global s
    assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
rep2("Refuel under pressure at the Roadstar, break through the motorway checkpoint and the pileup beyond, and hold the Dover port gate long enough to reach the last ferry.","Cross Tower Bridge, run the gauntlet down Tower Bridge Road, refuel under pressure at the Roadstar off the Old Kent Road, break through the overrun army checkpoint and the pile-up beyond, and hold the staging-yard gate long enough to make the last convoy to Dover. Streets, buildings, trees and street furniture follow the real map. <span style=\"opacity:.7\">Map data © OpenStreetMap contributors (ODbL).</span>")
rep2("Math.hypot(car.x-87,car.z-199)<45","Math.hypot(car.x-FC(87,199)[0],car.z-FC(87,199)[1])<45")
rep2("lod.addLevel(tint(AS.carLod),0);if(AS.carFar)lod.addLevel(tint(AS.carFar),38);","lod.addLevel(tint(AS.carLod),0);if(AS.carFar)lod.addLevel(tint(AS.carFar),38);lod.addLevel(new THREE.Object3D(),Q.high?110:80);")
open(p,'w').write(s);print('extra ok')
