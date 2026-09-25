import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
test('every offline shell resource exists and the manifest supports repo subpaths',async()=>{
 const sw=await readFile('sw.js','utf8');const paths=[...sw.match(/const SHELL=\[(.*?)\];/s)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
 for(const p of paths)await stat(p==='./'?'index.html':p);
 const manifest=JSON.parse(await readFile('manifest.webmanifest','utf8'));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.ok(manifest.icons.some(i=>i.sizes==='192x192'));assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
});
test('offline fetches fall back to the shell, ignore query strings, and leave external/classic requests alone',async()=>{
 const handlers={},cached=[];const context={URL,Promise,self:{location:{origin:'https://example.com'},registration:{scope:'https://example.com/cinderpath/'},addEventListener:(name,fn)=>handlers[name]=fn},fetch:()=>Promise.reject(Error('offline')),caches:{match:(req,opts)=>{cached.push({req,opts});return Promise.resolve('cached');}}};
 vm.runInNewContext(await readFile('sw.js','utf8'),context);
 let response;handlers.fetch({request:{url:'https://example.com/cinderpath/?seed=7',method:'GET'},respondWith:p=>response=p});assert.equal(await response,'cached');assert.equal(cached[0].opts.ignoreSearch,true);
 for(const url of ['https://external.com/asset.js','https://example.com/cinderpath/classic.html']){let handled=false;handlers.fetch({request:{url,method:'GET'},respondWith:()=>handled=true});assert.equal(handled,false);}
});
test('activation only removes old Cinderpath caches',async()=>{
 const handlers={},removed=[];let completion;
 vm.runInNewContext(await readFile('sw.js','utf8'),{URL,Promise,self:{addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:()=>{}}},caches:{keys:async()=>['other-app','cinderpath-runner-old','cinderpath-runner-v1'],delete:async k=>removed.push(k)}});
 handlers.activate({waitUntil:p=>completion=p});await completion;assert.deepEqual(removed,['cinderpath-runner-old']);
});
