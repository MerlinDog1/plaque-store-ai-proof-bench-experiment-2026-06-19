// Offline contact sheets and measurements; never makes model requests.
const fs=require('node:fs');const {chromium}=require('@playwright/test');
const root='output/medium-size-text',out=root+'/results';
const cases=JSON.parse(fs.readFileSync('scripts/fixtures/medium-size-text-review.json'));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),rows=[];
 for(let start=0;start<cases.length;start+=4){const cards=[];
 for(const c of cases.slice(start,start+4)){
 const stem=out+'/'+c.id;if(!fs.existsSync(stem+'.json'))continue;
 const r=JSON.parse(fs.readFileSync(stem+'.json'));
 const status=r.error?'TEST ERROR':!r.generated?'NO VALID PROOF':r.fallback?'LOCAL FALLBACK':'AI';
 const row={id:c.id,size:`${c.width} × ${c.height}`,status,calls:r.calls.length,seconds:r.calls.reduce((n,x)=>n+(x.elapsedMs||0),0)/1000,outside:r.measurements?.shapeOutside?.length,overflow:r.overflow,error:r.error};rows.push(row);
 const png=fs.existsSync(stem+'.png')?stem+'.png':stem+'-error.png';
 cards.push(`<section><h2>${c.id}</h2><p>${row.size} mm · ${c.fixing} · ${status} · ${row.calls} calls</p><img src="data:image/png;base64,${fs.readFileSync(png).toString('base64')}"></section>`);
 }
 await page.setContent(`<style>body{background:#eee;font:17px Arial;color:#233829;margin:15px}main{display:grid;grid-template-columns:1fr 1fr;gap:14px}section{background:white;padding:12px}h2{font-size:20px;margin:0}p{margin:8px 0}img{width:100%;height:410px;object-fit:contain}</style><h1>MEDIUM · rectangular etched plaques · batch ${start/4+1}</h1><main>${cards.join('')}</main>`);
 await page.screenshot({path:root+`/sheet-${start/4+1}.png`,fullPage:true});
 }
 fs.writeFileSync(root+'/summary.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
