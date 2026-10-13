// The existing read-only PR workflow runs npm build. Keep workflow permissions
// unchanged and run browser checks only there, never during a Vercel deployment.
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

if (process.env.GITHUB_ACTIONS === 'true') {
  const result = spawnSync(process.execPath, ['scripts/check-designer-seo-browser.mjs'], {
    stdio: 'inherit', timeout: 180_000,
  });
  // These contain only synthetic/public fixture content. Emit two review images
  // in bounded chunks so they can be recovered from the normal CI log without
  // adding an artifact uploader, workflow write scope or another credential.
  for (const name of ['mobile-designer.png', 'mobile-guide.png', 'desktop-guide.png']) {
    try {
      const base64 = (await readFile(`output/designer-seo/${name}`)).toString('base64');
      console.log(`DESIGNER_REVIEW_BEGIN ${name}`);
      for (let offset = 0; offset < base64.length; offset += 12000) {
        console.log(`DESIGNER_REVIEW_DATA ${base64.slice(offset, offset + 12000)}`);
      }
      console.log(`DESIGNER_REVIEW_END ${name}`);
    } catch { /* A failure before capture is described by the test itself. */ }
  }
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status === 0 ? 0 : 1;
  if (result.status === 0) {
    const policies = spawnSync(process.execPath, ['scripts/check-product-policies-browser.mjs'], {
      stdio: 'inherit', timeout: 180_000,
    });
    if (policies.error) console.error(policies.error.message);
    process.exitCode = policies.status === 0 ? 0 : 1;
  }
}
