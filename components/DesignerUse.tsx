import React, { useEffect, useState } from 'react';
const money = (p: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(p / 100);
const names: Record<string, string> = { google_ads_shopping: 'Google ads / Shopping', google_ads:'Google ads', google_shopping:'Google Shopping', facebook_instagram_ads: 'Facebook / Instagram', google_organic: 'Google search', direct: 'Direct', other: 'Other', unknown: 'Not received', accepted: 'Accepted', rejected: 'Rejected', none: 'No answer', ai_error: 'AI error', timeout: 'Timed out', rate_limited: 'Too many requests', invalid_reply: 'Invalid reply', did_not_fit: 'Did not fit', cancelled: 'Changed while working' };
const label = (s: string) => names[s] || s.replaceAll('_', ' ');
const split = (o: Record<string, number>) => Object.entries(o).map(([k,v])=>`${label(k)}: ${v}`).join(' · ') || '—';
type Day = { day:string; designer:number; ai:number; layouts_shown:number; layouts_failed:number; changes_shown:number; changes_failed:number; unfinished:number; reasons:Record<string,number>; proof_pdf:number; proof_saved:number; proof_emailed:number; checkouts:number; paid:number; paid_pence:number; source:Record<string,number>; cookie:Record<string,number> };
type Visit = {time:string;place:string;device:string;source:string;cookie:string;step:string;layouts_shown:number;layouts_failed:number;changes_shown:number;changes_failed:number;proof:number;checkout_pence:number;paid_pence:number;test_reason:string};
export default function DesignerUse() {
  const [tests,setTests] = useState(false);
  const [data,setData] = useState<{daily:Day[];recent:Visit[]} | null>(null);
  const [error,setError] = useState('');
  const [refresh,setRefresh] = useState(0);
  useEffect(()=> {
    const controller = new AbortController(); setData(null); setError('');
    fetch(`/api/admin/usage?days=14&tests=${tests ? 1 : 0}`,{credentials:'same-origin',cache:'no-store',signal:controller.signal})
      .then(async r=> {const body=await r.json(); if(!r.ok) throw new Error(body.error || 'Could not load counts.'); return body;})
      .then(setData).catch(e=> {if(!controller.signal.aborted) setError(e.message);});
    return ()=>controller.abort();
  },[tests,refresh]);
  return <section className="designer-use" aria-label="Designer use">
    <h2>Designer use</h2>
    <p>Visits to the designer, not unique people. A reload or a new tab is a new visit. Statistics-off visits are not counted. Times and days are London time.</p>
    <label><input type="checkbox" checked={tests} onChange={e=>setTests(e.target.checked)}/> Show only our tests, internal browsers and previews</label>{' '}
    <button type="button" onClick={()=>setRefresh(v=>v+1)}>Refresh</button>
    <h3>{tests ? 'Tests only — not customer totals' : 'Real visits — tests excluded'}</h3>
    {error && <p role="alert">{error}</p>}{!data && !error && <p>Loading designer counts…</p>}
    {data && <>
      <p>Shown means the browser displayed the layout. Unfinished means an AI attempt has no browser result; it may still be running or the page may have closed. PDF counts are saved PDF resume links, not a guarantee the download completed. PDF is included in saved proofs.</p>
      <div style={{overflowX:'auto'}} tabIndex={0} aria-label="Daily designer counts, scroll sideways">
      <table style={{minWidth:900,width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Day','Opened designer','Tried AI','Layouts shown / failed','Changes shown / failed','Unfinished','PDF / emailed / saved','Checkouts','Paid orders / £'].map(h=><th key={h} style={{padding:8,textAlign:'left'}}>{h}</th>)}</tr></thead>
        <tbody>{data.daily.map(d=><React.Fragment key={d.day}><tr>{[d.day,d.designer,d.ai,`${d.layouts_shown} / ${d.layouts_failed}`,`${d.changes_shown} / ${d.changes_failed}`,d.unfinished,`${d.proof_pdf} / ${d.proof_emailed} / ${d.proof_saved}`,d.checkouts,`${d.paid} / ${money(d.paid_pence)}`].map((v,i)=><td key={i} style={{padding:8,borderTop:'1px solid #ddd'}}>{v}</td>)}</tr>
        <tr><td colSpan={9} style={{padding:'0 8px 12px',fontSize:13}}><strong>Didn’t work:</strong> {split(d.reasons)}<br/><strong>AI visits by source:</strong> {split(d.source)}<br/><strong>AI visits by cookie choice:</strong> {split(d.cookie)}</td></tr></React.Fragment>)}</tbody></table>
      </div>
      <h3>Recent visits (latest 50)</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:12}}>{data.recent.map((v,i)=><article key={i} style={{padding:16,border:'1px solid #ddd',borderRadius:10}}>
        <strong>{new Date(v.time).toLocaleString('en-GB',{timeZone:'Europe/London'})}</strong><p>{v.place} · {v.device}<br/>{label(v.source)} · Cookies: {label(v.cookie)}<br/>Furthest step: {label(v.step)}</p>
        <p>Layouts: {v.layouts_shown} shown / {v.layouts_failed} failed<br/>Changes: {v.changes_shown} shown / {v.changes_failed} failed<br/>Proofs: {v.proof}<br/>Checkout: {money(v.checkout_pence)} · Paid: {money(v.paid_pence)}</p>
        {tests && <small>{label(v.test_reason || 'test')}</small>}
      </article>)}</div>{!data.recent.length && <p>No visits recorded in this period.</p>}
    </>}
  </section>;
}
