const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
if (process.env.ENABLE_LIVE_AI_REVIEW !== 'true') throw new Error('Explicit live-AI opt-in required');
const base = process.env.AI_REVIEW_URL;
if (!base) throw new Error('AI_REVIEW_URL required');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome'});
  try {
    const page = await browser.newPage({viewport:{width:390,height:1000}});
    const replies = [];
    const fallbacks = [];
    page.on('console', message => {
      if (/Model-authored typography failed|Deterministic local classification failed/.test(message.text())) fallbacks.push(message.text());
    });
    page.on('response', async response => {
      if (response.url().endsWith('/api/gemini/generate-content')) {
        replies.push({ status:response.status(), body:await response.json() });
      }
    });
    await page.goto(base + '/design');
    await page.getByRole('button',{name:/A4 landscape/}).click();
    await page.getByRole('button',{name:'Go to Text',exact:true}).click();
    await page.getByRole('button',{name:'AI-assisted design',exact:false}).click();
    await page.locator('#inscription-wording-input').fill('THE WILLOW GARDEN\nOPENED 2026');
    await page.locator('#design-brief').fill('Two centred lines. Make THE WILLOW GARDEN the main title and OPENED 2026 smaller underneath. Use Lato.');
    await page.getByRole('button',{name:'Generate layout',exact:true}).click();
    await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor({timeout:180000});
    await page.getByRole('button',{name:'Tweak manually',exact:true}).click();
    await page.locator('#generated-text-line-0').waitFor();
    assert.ok(replies.length && replies.every(x => x.status === 200), JSON.stringify(replies.map(x => ({status:x.status,error:x.body.error}))));
    assert.deepEqual(fallbacks, [], 'AI generation must not use a local fallback');
    assert.ok(!/A simple layout was used because the AI layout was unavailable/.test(await page.locator('body').innerText()), 'Generation used fallback');
    console.log('Real AI generation returned HTTP 200 and an editable proof.');
    const before = await page.locator('#ai-text-layer').innerHTML();
    const count = replies.length;
    await page.locator('#layout-instruction').fill('Make the OPENED 2026 line bold, keep the title unchanged. Preserve the wording and positions.');
    await page.getByRole('button',{name:'Apply changes',exact:true}).click();
    await page.getByText('Layout updated. Your wording is unchanged. Check the proof or undo this change.').waitFor({timeout:180000});
    assert.ok(replies.length > count && replies.slice(count).every(x => x.status === 200));
    assert.equal(await page.locator('#inscription-wording-input').inputValue(),'THE WILLOW GARDEN\nOPENED 2026');
    assert.notEqual(await page.locator('#ai-text-layer').innerHTML(),before);
    await page.getByRole('button',{name:'Undo last change',exact:true}).click();
    assert.equal(await page.locator('#ai-text-layer').innerHTML(),before);
    console.log('Real AI instruction edit accepted, exact wording retained, undo restored original.');
    console.log('Model request count:',replies.length);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
