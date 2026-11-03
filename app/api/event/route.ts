import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status=200, extra={}) => Response.json(data,{status,headers:{'Cache-Control':'no-store',...extra}});
function token(r:Request) { const cookie=r.headers.get('cookie')?.match(/(?:^|;\s*)diwali_device=([a-f0-9-]{36})/)?.[1]; const stored=r.headers.get('x-diwali-device')||''; return cookie || (/^[a-f0-9-]{36}$/.test(stored)?stored:''); }
function db() { if(!env.DB) throw new Error('Database unavailable'); return env.DB; }
async function state(device:string) {
 const d=db();
 const [total,winners,entry] = await Promise.all([d.prepare('SELECT COUNT(*) AS count FROM entries').first(),d.prepare('SELECT id,name FROM entries WHERE win=1 ORDER BY created').all(), device? d.prepare('SELECT id,name,played,win FROM entries WHERE device=?').bind(device).first():null]);
 return {count:total?.count||0,winners:winners.results,closed:false,entry};
}
// Rejection sampling avoids modulo bias: exactly one in 100 candidates wins.
function lucky(){const v=new Uint32Array(1);do{crypto.getRandomValues(v)}while(v[0]>=4294967200);return v[0]%100===0?1:0;}
export async function GET(r:Request) {try{return json(await state(token(r)));}catch{return json({error:'We could not load the celebration. Please try again.'},503);} }
export async function POST(r:Request) {
 if(r.headers.get('origin')!==new URL(r.url).origin) return json({error:'Invalid request.'},403);
 try {
 const body=await r.json() as {name?:unknown;device?:unknown;action?:string};
 const d=db();
 if(body.action==='reveal') {
 const device=token(r);
 if(!device) return json({error:'Please enter your name before scratching.'},400);
 // A single serialized statement both checks the shared cap and saves this browser's
 // one result. Concurrent scratches cannot create a fourth winner or reroll a card.
 await d.prepare('UPDATE entries SET win=CASE WHEN ?=1 AND (SELECT COUNT(*) FROM entries WHERE win=1)<3 THEN 1 ELSE 0 END, played=1 WHERE device=? AND played=0').bind(lucky(),device).run();
 const result=await state(device);
 if(!result.entry) return json({error:'Please enter your name first.'},400);
 return json(result);
 }
 if(body.action) return json({error:'This celebration uses instant scratch cards.'},400);
 const name=typeof body.name==='string'?body.name.trim().replace(/\s+/g,' '):'';
 if(name.length<2 || name.length>60 || /[\u0000-\u001f<>]/.test(name)) return json({error:'Please enter a name between 2 and 60 characters.'},400);
 const device=token(r)||(typeof body.device==='string'&&/^[a-f0-9-]{36}$/.test(body.device)?body.device:crypto.randomUUID());
 await d.prepare('INSERT OR IGNORE INTO entries(id,device,name,created) VALUES (?,?,?,?)').bind(crypto.randomUUID(),device,name,Date.now()).run();
 return json(await state(device),200,{'Set-Cookie':`diwali_device=${device}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`});
 } catch {return json({error:'We could not save your entry or card. Please try again.'},503);}
}
