const CACHE='nef-crm-v2';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin){ e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))); return; }
  // network first for the page so updates arrive, cache fallback offline
  e.respondWith(fetch(e.request).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r; }).catch(()=>caches.match(e.request).then(m=>m||caches.match('./index.html'))));
});
