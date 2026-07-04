import { spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const outDir = path.resolve(root, 'public/seo/realistic');
const devOrigin = 'http://127.0.0.1:5179';
const apiOrigin = 'http://127.0.0.1:4179';

const materialLabels = {
  'brushed-stainless': 'Brushed stainless',
  'polished-stainless': 'Polished stainless',
  'brushed-brass': 'Brushed brass',
  'polished-brass': 'Polished brass',
  'aged-brass': 'Aged brass',
};

const pageConfigs = [
  {
    slug: 'garden-plaques',
    size: 'A5 landscape',
    scene: 'in a planted UK garden beside greenery and natural stone',
    assets: [
      ['hero-16x9', '16:9', 'brushed-brass', 'The Wilson Garden\nPlanted with love\nSpring 2026'],
      ['hero-9x16', '9:16', 'aged-brass', 'Remembering Ellen\n1939 - 2026\nIn her favourite garden'],
      ['example-1', '4:3', 'brushed-stainless', 'Mum’s Garden\nA quiet place to remember\n1944 - 2026'],
      ['example-2', '4:3', 'brushed-brass', 'The Rose Corner\nFor Margaret\nLoved always'],
      ['example-3', '4:3', 'aged-brass', 'In memory of David\nA garden full of kindness\n1951 - 2026'],
      ['example-4', '4:3', 'polished-stainless', 'Family Garden\nEstablished 2026\nThe Hartleys'],
    ],
  },
  {
    slug: 'opening-plaques',
    size: 'A4 landscape',
    scene: 'mounted indoors on a clean wall at a formal opening ceremony venue',
    assets: [
      ['hero-16x9', '16:9', 'polished-brass', 'The Riverside Hall\nOpened by Councillor A. Patel\n2 July 2026'],
      ['hero-9x16', '9:16', 'brushed-stainless', 'Oak Room\nOfficially opened\nJuly 2026'],
      ['example-1', '4:3', 'brushed-brass', 'Community Garden\nOpened by volunteers\nSummer 2026'],
      ['example-2', '4:3', 'polished-stainless', 'Innovation Suite\nOpened 2026\nWith thanks to our supporters'],
      ['example-3', '4:3', 'aged-brass', 'The Heritage Room\nRestored and reopened\n2026'],
      ['example-4', '4:3', 'polished-brass', 'New Pavilion\nOfficial opening\n2 July 2026'],
    ],
  },
  {
    slug: 'commemorative-plaques',
    size: 'A5 landscape',
    scene: 'mounted on stone or a clean public-space wall with dignified natural light',
    assets: [
      ['hero-16x9', '16:9', 'brushed-brass', 'Commemorating\nThe Mill Restoration\nCompleted 2026'],
      ['hero-9x16', '9:16', 'aged-brass', 'In recognition of\nEleanor Shaw\nFounder and friend'],
      ['example-1', '4:3', 'brushed-stainless', 'With thanks to\nThe Friends of Green Park\n2026'],
      ['example-2', '4:3', 'polished-brass', 'Celebrating 50 Years\nOf service to the community\n1976 - 2026'],
      ['example-3', '4:3', 'aged-brass', 'This garden was restored\nIn memory of Arthur Bell\n2026'],
      ['example-4', '4:3', 'brushed-brass', 'Dedicated to all volunteers\nWho made this place possible'],
    ],
  },
  {
    slug: 'engraved-plaques',
    size: 'A5 landscape',
    scene: 'as a premium product photograph on a clean neutral studio surface',
    assets: [
      ['hero-16x9', '16:9', 'brushed-stainless', 'Custom Engraved Plaque\nDesigned online\nApproved before production'],
      ['hero-9x16', '9:16', 'brushed-brass', 'Bespoke Engraved Plaque\nBrass finish\nMade to order'],
      ['example-1', '4:3', 'polished-stainless', 'Modern Stainless Plaque\nClean engraved lettering\n2026'],
      ['example-2', '4:3', 'polished-brass', 'Traditional Brass Plaque\nFormal presentation finish'],
      ['example-3', '4:3', 'aged-brass', 'Aged Brass Plaque\nWarm patinated finish'],
      ['example-4', '4:3', 'brushed-brass', 'Engraved Metal Plaque\nProofed before checkout'],
    ],
  },
  {
    slug: 'pet-memorial-plaques',
    size: 'A5 landscape',
    scene: 'in a quiet garden remembrance corner with soft planting and warm natural light',
    assets: [
      ['hero-16x9', '16:9', 'brushed-brass', 'Bella\n2012 - 2026\nForever chasing sunshine'],
      ['hero-9x16', '9:16', 'aged-brass', 'Oscar\nOur faithful friend\nLoved always'],
      ['example-1', '4:3', 'brushed-stainless', 'Milo\n2014 - 2026\nStill walking beside us'],
      ['example-2', '4:3', 'brushed-brass', 'Daisy\nGentle, loyal, loved\n2010 - 2026'],
      ['example-3', '4:3', 'aged-brass', 'For Willow\nA tiny pawprint\nA huge place in our hearts'],
      ['example-4', '4:3', 'polished-stainless', 'Ruby\nBest friend and shadow\n2013 - 2026'],
    ],
  },
  {
    slug: 'tree-plaques',
    size: 'A5 landscape',
    scene: 'beside a young memorial tree with mulch, grass and natural outdoor light',
    assets: [
      ['hero-16x9', '16:9', 'aged-brass', 'This tree was planted\nIn memory of Peter\n1948 - 2026'],
      ['hero-9x16', '9:16', 'brushed-brass', 'For Anne\nA living memory\nPlanted 2026'],
      ['example-1', '4:3', 'brushed-stainless', 'Donated by\nThe Green Family\nFor future generations'],
      ['example-2', '4:3', 'brushed-brass', 'In loving memory of Joan\nHer kindness still grows here'],
      ['example-3', '4:3', 'aged-brass', 'Oak tree planted\nTo celebrate 100 years\n1926 - 2026'],
      ['example-4', '4:3', 'polished-stainless', 'Community Orchard\nPlanted by local volunteers\n2026'],
    ],
  },
  {
    slug: 'donor-plaques',
    size: 'A4 landscape',
    scene: 'mounted on a clean community building wall with a formal recognition feel',
    assets: [
      ['hero-16x9', '16:9', 'polished-brass', 'This project was made possible\nBy generous local donors\n2026'],
      ['hero-9x16', '9:16', 'brushed-stainless', 'With grateful thanks\nTo our supporters\nFor making this space possible'],
      ['example-1', '4:3', 'brushed-brass', 'Garden restoration funded by\nThe Barker Trust\nCompleted 2026'],
      ['example-2', '4:3', 'polished-stainless', 'Donated by\nFriends of Westfield Park\n2026'],
      ['example-3', '4:3', 'aged-brass', 'In recognition of\nThe volunteers and sponsors\nWho restored this room'],
      ['example-4', '4:3', 'polished-brass', 'Supported by\nLocal families and businesses\nThank you'],
    ],
  },
  {
    slug: 'memorial-bench-plaques',
    size: '225 x 75 mm',
    scene: 'mounted neatly on a clean wooden park bench slat with shallow green background blur',
    assets: [
      ['hero-16x9', '16:9', 'brushed-stainless', 'Margaret Ellis\n1942 - 2026\nForever in our hearts\nA much-loved mum and nan'],
      ['hero-9x16', '9:16', 'brushed-brass', 'Arthur James\n1938 - 2026\nA quiet place to remember'],
      ['example-1', '4:3', 'brushed-stainless', 'Margaret Ellis\n1942 - 2026\nForever in our hearts'],
      ['example-2', '4:3', 'brushed-brass', 'John & Mary\nTogether always\nLoved by all the family'],
      ['example-3', '4:3', 'aged-brass', 'For Ben\nFaithful friend\nEvery walk led us here'],
      ['example-4', '4:3', 'polished-stainless', 'Dad\n1940 - 2026\nStill beside us'],
    ],
  },
  {
    slug: 'ashes-scattering-plaques',
    size: 'A5 landscape',
    scene: 'in a peaceful remembrance garden with natural planting and soft daylight',
    assets: [
      ['hero-16x9', '16:9', 'brushed-brass', 'In loving memory of Helen\nScattered here among the flowers\n1946 - 2026'],
      ['hero-9x16', '9:16', 'aged-brass', 'For Thomas\nA quiet place of remembrance\n1937 - 2026'],
      ['example-1', '4:3', 'brushed-stainless', 'Remembering Grace\nHere in the garden she loved'],
      ['example-2', '4:3', 'brushed-brass', 'Michael Reed\n1941 - 2026\nAlways near us'],
      ['example-3', '4:3', 'aged-brass', 'Ashes scattered here\nWith love and gratitude\n2026'],
      ['example-4', '4:3', 'polished-stainless', 'A place to pause\nA life remembered\nA love continued'],
    ],
  },
  {
    slug: 'school-opening-plaques',
    size: 'A4 landscape',
    scene: 'mounted on a smart school building interior wall with clean institutional lighting',
    assets: [
      ['hero-16x9', '16:9', 'polished-brass', 'The Willow Learning Centre\nOfficially opened\n2 July 2026'],
      ['hero-9x16', '9:16', 'brushed-stainless', 'Maple Classrooms\nOpened by the Headteacher\n2026'],
      ['example-1', '4:3', 'brushed-brass', 'The New Library\nOpened by pupils and staff\nSummer 2026'],
      ['example-2', '4:3', 'polished-stainless', 'STEM Suite\nOfficially opened\nJuly 2026'],
      ['example-3', '4:3', 'aged-brass', 'Heritage Hall\nRestored for future learners\n2026'],
      ['example-4', '4:3', 'polished-brass', 'School Garden\nOpened with thanks to our community'],
    ],
  },
];

const requestedSlugs = new Set((process.env.SLUGS || process.argv.find(arg => arg.startsWith('--slugs='))?.slice('--slugs='.length) || '')
  .split(',')
  .map(slug => slug.trim())
  .filter(Boolean));
const limit = Number(process.env.LIMIT || process.argv.find(arg => arg.startsWith('--limit='))?.slice('--limit='.length) || 0);
const force = process.argv.includes('--force') || process.env.FORCE === '1';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fileExists = async (file) => {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
};

const waitForHttp = async (url, label) => {
  for (let index = 0; index < 90; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      // keep waiting
    }
    await sleep(1000);
  }
  throw new Error(`${label} did not become ready at ${url}`);
};

const spawnServer = (command, args, label) => {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });
  child.stdout.on('data', (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[${label}] ${chunk}`));
  child.on('exit', (code) => {
    if (code !== null && code !== 0) console.warn(`[${label}] exited with ${code}`);
  });
  return child;
};

const ensureServers = async () => {
  let api;
  let dev;
  try {
    await fetch(`${apiOrigin}/api/gemini/health`).then((response) => {
      if (!response.ok) throw new Error('api not ok');
    });
  } catch {
    api = spawnServer('node', ['server.mjs'], 'api');
    await waitForHttp(`${apiOrigin}/api/gemini/health`, 'API server');
  }
  try {
    await fetch(`${devOrigin}/design`).then((response) => {
      if (!response.ok) throw new Error('dev not ok');
    });
  } catch {
    dev = spawnServer('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5179'], 'vite');
    await waitForHttp(`${devOrigin}/design`, 'Vite server');
  }
  return () => {
    api?.kill('SIGTERM');
    dev?.kill('SIGTERM');
  };
};

const clickStep = async (page, label) => {
  await page.locator(`button[aria-label="Go to ${label}"]`).first().click();
};

const selectMaterial = async (page, material) => {
  await clickStep(page, 'Material');
  await page.getByRole('button', { name: new RegExp(materialLabels[material], 'i') }).first().click();
};

const selectSize = async (page, label) => {
  await clickStep(page, 'Size/Shape');
  await page.getByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first().click();
};

const generateAsset = async (browser, config, asset) => {
  const [name, ratio, material, wording] = asset;
  const slugDir = path.join(outDir, config.slug);
  await mkdir(slugDir, { recursive: true });
  const outFile = path.join(slugDir, `${name}.jpg`);
  if (!force && await fileExists(outFile)) {
    console.log(`skip existing ${config.slug}/${name}`);
    return;
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(70000);
  await page.route(`${devOrigin}/api/gemini/**`, async (route) => {
    const response = await route.fetch({
      url: route.request().url().replace(devOrigin, apiOrigin),
      timeout: 360000,
    });
    await route.fulfill({ response });
  });
  page.on('console', (msg) => {
    const text = msg.text();
    if (/error|failed|Gemini|realistic/i.test(text)) {
      console.log(`[${config.slug}/${name}] ${msg.type()} ${text.slice(0, 500)}`);
    }
  });

  try {
    console.log(`generate ${config.slug}/${name} ${ratio} ${material}`);
    await page.goto(`${devOrigin}/design`, { waitUntil: 'networkidle', timeout: 70000 });
    await selectSize(page, config.size);
    await selectMaterial(page, material);
    await clickStep(page, 'Text');
    await page.locator('#inscription-wording-input').fill(wording);
    await page.getByRole('button', { name: /^Generate layout$/i }).click();
    await page.getByText('Choose a look').waitFor({ timeout: 220000 });
    await clickStep(page, 'Proof');
    await page.getByRole('button', { name: /Admin tools/i }).click();
    await page.getByText('REALISTIC SCENE PROMPT').waitFor({ timeout: 15000 });

    const materialName = materialLabels[material].toLowerCase();
    const prompt = [
      `Photorealistic product photo of the attached ${materialName} custom plaque proof ${config.scene}.`,
      'The plaque must be fully visible and use the exact plaque layout and wording from the reference proof.',
      'Keep engraving legible, preserve screw fixings and border placement, use realistic metal reflections and shadows.',
      'No extra words, no watermark, no fake logo, no hands holding it, no distorted lettering.',
    ].join(' ');

    await page.locator('textarea[placeholder^="Example:"]').fill(prompt);
    await page.locator('select').last().selectOption(ratio);
    await page.getByRole('button', { name: /^Realistic preview$/i }).click();

    const dataUrl = await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const candidates = imgs
        .map((img) => img.getAttribute('src') || '')
        .filter((src) => /^data:image\/(?:png|jpeg|jpg);base64,/.test(src));
      return candidates.find((src) => src.length > 200000) || null;
    }, null, { timeout: 360000 }).then((handle) => handle.jsonValue());

    const buffer = Buffer.from(dataUrl.replace(/^data:image\/(?:png|jpeg|jpg);base64,/, ''), 'base64');
    await writeFile(outFile, buffer);
    console.log(`wrote ${outFile} ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
  } finally {
    await page.close();
  }
};

const stopServers = await ensureServers();
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  let made = 0;
  const pages = pageConfigs.filter((config) => !requestedSlugs.size || requestedSlugs.has(config.slug));
  for (const config of pages) {
    for (const asset of config.assets) {
      if (limit && made >= limit) break;
      await generateAsset(browser, config, asset);
      made += 1;
    }
    if (limit && made >= limit) break;
  }
} finally {
  await browser.close();
  stopServers();
}
