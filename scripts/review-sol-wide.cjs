// Offline Sol coverage QA. No model or external API calls.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('@playwright/test');
const cases=JSON.parse(fs.readFileSync('scripts/fixtures/medium-size-text-review.json'));
const input=process.env.SOL_INPUT||'../instaplaque-model-comparison/sol-wide';
const baseline=process.env.MEDIUM_RESULTS||'../instaplaque-thinking-ab/output/medium-size-text/results';
const root='output/sol-wide';fs.mkdirSync(root,{recursive:true});
const mode=process.argv[2]||'validate';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
 try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}});
 if(mode==='validate'){
  await page.goto((process.env.APP_URL||'http://127.0.0.1:4203')+'/design');
  const rows=[];const repaired=process.argv.includes('--repairs');
  const dest=path.join(root,repaired?'repair-responses':'first-responses');fs.mkdirSync(dest,{recursive:true});
  for(const c of cases){
   const prompt=fs.readFileSync(path.join(input,c.id+'-prompt.txt'),'utf8');
   const original=JSON.parse(fs.readFileSync(path.join(baseline,c.id+'-responses.json')))[0].request.contents;
   if(prompt!==original)throw Error('Prompt mismatch '+c.id);
   const size=prompt.match(/Available text box: ([\d.]+) × ([\d.]+)/);
   const first=JSON.parse(fs.readFileSync(path.join(input,c.id+'.json')));
   const repairFile=path.join(input,c.id+'-repaired.json');
   const output=repaired&&fs.existsSync(repairFile)?JSON.parse(fs.readFileSync(repairFile)):first;
   const result=await page.evaluate(async({svg,text,box})=>{
    const {validateAuthoredTypographySvg}=await import('/services/geminiService.ts');
    try{validateAuthoredTypographySvg(svg,text,box);return {valid:true}}catch(e){return {valid:false,error:e.message}}
   },{svg:output.svgContent,text:c.text,box:{width:+size[1],height:+size[2]}});
   rows.push({id:c.id,...result});
   const envelope=o=>({status:200,response:{text:JSON.stringify(o)},source:'offline-sol-subagent'});
   fs.writeFileSync(path.join(dest,c.id+'-responses.json'),JSON.stringify(repaired&&fs.existsSync(repairFile)?[envelope(first),envelope(output)]:[envelope(first)],null,2));
  }
  fs.writeFileSync(path.join(root,repaired?'repair-validation.json':'validation.json'),JSON.stringify(rows,null,2));console.log(rows);
 }else if(mode==='sheets'){
  const rows=[];const repaired=process.argv.includes('--repairs');
  for(let start=0;start<cases.length;start+=2){const cards=[];
   for(const c of cases.slice(start,start+2))for(const [label,dir] of [['Gemini MEDIUM — earlier batch',baseline],[repaired?'Sol — after at most one repair':'Sol — fresh first attempt',root+(repaired?'/repaired':'/first')]]){
    const stem=path.join(dir,c.id),r=JSON.parse(fs.readFileSync(stem+'.json'));
    const status=r.error?'TEST ERROR':!r.generated?'NO VALID PROOF':r.fallback?'LOCAL FALLBACK':'MODEL LAYOUT';
    rows.push({id:c.id,model:label,status,outside:r.measurements?.shapeOutside.length,overflow:r.overflow});
    const png=stem+(fs.existsSync(stem+'.png')?'.png':'-error.png');
    cards.push(`<section><h2>${escape(c.id)} · ${c.width} × ${c.height} mm</h2><p>${label} · ${status}</p><img src="data:image/png;base64,${fs.readFileSync(png).toString('base64')}"></section>`);
   }
   await page.setContent(`<style>body{font:17px Arial;background:#eee;color:#233829;margin:16px}main{display:grid;grid-template-columns:1fr 1fr;gap:14px}section{padding:12px;background:white;min-width:0}h2{font-size:18px;margin:0}p{margin:8px 0;font-size:15px;overflow-wrap:anywhere}img{width:100%;height:380px;object-fit:contain}</style><h1>Rectangular etched plaques · identical prompts · sheet ${start/2+1}</h1><main>${cards.join('')}</main>`);
   await page.screenshot({path:root+`/${repaired?'repaired-':''}sheet-${start/2+1}.png`,fullPage:true});
  }
  fs.writeFileSync(root+(repaired?'/repair-visual-summary.json':'/visual-summary.json'),JSON.stringify(rows,null,2));console.log(rows);
 }else throw Error('Unknown mode');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
