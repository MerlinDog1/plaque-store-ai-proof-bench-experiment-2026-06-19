// Wrap saved subagent JSON as a synthetic API envelope for offline app validation.
// Does not call any model or modify the public site.
const fs=require('node:fs'),path=require('node:path');
const ids=['21-small-name','32-small-long-name','26-a5-award','37-portrait-history'];
const models=process.argv.slice(2).length?process.argv.slice(2):['sol','luna'];
if(models.some(m=>!['sol','luna'].includes(m)))throw Error('Unknown model');
for(const model of models){
 const dest=`output/sol-luna/${model}-responses`;fs.mkdirSync(dest,{recursive:true});
 for(const id of ids){
 const file=path.join('/home/coding-agent/workspace/projects/instaplaque-model-comparison',model,id+'.json');
 if(!fs.existsSync(file))throw Error('Missing '+file);
 const output=JSON.parse(fs.readFileSync(file));
 if(typeof output.svgContent!=='string'||typeof output.reasoning!=='string')throw Error('Invalid output '+file);
 const response={text:JSON.stringify(output)};
 fs.writeFileSync(`${dest}/${id}-responses.json`,JSON.stringify([{status:200,response,source:`offline-${model}-subagent`}],null,2));
 }
}
