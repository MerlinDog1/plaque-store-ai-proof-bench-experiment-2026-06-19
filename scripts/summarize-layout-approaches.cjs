const fs=require('node:fs');
const path=require('node:path');
const root=process.argv[2]||'output/approaches';
for(const approach of ['baseline','readable','proportioned']){
 const folder=path.join(root,approach);if(!fs.existsSync(folder))continue;
 for(const name of fs.readdirSync(folder).filter(n=>/^\d\d-.*\.json$/.test(n)&&!n.endsWith('-responses.json'))){
 const r=JSON.parse(fs.readFileSync(path.join(folder,name)));const m=r.measurements;
 console.log(JSON.stringify({approach,id:r.id,generated:r.generated,calls:r.calls.length,fallback:r.fallback,error:r.error,shapeEscapes:m?.shapeOutside.length,overflow:r.overflow,blockHeightFraction:m?+(m.bounds.h/m.fit[1]).toFixed(2):null}));
 }
}
