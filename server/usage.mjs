import { waitUntil } from '@vercel/functions';
export const TABLE = 'instaplaque_usage_events';
export const STEPS = ['size', 'material', 'colour', 'fixings', 'backing', 'wording', 'review'];
const SOURCES = ['google_ads','google_shopping','facebook_instagram_ads','google_organic','direct','other'];
const REASONS = ['ai_error','timeout','rate_limited','invalid_reply','did_not_fit','cancelled','other'];
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const keysOnly = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).every(k => keys.includes(k));
const invalid = () => { throw Object.assign(new Error('Invalid usage event.'), { statusCode: 400 }); };
export function parseUsage(raw) {
  if (Buffer.byteLength(raw) > 2048) throw Object.assign(new Error('Usage event too large.'), {statusCode:413});
  let p; try { p = JSON.parse(raw); } catch { return invalid(); }
  if (!keysOnly(p, ['visitId','event','source','campaign','cookie','internal','taggedTest','details']) || !uuid(p.visitId)
    || !SOURCES.includes(p.source) || !['accepted','rejected','none'].includes(p.cookie)
    || typeof p.internal !== 'boolean' || typeof p.taggedTest !== 'boolean'
    || typeof p.campaign !== 'string' || (p.campaign !== '' && !/^[a-zA-Z0-9 _.-]{1,80}$/.test(p.campaign))) return invalid();
  const d = p.details;
  if (['visit','designer_open'].includes(p.event)) { if (!keysOnly(d, []) ) return invalid(); }
  else if (p.event === 'designer_step') { if (!keysOnly(d, ['step']) || !STEPS.includes(d.step)) return invalid(); }
  else if (p.event === 'layout_result') {
    if (!keysOnly(d, ['kind','outcome','reason','seconds','operation']) || !['layout','change'].includes(d.kind) || !['shown','failed'].includes(d.outcome)
      || (d.operation !== undefined && !uuid(d.operation)) || !Number.isInteger(d.seconds) || d.seconds < 0 || d.seconds > 600 || (d.outcome === 'failed' ? !REASONS.includes(d.reason) : d.reason !== undefined)) return invalid();
  } else return invalid();
  return p;
}
const geo = value => { try { return decodeURIComponent(String(value || '')).replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0,80); } catch { return ''; } };
export function requestContext(req, env = process.env, browser) {
  const h = req.headers || {};
  const visit = browser?.visitId || h['x-instaplaque-visit'];
  // Absence is the Statistics-off signal. Never infer or mint a visit server-side.
  if (!uuid(visit)) return null;
  const host = String(h.host || '').split(':')[0].toLowerCase();
  const site = ['instaplaque.co.uk','www.instaplaque.co.uk'].includes(host) ? 'live' : ['localhost','127.0.0.1','['].includes(host) ? 'local' : 'preview';
  const internal = browser?.internal === true || h['x-instaplaque-internal'] === '1';
  const ip = String(h['x-vercel-forwarded-for'] || h['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const ipTest = (env.USAGE_INTERNAL_IPS || '').split(',').map(x=>x.trim()).filter(Boolean).includes(ip);
  const tagged = browser?.taggedTest === true || h['x-instaplaque-test'] === '1';
  const ua = String(h['user-agent'] || '');
  const device = /ipad|tablet|android(?!.*mobile)/i.test(ua) ? 'tablet' : /iphone|mobile/i.test(ua) ? 'phone' : ua ? 'desktop' : 'unknown';
  return { visit_id: visit, site, deployment: `${['production','preview','development'].includes(env.VERCEL_ENV) ? env.VERCEL_ENV : 'local'}:${/^[a-f0-9]{7,40}$/i.test(env.VERCEL_GIT_COMMIT_SHA || '') ? env.VERCEL_GIT_COMMIT_SHA.slice(0,8) : 'unknown'}`,
    device, country:geo(h['x-vercel-ip-country']), region:geo(h['x-vercel-ip-country-region']), town:geo(h['x-vercel-ip-city']),
    internal, test: site !== 'live' || internal || ipTest || tagged,
    test_reason: site !== 'live' ? site : internal ? 'internal_browser' : ipTest ? 'internal_ip' : tagged ? 'tagged_test' : null };
}
export function browserRow(req, payload, env) {
  const context = requestContext(req, env, payload);
  return { ...context, event:payload.event, details: { ...payload.details, source:payload.source, campaign:payload.campaign, cookie:payload.cookie } };
}
export function serverRow(req, event, data = {}, env) {
  const context = requestContext(req, env);
  if (!context) return null;
  let details = {};
  let order_id = null;
  if (event === 'ai_call') {
    const status = Number(data.status);
    const step = req.headers['x-instaplaque-step'];
    details = { operation:uuid(req.headers['x-instaplaque-operation']) ? req.headers['x-instaplaque-operation'] : null, step:['proofread','layout','change'].includes(step) ? step : 'other', status, ok:status >= 200 && status < 300,
      duration_ms:Math.min(600000,Math.max(0,Math.round(data.duration_ms || 0))), rate_limited:status===429,
      error_code:status < 400 ? null : status===429 ? 'rate_limited' : status===504 ? 'timeout' : status===400 ? 'invalid_request' : status===403 ? 'forbidden' : 'ai_error' };
  } else if (event === 'checkout_start') {
    const order = data.order;
    if (!order || !/^[A-Za-z0-9_-]{1,80}$/.test(order.id || '')) return null;
    order_id = order.id;
    const p = order.plaqueState || {};
    details = { total_pence:Math.max(0,Math.round(order.totalPence || 0)),
      material:['brushed-brass','polished-brass','brushed-stainless','polished-stainless','orbital-brass-matt-lacquer','aged-brass'].includes(p.material) ? p.material : 'other',
      width:Number.isFinite(p.width) ? Math.min(2000,Math.max(0,p.width)) : 0, height:Number.isFinite(p.height) ? Math.min(2000,Math.max(0,p.height)) : 0 };
    if (data.sandboxTest || data.liveTest) { context.test = true; context.test_reason = data.liveTest ? 'admin_live_test' : 'admin_sandbox'; }
  } else if (event === 'proof_saved') {
    details = { source:['pdf-resume-link-trial'].includes(data.source) ? data.source : 'other', kind:['pdf','saved','draft'].includes(data.kind) ? data.kind : 'saved' };
  } else if (!['proof_emailed','design_request'].includes(event)) return null;
  return {...context,event,order_id,details};
}
// Separate REST client: every request is abortable, no SDK retries, no credentials in logs.
export async function usageDb(query = '', options = {}, fetcher = fetch) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Usage storage unavailable.');
  const response = await fetcher(`${url}/rest/v1/${TABLE}${query}`, { ...options,
    headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers}, signal:AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error('Usage storage unavailable.');
  const text = await response.text(); return text ? JSON.parse(text) : null;
}
let cleanedAt = 0;
export async function retainUsage(db = usageDb, now = Date.now()) {
  if (now - cleanedAt < 3600000) return;
  cleanedAt = now;
  const cutoff = new Date(now); cutoff.setUTCMonth(cutoff.getUTCMonth() - 13);
  await db(`?created_at=lt.${encodeURIComponent(cutoff.toISOString())}`, {method:'DELETE'});
}
export function backgroundUsage(work, lifetime = waitUntil) {
  // Start only in the next microtask, always detached from the response path.
  const promise = Promise.resolve().then(work).catch(() => { console.warn('Usage count unavailable.'); });
  try { lifetime(promise); } catch { /* Local server has no Vercel request context. */ }
  return promise;
}
export function recordUsage(row, db = usageDb) {
  if (!row) return;
  return backgroundUsage(async () => {
    await db('', {method:'POST',body:JSON.stringify(row),headers:{Prefer:'return=minimal'}});
    await retainUsage(db);
  });
}
export function observeUsage(req, res, path, now = performance.now()) {
  const events = {'/api/gemini/generate-content':'ai_call','/api/proof-sessions':'proof_saved','/api/proof-sessions/email':'proof_emailed',
    '/api/design-requests':'design_request','/api/stripe/checkout-session':'checkout_start'};
  if (req.method !== 'POST' || !events[path] || !requestContext(req)) return;
  res.once('finish', () => {
    if (events[path] !== 'ai_call' && (res.statusCode < 200 || res.statusCode >= 300)) return;
    recordUsage(serverRow(req,events[path],{...res.usageData,status:res.statusCode,duration_ms:performance.now()-now}));
  });
}
export function recordPaid(event, db = usageDb) {
  if (!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event?.type) || event.data?.object?.payment_status !== 'paid') return;
  const orderId = event.data.object.metadata?.order_id;
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(orderId || '')) return;
  return backgroundUsage(async () => {
    const rows = await db(`?event=eq.checkout_start&order_id=eq.${encodeURIComponent(orderId)}&limit=1`);
    if (!rows?.length) return; // No visit (including Statistics-off) means no paid count.
    const {id,created_at,...checkout} = rows[0];
    await db('?on_conflict=event,order_id', {method:'POST', headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},
      body:JSON.stringify({...checkout,event:'paid',details:{total_pence:checkout.details.total_pence}})});
  });
}
export const londonDay = date => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
export function summarizeUsage(rows, days = 14, tests = false, now = new Date()) {
  rows = rows.filter(r=>Boolean(r.test) === tests);
  const noon = Date.parse(londonDay(now) + 'T12:00:00Z');
  const dates = Array.from({length:days},(_,i)=>new Date(noon-i*86400000).toISOString().slice(0,10));
  const daily = dates.map(day=> {
    const items = rows.filter(r=>londonDay(r.created_at)===day);
    const count = event => items.filter(r=>r.event===event).length;
    const users = event => new Set(items.filter(r=>r.event===event).map(r=>r.visit_id)).size;
    const result = (kind,outcome) => items.filter(r=>r.event==='layout_result' && r.details.kind===kind && r.details.outcome===outcome).length;
    const aiVisits = new Set(items.filter(r=>r.event==='ai_call').map(r=>r.visit_id));
    const source={},cookie={},reasons={};
    for (const id of aiVisits) {
      const context = rows.filter(r=>r.visit_id===id && r.details.cookie).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0]?.details || {};
      const s = ['google_ads','google_shopping'].includes(context.source) ? 'google_ads_shopping' : context.source || 'unknown';
      source[s]=(source[s]||0)+1; cookie[context.cookie||'unknown']=(cookie[context.cookie||'unknown']||0)+1;
    }
    for (const r of items.filter(r=>r.event==='layout_result' && r.details.outcome==='failed')) reasons[r.details.reason]=(reasons[r.details.reason]||0)+1;
    // A visit/kind without any result is unfinished. Calls include validation retries;
    // never subtract raw request counts and mistake a retry for a second layout.
    const unfinished = ['layout','change'].reduce((n,kind)=>n+new Set(items.filter(r=>r.event==='ai_call' && (kind==='layout' ? ['proofread','layout'].includes(r.details.step) : r.details.step==='change')
      && !rows.some(x=>x.visit_id===r.visit_id && (r.details.operation ? x.details.operation===r.details.operation : true) && x.event==='layout_result' && x.details.kind===kind)).map(r=>r.details.operation || r.visit_id)).size,0);
    return {day,designer:users('designer_open'),ai:aiVisits.size,layouts_shown:result('layout','shown'),layouts_failed:result('layout','failed'),changes_shown:result('change','shown'),changes_failed:result('change','failed'),unfinished,
      reasons,proof_pdf:items.filter(r=>r.event==='proof_saved'&&r.details.source==='pdf-resume-link-trial').length,proof_saved:count('proof_saved'),proof_emailed:count('proof_emailed'),checkouts:count('checkout_start'),paid:count('paid'),paid_pence:items.filter(r=>r.event==='paid').reduce((n,r)=>n+(r.details.total_pence||0),0),source,cookie};
  });
  const recent = [...new Set([...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(r=>r.visit_id))].slice(0,50).map(id=> {
    const items = rows.filter(r=>r.visit_id===id).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    const first = items[0], ctx=items.findLast(r=>r.details.cookie)?.details||{};
    const count = (kind,outcome) => items.filter(r=>r.event==='layout_result'&&r.details.kind===kind&&r.details.outcome===outcome).length;
    return {time:first.created_at,place:[first.town,first.region,first.country].filter(Boolean).join(', ')||'Unknown',device:first.device,source:ctx.source||'unknown',cookie:ctx.cookie||'unknown',
      step:STEPS.filter(s=>items.some(r=>r.event==='designer_step'&&r.details.step===s)).at(-1)||'—',layouts_shown:count('layout','shown'),layouts_failed:count('layout','failed'),changes_shown:count('change','shown'),changes_failed:count('change','failed'),proof:items.filter(r=>['proof_saved','proof_emailed'].includes(r.event)).length,
      checkout_pence:items.filter(r=>r.event==='checkout_start').reduce((n,r)=>n+(r.details.total_pence||0),0),paid_pence:items.filter(r=>r.event==='paid').reduce((n,r)=>n+(r.details.total_pence||0),0),test_reason:first.test_reason};
  });
  return {daily,recent,tests};
}
export async function readUsage(days, tests) {
  // Keyset pages avoid Supabase's default 1,000-row truncation.
  const since = new Date(Date.now()-(days+1)*86400000).toISOString();
  const rows=[]; let last=0;
  for (;;) {
    const page=await usageDb(`?created_at=gte.${encodeURIComponent(since)}&test=eq.${tests}&id=gt.${last}&order=id.asc&limit=1000`);
    rows.push(...page); if(page.length<1000) break; last=page.at(-1).id;
  }
  backgroundUsage(()=>retainUsage());
  return summarizeUsage(rows,days,tests);
}
