import { AdminIcon } from './AdminIcon';
import React, { useEffect, useState } from 'react';
const money = (p: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(p / 100);
const names: Record<string, string> = { google_ads_shopping: 'Google ads / Shopping', google_ads:'Google ads', google_shopping:'Google Shopping', facebook_instagram_ads: 'Facebook / Instagram', google_organic: 'Google search', direct: 'Direct', other: 'Other', unknown: 'Not received', accepted: 'Accepted', rejected: 'Rejected', none: 'No answer', ai_error: 'AI error', timeout: 'Timed out', rate_limited: 'Too many requests', invalid_reply: 'Invalid reply', did_not_fit: 'Did not fit', cancelled: 'Changed while working' };
const label = (s: string) => names[s] || s.replaceAll('_', ' ');
const journeySteps = ['size', 'material', 'colour', 'fixings', 'backing', 'wording', 'review'];
const dayLabel = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
const chips = (o: Record<string, number>) => Object.entries(o).filter(([,v]) => v > 0).map(([k,v]) => <span className="usage-chip" key={k}>{label(k)} <b>{v}</b></span>);
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
  const sum = (key: keyof Day) => data?.daily.reduce((n, d) => n + (typeof d[key] === 'number' ? d[key] as number : 0), 0) || 0;
  const max = Math.max(1, ...data?.daily.map(d => Math.max(d.designer, d.ai)) || []);
  const metrics = [
    ['Opened designer', sum('designer'), 'visits', 'orders'],
    ['Tried AI', sum('ai'), 'visits', 'usage'],
    ['Layouts shown', sum('layouts_shown'), `${sum('layouts_failed')} failed`, 'check'],
    ['Changes shown', sum('changes_shown'), `${sum('changes_failed')} failed`, 'refresh'],
    ['Proofs saved', sum('proof_saved'), `${sum('proof_pdf')} PDF · ${sum('proof_emailed')} emailed`, 'orders'],
    ['Checkouts', sum('checkouts'), 'started', 'money'],
    ['Paid orders', sum('paid'), money(sum('paid_pence')), 'money'],
  ];
  return <section className="designer-use" aria-label="Designer use">
    <div className="usage-toolbar"><div><h2>Designer activity</h2><p>Last 14 days · London time</p></div><div className="usage-controls"><div className="usage-segment" role="group" aria-label="Visit audience"><button type="button" aria-pressed={!tests} onClick={()=>setTests(false)}>Customers</button><button type="button" aria-pressed={tests} onClick={()=>setTests(true)}>Our tests</button></div><button type="button" className="usage-refresh" onClick={()=>setRefresh(v=>v+1)}><AdminIcon name="refresh" />Refresh</button></div></div>
    <p className={tests ? 'usage-audience is-test' : 'usage-audience'}><span aria-hidden="true">{tests ? '◈' : '●'}</span> {tests ? 'Tests only — not customer totals' : 'Real visits — tests excluded'}<span>Visits, not unique people</span></p>
    {error && <div className="commerce-warning" role="alert"><strong>Counts couldn’t be loaded</strong><p>{error}</p><button type="button" className="usage-refresh" onClick={()=>setRefresh(v=>v+1)}>Try again</button></div>}
    {!data && !error && <div className="admin-skeleton" role="status" aria-label="Loading designer counts"><span className="sr-only">Loading designer counts…</span>{[0,1,2,3].map(i=><div key={i}><i/><i/><i/></div>)}</div>}
    {data && <>
      <div className="usage-metrics">{metrics.map(([title,value,note,icon])=><article key={title}><span><AdminIcon name={String(icon)} />{title}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
      <section className="usage-card usage-chart"><div className="usage-section-heading"><div><h3>Daily activity</h3><p>Designer opens and visits that tried AI</p></div><div className="usage-legend"><span>Opened designer</span><span>Tried AI</span></div></div>
        <svg viewBox="0 0 840 180" role="img" aria-label="Daily designer opens and AI visits over the last 14 days">
          {[0,1,2].map(i=><g key={i}><line x1="28" x2="830" y1={18+i*54} y2={18+i*54} stroke="#e8ece8"/><text x="0" y={22+i*54}>{Math.round(max*(1-i/2))}</text></g>)}
          {data.daily.slice().reverse().map((d,i)=><g key={d.day}><title>{dayLabel(d.day)}: {d.designer} opens, {d.ai} tried AI</title><rect x={36+i*57} y={126-d.designer/max*108} width="16" height={d.designer/max*108} rx="3" fill="#203b32"/><rect x={55+i*57} y={126-d.ai/max*108} width="16" height={d.ai/max*108} rx="3" fill="#6b9784"/><text x={53+i*57} y="151" textAnchor="middle">{new Date(d.day).getUTCDate()}</text></g>)}
        </svg><div className="usage-chart-dates"><span>{data.daily.length ? dayLabel(data.daily[data.daily.length-1].day) : ''}</span><span>{data.daily.length ? dayLabel(data.daily[0].day) : ''}</span></div>
      </section>
      <section className="usage-card"><div className="usage-section-heading"><div><h3>Day by day</h3><p>The whole journey, from a first look to a paid order.</p></div><span className="usage-chip">14 days</span></div>
      <div className="usage-table-wrap" tabIndex={0} aria-label="Daily designer counts, scroll sideways"><table><thead><tr>{['Day','Opened','Tried AI','Layouts','Changes','Unfinished','PDF / email / saved','Checkouts','Paid / revenue'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{data.daily.map(d=><React.Fragment key={d.day}><tr className={d.day === today() ? 'is-today' : ''}><th scope="row">{dayLabel(d.day)}{d.day === today() && <small>Today</small>}</th>{[d.designer,d.ai].map((v,i)=><td className={!v?'is-zero':''} key={i}>{v}</td>)}<td className={!d.layouts_shown && !d.layouts_failed ? 'is-zero' : ''}>{d.layouts_shown}{d.layouts_failed>0&&<small className="usage-failed">{d.layouts_failed} failed</small>}</td><td className={!d.changes_shown && !d.changes_failed ? 'is-zero' : ''}>{d.changes_shown}{d.changes_failed>0&&<small className="usage-failed">{d.changes_failed} failed</small>}</td><td className={!d.unfinished?'is-zero':''}>{d.unfinished}</td><td className={!d.proof_saved && !d.proof_emailed ? 'is-zero' : ''}>{d.proof_pdf} / {d.proof_emailed} / {d.proof_saved}</td><td className={!d.checkouts?'is-zero':''}>{d.checkouts}</td><td className={!d.paid?'is-zero':'usage-paid'}>{d.paid} <small>{money(d.paid_pence)}</small></td></tr>
        {[d.reasons,d.source,d.cookie].some(o=>Object.values(o).some(v=>v>0)) && <tr className="usage-day-context"><td colSpan={9}><details><summary>Day details <span>Sources, cookie choices &amp; failed attempts</span></summary><div>{Object.values(d.reasons).some(v=>v>0)&&<p><strong>Didn’t work</strong>{chips(d.reasons)}</p>}{Object.values(d.source).some(v=>v>0)&&<p><strong>AI visits by source</strong>{chips(d.source)}</p>}{Object.values(d.cookie).some(v=>v>0)&&<p><strong>AI visits by cookie choice</strong>{chips(d.cookie)}</p>}</div></details></td></tr>}</React.Fragment>)}</tbody></table></div></section>
      <section className="usage-card"><div className="usage-section-heading"><div><h3>Recent visits</h3><p>A closer look at the latest 50 visits.</p></div><span className="usage-chip">{data.recent.length} visits</span></div><div className="usage-visits">{data.recent.map((v,i)=><article className="usage-visit" key={i}>
        <div className="usage-visit-place"><span className="usage-device"><AdminIcon name={v.device === 'mobile' ? 'mobile' : 'desktop'} /></span><div><strong>{v.place || 'Place not received'}</strong><time dateTime={v.time}>{new Date(v.time).toLocaleString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · {v.device}</time></div></div>
        <div className="usage-visit-source"><span className="usage-chip">{label(v.source)}</span><small>Cookies: {label(v.cookie)}</small>{tests&&<small>{label(v.test_reason || 'test')}</small>}</div>
        <div className="usage-visit-journey"><span className="usage-step">{label(v.step)}<span className="usage-progress" aria-label={`Furthest step: ${label(v.step)}`}>{journeySteps.map((step,index)=><i key={step} className={index <= journeySteps.indexOf(v.step) ? 'is-complete' : ''} />)}</span></span><small>Layouts {v.layouts_shown} ✓{v.layouts_failed>0 ? ` / ${v.layouts_failed} ✗` : ''} · Changes {v.changes_shown} ✓{v.changes_failed>0 ? ` / ${v.changes_failed} ✗` : ''} · Proofs {v.proof}</small></div>
        <div className="usage-visit-value"><strong className={v.paid_pence>0?'usage-paid':''}>{v.paid_pence>0 ? `${money(v.paid_pence)} paid` : money(v.checkout_pence)}</strong><small>{v.paid_pence>0 ? `Checkout ${money(v.checkout_pence)}` : 'Checkout'}</small></div>
      </article>)}</div>{!data.recent.length&&<div className="admin-console__empty"><strong>No visits recorded in this period.</strong><span>New activity will appear here.</span></div>}</section>
    </>}
    <details className="usage-explainer"><summary>How these numbers work</summary><p>Visits to the designer, not unique people. A reload or a new tab is a new visit. Statistics-off visits are not counted. Times and days are London time.</p><p>Shown means the browser displayed the layout. Unfinished means an AI attempt has no browser result; it may still be running or the page may have closed. PDF counts are saved PDF resume links, not a guarantee the download completed. PDF is included in saved proofs.</p></details>
  </section>;
}
