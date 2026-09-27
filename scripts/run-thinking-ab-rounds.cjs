// Explicit bounded test sequence, not a scheduled job. Requires owner-authorised live API use.
const fs=require('node:fs');const {spawn}=require('node:child_process');
if(process.env.LIVE_LAYOUT_QA!=='true')throw Error('Set LIVE_LAYOUT_QA=true');
const profiles=JSON.parse(fs.readFileSync('output/thinking-ab/deployments.json'));
const rounds=process.argv.slice(2);
(async()=>{for(const round of rounds){
 if(!/^(low8|low16|medium16|high32)-r[12]$/.test(round))throw Error('Invalid round');
 const profile=round.replace(/-r[12]$/,'');
 const out='output/thinking-ab/'+round;
 if(fs.existsSync(out+'/summary.json'))throw Error('Refusing to repeat completed '+round);
 console.log('START ROUND',round);
 await new Promise((resolve,reject)=>{
 const p=spawn(process.execPath,['scripts/check-layout-quality.cjs'],{stdio:'inherit',env:{...process.env,QA_APPROACH:'baseline',QA_CASE_FILE:'scripts/fixtures/regular-etched-layouts.json',CASE_IDS:'21-small-name,23-bench-poem,26-a5-award,27-a4-history',QA_PROTECTED:'true',QA_API_URL:profiles[profile].url,QA_OUT:out}});
 p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(round+' exited '+code)));
 });
}})().catch(e=>{console.error(e);process.exitCode=1});
