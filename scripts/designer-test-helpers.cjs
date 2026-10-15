async function enterProofBench(page) {
  if (await page.locator('.proofbench-board').count()) return;
  await page.getByRole('link', { name: 'Design your plaque ↗', exact: true }).click();
  await page.locator('.proofbench-board').waitFor();
}

async function clickJourney(page, label) {
  await enterProofBench(page);
  await page.getByRole('button', {
    name: `Go to ${label.replace(/\\/g, '')}`,
    exact: true,
  }).click();
}

module.exports = { enterProofBench, clickJourney };
