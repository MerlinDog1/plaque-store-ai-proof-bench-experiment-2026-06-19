// Offline screenshots only: model outputs have already passed through the app.
const fs=require('node:fs');const {chromium}=require('@playwright/test');
const ids=['21-small-name','32-small-long-name','26-a5-award','37-portrait-history'];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});try{
const page=await browser.newPage({viewport:{width:1800,height:800}});const summary=[];
for(const id of ids){let cells=[];
for(const model of ['live','sol','luna']){
const repaired=process.argv.includes('--repairs') && model==='luna' && ['21-small-name','26-a5-award'].includes(id);
const stem=`output/sol-luna/${repaired?'luna-repaired':model}/${id}`,r=JSON.parse(fs.readFileSync(stem+'.json'));
const status=r.error?'HARNESS ERROR':!r.generated?'NO VALID PROOF':r.fallback?'LOCAL FALLBACK — NOT MODEL DESIGN':'VALID MODEL LAYOUT';
summary.push({id,model,status,calls:r.calls.length,outside:r.measurements?.shapeOutside?.length,overflow:r.overflow});
cells.push(`<section><h2>${model.toUpperCase()}${repaired?' · after one repair':''}</h2><p>${status}</p><img src="data:image/png;base64,${fs.readFileSync(stem+'.png').toString('base64')}"></section>`);
}
await page.setContent(`<style>body{font:18px Arial;background:#eee;color:#243b2d;padding:15px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}section{background:#fff;padding:12px}h2{margin:0}img{width:100%;height:600px;object-fit:contain}</style><h1>Same prompt, same plaque — ${id}</h1><main>${cells.join('')}</main>`);
await page.screenshot({path:`output/sol-luna/${id}-${process.argv.includes('--repairs')?'after-repair-':''}comparison.png`,fullPage:true});
}
fs.writeFileSync('output/sol-luna/'+(process.argv.includes('--repairs')?'after-repair-summary':'summary')+'.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
