const fs=require('node:fs');const {chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});try{
const page=await browser.newPage();await page.goto('http://127.0.0.1:4201/design');const rows=[];
for(const model of ['sol','luna'])for(const id of ['21-small-name','32-small-long-name','26-a5-award','37-portrait-history']){
 const folder='/home/coding-agent/workspace/projects/instaplaque-model-comparison/'+model;
 const prompt=fs.readFileSync(folder+'/'+id+'-prompt.txt','utf8');const size=prompt.match(/Available text box: ([\d.]+) × ([\d.]+)/);
 const fixtures=JSON.parse(fs.readFileSync('scripts/fixtures/medium-size-text-review.json'));const text=fixtures.find(c=>c.id===id).text;
 const suffix=process.argv.includes('--repairs') && model==='luna' && ['21-small-name','26-a5-award'].includes(id)?'-repaired':'';
 const output=JSON.parse(fs.readFileSync(folder+'/'+id+suffix+'.json'));
 const result=await page.evaluate(async({svg,text,box})=>{const {validateAuthoredTypographySvg}=await import('/services/geminiService.ts');try{validateAuthoredTypographySvg(svg,text,box);return {valid:true}}catch(e){return {valid:false,error:e.message}}},{svg:output.svgContent,text,box:{width:Number(size[1]),height:Number(size[2])}});
 rows.push({model,id,...result});
}
fs.writeFileSync('output/sol-luna/'+(process.argv.includes('--repairs')?'repair-validation':'validation')+'.json',JSON.stringify(rows,null,2));console.log(rows);
}finally{await browser.close()}})();
