const AU={on:false,c:AC};
// impulse response for a wet London street at night (early reflections off facades + long tail)
function makeIR(sec,decay){const C=AC,n=C.sampleRate*sec|0,b=C.createBuffer(2,n,C.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++){const t=i/n;d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(t<.02?.3:1);}
    for(const [ms,g] of [[11,.5],[23,.35],[37,.3],[53,.22],[71,.18],[97,.12]]){const k=(ms+ch*4)*C.sampleRate/1000|0;if(k<n)d[k]+=g*(Math.random()<.5?-1:1);}}return b;}
function audioInit(){if(AU.on){AC.resume();return;}AU.on=true;AC.resume();const C=AC;
  AU.comp=C.createDynamicsCompressor();AU.comp.threshold.value=-16;AU.comp.ratio.value=4;AU.comp.attack.value=.004;AU.comp.release.value=.25;AU.comp.connect(C.destination);
  AU.m=C.createGain();AU.m.gain.value=.95;AU.m.connect(AU.comp);
  AU.rv=C.createConvolver();AU.rv.buffer=makeIR(2.6,3.2);AU.rvG=C.createGain();AU.rvG.gain.value=.55;AU.rv.connect(AU.rvG);AU.rvG.connect(AU.m);
  // world bus (everything outside the car) — muffled while you are inside the sedan
  AU.w=C.createGain();AU.wf=C.createBiquadFilter();AU.wf.type='lowpass';AU.wf.frequency.value=18000;AU.w.connect(AU.wf);AU.wf.connect(AU.m);
  AU.nb=C.createBuffer(1,C.sampleRate*2,C.sampleRate);const d=AU.nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  AU.bn=C.createBuffer(1,C.sampleRate*2,C.sampleRate);{const e=AU.bn.getChannelData(0);let l=0;for(let i=0;i<e.length;i++){l=(l+.02*(Math.random()*2-1))/1.02;e[i]=l*3.5;}}// brown noise
  const loop=(name,vol,dest=AU.m,fallback)=>{const g=C.createGain();g.gain.value=0;g.connect(dest);const src=C.createBufferSource();src.buffer=AS.sfx[name]||fallback||AU.nb;src.loop=true;src.connect(g);src.start(0,Math.random()*2);return{g,src,real:!!AS.sfx[name],base:vol};};
  AU.idle=loop('engine_idle',.5);AU.rev=loop('engine_rev',.5);AU.rain=loop('rain',.5,AU.w);AU.pump=loop('pump',.4,AU.w);AU.skid=loop('skid',.35);AU.horde=loop('horde',.4,AU.w);
  // synthesized engine body: firing-order harmonics through a throttle-driven lowpass
  AU.eng=C.createGain();AU.eng.gain.value=0;AU.engF=C.createBiquadFilter();AU.engF.type='lowpass';AU.engF.Q.value=2.2;AU.engF.connect(AU.eng);AU.eng.connect(AU.m);AU.engO=[];
  for(const [mul,type,g] of [[.5,'sine',.55],[1,'sawtooth',.32],[2,'square',.08],[3,'sawtooth',.05]]){const o=C.createOscillator();o.type=type;o.frequency.value=40;const gg=C.createGain();gg.gain.value=g;o.connect(gg);gg.connect(AU.engF);o.start();AU.engO.push([o,mul]);}
  {const s=C.createBufferSource();s.buffer=AU.nb;s.loop=true;const bp=C.createBiquadFilter();bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.8;AU.intakeG=C.createGain();AU.intakeG.gain.value=0;s.connect(bp);bp.connect(AU.intakeG);AU.intakeG.connect(AU.m);s.start();}
  // tyres rolling on asphalt / kerb-stones, wind, tyre squeal
  {const s=C.createBufferSource();s.buffer=AU.bn;s.loop=true;AU.rollF=C.createBiquadFilter();AU.rollF.type='lowpass';AU.rollF.frequency.value=500;AU.rollG=C.createGain();AU.rollG.gain.value=0;s.connect(AU.rollF);AU.rollF.connect(AU.rollG);AU.rollG.connect(AU.m);s.start();}
  {const s=C.createBufferSource();s.buffer=AU.nb;s.loop=true;const bp=C.createBiquadFilter();bp.type='bandpass';bp.frequency.value=380;bp.Q.value=.6;AU.windG=C.createGain();AU.windG.gain.value=0;s.connect(bp);bp.connect(AU.windG);AU.windG.connect(AU.m);s.start();}
  {const s=C.createBufferSource();s.buffer=AU.nb;s.loop=true;const bp=C.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=9;AU.sqF=bp;AU.sqG=C.createGain();AU.sqG.gain.value=0;s.connect(bp);bp.connect(AU.sqG);AU.sqG.connect(AU.m);s.start();}
  // music: slow minor pad + pulse that rises with the threat level
  AU.mus=C.createGain();AU.mus.gain.value=.0;AU.musF=C.createBiquadFilter();AU.musF.type='lowpass';AU.musF.frequency.value=420;AU.musF.connect(AU.mus);AU.mus.connect(AU.m);const send=C.createGain();send.gain.value=.6;AU.mus.connect(send);send.connect(AU.rv);
  AU.pad=[];for(let i=0;i<6;i++){const o=C.createOscillator();o.type='sawtooth';o.detune.value=(i%2?7:-7);const g=C.createGain();g.gain.value=.05;o.connect(g);g.connect(AU.musF);o.start();AU.pad.push(o);}
  AU.chord=0;AU.chordT=0;AU.pulseT=0;AU.amb={siren:rnd(12,30),alarm:rnd(25,60),heli:rnd(40,90),shot:rnd(18,40),scream:rnd(30,70),dog:rnd(20,50)};AU.step=0;}
const CHORDS=[[110,130.8,164.8,220,261.6,329.6],[87.3,110,130.8,174.6,220,261.6],[65.4,98,130.8,164.8,196,261.6],[98,123.5,146.8,196,246.9,293.7]];// Am F C G
function updListener(){if(!AU.on)return;const L=AC.listener,t=AC.currentTime;const f=new THREE.Vector3();camera.getWorldDirection(f);const p=camera.position;
  if(L.positionX){L.positionX.setValueAtTime(p.x,t);L.positionY.setValueAtTime(p.y,t);L.positionZ.setValueAtTime(p.z,t);L.forwardX.setValueAtTime(f.x,t);L.forwardY.setValueAtTime(f.y,t);L.forwardZ.setValueAtTime(f.z,t);L.upX.setValueAtTime(0,t);L.upY.setValueAtTime(1,t);L.upZ.setValueAtTime(0,t);}else{L.setPosition(p.x,p.y,p.z);L.setOrientation(f.x,f.y,f.z,0,1,0);}}
const WET={gun:.55,crash:.3,scream:.6,thunder:.2,horn:.35,gate:.4,groan:.25,snarl:.2,horde:.3,bodyhit:.15,claw:.12,swing:.05,crowbar:.15,shutter:.3};
const SLICE={groan:1,snarl:1,scream:1};
// positional one-shot: random pitch, distance air-absorption, reverb send, vocal slicing for variety
function snd(name,x,z,vol=1,rate=1){if(!AU.on)return;const C=AC;const buf=AS.sfx[name]||AS.sfx2&&AS.sfx2[name];const t=C.currentTime;const g=C.createGain();g.gain.value=vol;
  let dist=0;let dest=AU.w;if(x===undefined)dest=AU.m;
  if(x!==undefined){const pn=C.createPanner();pn.panningModel=isTouch?'equalpower':'HRTF';pn.distanceModel='inverse';pn.refDistance=4;pn.rolloffFactor=1.05;pn.maxDistance=260;if(pn.positionX){pn.positionX.value=x;pn.positionY.value=1.2;pn.positionZ.value=z;}else pn.setPosition(x,1.2,z);
    dist=Math.hypot(x-camera.position.x,z-camera.position.z);const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=clamp(19000-dist*110,900,19000);g.connect(lp);lp.connect(pn);pn.connect(dest);
    const w=(WET[name]??.12)*clamp(.5+dist/60,.5,1.8);if(w>.02){const s=C.createGain();s.gain.value=w;pn.connect(s);s.connect(AU.rv);}}else g.connect(dest);
  if(buf){const s=C.createBufferSource();s.buffer=buf;s.playbackRate.value=rate*(1+(Math.random()-.5)*.08);s.connect(g);
    if(SLICE[name]&&buf.duration>1.2){const len=Math.min(buf.duration,.7+Math.random()*1.4);const off=Math.random()*Math.max(0,buf.duration-len);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.04);g.gain.setValueAtTime(vol,t+len/rate-.12);g.gain.linearRampToValueAtTime(0,t+len/rate);s.start(t,off,len);}
    else s.start();return s;}
  const s=C.createBufferSource();s.buffer=AU.nb;const f=C.createBiquadFilter();f.type='bandpass';f.frequency.value={gun:1800,crash:900,bodyhit:200,crowbar:400,swing:2200,scream:1400}[name]||700;s.connect(f);f.connect(g);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);s.start(t,Math.random());s.stop(t+.4);}
// ---- synthesized one-shots
function _pan(x,z,dest){const C=AC;const pn=C.createPanner();pn.panningModel='equalpower';pn.distanceModel='inverse';pn.refDistance=4;pn.rolloffFactor=1.05;if(pn.positionX){pn.positionX.value=x;pn.positionY.value=1;pn.positionZ.value=z;}else pn.setPosition(x,1,z);pn.connect(dest||AU.w);return pn;}
function noiseBurst(dest,t,dur,f,q,vol,type='bandpass'){const C=AC;const s=C.createBufferSource();s.buffer=AU.nb;const bf=C.createBiquadFilter();bf.type=type;bf.frequency.value=f;bf.Q.value=q;const g=C.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(bf);bf.connect(g);g.connect(dest);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);}
function tone(dest,t,f,dur,vol,type='sine',f2){const C=AC;const o=C.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);const g=C.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05);}
function sfxGlass(x,z,v=1){if(!AU.on)return;const t=AC.currentTime;const p=_pan(x,z);const s=AC.createGain();s.gain.value=.4;p.connect(s);s.connect(AU.rv);noiseBurst(p,t,.25,3200,.7,.9*v,'highpass');for(let i=0;i<26;i++){const tt=t+.02+Math.random()*.55*Math.random();noiseBurst(p,tt,.03+Math.random()*.06,4000+Math.random()*6000,6,.25*v*Math.random());if(Math.random()<.4)tone(p,tt,2500+Math.random()*5000,.12,.05*v);}}
function sfxClang(x,z,v=1){if(!AU.on)return;const t=AC.currentTime;const p=_pan(x,z);const s=AC.createGain();s.gain.value=.3;p.connect(s);s.connect(AU.rv);const f0=300+Math.random()*250;for(const [m,a,d] of [[1,.3,.9],[2.76,.18,.6],[5.4,.1,.35],[8.9,.06,.2]])tone(p,t,f0*m,d,a*v);noiseBurst(p,t,.08,1800,1,.5*v);}
function sfxThump(x,z,v=1){if(!AU.on)return;const t=AC.currentTime;tone(AU.m,t,70,.18,.5*v,'sine',38);noiseBurst(AU.m,t,.07,240,.8,.4*v);if(v>.5)tone(AU.m,t+.03,900,.08,.05*v,'square');}
const SURF_STEP={road:[1700,1.4,.07],main:[1700,1.4,.07],conc:[1900,1.2,.07],grass:[700,.7,.12],gravel:[2600,1.8,.09],bridge:[1400,1.1,.08],off:[1200,1,.08]};
function sfxStep(x,z,run){if(!AU.on)return;const t=AC.currentTime;const s=regionAt(x,z).s;const k=SURF_STEP[s]||SURF_STEP.road;const v=run?.5:.3;
  const fs=AS.sfx2&&AS.sfx2[s==='grass'?'step_grass':'step_concrete'];if(fs&&fs.length){const g=AC.createGain();g.gain.value=v*.9;g.connect(_pan(x,z));const b=AC.createBufferSource();b.buffer=fs[(Math.random()*fs.length)|0];b.playbackRate.value=.9+Math.random()*.2;b.connect(g);b.start();}
  else{noiseBurst(_pan(x,z),t,k[2],k[0]*(.85+Math.random()*.3),k[1],v);tone(_pan(x,z),t,90,.05,v*.25);}
  noiseBurst(_pan(x,z),t+.01,.12,5200,.8,v*.12,'highpass');}// wet splash (it's raining)
function ambientOneShots(dt){const A=AU.amb,cx=camera.position.x,cz=camera.position.z;const far=()=>{const a=Math.random()*6.28,d=160+Math.random()*220;return[cx+Math.cos(a)*d,cz+Math.sin(a)*d];};
  for(const k in A)A[k]-=dt;const C=AC,t=C.currentTime;
  if(A.siren<=0){A.siren=rnd(35,80);const [x,z]=far();const p=_pan(x,z);const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;lp.connect(p);const s=C.createGain();s.gain.value=.5;lp.connect(s);s.connect(AU.rv);
    const o=C.createOscillator();o.type='triangle';const g=C.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+1.5);g.gain.setValueAtTime(.09,t+7);g.gain.linearRampToValueAtTime(0,t+9);for(let i=0;i<9;i++){o.frequency.setValueAtTime(i%2?780:620,t+i);o.frequency.linearRampToValueAtTime(i%2?620:780,t+i+.95);}o.connect(g);g.connect(lp);o.start(t);o.stop(t+9.2);}
  if(A.alarm<=0){A.alarm=rnd(45,100);const [x,z]=far();const p=_pan(x,z);const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.connect(p);for(let i=0;i<16;i++){const tt=t+i*.42;tone(lp,tt,1250,.2,.05,'square');tone(lp,tt+.21,950,.2,.05,'square');}}
  if(A.heli<=0){A.heli=rnd(70,140);const [x,z]=far();const p=_pan(x,z);const s=C.createBufferSource();s.buffer=AU.bn;s.loop=true;const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320;const g=C.createGain();g.gain.value=0;const am=C.createOscillator();am.frequency.value=11;const amg=C.createGain();amg.gain.value=.12;am.connect(amg);amg.connect(g.gain);
    const env=C.createGain();env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(.5,t+5);env.gain.linearRampToValueAtTime(0,t+14);s.connect(lp);lp.connect(g);g.connect(env);env.connect(p);s.start(t);am.start(t);s.stop(t+14.5);am.stop(t+14.5);}
  if(A.shot<=0){A.shot=rnd(25,60);const [x,z]=far();const n=1+(Math.random()*4|0);for(let i=0;i<n;i++)setTimeout(()=>snd('gun',x,z,.35,rnd(.8,.95)),i*rnd(180,420));}
  if(A.scream<=0){A.scream=rnd(35,80);const [x,z]=far();snd(Math.random()<.5?'scream':'snarl',x,z,.5,rnd(.7,.9));}
  if(A.dog<=0){A.dog=rnd(30,70);const [x,z]=far();const p=_pan(x,z);for(let i=0;i<3+(Math.random()*4|0);i++){const tt=t+i*rnd(.35,.6);tone(p,tt,520,.09,.08,'sawtooth',240);noiseBurst(p,tt,.08,900,2,.06);}}}
function updAudio(dt){if(!AU.on)return;const t=AC.currentTime;const running=car.fuel>0&&car.engine>0;const dCam=Math.hypot(camera.position.x-car.x,camera.position.z-car.z);const near=clamp(1-dCam/70,0,1);
  const sp=Math.hypot(car.vx,car.vz);const vf=Math.abs(car.vf||0);
  // 5-speed box: pseudo engine speed rises through each gear then drops on the shift
  const G=[0,7,13,20,28,38,60];let gi=1;while(gi<G.length-1&&vf>G[gi])gi++;const inG=clamp((vf-G[gi-1])/(G[gi]-G[gi-1]),0,1);let rpm=running?clamp(.18+inG*.72+(car.throttle||0)*.12*(1-inG),.16,1.05):0;if(vf<1)rpm=running?.16+(car.throttle||0)*.5:0;
  AU.rpmS=lerp(AU.rpmS||0,rpm,1-Math.exp(-(rpm>(AU.rpmS||0)?6:9)*dt));const r=AU.rpmS;const rough=car.engine<40?rnd(.96,1.04):1;
  const rev=clamp((r-.25)/.6,0,1);AU.idle.g.gain.setTargetAtTime(running?(1-rev)*.42*near:0,t,.08);AU.rev.g.gain.setTargetAtTime(running?(rev*.42+(car.throttle||0)*.12)*near:0,t,.08);
  if(AU.idle.real){AU.idle.src.playbackRate.setTargetAtTime((.8+r*.6)*rough,t,.04);AU.rev.src.playbackRate.setTargetAtTime((.62+r*.75)*rough,t,.04);}
  const fire=(28+r*130)*rough;for(const [o,m] of AU.engO)o.frequency.setTargetAtTime(fire*m,t,.03);AU.engF.frequency.setTargetAtTime(220+r*900+(car.throttle||0)*1400,t,.05);
  AU.eng.gain.setTargetAtTime(running?(.1+r*.12+(car.throttle||0)*.08)*near:0,t,.06);AU.intakeG.gain.setTargetAtTime(running?(car.throttle||0)*r*.07*near:0,t,.06);
  // exhaust crackle on lift-off at high revs
  if(running&&near>.3&&(AU.lastThr||0)>.5&&!(car.throttle>0)&&r>.55){for(let i=0;i<5;i++)noiseBurst(AU.m,t+i*rnd(.04,.11),.04,rnd(300,900),3,.25*near);}AU.lastThr=car.throttle||0;
  const surf=regionAt(car.x,car.z).s;AU.rollG.gain.setTargetAtTime(clamp(sp/30,0,1)*.42*near,t,.08);AU.rollF.frequency.setTargetAtTime((surf==='gravel'||surf==='grass'?1600:420)+sp*18,t,.1);
  AU.windG.gain.setTargetAtTime(clamp((sp-6)/35,0,1)**2*.35*near,t,.1);
  const sq=(car.slide||0)*(PL.inCar?1:.6);AU.sqG.gain.setTargetAtTime(sq*.18*near,t,.04);AU.sqF.frequency.setTargetAtTime(1300+Math.sin(t*23)*120+sp*12,t,.02);
  AU.skid.g.gain.setTargetAtTime(PL.inCar?sq*.4:0,t,.05);AU.pump.g.gain.setTargetAtTime(holdUse&&holdUse.kind==='pump'?.45:0,t,.1);
  // inside the car the world is muffled and the rain drums on the roof
  const inCar=PL.inCar&&dCam<9;AU.wf.frequency.setTargetAtTime(inCar?2600:18000,t,.25);
  const under=PUMPS.length&&Math.hypot(camera.position.x-PUMPS[0].x,camera.position.z-PUMPS[0].z)<14;AU.rain.g.gain.setTargetAtTime(AU.rain.real?(under?.25:.5):(under?.05:.12),t,.3);
  const px=PL.inCar?car.x:PL.x,pz=PL.inCar?car.z:PL.z;let threat=0;for(const z of Z)if(z.alert&&z.state!=='dead'&&Math.abs(z.x-px)<40&&Math.abs(z.z-pz)<40)threat++;if(MS.screamer&&MS.screamer.state!=='dead')threat+=6;
  AU.horde.g.gain.setTargetAtTime(AU.horde.real?clamp((threat-3)/14,0,1)*.45:0,t,.8);
  // music
  const th=clamp(threat/16,0,1);AU.mus.gain.setTargetAtTime(.05+th*.08,t,1.2);AU.musF.frequency.setTargetAtTime(380+th*1400,t,.8);
  AU.chordT-=dt;if(AU.chordT<=0){AU.chordT=8;AU.chord=(AU.chord+1)%CHORDS.length;CHORDS[AU.chord].forEach((f,i)=>AU.pad[i].frequency.setTargetAtTime(f/2,t,1.6));}
  if(th>.25){AU.pulseT-=dt;if(AU.pulseT<=0){AU.pulseT=60/(70+th*70);tone(AU.mus,t,55,.35,.5*th,'sine',38);}}
  ambientOneShots(dt);updListener();}
