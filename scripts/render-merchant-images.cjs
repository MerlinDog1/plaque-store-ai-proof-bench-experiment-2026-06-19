// Reproducible product illustrations using the actual designer, not generated photos.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
(async () => {
  const { merchantOffers } = await import('../services/merchantCatalogue.mjs');
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/opt/google/chrome/chrome', args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1500,height:1500},deviceScaleFactor:1});
  await page.route('**/api/**', r => r.abort());
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:4210');
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const rootModule = await import('/node_modules/.vite/deps/react-dom_client.js');
    const createRoot = rootModule.createRoot || rootModule.default.createRoot;
    const {default: Preview} = await import('/components/PlaquePreview.tsx');
    const {INITIAL_STATE} = await import('/types.ts');
    document.body.innerHTML = '<div id="merchant-render"></div>';
    const root = createRoot(document.getElementById('merchant-render'));
    window.renderMerchant = preset => {
      const svg = '<g><text x="150" y="20" text-anchor="middle" font-family="Georgia" font-size="14">In loving memory of</text><text x="150" y="55" text-anchor="middle" font-family="Georgia" font-size="25" font-weight="bold">ALEX MORGAN</text><text x="150" y="86" text-anchor="middle" font-family="Georgia" font-size="14">Forever in our hearts</text></g>';
      root.render(React.createElement(Preview, {key:JSON.stringify(preset),state:{...INITIAL_STATE,...preset,generatedSvgContent:svg},activeStep:6,inscription:'In loving memory of\nALEX MORGAN\nForever in our hearts'}));
    };
  });
  await page.addStyleTag({content:'html,body{margin:0!important;background:white!important;width:1500px!important;height:1500px!important;overflow:hidden!important}#merchant-render{width:1500px;height:1500px;display:flex;align-items:center;justify-content:center}.print-content{width:1360px!important;height:1360px!important;max-height:none!important;border:0!important;background:white!important;padding:0!important;box-shadow:none!important;border-radius:0!important;aspect-ratio:auto!important}.print-content>.pointer-events-none,.designer-preview-tools{display:none!important}.proof-preview-viewport,.proof-preview-scale{width:100%!important;height:100%!important;max-height:none!important;background:transparent!important;overflow:visible!important;transition:none!important}svg{transition:none!important}.proof-canvas::after,.proof-canvas::before{display:none!important}'});
  fs.mkdirSync('public/site-images/merchant',{recursive:true});
  const report = [];
  for (const offer of merchantOffers.filter(x=>x.imageKind==='render')) {
    await page.evaluate(preset=>window.renderMerchant(preset),offer.preset);
    await page.waitForTimeout(100);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('svg image')].map(el=>new Promise(resolve=>{const image=new Image();image.onload=image.onerror=resolve;image.src=el.getAttribute('href')})))});
    const measurement=await page.evaluate(()=>{
      const texts=[...document.querySelectorAll('#ai-text-layer text')];
      return {wording:texts.map(t=>t.textContent).join('|'),hardware:document.querySelectorAll('.fixing').length,bounds:(()=>{const el=document.querySelector('#ai-text-layer');const r=el.getBoundingClientRect(), f=document.querySelector('.cut-line').getBoundingClientRect();if(r.left<f.left || r.right>f.right || r.top<f.top || r.bottom>f.bottom)throw Error('Text outside metal');return {x:r.x,y:r.y,width:r.width,height:r.height}})(),viewBox:document.querySelector('.proof-preview-scale>svg')?.getAttribute('viewBox')};
    });
    if(!measurement.wording.includes('ALEX MORGAN'))throw Error('Missing inscription '+offer.slug);
    if(measurement.hardware!==offer.preset.fixingHoleCount)throw Error('Hardware mismatch '+offer.slug+JSON.stringify(measurement));
    await page.screenshot({path:path.join('public',offer.image),type:'jpeg',quality:87});
    execFileSync('exiftool', ['-overwrite_original', '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic', path.join('public',offer.image)], {stdio:'pipe'});
    report.push({slug:offer.slug,...measurement});
    if(report.length%20===0)console.log('Rendered',report.length);
  }
  fs.mkdirSync('output/merchant',{recursive:true});fs.writeFileSync('output/merchant/render-report.json',JSON.stringify(report,null,2));
  await browser.close();console.log('Rendered',report.length,'exact product illustrations');
})().catch(e=>{console.error(e);process.exit(1)});
