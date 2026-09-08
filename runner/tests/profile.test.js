import test from 'node:test';
import assert from 'node:assert/strict';
import {newProfile,normalizeProfile,saveProfile,loadProfile,completeRun,levelInfo,buyCloak,buyUpgrade,PROFILE_KEY} from '../profile.js';
import {createRun,startRun,finishRun} from '../sim.js';
const memory=()=>{const data=new Map();return{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};};
test('a completed run is banked once, including repeated callbacks and reloads',()=>{
 const p=newProfile(),s=createRun({id:'run-1'});s.distance=650;s.coins=55;s.score=2000;s.dodges=13;assert.equal(completeRun(p,s),null);startRun(s);finishRun(s);
 const reward=completeRun(p,s);assert.equal(p.runs,1);assert.ok(reward.reward>0);const before=JSON.stringify(p);assert.equal(completeRun(p,s),null);assert.equal(completeRun(p,{...s,settled:false}),null);assert.equal(JSON.stringify(p),before);assert.ok(p.claimed.includes('best1'));
});
test('missions reward only once across future runs',()=>{
 const p=newProfile();const run=id=>({id,phase:'ended',distance:10,coins:0,score:20,dodges:0,fevers:0});const a=completeRun(p,run('a')),b=completeRun(p,run('b'));assert.equal(a.reward,40);assert.equal(b.reward,0);
});
test('cloak purchases respect price and level; re-equipping never charges',()=>{
 const p=newProfile();assert.equal(buyCloak(p,'moss'),false);p.coins=150;assert.equal(buyCloak(p,'moss'),false);p.xp=120;assert.equal(buyCloak(p,'moss'),true);assert.equal(p.coins,0);assert.equal(p.selected,'moss');assert.equal(buyCloak(p,'ember'),true);assert.equal(buyCloak(p,'moss'),true);assert.equal(p.coins,0);assert.equal(buyCloak(p,'unknown'),false);
});
test('upgrades cannot overdraw currency or exceed their maximum level',()=>{
 const p=newProfile();assert.equal(buyUpgrade(p,'oil'),false);p.coins=2000;for(let i=0;i<3;i++)assert.equal(buyUpgrade(p,'oil'),true);const balance=p.coins;assert.equal(buyUpgrade(p,'oil'),false);assert.equal(p.coins,balance);assert.equal(buyUpgrade(p,'unknown'),false);
});
test('level progress has exact thresholds and finite progress',()=>{assert.equal(levelInfo(0).level,1);assert.equal(levelInfo(119).level,1);assert.equal(levelInfo(120).level,2);assert.equal(levelInfo(480).level,3);assert.equal(levelInfo(480).progress,0);});
test('corrupt, missing, or blocked storage never prevents a run',()=>{
 const storage=memory();storage.setItem(PROFILE_KEY,'{bad');assert.deepEqual(loadProfile(storage),newProfile());assert.equal(saveProfile(newProfile(),null),false);
 const denied={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};assert.deepEqual(loadProfile(denied),newProfile());assert.equal(saveProfile(newProfile(),denied),false);
});
test('profile round-trips and sanitizes untrusted data shapes and impossible values',()=>{
 const p=newProfile();p.coins=42;p.settings.sound=false;const storage=memory();assert.equal(saveProfile(p,storage),true);assert.deepEqual(loadProfile(storage),p);
 const bad=normalizeProfile({v:1,coins:-1,xp:Infinity,owned:['fake','moss'],selected:'fake',claimed:{bad:1},recent:'oops',upgrades:{wick:900},settings:{quality:'huge'}});
 assert.equal(bad.coins,0);assert.equal(bad.xp,0);assert.equal(bad.selected,'ember');assert.equal(bad.upgrades.wick,3);assert.equal(bad.settings.quality,'high');assert.deepEqual(bad.claimed,[]);
});
test('daily best is scoped to the run start date and cannot go down',()=>{
 const p=newProfile();const run=(id,day,score)=>({id,day,mode:'daily',score,phase:'ended',distance:0,coins:0,dodges:0,fevers:0});
 completeRun(p,run('a','2026-09-07',100));completeRun(p,run('b','2026-09-07',50));completeRun(p,run('c','2026-09-08',40));assert.equal(p.daily['2026-09-07'],100);assert.equal(p.daily['2026-09-08'],40);
});
