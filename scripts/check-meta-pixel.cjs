const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const js=ts.transpileModule(fs.readFileSync('services/metaPixel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function setup(consent,url='https://instaplaque.co.uk/checkout') { const map=new Map(consent?[['instaplaque-meta-consent',consent]]:[]),scripts=[]; const c={exports:{},URL,location:{href:url},document:{referrer:'',createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},window:{},localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};vm.runInNewContext(js,c);return {c,m:c.exports,scripts}; }
const order={total:95.5,stripeSimulation:{provider:'stripe',mode:'live',checkoutSessionId:'synthetic-session',checkoutUrl:'https://checkout.stripe.com/test'}};
let x=setup();assert.equal(x.m.trackMetaCheckout(order),false);assert.equal(x.scripts.length,0);
x.m.setMetaConsent(true);assert.equal(x.scripts.length,1);assert.equal(x.m.trackMetaCheckout(order),true);assert.equal(x.m.trackMetaCheckout(order),false);
const events=x.c.window.fbq.queue;const checkout=events.find(e=>e[2]==='InitiateCheckout');assert.equal(checkout[1],'2766586460430567');assert.equal(checkout[3].value,95.5);assert.equal(JSON.stringify(events).includes('synthetic-session'),false);
x.m.setMetaConsent(false);assert.equal(x.m.trackMetaCheckout({...order,stripeSimulation:{...order.stripeSimulation,checkoutSessionId:'second'}}),false);
for (const url of ['https://instaplaque.co.uk/proof/private','https://instaplaque.co.uk/?proof=secret','https://instaplaque.co.uk/order/private','https://instaplaque.co.uk/?view=admin']) {x=setup('yes',url);assert.equal(x.m.enableMeta(),false);assert.equal(x.scripts.length,0);}
for(const edit of [{mode:'test'},{provider:'mock'},{checkoutUrl:undefined}]){x=setup('yes');assert.equal(x.m.trackMetaCheckout({...order,stripeSimulation:{...order.stripeSimulation,...edit}}),false);assert.equal(x.scripts.length,0);}
console.log('PASS consent/revocation, exact pixel/value, duplicate suppression, private routes, test/mock/failed checkout exclusions');
