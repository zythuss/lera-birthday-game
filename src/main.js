import './style.css';
import * as THREE from 'three';
import {drawWeapon} from './weapon.js';

const $ = id => document.getElementById(id);
let current = 'menu', sound = false, audio, paused = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(id) { current=id; document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('hidden',el.id!==id)); document.querySelectorAll('dialog[open]').forEach(d=>d.close()); if(id!=='game') paused=false; window.scrollTo(0,0); }
function tone(freq=500,length=.08,type='sine') { if(!sound)return; audio??=new (window.AudioContext||window.webkitAudioContext)(); audio.resume(); const o=audio.createOscillator(),g=audio.createGain(); o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+length);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+length); }
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=`Звук: ${sound?'вкл.':'выкл.'}`;$('sound').setAttribute('aria-label',sound?'Выключить звук':'Включить звук');tone();};
$('play').onclick=()=>{tone();show('valentine');};$('help').onclick=()=>$('help-dialog').showModal();document.querySelectorAll('.dialog-close,.dialog-done').forEach(b=>b.onclick=()=>$('help-dialog').close());document.querySelectorAll('.back').forEach(b=>b.onclick=()=>show('menu'));document.querySelector('.brand').onclick=e=>{e.preventDefault();show('menu');};

// A true voxel model, built from individual 3D blocks using the supplied photo references.
const container=$('character');let renderer;
try {
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.appendChild(renderer.domElement);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(6,4,10);camera.lookAt(0,1.6,0);
 scene.add(new THREE.HemisphereLight(0xfff6fb,0x895368,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,6,5);scene.add(light);
 const girl=new THREE.Group();scene.add(girl);const mats={};
 function block(x,y,z,w,h,d,color){mats[color]??=new THREE.MeshStandardMaterial({color,roughness:.85});const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats[color]);mesh.position.set(x,y,z);girl.add(mesh);return mesh;}
 const skin='#dba58a',hair='#65412f',jeans='#34343d';
 // Sneakers, high-waisted denim, cropped white tee, long chestnut hair.
 for(const x of [-.24,.24]){block(x,.12,.07,.38,.24,.64,'#eee5e4');block(x,.17,.14,.39,.08,.65,'#fff8f7');block(x,.77,0,.34,1.12,.35,jeans);block(x,1.15,.185,.22,.16,.02,'#41414b');}
 block(0,1.42,0,.83,.25,.4,jeans);block(0,1.68,0,.65,.3,.35,skin);block(0,2.02,0,.83,.45,.46,'#f8f1eb');block(0,2.3,0,.62,.16,.4,'#fffaf4');block(0,2.43,0,.23,.19,.25,skin);
 for(const sign of [-1,1]){block(sign*.54,2.1,0,.25,.35,.37,'#f8f1eb');block(sign*.56,1.77,0,.2,.42,.24,skin);block(sign*.52,1.48,.035,.2,.23,.24,skin);for(let i=0;i<3;i++)block(sign*.52-.055+i*.05,1.37,.165,.035,.06,.03,'#705043');}
 block(0,2.82,0,.68,.7,.55,skin);block(0,3.19,-.02,.8,.18,.65,hair);block(0,2.88,-.29,.79,.65,.18,hair);block(-.34,2.98,.2,.17,.36,.2,hair);block(.34,2.98,.2,.17,.36,.2,hair);
 for(const sign of [-1,1]){for(let j=0;j<6;j++){const yy=2.75-j*.16;block(sign*(.38+Math.sin(j)*.035),yy,-.02,.21,.19,.43,j%3===0?'#79523a':hair);}block(sign*.14,2.87,.284,.1,.065,.025,'#46372e');block(sign*.15,2.89,.301,.025,.025,.015,'#e8eee3');block(sign*.16,2.99,.285,.15,.035,.02,hair);block(sign*.2,2.73,.282,.1,.055,.022,'#d99288');}block(0,2.69,.29,.13,.04,.028,'#ac6965');block(0,2.78,.3,.065,.085,.05,'#e3ad91');
 const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.3,.14,48),new THREE.MeshStandardMaterial({color:'#d993b2',roughness:.8}));platform.position.y=-.07;scene.add(platform);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.018,8,64),new THREE.MeshBasicMaterial({color:'#ffe7f1'}));ring.rotation.x=Math.PI/2;ring.position.y=.01;scene.add(ring);
 let angle=.1;container.addEventListener('pointermove',e=>{angle=((e.clientX-container.getBoundingClientRect().left)/container.clientWidth-.5)*.8;});container.addEventListener('pointerleave',()=>angle=.1);
 const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(container);resize();
 function render(t){requestAnimationFrame(render);if(current!=='menu')return;girl.rotation.y=angle+(reducedMotion?0:Math.sin(t*.0006)*.07);girl.position.y=reducedMotion?0:Math.sin(t*.0015)*.025;renderer.render(scene,camera);}requestAnimationFrame(render);
} catch {container.innerHTML='<div style="font-size:140px;padding-top:60px">👩🏻</div><p>3D-персонаж требует WebGL</p>';}

const canvas=$('arena'),ctx=canvas.getContext('2d');let W=1,H=1,phase='targets',elapsed=0,spawn=0,targets=[],particles=[],score=0,hp=5,bossState='idle',bossClock=0,attackSide=1,dodge=0,dodged=false,recoil=0,flash=0,aim={x:0,y:0},last=0;
function resizeArena(){W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*Math.min(devicePixelRatio,2);canvas.height=H*Math.min(devicePixelRatio,2);ctx.setTransform(Math.min(devicePixelRatio,2),0,0,Math.min(devicePixelRatio,2),0,0);aim={x:W/2,y:H/2};}new ResizeObserver(resizeArena).observe(canvas);
function start(){show('game');resizeArena();phase='targets';elapsed=0;spawn=0;targets=[];particles=[];score=0;hp=5;bossState='idle';bossClock=0;dodge=0;recoil=0;flash=0;paused=false;$('boss-health').classList.add('hidden');$('boss-controls').classList.add('hidden');$('phase-label').textContent='СОБЕРИ СЕРДЕЧКИ';$('score-label').textContent='ПОПАДАНИЯ';$('score').textContent='0 ♡';$('time').textContent='00:30';$('message').textContent='Нажимай на сердечки и торты';$('game-hint').textContent='НАЖМИ НА ЦЕЛЬ • ПРОБЕЛ — ВЫСТРЕЛ';}
$('retry').onclick=start;
$('loss-dialog').addEventListener('cancel',e=>e.preventDefault());
function lose(){phase='lost';paused=true;$('loss-score').textContent=`Попадания: ${score} ♡`;$('loss-dialog').showModal();tone(140,.3);}
$('unlock').onclick=start;$('restart').onclick=start;$('pause').onclick=pause;$('resume').onclick=()=>{paused=false;$('pause-dialog').close();};$('pause-dialog').addEventListener('cancel',()=>{paused=false;});function pause(){if(current!=='game'||paused||phase==='won'||phase==='lost')return;paused=true;$('pause-dialog').showModal();}document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function updateHp(){$('hp').textContent=Array.from({length:5},(_,i)=>i<hp?'♥':'♡').join(' ');}
function beginBoss(){phase='boss';targets=[];bossClock=.2;bossState='idle';$('boss-health').classList.remove('hidden');$('boss-controls').classList.remove('hidden');$('phase-label').textContent='ФИНАЛЬНЫЙ БОСС';$('time').textContent='♡';$('message').textContent='Следи за замахом. Уклоняйся и стреляй!';$('game-hint').textContent='A / ← — ВЛЕВО • D / → — ВПРАВО';updateHp();tone(240,.3);}
function evade(side){if(current!=='game'||paused||phase!=='boss')return;if(bossState==='windup'&&!dodged){dodge=side;dodged=side===-attackSide;if(dodged){$('message').textContent='Отлично! Дождись удара и стреляй ♡';tone(650,.1);}else{$('message').textContent='В другую сторону! Ещё есть время';} } }
$('left').onclick=()=>evade(-1);$('right').onclick=()=>evade(1);
function burst(x,y,color){for(let i=0;i<14;i++)particles.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*220,life:.7,color});}
function bossPosition(){return {x:W/2-dodge*W*.12,y:H*.48,r:Math.min(W*.2,H*.19,120)};}
function shoot(x,y){if(current!=='game'||paused||!['targets','boss'].includes(phase))return;aim={x,y};recoil=1;tone(180,.08,'triangle');if(phase==='targets'){for(let i=targets.length-1;i>=0;i--){const t=targets[i];if(Math.hypot(t.x-x,t.y-y)<t.r*1.2){targets.splice(i,1);score++;$('score').textContent=`${score} ♡`;burst(t.x,t.y,t.type?'#cba073':'#e7699b');tone(700,.08);break;}}}else{const b=bossPosition();if(Math.hypot(x-b.x,y-b.y)<b.r*1.1){if(bossState==='vulnerable'){hp--;updateHp();burst(b.x,b.y,'#db5789');tone(800,.16);if(!hp){phase='won';$('message').textContent='Ты открыла моё сердце ♡';setTimeout(()=>{if(current==='game'&&phase==='won'){show('ending');tone(1000,.4);}},900);}else{bossState='idle';bossClock=0;dodge=0;$('message').textContent='Попадание! Готовься к следующему замаху';}}else{$('message').textContent='Сначала уклонись от атаки ♡';}}}}
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();aim={x:e.clientX-r.left,y:e.clientY-r.top};});canvas.addEventListener('pointerdown',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();shoot(e.clientX-r.left,e.clientY-r.top);});
document.addEventListener('keydown',e=>{if(current!=='game'||paused)return;if(['Space','ArrowLeft','ArrowRight','KeyA','KeyD','Escape'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space')shoot(aim.x,aim.y);if(['ArrowLeft','KeyA'].includes(e.code))evade(-1);if(['ArrowRight','KeyD'].includes(e.code))evade(1);if(e.code==='Escape')pause();});
function heart(x,y,r,color){ctx.save();ctx.translate(x,y);const grid=['01100110','11111111','11111111','11111111','01111110','00111100','00011000'];const s=r/4;ctx.fillStyle='#a8416c';grid.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')ctx.fillRect((i-4)*s+3,(j-3)*s+5,s+.5,s+.5);}));ctx.fillStyle=color;grid.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')ctx.fillRect((i-4)*s,(j-3)*s,s+.5,s+.5);}));ctx.fillStyle='#ffffff55';ctx.fillRect(-r*.55,-r*.47,s*1.5,s);ctx.restore();}
function cake(t){
 ctx.save();ctx.translate(t.x,t.y);const s=t.r/4;
 // Two sponge tiers, pink icing, a plate and a birthday candle.
 rect(-s*4.3,s*3,s*8.6,s*.5,'#fff2f8');
 rect(-s*4,0,s*8,s*3,'#e4af78');
 rect(-s*4,s*1.25,s*8,s*.55,'#fff0d8');
 rect(-s*4,-s*.35,s*8,s,'#c75479');
 for(const x of [-3,-1,2])rect(x*s,s*.5,s*.6,s*.6,'#c75479');
 rect(-s*2.8,-s*2,s*5.6,s*2,'#edbd89');
 rect(-s*2.8,-s*2.3,s*5.6,s*.7,'#f9d5e3');
 rect(-s*2,-s*1.55,s*.4,s*.35,'#fff6e9');
 rect(s,-s*1.55,s*.4,s*.35,'#fff6e9');
 rect(-s*.3,-s*3.5,s*.6,s*1.2,'#ed6da4');
 rect(-s*.3,-s*3,s*.6,s*.2,'#fff6e9');
 rect(-s*.2,-s*4.2,s*.4,s*.7,'#ffc95c');
 rect(-s*.1,-s*4.35,s*.2,s*.45,'#fff2b1');
 ctx.restore();
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function weapon(dt){drawWeapon(ctx,W,H,recoil,dodge,elapsed,aim,paused?0:dt,!reducedMotion);}
function background(t){const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#f5cddd');grad.addColorStop(.65,'#fbe7ef');grad.addColorStop(1,'#e9b7ce');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);const horizon=H*.68;ctx.strokeStyle='#c984a42c';ctx.lineWidth=1;for(let i=-6;i<=6;i++){ctx.beginPath();ctx.moveTo(W/2+i*W*.035,horizon);ctx.lineTo(W/2+i*W*.3,H);ctx.stroke();}for(let i=0;i<7;i++){const y=horizon+(H-horizon)*(i/6)**2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let i=0;i<15;i++){const x=((i*137.3)%W),y=(i*71.2)%(H*.6);ctx.fillStyle='#ffffff60';const size=i%3===0?5:3;ctx.fillRect(x,y+Math.sin(t+i)*5,size,size);}}
function frame(timestamp){requestAnimationFrame(frame);const realDt=Math.max(0,(timestamp-last)/1000),dt=Math.min(realDt,.05);last=timestamp;if(current!=='game')return;if(!paused){elapsed+=realDt;recoil=Math.max(0,recoil-dt*5);flash=Math.max(0,flash-dt*2);if(phase==='targets'){spawn-=dt;if(spawn<=0){spawn=.45+Math.random()*.35;const r=Math.min(W*.07,28)+Math.random()*9;targets.push({x:35+Math.random()*Math.max(1,W-70),y:H+r,r,vy:75+Math.random()*70,vx:(Math.random()-.5)*30,type:Math.random()>.58});}targets.forEach(t=>{t.y-=t.vy*dt;t.x=Math.max(t.r,Math.min(W-t.r,t.x+t.vx*dt));});if(targets.some(t=>t.y+t.r<0)){lose();return;}$('time').textContent=`00:${String(Math.ceil(Math.max(0,30-elapsed))).padStart(2,'0')}`;if(elapsed>=30)beginBoss();}else if(phase==='boss'){bossClock+=realDt;if(bossState==='idle'&&bossClock>=1.5){bossState='windup';bossClock=0;attackSide=Math.random()<.5?-1:1;dodged=false;dodge=0;$('message').textContent=`Замах ${attackSide<0?'слева — уклоняйся вправо →':'справа — уклоняйся влево ←'}`;tone(250,.2);}else if(bossState==='windup'&&bossClock>=1){if(dodged){bossState='vulnerable';bossClock=0;$('message').textContent='Сейчас! Нажми на сердечко ♡';tone(850,.1);}else{bossState='hit';bossClock=0;flash=.7;$('message').textContent='Ничего страшного ♡ Попробуй следующий замах';tone(120,.2);}}else if((bossState==='vulnerable'&&bossClock>=2.5)||(bossState==='hit'&&bossClock>=.8)){bossState='idle';bossClock=0;dodge=0;$('message').textContent='Приготовься к следующему замаху';}}particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=170*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);}
 background(elapsed);targets.forEach(t=>t.type?cake(t):heart(t.x,t.y,t.r,'#ea75a1'));if(['boss','won'].includes(phase)){const b=bossPosition();ctx.save();ctx.translate(b.x,b.y);if(bossState==='windup'){ctx.rotate(attackSide*(.08+bossClock*.25));ctx.translate(attackSide*bossClock*24,-bossClock*12);}if(bossState==='hit'){ctx.scale(1.3,1.3);}heart(0,0,b.r,bossState==='vulnerable'?'#f191b5':'#df5e91');ctx.fillStyle='#79374f';const s=b.r/10;ctx.fillRect(-s*4,-s,s,s*1.5);ctx.fillRect(s*3,-s,s,s*1.5);ctx.fillRect(-s,s*2,s*2,s*.5);if(bossState==='windup'){ctx.fillStyle='#a8466e';ctx.font='bold 14px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText('!',0,-b.r-18);}ctx.restore();if(bossState==='vulnerable'){ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}}
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.7);rect(p.x,p.y,5,5,p.color);});ctx.globalAlpha=1;weapon(dt);ctx.strokeStyle='#93577388';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(aim.x-8,aim.y);ctx.lineTo(aim.x-3,aim.y);ctx.moveTo(aim.x+3,aim.y);ctx.lineTo(aim.x+8,aim.y);ctx.moveTo(aim.x,aim.y-8);ctx.lineTo(aim.x,aim.y-3);ctx.moveTo(aim.x,aim.y+3);ctx.lineTo(aim.x,aim.y+8);ctx.stroke();if(flash){ctx.fillStyle=`rgba(206,57,99,${flash*.3})`;ctx.fillRect(0,0,W,H);}}
requestAnimationFrame(frame);
