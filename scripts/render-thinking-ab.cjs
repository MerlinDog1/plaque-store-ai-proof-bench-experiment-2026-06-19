const fs=require('node:fs');const {chromium}=require('@playwright/test');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});try{const p=await b.newPage({viewport:{width:1800,height:1200}});
for(const id of ['21-small-name','23-bench-poem','26-a5-award','27-a4-history']){
const cells=[];
for(const round of [1,2])for(const profile of ['low8','low16','medium16','high32']){
const stem=`output/thinking-ab/${profile}-r${round}/${id}`;let body='Not recorded';
if(fs.existsSync(stem+'.json')){const r=JSON.parse(fs.readFileSync(stem+'.json'));const pic=fs.existsSync(stem+'.png')?`<img src="data:image/png;base64,${fs.readFileSync(stem+'.png').toString('base64')}">`:'';body=`<b>${r.generated?(r.fallback?'LOCAL FALLBACK':'AI layout'):'NO VALID PROOF'}</b>${pic}`;}
cells.push(`<section><h2>${profile.toUpperCase()} · round ${round}${profile==='high32'&&round===2?' · 120s test limit':''}</h2>${body}</section>`);
}
await p.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:18px;font:18px Arial;background:#eef0e9;color:#203b2c}h1{margin:0 0 14px;font-size:28px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}section{background:#fafbf5;padding:10px;border:1px solid #bdc7b5}h2{font-size:18px;margin:0 0 8px}img{display:block;width:100%;height:490px;object-fit:contain}</style><h1>Thinking/output-budget comparison — ${id}</h1><div class=grid>${cells.join('')}</div>`);
await p.screenshot({path:`output/thinking-ab/${id}-comparison.png`,fullPage:true});
}
}finally{await b.close()}})();
