import { RULES, BIOMES } from './content.js';
export function random(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function dailyKey(date = new Date()) { return date.toISOString().slice(0,10); }
export function dailySeed(key) { return [...key].reduce((n,c) => Math.imul(n ^ c.charCodeAt(0),16777619) >>> 0, 2166136261); }
export function biomeAt(distance) { return BIOMES[Math.floor(distance / 600) % BIOMES.length]; }
export function jumpHeight(s) { return s.action === 'jump' ? Math.sin(Math.PI * Math.min(1, s.actionTime / RULES.jumpDuration)) * RULES.jumpHeight : 0; }
export function createRun({ seed = 1, mode = 'endless', upgrades = {}, id = '', day = '' } = {}) {
  const daily = mode === 'daily';
  return { id, day, seed: seed >>> 0, mode, phase:'ready', time:0, distance:0, speed:RULES.baseSpeed,
    lane:0, targetLane:0, action:'run', actionTime:0, buffered:null, fuel:100,
    coins:0, score:0, bonus:0, combo:0, comboTime:0, bestCombo:0, charge:0,
    fever:0, magnet:0, shield:0, invincible:0, hits:0, dodges:0, fevers:0,
    entities:[], row:0, safeLane:0, rng:random(seed), events:[], settled:false,
    upgrades: { wick:daily ? 0 : Math.max(0,Math.min(3, upgrades.wick || 0)), oil:daily ? 0 : Math.max(0,Math.min(3,upgrades.oil || 0)), magnet:daily ? 0 : Math.max(0,Math.min(3,upgrades.magnet || 0)) } };
}
// Every row has a guaranteed open lane; adjacent safe lanes differ by at most one.
// The 32 m spacing leaves >1 s at maximum speed, even after a double lane change.
export function generateRow(s) {
  const row = s.row++, z = 80 + row * RULES.rowGap;
  let safe;
  if (row < 4) safe = [0,-1,-1,-1][row];
  else safe = Math.max(-1,Math.min(1,s.safeLane + Math.floor(s.rng()*3)-1));
  s.safeLane = safe;
  const out = [];
  const add = (type,lane,distance) => out.push({id:`${row}-${out.length}`,type,lane,z:distance,done:false});
  if (row === 1) add('rock',0,z);
  else if (row === 2) add('root',0,z);
  else if (row === 3) add('arch',0,z);
  else if (row > 3) {
    const danger = [-1,0,1].filter(l=>l!==safe);
    const count = row > 10 && s.rng() > .32 ? 2 : 1;
    if (s.rng()>.5) danger.reverse();
    for(let i=0;i<count;i++) add(['rock','root','arch'][Math.floor(s.rng()*3)],danger[i],z);
  }
  for(let j=0;j<5;j++) add('cinder',safe,z-14+j*4);
  if (row % 5 === 4) add('oil',safe,z+9);
  else if (row % 9 === 6) add('magnet',safe,z+9);
  else if (row % 11 === 8) add('shield',safe,z+9);
  return out;
}
export function startRun(s) { if(s.phase==='ready') s.phase='running'; }
export function command(s, action) {
  if(s.phase!=='running') return;
  if(action==='left'||action==='right') {
    s.targetLane=Math.max(-1,Math.min(1,s.targetLane+(action==='left'?-1:1)));
    return;
  }
  if(action!=='jump'&&action!=='slide') return;
  if(s.action==='run' || (action==='slide' && s.action==='jump')) {
    s.action=action; s.actionTime=0; s.buffered=null;
  } else s.buffered={action,remaining:.14};
}
export function stepRun(s, dt = RULES.step) {
  s.events=[];
  if(s.phase!=='running' || !Number.isFinite(dt) || dt<=0) return s.events;
  dt=Math.min(dt,1/30);
  s.time+=dt;
  const previousDistance=s.distance, previousLane=s.lane;
  s.speed=Math.min(RULES.maxSpeed,RULES.baseSpeed+s.distance/180);
  s.distance+=s.speed*dt;
  s.lane+=Math.sign(s.targetLane-s.lane)*Math.min(Math.abs(s.targetLane-s.lane),RULES.laneSpeed*dt);
  for(const key of ['fever','magnet','invincible','comboTime']) s[key]=Math.max(0,s[key]-dt);
  if(s.comboTime===0) s.combo=0;
  if(s.buffered) { s.buffered.remaining-=dt; if(s.buffered.remaining<=0) s.buffered=null; }
  if(s.action!=='run') {
    s.actionTime+=dt;
    if(s.actionTime>=(s.action==='jump'?RULES.jumpDuration:RULES.slideDuration)) {
      s.action='run';s.actionTime=0;
      if(s.buffered) command(s,s.buffered.action);
    }
  }
  s.fuel=Math.max(0,s.fuel-RULES.fuelDrain*(1-.06*s.upgrades.wick)*(1+s.distance/12000)*dt);
  while(80+s.row*RULES.rowGap < s.distance+RULES.viewDistance) s.entities.push(...generateRow(s));
  for(const e of s.entities) {
    if(e.done || e.z < previousDistance-.01 || e.z > s.distance) continue;
    e.done=true;
    const t=(e.z-previousDistance)/(s.distance-previousDistance);
    const contactLane=previousLane+(s.lane-previousLane)*Math.max(0,Math.min(1,t));
    const same=Math.abs(e.lane-contactLane)<.57;
    const pickup=['cinder','oil','magnet','shield'].includes(e.type);
    if(pickup) {
      if(!same && !(e.type==='cinder'&&(s.magnet>0||s.fever>0))) continue;
      if(e.type==='cinder') {
        s.coins++;s.combo++;s.comboTime=3.4;s.bestCombo=Math.max(s.bestCombo,s.combo);
        s.bonus+=10*Math.min(5,1+Math.floor(s.combo/10))*(s.fever>0?2:1);
        s.fuel=Math.min(100,s.fuel+.45);
        if(s.fever<=0 && ++s.charge>=RULES.feverAt) {
          s.charge=0;s.fever=RULES.feverDuration;s.fevers++;s.events.push({type:'fever'});
        }
      } else if(e.type==='oil') s.fuel=Math.min(100,s.fuel+24+4*s.upgrades.oil);
      else if(e.type==='magnet') s.magnet=10+2*s.upgrades.magnet;
      else s.shield=1;
      s.events.push({type:e.type,lane:e.lane});
      continue;
    }
    const cleared=!same || (e.type==='root'&&jumpHeight(s)>.55) || (e.type==='arch'&&s.action==='slide');
    if(cleared) {
      s.dodges++;
      if(same) {s.bonus+=60;s.events.push({type:'clear',kind:e.type});}
      continue;
    }
    if(s.fever>0||s.invincible>0) {s.events.push({type:'shatter',lane:e.lane});continue;}
    if(s.shield) {s.shield=0;s.invincible=1.3;s.events.push({type:'blocked'});continue;}
    s.hits++;s.fuel=Math.max(0,s.fuel-RULES.hitCost);s.invincible=1.3;s.combo=0;s.charge=0;
    s.events.push({type:'hit',kind:e.type,lane:e.lane});
  }
  s.entities=s.entities.filter(e=>e.z>s.distance-12);
  s.score=Math.floor(s.distance*2+s.bonus);
  if(Math.floor(previousDistance/600)!==Math.floor(s.distance/600)) s.events.push({type:'biome',name:biomeAt(s.distance).name});
  if(s.fuel<=0) {s.phase='ended';s.events.push({type:'end'});}
  return s.events;
}
export function finishRun(s) { if(s.phase==='running'||s.phase==='paused') s.phase='ended'; }
