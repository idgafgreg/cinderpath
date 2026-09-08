import test from 'node:test';
import assert from 'node:assert/strict';
import {RULES} from '../content.js';
import {createRun,startRun,stepRun,command,generateRow,finishRun,jumpHeight,dailyKey,dailySeed,biomeAt} from '../sim.js';
function live(opts={}){const s=createRun(opts);startRun(s);return s;}
function tick(s,seconds){for(let i=0;i<Math.round(seconds*60);i++)stepRun(s);return s;}
function contact(type,{action='run',at=.4,lane=0,shield=0,fever=0}={}){
 const s=live();s.row=100;s.entities=[{id:'one',type,lane,z:.1,done:false}];s.action=action;s.actionTime=at;s.shield=shield;s.fever=fever;stepRun(s);return s;
}
test('ready, pause, and ended states freeze all gameplay',()=>{
 const s=createRun();stepRun(s);assert.equal(s.distance,0);startRun(s);stepRun(s);s.phase='paused';const before=JSON.stringify(s);tick(s,2);assert.equal(JSON.stringify(s),before);finishRun(s);tick(s,2);assert.equal(s.phase,'ended');
});
test('seeded content repeats exactly and distinct seeds diverge',()=>{
 const rows=seed=>{const s=createRun({seed});return Array.from({length:30},()=>generateRow(s));};assert.deepEqual(rows(7),rows(7));assert.notDeepEqual(rows(7),rows(8));
});
test('100,000 generated rows have an open lane, safe pickups and reachable transitions',()=>{
 for(let seed=1;seed<=100;seed++){
  const s=createRun({seed});let previous=0;
  for(let i=0;i<1000;i++){
   const row=generateRow(s),hazards=row.filter(e=>['rock','root','arch'].includes(e.type));
   assert.ok(hazards.length<=2);assert.ok(!hazards.some(e=>e.lane===s.safeLane));assert.ok(Math.abs(s.safeLane-previous)<=1);
   assert.ok(row.filter(e=>e.type==='cinder').every(e=>e.lane===s.safeLane));assert.equal(new Set(row.map(e=>e.id)).size,row.length);previous=s.safeLane;
  }
 }
 assert.ok(RULES.rowGap/RULES.maxSpeed>1);
});
test('lane motion is bounded, smooth, and input changes direction immediately',()=>{
 const s=live();command(s,'left');stepRun(s);assert.ok(s.lane<0&&s.lane>-1);tick(s,.2);assert.equal(s.lane,-1);command(s,'left');tick(s,.2);assert.equal(s.lane,-1);command(s,'right');tick(s,.2);assert.equal(s.lane,0);
});
test('jump and slide have timing windows, allow a dive, and cannot be held forever',()=>{
 const s=live();command(s,'jump');tick(s,.4);assert.ok(jumpHeight(s)>1.5);command(s,'slide');assert.equal(s.action,'slide');assert.equal(jumpHeight(s),0);tick(s,1);assert.equal(s.action,'run');
});
test('a near-end action can buffer while stale inputs expire',()=>{
 const s=live();command(s,'jump');tick(s,.78);command(s,'jump');tick(s,.12);assert.equal(s.action,'jump');assert.ok(s.actionTime<.1);command(s,'slide');command(s,'jump');tick(s,1);assert.equal(s.action,'run');
});
test('rocks require dodging; roots require jumping; arches require sliding',()=>{
 assert.equal(contact('rock').hits,1);assert.equal(contact('rock',{action:'jump'}).hits,1);assert.equal(contact('rock',{lane:1}).hits,0);
 assert.equal(contact('root').hits,1);assert.equal(contact('root',{action:'jump'}).hits,0);assert.equal(contact('root',{action:'jump',at:0}).hits,1);
 assert.equal(contact('arch').hits,1);assert.equal(contact('arch',{action:'slide'}).hits,0);assert.equal(contact('arch',{action:'jump'}).hits,1);
});
test('swept contacts grant exactly one hit or pickup, including maximum speed',()=>{
 const s=contact('cinder');assert.equal(s.coins,1);tick(s,1);assert.equal(s.coins,1);
 const r=live();r.distance=10000;r.row=1000;r.entities=[{id:'fast',type:'rock',lane:0,z:10000.1}];stepRun(r,1/30);assert.equal(r.hits,1);tick(r,.5);assert.equal(r.hits,1);
});
test('damage uses the interpolated lane at contact, not the target lane',()=>{
 const s=live();s.row=100;s.lane=0;s.entities=[{id:'at-contact',type:'rock',lane:0,z:.01}];command(s,'right');stepRun(s);assert.equal(s.hits,1);
});
test('fuel is the only life resource and reaching zero ends the run',()=>{
 const s=live();s.fuel=.001;stepRun(s);assert.equal(s.fuel,0);assert.equal(s.phase,'ended');assert.equal(s.hp,undefined);
});
test('oil caps fuel and an equipped ward blocks one hit',()=>{
 assert.equal(contact('oil').fuel,100);const s=contact('rock',{shield:1});assert.equal(s.hits,0);assert.equal(s.shield,0);assert.ok(s.fuel>99);
});
test('magnet gathers other lanes and fever protects without becoming permanent',()=>{
 const s=live();s.row=100;s.magnet=2;s.entities=[{id:'coin',type:'cinder',lane:1,z:.1}];stepRun(s);assert.equal(s.coins,1);
 const rush=contact('rock',{fever:1});assert.equal(rush.hits,0);tick(rush,2);assert.equal(rush.fever,0);
});
test('24 cinders trigger Ember Rush and a hit resets its charge',()=>{
 const s=live();s.row=100;s.charge=23;s.entities=[{id:'coin',type:'cinder',lane:0,z:.1}];stepRun(s);assert.equal(s.fevers,1);assert.equal(s.charge,0);assert.equal(s.fever,7);
 const r=live();r.row=100;r.charge=20;r.entities=[{id:'rock',type:'rock',lane:0,z:.1}];stepRun(r);assert.equal(r.charge,0);
});
test('combo expires between distant pickups and damage clears it',()=>{const s=contact('cinder');assert.equal(s.combo,1);tick(s,4);assert.equal(s.combo,0);});
test('same input stream gives exactly the same outcome',()=>{
 function play(){const s=live({seed:51});for(let t=0;t<6000;t++){if(t%95===0)command(s,t%190?'left':'right');if(t%63===0)command(s,'jump');stepRun(s);}return {distance:s.distance,score:s.score,fuel:s.fuel,coins:s.coins,hits:s.hits};}
 assert.deepEqual(play(),play());
});
test('biomes rotate and the UTC daily seed changes only with the date',()=>{
 assert.equal(biomeAt(0).id,'wood');assert.equal(biomeAt(600).id,'ruins');assert.equal(biomeAt(1200).id,'dawn');assert.equal(biomeAt(1800).id,'wood');
 const key=dailyKey(new Date('2026-09-07T23:30:00-07:00'));assert.equal(key,'2026-09-08');assert.equal(dailySeed(key),dailySeed(key));assert.notEqual(dailySeed(key),dailySeed('2026-09-09'));
});
test('daily mode ignores all permanent upgrades',()=>{const s=live({mode:'daily',upgrades:{wick:3,oil:3,magnet:3}});assert.deepEqual(s.upgrades,{wick:0,oil:0,magnet:0});});
test('invalid or huge delta cannot teleport the runner',()=>{const s=live();stepRun(s,NaN);stepRun(s,-1);assert.equal(s.distance,0);stepRun(s,100);assert.ok(s.distance<=.5);});
test('a safe-lane player can cross all three biomes without damage; objects stay bounded',()=>{
 const s=live({seed:17});let maxEntities=0;
 while(s.distance<5000&&s.phase==='running'){
  const target=s.entities.find(e=>!e.done&&e.type==='cinder'&&e.z>s.distance);
  if(target&&Math.abs(target.lane-s.targetLane)>.01)command(s,target.lane<s.targetLane?'left':'right');
  stepRun(s);maxEntities=Math.max(maxEntities,s.entities.length);
 }
 assert.ok(s.distance>=5000,`ended at ${s.distance}`);assert.equal(s.hits,0);assert.ok(maxEntities<70);assert.ok(s.coins>500);assert.ok(s.fevers>10);
});
