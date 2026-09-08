const CACHE='cinderpath-runner-v1';
const SHELL=['./','./index.html','./runner/style.css','./runner/main.js','./runner/content.js','./runner/sim.js','./runner/profile.js','./runner/render.js','./runner/art.js','./assets/BreeSerif-Regular.ttf','./runner/audio.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
// New builds wait until existing tabs close: a run never swaps code underneath you.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cinderpath-runner-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const shellUrls=SHELL.map(path=>new URL(path,self.registration.scope).href);
  // Classic mode is deliberately outside the offline runner shell.
  if(!shellUrls.includes(url.origin+url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(()=>caches.match(event.request,{ignoreSearch:true})));
});
