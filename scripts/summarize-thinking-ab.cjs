const fs=require('node:fs');const path=require('node:path');
const root='output/thinking-ab';const out=[];
for(const folder of fs.readdirSync(root).filter(n=>/^(low8|low16|medium16|high32)-r[12]$/.test(n))){
 for(const file of fs.readdirSync(path.join(root,folder)).filter(n=>/^\d\d-.*\.json$/.test(n)&&!n.endsWith('-responses.json')&&!n.endsWith('-request.json'))){
 const r=JSON.parse(fs.readFileSync(path.join(root,folder,file)));const calls=r.calls||[];
 out.push({profile:folder,id:r.id,generated:r.generated===true,fallback:!!r.fallback,calls:calls.length,seconds:+(calls.reduce((s,c)=>s+(c.elapsedMs||0),0)/1000).toFixed(1),thoughts:calls.reduce((s,c)=>s+(c.response?.usageMetadata?.thoughtsTokenCount||0),0),output:calls.reduce((s,c)=>s+(c.response?.usageMetadata?.candidatesTokenCount||0),0),http: calls.map(c=>c.status),finish:calls.map(c=>c.response?.candidates?.[0]?.finishReason),outside:r.measurements?.shapeOutside.length,overflow:r.overflow,error:r.error});
 }
}
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(out,null,2));for(const r of out)console.log(JSON.stringify(r));
