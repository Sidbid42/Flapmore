
// FlapMore Arcade - single-file game logic (vanilla JS, canvas)
(()=>{
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high');
const levelEl = document.getElementById('level');
const muteBtn = document.getElementById('muteBtn');
const skinBtn = document.getElementById('skinBtn');
const leaderBtn = document.getElementById('leaderBtn');
const leaderModal = document.getElementById('leaderboard');
const leaderList = document.getElementById('leaderList');
const closeLeader = document.getElementById('closeLeader');
const clearScores = document.getElementById('clearScores');

let WIDTH = 800, HEIGHT = 520;
function resizeCanvas(){ const w = Math.min(980, window.innerWidth - 56); canvas.style.width = w+'px'; canvas.style.height = HEIGHT+'px'; canvas.width = w; canvas.height = HEIGHT; WIDTH = w; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

const skins = ['assets/skins/orange.png','assets/skins/blue_hat.png','assets/skins/bee.png'];
let skinIndex = Number(localStorage.getItem('flapmore_skin_index') || 0);
let skinImg = new Image(); skinImg.src = skins[skinIndex];

const sounds = {
  flap: new Audio('assets/sfx/flap.wav'),
  point: new Audio('assets/sfx/point.wav'),
  hit: new Audio('assets/sfx/hit.wav'),
  power: new Audio('assets/sfx/power.wav')
};
const music = new Audio('assets/music/bg_loop.wav'); music.loop = true; music.volume = 0.25;
let muted = false;
if (localStorage.getItem('flapmore_muted')==='1'){ muted = true; music.muted = true; for(let k in sounds) sounds[k].muted = true; muteBtn.textContent='🔇'; } else { muteBtn.textContent='🔊'; }

muteBtn.addEventListener('click', ()=>{ muted = !muted; music.muted = muted; for(let k in sounds) sounds[k].muted = muted; localStorage.setItem('flapmore_muted', muted? '1':'0'); muteBtn.textContent = muted? '🔇':'🔊'; });

skinBtn.addEventListener('click', ()=>{ skinIndex = (skinIndex+1) % skins.length; skinImg.src = skins[skinIndex]; localStorage.setItem('flapmore_skin_index', String(skinIndex)); });

leaderBtn.addEventListener('click', ()=>{ showLeaderboard(); });

closeLeader && closeLeader.addEventListener('click', ()=>{ leaderModal.classList.add('hidden'); });
clearScores && clearScores.addEventListener('click', ()=>{ localStorage.setItem('flapmore_scores', JSON.stringify([])); renderLeaderboard(); });

let state = null;
function newState(){
  state = {
    bird:{x:120,y:HEIGHT/2,vy:0,r:16,rot:0,scale:1,shield:false,small:false},
    pipes:[], stars:[], bonus: [], particles:[],
    lastPipe:0, lastStar:0, lastBonus:0,
    score:0, level:1, running:false, gameOver:false, invUntil:0, speed:1,
    timeOfDay:0
  };
  scoreEl.textContent = '0'; levelEl.textContent = '1';
}
newState();

function rand(a,b){return Math.random()*(b-a)+a;}
function addParticles(x,y,n=12){
  for(let i=0;i<n;i++) state.particles.push({x,y,vx:rand(-3,3),vy:rand(-6,1),born:Date.now(),life:rand(500,1000)});
}

function spawnPipe(){
  const types = ['static','moving','small','movingSmall'];
  const t = types[Math.floor(Math.random()*types.length)];
  const w = rand(48,72);
  let gapBase = 140; if (t==='small' || t==='movingSmall') gapBase = 100;
  const gap = Math.max(72, gapBase - (state.level-1)*6);
  const topH = rand(40, HEIGHT - gap - 80);
  state.pipes.push({x:WIDTH+80,w,topH,gap,type:t,t0:Date.now(),amp:rand(18,60),speed:rand(0.002,0.01),passed:false});
  state.lastPipe = Date.now();
}
function spawnStar(){ state.stars.push({x:WIDTH+80,y:rand(90,HEIGHT-90),type:Math.random()<0.65?'inv':'slow',size:10}); state.lastStar=Date.now(); }
function spawnBonus(){ state.bonus.push({x:WIDTH+80,y:rand(120,HEIGHT-120),size:14}); state.lastBonus=Date.now(); }

function flap(){ if (state.gameOver){ newState(); state.running = true; music.play(); return; } state.bird.vy = -9; state.bird.rot = -0.9; addParticles(state.bird.x-10,state.bird.y+8,6); try{ sounds.flap.currentTime=0; sounds.flap.play(); }catch(e){} }
window.addEventListener('keydown',(e)=>{ if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); flap(); } if(e.code==='KeyP'){ state.running = !state.running; } if(e.code==='KeyS'){ skinIndex=(skinIndex+1)%skins.length; skinImg.src=skins[skinIndex]; localStorage.setItem('flapmore_skin_index', String(skinIndex)); } });
canvas.addEventListener('pointerdown', ()=>flap());
startBtn.addEventListener('click', ()=>{ state.running = true; music.play(); });
restartBtn.addEventListener('click', ()=>{ newState(); music.play(); });

function pushScore(score){ try{ const raw = JSON.parse(localStorage.getItem('flapmore_scores')||'[]'); raw.push(score); raw.sort((a,b)=>b-a); localStorage.setItem('flapmore_scores', JSON.stringify(raw.slice(0,50))); }catch(e){} }
function renderLeaderboard(){ leaderList.innerHTML = ''; try{ const raw = JSON.parse(localStorage.getItem('flapmore_scores')||'[]'); raw.slice(0,10).forEach(s=>{ const li = document.createElement('li'); li.textContent = s; leaderList.appendChild(li); }); }catch(e){} }
function showLeaderboard(){ renderLeaderboard(); leaderModal.classList.remove('hidden'); }

let last = performance.now();
function update(dt){
  if (!state.running) return;
  const now = Date.now();
  const spawnRate = Math.max(620, 1200 - (state.level-1)*40);
  if (now - state.lastPipe > spawnRate) spawnPipe();
  if (now - state.lastStar > 4200 && Math.random()<0.6) spawnStar();
  if (now - state.lastBonus > 16000 && Math.random()<0.06) spawnBonus();
  state.bird.vy += 0.6 * dt * 0.06;
  state.bird.y += state.bird.vy * dt * 0.06;
  state.bird.rot += ((Math.max(-1.2, Math.min(1.8, state.bird.vy * 0.06))) - state.bird.rot) * 0.08;
  for(let i=state.pipes.length-1;i>=0;i--){
    const p = state.pipes[i];
    p.x -= 2.6 * state.speed * dt * 0.06;
    if (p.x + p.w < -50) state.pipes.splice(i,1);
    let offset = 0; if (p.type==='moving' || p.type==='movingSmall') offset = Math.sin((Date.now()-p.t0) * p.speed)*p.amp;
    const topH = p.topH + offset;
    const insideTop = state.bird.x + state.bird.r > p.x && state.bird.x - state.bird.r < p.x + p.w && state.bird.y - state.bird.r < topH;
    const insideBottom = state.bird.x + state.bird.r > p.x && state.bird.x - state.bird.r < p.x + p.w && state.bird.y + state.bird.r > topH + p.gap;
    if ((insideTop || insideBottom) && Date.now() > state.invUntil && !state.bird.shield){
      state.gameOver = true; state.running = false; try{ sounds.hit.currentTime=0; sounds.hit.play(); }catch(e){}; addParticles(state.bird.x,state.bird.y,40); pushScore(state.score); renderLeaderboard();
    }
    if (!p.passed && p.x + p.w < state.bird.x){ p.passed = true; state.score += 1; scoreEl.textContent = state.score; try{ sounds.point.currentTime=0; sounds.point.play(); }catch(e){}; if (state.score % 10 === 0){ state.level++; levelEl.textContent = state.level; } }
  }
  for(let i=state.stars.length-1;i>=0;i--){
    const s = state.stars[i]; s.x -= 2.6 * state.speed * dt * 0.06; if (s.x < -30) state.stars.splice(i,1);
    const d = Math.hypot(s.x - state.bird.x, s.y - state.bird.y);
    if (d < state.bird.r + s.size){ if (s.type==='inv'){ state.bird.shield = true; state.invUntil = Date.now() + 1800; setTimeout(()=> state.bird.shield=false,1800); } else { state.speed = 0.6; setTimeout(()=> state.speed = 1,1700); } state.stars.splice(i,1); addParticles(s.x,s.y,20); try{ sounds.power.currentTime=0; sounds.power.play(); }catch(e){}; state.score += 2; scoreEl.textContent = state.score; }
  }
  for(let i=state.bonus.length-1;i>=0;i--){
    const b = state.bonus[i]; b.x -= 2.8 * state.speed * dt * 0.06; if (b.x < -40) state.bonus.splice(i,1);
    const d = Math.hypot(b.x - state.bird.x, b.y - state.bird.y);
    if (d < state.bird.r + b.size){ state.bonus.splice(i,1); addParticles(b.x,b.y,28); const until = Date.now() + 7000; const interval = setInterval(()=>{ if (Date.now() > until){ clearInterval(interval); } else { state.score += 1; scoreEl.textContent = state.score; } }, 300); try{ sounds.point.currentTime=0; sounds.point.play(); }catch(e){}; }
  }
  for(let i=state.particles.length-1;i>=0;i--){ const p = state.particles[i]; const age = Date.now() - p.born; if (age > p.life) state.particles.splice(i,1); else { p.vy += 0.04 * dt; p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06; } }
  if (state.bird.y + state.bird.r > HEIGHT || state.bird.y - state.bird.r < 0){ if (Date.now() > state.invUntil && !state.bird.shield){ state.gameOver = true; state.running = false; try{ sounds.hit.currentTime=0; sounds.hit.play(); }catch(e){}; pushScore(state.score); renderLeaderboard(); } }
  state.timeOfDay = Math.min(1, state.score / 50);
}

function draw(){
  const t = state.timeOfDay;
  function lerp(a,b,t){ return a + (b-a)*t; }
  const dayTop = [167,240,255], dayBottom=[215,247,255];
  const nightTop = [12,22,46], nightBottom=[44,62,99];
  const top = `rgb(${Math.round(lerp(dayTop[0],nightTop[0],t))},${Math.round(lerp(dayTop[1],nightTop[1],t))},${Math.round(lerp(dayTop[2],nightTop[2],t))})`;
  const bottom = `rgb(${Math.round(lerp(dayBottom[0],nightBottom[0],t))},${Math.round(lerp(dayBottom[1],nightBottom[1],t))},${Math.round(lerp(dayBottom[2],nightBottom[2],t))})`;
  const g = ctx.createLinearGradient(0,0,0,HEIGHT); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0,0,WIDTH,HEIGHT);
  const time = Date.now() * 0.00012;
  function drawHills(offset,hf,opa){ ctx.beginPath(); ctx.moveTo(0,HEIGHT); for(let x=0;x<=WIDTH;x+=20){ const y = HEIGHT - Math.sin((x*0.008) + time*offset) * (40*hf) - 40*hf; ctx.lineTo(x,y);} ctx.lineTo(WIDTH,HEIGHT); ctx.closePath(); ctx.fillStyle = `rgba(60,120,70,${opa*(1-t) + 0.06*t})`; ctx.fill(); }
  drawHills(1.0,1.0,0.18); drawHills(0.7,0.6,0.12); drawHills(0.45,0.35,0.08);
  for(const p of state.pipes){ let offset = 0; if (p.type==='moving' || p.type==='movingSmall') offset = Math.sin((Date.now()-p.t0) * p.speed)*p.amp; const topH = p.topH + offset; ctx.fillStyle = '#1f6aa5'; roundRect(ctx, p.x, 0, p.w, topH, 6); ctx.fill(); ctx.fillStyle = '#185b88'; roundRect(ctx, p.x, topH + p.gap, p.w, HEIGHT - (topH + p.gap), 6); ctx.fill(); }
  for(const s of state.stars) drawStar(ctx, s.x, s.y, s.size, 5, 0.5, '#ffd45e');
  for(const b of state.bonus){ ctx.beginPath(); ctx.arc(b.x,b.y,b.size,0,Math.PI*2); ctx.fillStyle='#ffdf6b'; ctx.fill(); ctx.strokeStyle='#b88b00'; ctx.stroke(); }
  ctx.save(); ctx.translate(state.bird.x, state.bird.y); ctx.rotate(state.bird.rot); ctx.scale(state.bird.scale, state.bird.scale); if (skinImg.complete) ctx.drawImage(skinImg, -22, -22, 44, 44); else { ctx.beginPath(); ctx.arc(0,0,state.bird.r,0,Math.PI*2); ctx.fillStyle='#ff7a6b'; ctx.fill(); } if (state.bird.shield){ ctx.beginPath(); ctx.arc(0,0,state.bird.r+8,0,Math.PI*2); ctx.strokeStyle='rgba(180,235,255,0.95)'; ctx.lineWidth=3; ctx.stroke(); } ctx.restore();
  for(const p of state.particles){ const age = Date.now() - p.born; const alpha = 1 - (age / p.life); ctx.beginPath(); ctx.arc(p.x,p.y, Math.max(1, 3*(alpha)), 0, Math.PI*2); ctx.fillStyle = `rgba(255,220,180,${alpha})`; ctx.fill(); }
}

function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function drawStar(ctx,cx,cy,outer,points,inset,color){ ctx.save(); ctx.beginPath(); ctx.translate(cx,cy); ctx.moveTo(0,0-outer); for(let i=0;i<points;i++){ ctx.rotate(Math.PI/points); ctx.lineTo(0,0-(outer*inset)); ctx.rotate(Math.PI/points); ctx.lineTo(0,0-outer);} ctx.closePath(); ctx.fillStyle=color; ctx.fill(); ctx.restore(); }

let raf = null; let lastTime = performance.now();
function loop(now){ const dt = Math.min(48, now - lastTime); lastTime = now; update(dt); draw(); raf = requestAnimationFrame(loop); }
raf = requestAnimationFrame(loop);

setInterval(()=>{ try{ const cur = Number(localStorage.getItem('flapmore_high')||0); if (state.score > cur){ localStorage.setItem('flapmore_high', String(state.score)); highEl.textContent = String(state.score); } }catch(e){} }, 2000);

highEl.textContent = localStorage.getItem('flapmore_high')||'0';

})(); // end IIFE
