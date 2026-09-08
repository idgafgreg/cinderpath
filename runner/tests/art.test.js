import test from 'node:test';
import assert from 'node:assert/strict';
import { gaitPose, courier, treeArt, lantern, ICONS } from '../art.js';

test('the authored gait is continuous across loops and contains a planted and lifted foot',()=>{
  assert.deepEqual(gaitPose(0),gaitPose(1));
  const poses=Array.from({length:101},(_,i)=>gaitPose(i/100));
  assert.ok(poses.some(p=>p.y===0));assert.ok(poses.some(p=>p.y<-15));
  for(let i=1;i<poses.length;i++)for(const key of ['x','y','k'])assert.ok(Math.abs(poses[i][key]-poses[i-1][key])<2);
});

test('every courier action and tree variant draws finite geometry and restores canvas state',()=>{
  const old=globalThis.Path2D;
  globalThis.Path2D=class{constructor(path){assert.ok(!/NaN|Infinity|undefined/.test(path),path);}};
  let depth=0;
  const numeric=(...values)=>{for(const v of values)if(typeof v==='number')assert.ok(Number.isFinite(v));};
  const c={save(){depth++;},restore(){assert.ok(depth>0);depth--;},translate:numeric,scale:numeric,rotate:numeric,beginPath(){},ellipse:numeric,moveTo:numeric,lineTo:numeric,fill(){},stroke(){}};
  try{
    for(const action of ['run','jump','slide'])for(const back of [false,true])for(let i=0;i<32;i++){
      courier(c,{time:i/7,phase:i/32,run:true,back,action,actionTime:i/32*.86,lean:(i%3)-1,fuel:i*3});assert.equal(depth,0);
    }
    for(let v=0;v<4;v++){treeArt(c,v,['#254c3d','#3e654a','#658159']);assert.equal(depth,0);}
    lantern(c,0,0,1,0,0);assert.equal(depth,0);
  }finally{globalThis.Path2D=old;}
});

test('game controls use named original glyphs instead of platform-dependent emoji',()=>{
  for(const name of ['book','cloak','sun','gear','sound','mute','flame','pause','close','left','right','jump','slide'])assert.ok(ICONS[name]?.startsWith('M'));
});
