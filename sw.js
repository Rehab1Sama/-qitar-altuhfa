const C='qitar-v3',A='qitar-audio';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==A).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
/* التلاوات: من الجوال إن حُفظت (مع دعم المقاطع الجزئية Range)، وإلا من الشبكة */
async function audio(req){
  const c=await caches.open(A);
  const hit=await c.match(new URL(req.url).pathname.replace(/^.*\/audio\//,'audio/'))||await c.match(req.url,{ignoreSearch:true});
  if(!hit)return fetch(req);
  const range=req.headers.get('range');
  if(!range)return hit;
  const buf=await hit.arrayBuffer(),n=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(range)||[];const a=m[1]?+m[1]:0,b=m[2]?Math.min(+m[2],n-1):n-1;
  return new Response(buf.slice(a,b+1),{status:206,headers:{'Content-Type':hit.headers.get('Content-Type')||'audio/mp4','Content-Range':`bytes ${a}-${b}/${n}`,'Content-Length':String(b-a+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.hostname.endsWith('supabase.co'))return;
  if(u.origin===location.origin&&u.pathname.includes('/audio/')){e.respondWith(audio(e.request));return;}
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;})));
});
