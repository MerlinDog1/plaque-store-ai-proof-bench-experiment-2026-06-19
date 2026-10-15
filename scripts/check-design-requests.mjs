import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { submitDesignRequest, validateDesignRequest, MAX_DESIGN_REQUEST_BYTES } from '../server/designRequests.mjs';
const payload = {requestId:randomUUID(),name:'Test Customer',email:'customer@example.test',size:'150 × 50 mm',shape:'Rectangle',material:'Brushed brass',wood:'No wood backing',fixing:'Screw holes',wording:'IN MEMORY\nALICE & BOB',notes:'<script>not HTML</script>',use:'Garden bench',website:''};
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const full = {...payload,attachment:{type:'image/png',content:png}};
let sent=[];
const fakeSend=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent.push(options);return Response.json({id:'synthetic-provider-id'});};
const options={env:{RESEND_API_KEY:'synthetic-test-key'},recipients:['owner@example.test'],fetchImpl:fakeSend};
const first=await submitDesignRequest(full,options);
assert.ok(first.ok && first.reference.startsWith('IP-DESIGN-'));
assert.equal(JSON.parse(sent[0].body).reply_to,payload.email);
assert.deepEqual(JSON.parse(sent[0].body).to,['owner@example.test']);
assert.ok(JSON.parse(sent[0].body).text.includes(payload.wording));
assert.equal(JSON.parse(sent[0].body).html,undefined,'User content is plain text, never HTML');
assert.equal(JSON.parse(sent[0].body).attachments[0].content,png);
await submitDesignRequest(full,options);
assert.equal(sent[0].headers['Idempotency-Key'],sent[1].headers['Idempotency-Key']);
await submitDesignRequest({...full,notes:'Changed brief'},options);
assert.notEqual(sent[0].headers['Idempotency-Key'],sent[2].headers['Idempotency-Key']);
for (const change of [{email:'bad\r\nBcc:bad@example.test'},{wording:' '},{size:'x'.repeat(101)},{website:'bot'},{to:'external@example.test'},{attachment:{type:'image/png',content:Buffer.from('<svg/>').toString('base64')}},{attachment:{type:'image/jpeg',content:png}},{requestId:'bad'}]) {
 assert.throws(()=>validateDesignRequest({...full,...change}));
}
await assert.rejects(submitDesignRequest(full,{...options,env:{}}),e=>e.statusCode===503);
await assert.rejects(submitDesignRequest(full,{...options,recipients:[]}),e=>e.statusCode===503);
for(const fake of [async()=>Response.json({message:'PRIVATE PROVIDER DETAIL'},{status:500}),async()=>Response.json({}),async()=>{throw Error('secret network details');}]) {
 await assert.rejects(submitDesignRequest(full,{...options,fetchImpl:fake}),e=>e.statusCode===502&&!e.message.includes('PRIVATE')&&!e.message.includes('secret'));
}
// Exercise actual server routing, guards, body limits and success handling without external mail/DB calls.
process.env.VERCEL='1'; process.env.RESEND_API_KEY='synthetic-test-key'; process.env.ORDER_ADMIN_EMAIL='owner@example.test';
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails','No other provider or database may be contacted');return fakeSend(url,options);};
const {handleRequest}=await import('../server.mjs');
const server=http.createServer(handleRequest);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let ip=1;
const post=async(body,headers={})=>realFetch(base+'/api/design-requests',{method:'POST',headers:{'content-type':'application/json',origin:base.replace('http:','https:'),'sec-fetch-site':'same-origin','x-vercel-forwarded-for':`192.0.2.${ip++}`,...headers},body:typeof body==='string'?body:JSON.stringify(body)});
try {
 const accepted=await post(full);assert.equal(accepted.status,201);assert.equal((await accepted.json()).reference,first.reference);
 assert.equal((await post(full,{origin:'https://elsewhere.test'})).status,403);
 assert.equal((await post(full,{'content-type':'text/plain'})).status,403);
 assert.equal((await post('{')).status,400);
 assert.equal((await post({})).status,400);
 assert.equal((await post('x'.repeat(MAX_DESIGN_REQUEST_BYTES+1))).status,413);
 assert.equal((await realFetch(base+'/api/design-requests')).status,405);
 for(let n=0;n<5;n++) assert.equal((await post(payload,{'x-vercel-forwarded-for':'198.51.100.1'})).status,201);
 assert.equal((await post(payload,{'x-vercel-forwarded-for':'198.51.100.1'})).status,429);
} finally {await new Promise(resolve=>server.close(resolve));globalThis.fetch=realFetch;}
console.log('Design request validation, attachment, provider failure, idempotency, real HTTP origin/rate/body/method checks passed. No real emails or database writes.');
