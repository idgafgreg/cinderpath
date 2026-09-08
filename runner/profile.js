import { CLOAKS, UPGRADES, MISSIONS } from './content.js';
export const PROFILE_KEY='cinderpath-runner-v1';
const integer=(v,max=1e9)=>Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
export function newProfile() { return { v:1, coins:0, xp:0, best:0, bestDistance:0, runs:0, distance:0, totalCoins:0,
  dodges:0, fevers:0, selected:'ember', owned:['ember'], upgrades:{wick:0,oil:0,magnet:0}, claimed:[], recent:[], daily:{},
  settings:{sound:true,motion:true,quality:'high',controls:true}, tutorial:false }; }
export function normalizeProfile(data) {
  const p=newProfile();
  if(!data||data.v!==1) return p;
  for(const key of ['coins','xp','best','bestDistance','runs','distance','totalCoins','dodges','fevers']) p[key]=integer(data[key]);
  p.owned=[...new Set(['ember',...(Array.isArray(data.owned)?data.owned:[]).filter(id=>CLOAKS.some(c=>c.id===id))])];
  p.selected=p.owned.includes(data.selected)?data.selected:'ember';
  for(const {id} of UPGRADES) p.upgrades[id]=integer(data.upgrades?.[id],3);
  p.claimed=(Array.isArray(data.claimed)?data.claimed:[]).filter(id=>MISSIONS.some(m=>m.id===id));
  p.recent=(Array.isArray(data.recent)?data.recent:[]).filter(id=>typeof id==='string').slice(-30);
  for(const [key,value] of Object.entries(data.daily&&typeof data.daily==='object'?data.daily:{}).sort().slice(-30)) {
    if(/^\d{4}-\d{2}-\d{2}$/.test(key)) p.daily[key]=integer(value);
  }
  for(const key of ['sound','motion','controls']) if(typeof data.settings?.[key]==='boolean') p.settings[key]=data.settings[key];
  if(['high','low'].includes(data.settings?.quality)) p.settings.quality=data.settings.quality;
  p.tutorial=data.tutorial===true;
  return p;
}
export function getStorage() { try { return globalThis.localStorage; } catch { return null; } }
export function loadProfile(storage=getStorage()) {
  try{return normalizeProfile(JSON.parse(storage?.getItem(PROFILE_KEY)||'null'));}catch{return newProfile();}
}
export function saveProfile(p,storage=getStorage()) {
  try{if(!storage)return false;storage.setItem(PROFILE_KEY,JSON.stringify(p));return true;}catch{return false;}
}
export function levelInfo(xp) { const level=Math.floor(Math.sqrt(integer(xp)/120))+1; const base=(level-1)**2*120,next=level**2*120; return {level,progress:(xp-base)/(next-base),remaining:next-xp}; }
export function missionValue(p,m) { return m.stat==='coins'?p.totalCoins:p[m.stat]||0; }
export function completeRun(p,s) {
  if(s.phase!=='ended'||s.settled||p.recent.includes(s.id)) return null;
  s.settled=true;
  const oldLevel=levelInfo(p.xp).level, newBest=s.score>p.best;
  const xp=Math.floor(s.distance/8)+s.coins*2+s.dodges*3;
  p.coins+=s.coins;p.totalCoins+=s.coins;p.xp+=xp;p.runs++;p.distance+=Math.floor(s.distance);
  p.dodges+=s.dodges;p.fevers+=s.fevers;p.best=Math.max(p.best,s.score);p.bestDistance=Math.max(p.bestDistance,Math.floor(s.distance));
  if(s.mode==='daily' && /^\d{4}-\d{2}-\d{2}$/.test(s.day)) {
    p.daily[s.day]=Math.max(p.daily[s.day]||0,s.score);
    p.daily=Object.fromEntries(Object.entries(p.daily).sort().slice(-30));
  }
  p.recent.push(s.id);p.recent=p.recent.slice(-30);
  const completed=MISSIONS.filter(m=>!p.claimed.includes(m.id)&&missionValue(p,m)>=m.target);
  const reward=completed.reduce((n,m)=>n+m.reward,0);
  p.coins+=reward;p.claimed.push(...completed.map(m=>m.id));
  return {xp,coins:s.coins,reward,completed,newBest,levelUp:levelInfo(p.xp).level>oldLevel};
}
export function buyCloak(p,id) {
  const item=CLOAKS.find(c=>c.id===id);
  if(!item)return false;
  if(p.owned.includes(id)){p.selected=id;return true;}
  if(p.coins<item.price||levelInfo(p.xp).level<item.level)return false;
  p.coins-=item.price;p.owned.push(id);p.selected=id;return true;
}
export function buyUpgrade(p,id) {
  const item=UPGRADES.find(c=>c.id===id), level=p.upgrades[id];
  if(!item||!Number.isInteger(level)||level>=item.prices.length||p.coins<item.prices[level])return false;
  p.coins-=item.prices[level];p.upgrades[id]++;return true;
}
