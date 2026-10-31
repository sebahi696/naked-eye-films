const CACHE='nef-crm-v3';
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

self.addEventListener('push', e=>{
  let d={}; try{ d=e.data.json(); }catch(_){ d={title:'Naked Eye Films', body: e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(d.title||'Naked Eye Films', { body:d.body||'', icon:'./icon-192.png', badge:'./icon-192.png', tag:'nef-'+(d.id||Date.now()), data:{cid:d.cid||null}, vibrate:[80,40,80] }));
});
self.addEventListener('notificationclick', e=>{
  e.notification.close(); const cid=e.notification.data && e.notification.data.cid;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    const c=cs.find(x=>x.url.includes('index.html')||x.url.endsWith('/'));
    if(c){ c.focus(); c.postMessage({type:'open-client',cid}); return; }
    return self.clients.openWindow('./index.html'+(cid?'#c'+cid:''));
  }));
});
