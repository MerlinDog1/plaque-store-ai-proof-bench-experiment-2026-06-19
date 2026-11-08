import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EventEmitter} from 'node:events';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {parseUsage,requestContext,browserRow,serverRow,backgroundUsage,recordPaid,observeUsage,summarizeUsage,londonDay,usageDb} from '../server/usage.mjs';
const id=randomUUID(), operation=randomUUID();
const req={headers:{host:'instaplaque.co.uk','x-instaplaque-visit':id,'x-instaplaque-operation':operation,'x-instaplaque-step':'layout','user-agent':'iPhone Mobile SECRET-UA','x-forwarded-for':'192.0.2.42','x-vercel-ip-city':'New%20Town'},method:'POST'};
const payload={visitId:id,event:'visit',source:'direct',campaign:'',cookie:'rejected',internal:false,taggedTest:false,details:{}};
test('strict top-level and per-event allowlists, UUID, 2 KB limit',()=>{
 assert.deepEqual(parseUsage(JSON.stringify(payload)),payload);
 for(const p of [{...payload,email:'secret'}, {...payload,event:'paid'},{...payload,visitId:'fingerprint'},{...payload,details:{wording:'secret'}},{...payload,campaign:'x'.repeat(81)},{...payload,source:'https://private'},{...payload,internal:'true'}]) assert.throws(()=>parseUsage(JSON.stringify(p)));
 for(const details of [{step:'wording'},{step:'size'}]) assert.ok(parseUsage(JSON.stringify({...payload,event:'designer_step',details})));
 for(const details of [{step:'private'}, {step:'wording',email:'secret'}]) assert.throws(()=>parseUsage(JSON.stringify({...payload,event:'designer_step',details})));
 assert.ok(parseUsage(JSON.stringify({...payload,event:'layout_result',details:{kind:'layout',outcome:'failed',reason:'timeout',seconds:30,operation}})));
 assert.throws(()=>parseUsage(JSON.stringify({...payload,event:'layout_result',details:{kind:'layout',outcome:'failed',reason:'private error text',seconds:1}})));
 assert.throws(()=>parseUsage(' '.repeat(2049)),e=>e.statusCode===413);
});
test('Statistics-off = no visit = no server rows, flags and safe context',()=>{
 assert.equal(serverRow({headers:{}},'ai_call',{status:200}),null);
 assert.equal(requestContext({...req,headers:{...req.headers,'x-instaplaque-visit':undefined}}),null);
 assert.equal(requestContext(req,{}).test,false);
 assert.equal(requestContext(req,{USAGE_INTERNAL_IPS:'192.0.2.42'}).test_reason,'internal_ip');
 assert.equal(requestContext({...req,headers:{...req.headers,'x-instaplaque-internal':'1'}}).test_reason,'internal_browser');
 assert.equal(requestContext({...req,headers:{...req.headers,'x-instaplaque-test':'1'}}).test_reason,'tagged_test');
 for(const [host,site] of [['localhost:4179','local'],['instaplaque-example.vercel.app','preview'],['www.instaplaque.co.uk','live']]) assert.equal(requestContext({...req,headers:{...req.headers,host}}).site,site);
 assert.equal(requestContext(req).town,'New Town'); assert.equal(requestContext(req).device,'phone');
});
test('inspect EVERY row shape: no IP, UA, wording, customer data, tokens, URL or arbitrary fields',()=>{
 const secret={email:'PRIVATE-EMAIL',wording:'PRIVATE-WORDING',name:'PRIVATE-NAME',token:'PRIVATE-TOKEN',artwork:'PRIVATE-ARTWORK'};
 const rows=[browserRow(req,payload), serverRow(req,'ai_call',{status:429,duration_ms:123,...secret}),serverRow(req,'proof_saved',{source:'evil source',kind:'PRIVATE-KIND',...secret}),serverRow(req,'proof_emailed',secret),serverRow(req,'design_request',secret),serverRow(req,'checkout_start',{order:{id:'PSAI-'+id,totalPence:12345,plaqueState:{material:'brushed-brass',width:150,height:50,...secret},...secret},sandboxTest:true})];
 const allowed=['visit_id','site','deployment','device','country','region','town','internal','test','test_reason','event','order_id','details'];
 for(const row of rows) {
  assert.ok(Object.keys(row).every(k=>allowed.includes(k)));
  const json=JSON.stringify(row); for(const s of ['192.0.2.42','SECRET-UA','PRIVATE-','evil source','"email":','"wording":','"token":','"artwork":']) assert.ok(!json.includes(s),s);
 }
 assert.equal(rows.at(-1).test_reason,'admin_sandbox'); assert.equal(rows[1].details.rate_limited,true);
});
function browser({enabled=true,internal=false}={}) {
 const calls=[];let on=enabled;
 const ctx={exports:{},window:{},crypto:{randomUUID},performance,fetch:(path,o)=>{calls.push({path,...o,body:JSON.parse(o.body)});return Promise.resolve({ok:true});},require:name=>({
 './siteStatistics':{statisticsEnabled:()=>on},'./metaPixel':{isInternalBrowser:()=>internal,metaConsent:()=> 'no'},'./arrivalAttribution':{getArrivalAttribution:()=>({label:'google_ads',utm_campaign:'Autumn',utm_source:'cody-test',gclid:'PRIVATE-CLICK',landing_path:'/private'})}
 })[name]};
 for(const k of ['localStorage','sessionStorage','indexedDB']) Object.defineProperty(ctx,k,{get(){throw Error('Storage accessed');}});
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('services/designerUsage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);
 return {api:ctx.exports,calls,set:v=>on=v};
}
test('browser: no storage; same visit; rejected cookies counted; internal flagged; off sends nothing; cap 40',()=>{
 const h=browser({enabled:false}); assert.equal(Object.keys(h.api.usageHeaders()).length,0);h.api.designerUsage('designer_open',{},'open');assert.equal(h.calls.length,0);
 h.set(true);h.api.designerUsage('designer_open',{},'open');h.api.designerUsage('designer_open',{},'open');assert.equal(h.calls.length,2);
 const first=h.api.usageHeaders();assert.equal(first['X-InstaPlaque-Visit'],h.api.usageHeaders()['X-InstaPlaque-Visit']);assert.equal(first['X-InstaPlaque-Test'],'1');
 assert.equal(h.calls[0].body.cookie,'rejected');assert.equal(h.calls[0].keepalive,true);assert.ok(!JSON.stringify(h.calls).includes('PRIVATE'));
 h.set(false);h.api.layoutUsage('layout',performance.now(),'shown');assert.equal(h.calls.length,2);assert.equal(Object.keys(h.api.usageHeaders()).length,0);
 h.set(true);for(let i=0;i<100;i++)h.api.designerUsage('layout_result',{kind:'layout',outcome:'shown',seconds:1});assert.equal(h.calls.length,40);
 const internal=browser({internal:true});internal.api.designerUsage('designer_open');assert.equal(internal.calls[0].body.internal,true);assert.equal(internal.api.usageHeaders()['X-InstaPlaque-Internal'],'1');
 assert.notEqual(browser().api.usageHeaders()['X-InstaPlaque-Visit'],first['X-InstaPlaque-Visit']);
});
test('response hooks cost <50 ms for AI, proof, email, design request and checkout; detached work cannot reject responses',async()=>{
 const measurements={};
 for(const path of ['/api/gemini/generate-content','/api/proof-sessions','/api/proof-sessions/email','/api/design-requests','/api/stripe/checkout-session']) {
  const times=[];for(let i=0;i<1000;i++){const res=new EventEmitter();res.statusCode=200;const start=performance.now();observeUsage(req,res,path);times.push(performance.now()-start);assert.equal(res.listenerCount('finish'),1);}
  measurements[path]=Math.max(...times);assert.ok(measurements[path]<50);
 }
 console.log('Added response-hook latency, max of 1000 (ms):',JSON.stringify(measurements));
 let resolved=false;const hung=new Promise(()=>{});const start=performance.now();backgroundUsage(()=>hung,()=>{});resolved=true;assert.ok(resolved);assert.ok(performance.now()-start<50);
 await backgroundUsage(()=>{throw Error('database down');},()=>{});
 const res=new EventEmitter();res.statusCode=503;observeUsage(req,res,'/api/proof-sessions');res.emit('finish'); // failed proof must never record
});
test('storage has a real 2-second abort deadline and errors are swallowed by recorder',async()=>{
 const old={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY};process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fake';
 const start=performance.now();
 const keepalive=setTimeout(()=>{},2500);
 await assert.rejects(usageDb('',{},(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)))));
 clearTimeout(keepalive); assert.ok(performance.now()-start<2400);
 if(old.url===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=old.url;if(old.key===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=old.key;
});
test('paid is linked only through checkout and duplicate webhook upserts just once',async()=>{
 const checkout={...serverRow(req,'checkout_start',{order:{id:'PSAI-'+id,totalPence:2500,plaqueState:{}}}),id:1,created_at:'2026-11-08T00:00:00Z'};
 const stored=new Map();const db=async(q,o)=>{if(!o)return [checkout]; assert.equal(q,'?on_conflict=event,order_id'); assert.match(o.headers.Prefer,/ignore-duplicates/);const r=JSON.parse(o.body);stored.set(r.event+r.order_id,r);};
 const event={type:'checkout.session.completed',data:{object:{payment_status:'paid',metadata:{order_id:checkout.order_id},email:'PRIVATE'}}};
 await recordPaid(event,db);await recordPaid(event,db);assert.equal(stored.size,1);const row=[...stored.values()][0];assert.equal(row.visit_id,id);assert.equal(row.details.total_pence,2500);assert.ok(!JSON.stringify(row).includes('PRIVATE'));
 let wrote=false;await recordPaid(event,async(q,o)=>{if(o)wrote=true;return [];});assert.equal(wrote,false);
});
test('London days around BST/GMT; counts distinguish attempt results and unfinished retries',()=>{
 assert.equal(londonDay('2026-10-24T23:30:00Z'),'2026-10-25');assert.equal(londonDay('2026-10-25T23:30:00Z'),'2026-10-25');
 const row=(event,details,time='2026-10-25T12:00:00Z',visit=id)=>({...requestContext(req),visit_id:visit,event,details,created_at:time});
 const rows=[row('designer_open',{}),row('visit',{source:'google_ads',cookie:'rejected'}),row('ai_call',{step:'proofread',operation}),row('ai_call',{step:'layout',operation}),row('layout_result',{kind:'layout',outcome:'shown',operation}),row('ai_call',{step:'layout',operation:'second'}),row('ai_call',{step:'layout',operation:'second'}),row('paid',{total_pence:1200}),row('proof_saved',{source:'pdf-resume-link-trial'},'2026-10-25T13:00:00Z')];
 const summary=summarizeUsage(rows,2,false,new Date('2026-10-25T23:59:00Z'));const d=summary.daily[0];assert.equal(d.day,'2026-10-25');assert.equal(d.ai,1);assert.equal(d.layouts_shown,1);assert.equal(d.unfinished,1);assert.equal(d.paid_pence,1200);assert.equal(d.source.google_ads_shopping,1);assert.equal(d.cookie.rejected,1);assert.equal(summary.recent[0].source,'google_ads');assert.equal(summary.recent[0].cookie,'rejected');
 assert.equal(summarizeUsage(rows,2,true).recent.length,0);
});
test('RLS migration has no public policies; additive single table and paid uniqueness',()=>{
 const sql=fs.readFileSync('supabase/migrations/20261108100000_instaplaque_usage_events.sql','utf8');assert.match(sql,/enable row level security/);assert.match(sql,/revoke all on public.instaplaque_usage_events from public, anon, authenticated/);assert.match(sql,/unique \(event,order_id\)/);assert.ok(!/create policy|pim_|alter table public.orders/i.test(sql));
});
