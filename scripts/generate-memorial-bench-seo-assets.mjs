import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const outDir = path.resolve('public/seo');

const escape = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const lines = (text, x, startY, size, gap, opts = {}) => text.map((line, index) => `
  <text x="${x}" y="${startY + index * gap}" text-anchor="middle" font-family="${opts.family || 'Georgia, serif'}" font-size="${size}" font-weight="${opts.weight || 600}" fill="${opts.fill || '#111'}" letter-spacing="${opts.spacing || 0}">${escape(line)}</text>
`).join('');

const plaqueSvg = ({
  width = 1200,
  height = 760,
  material = 'steel',
  title,
  subtitle,
  body,
  footer,
  background = 'studio',
  caption,
}) => {
  const isBrass = material === 'brass';
  const isAged = material === 'aged';
  const plateFill = isBrass ? 'url(#brass)' : isAged ? 'url(#aged)' : 'url(#steel)';
  const plateStroke = isBrass ? '#876022' : isAged ? '#51402d' : '#7d8789';
  const bg = background === 'bench'
    ? `
      <rect width="1600" height="900" fill="#d7c4a3"/>
      ${Array.from({ length: 8 }).map((_, i) => `<rect x="${-80 + i * 230}" y="-80" width="150" height="1060" rx="18" transform="rotate(8 ${-80 + i * 230} 450)" fill="${i % 2 ? '#9b6d3d' : '#b3834e'}" opacity="0.92"/>`).join('')}
      <rect width="1600" height="900" fill="url(#shade)"/>
    `
    : `
      <rect width="${width}" height="${height}" fill="#f2eee6"/>
      <circle cx="${width * 0.18}" cy="${height * 0.18}" r="${width * 0.25}" fill="#e5d8bd" opacity="0.65"/>
      <circle cx="${width * 0.85}" cy="${height * 0.16}" r="${width * 0.24}" fill="#dfe8e5" opacity="0.7"/>
    `;
  const canvasW = background === 'bench' ? 1600 : width;
  const canvasH = background === 'bench' ? 900 : height;
  const plateW = background === 'bench' ? 980 : 850;
  const plateH = background === 'bench' ? 326 : 284;
  const plateX = (canvasW - plateW) / 2;
  const plateY = background === 'bench' ? 286 : 205;
  const screwY = plateY + plateH / 2;
  const screwR = background === 'bench' ? 24 : 19;
  const titleSize = background === 'bench' ? 62 : 50;
  const subSize = background === 'bench' ? 34 : 29;
  const bodySize = background === 'bench' ? 30 : 25;
  const footerSize = background === 'bench' ? 30 : 25;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <defs>
    <linearGradient id="steel" x1="0" x2="1">
      <stop offset="0" stop-color="#aeb7b9"/>
      <stop offset="0.26" stop-color="#f0f3f2"/>
      <stop offset="0.53" stop-color="#bac4c5"/>
      <stop offset="0.78" stop-color="#eef1ef"/>
      <stop offset="1" stop-color="#9ea8aa"/>
    </linearGradient>
    <linearGradient id="brass" x1="0" x2="1">
      <stop offset="0" stop-color="#946721"/>
      <stop offset="0.22" stop-color="#e8c66a"/>
      <stop offset="0.52" stop-color="#bc8830"/>
      <stop offset="0.8" stop-color="#f0d37b"/>
      <stop offset="1" stop-color="#9a6b22"/>
    </linearGradient>
    <linearGradient id="aged" x1="0" x2="1">
      <stop offset="0" stop-color="#5f4c32"/>
      <stop offset="0.28" stop-color="#b08b51"/>
      <stop offset="0.54" stop-color="#786040"/>
      <stop offset="0.82" stop-color="#c3a06a"/>
      <stop offset="1" stop-color="#4c3d2a"/>
    </linearGradient>
    <radialGradient id="screw" cx="35%" cy="30%">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.38" stop-color="${isBrass || isAged ? '#d2ad5a' : '#cbd2d3'}"/>
      <stop offset="1" stop-color="${isBrass || isAged ? '#6c4b1d' : '#606b6d'}"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.34"/>
      <stop offset="0.52" stop-color="#fff" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#22180f" stop-opacity="0.34"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-30%" width="140%" height="180%">
      <feDropShadow dx="0" dy="34" stdDeviation="24" flood-color="#17100a" flood-opacity="0.34"/>
    </filter>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="0.22"/>
    </filter>
  </defs>
  ${bg}
  <g filter="url(#shadow)">
    <rect x="${plateX}" y="${plateY}" width="${plateW}" height="${plateH}" rx="22" fill="${plateFill}" stroke="${plateStroke}" stroke-width="5"/>
    <rect x="${plateX + 44}" y="${plateY + 42}" width="${plateW - 88}" height="${plateH - 84}" rx="10" fill="none" stroke="#101010" stroke-width="5" opacity="0.88"/>
    <circle cx="${plateX + 74}" cy="${screwY}" r="${screwR}" fill="url(#screw)" stroke="#222" stroke-width="2"/>
    <circle cx="${plateX + plateW - 74}" cy="${screwY}" r="${screwR}" fill="url(#screw)" stroke="#222" stroke-width="2"/>
    <path d="M${plateX + 74 - screwR * 0.48} ${screwY}h${screwR * 0.96}M${plateX + 74} ${screwY - screwR * 0.48}v${screwR * 0.96}M${plateX + plateW - 74 - screwR * 0.48} ${screwY}h${screwR * 0.96}M${plateX + plateW - 74} ${screwY - screwR * 0.48}v${screwR * 0.96}" stroke="#1b1b1b" stroke-width="4" stroke-linecap="round"/>
    ${lines([title], canvasW / 2, plateY + plateH * 0.28, titleSize, titleSize, { family: 'Georgia, serif', weight: 700 })}
    ${subtitle ? lines([subtitle], canvasW / 2, plateY + plateH * 0.44, subSize, subSize, { family: 'Arial, sans-serif', weight: 700 }) : ''}
    ${body ? lines(body, canvasW / 2, plateY + plateH * 0.58, bodySize, bodySize * 1.22, { family: 'Georgia, serif', weight: 500 }) : ''}
    ${footer ? lines([footer], canvasW / 2, plateY + plateH * 0.82, footerSize, footerSize, { family: 'Arial, sans-serif', weight: 700 }) : ''}
  </g>
  ${caption ? `<text x="${canvasW / 2}" y="${canvasH - 54}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#365147">${escape(caption)}</text>` : ''}
</svg>`;
};

const assets = [
  {
    file: 'memorial-bench-hero.png',
    svg: plaqueSvg({
      background: 'bench',
      material: 'steel',
      title: 'Margaret Ellis',
      subtitle: '1942 - 2026',
      body: ['Forever in our hearts'],
      footer: 'A much loved mum and nan',
    }),
  },
  {
    file: 'memorial-bench-example-steel.png',
    svg: plaqueSvg({
      material: 'steel',
      title: 'Arthur James',
      subtitle: '1938 - 2026',
      body: ['A quiet place to remember'],
      footer: 'Loved always',
      caption: 'Brushed stainless steel bench plaque proof',
    }),
  },
  {
    file: 'memorial-bench-example-brass.png',
    svg: plaqueSvg({
      material: 'brass',
      title: 'Margaret & John',
      subtitle: 'Together again',
      body: ['Thank you for the laughter'],
      footer: 'From all the family',
      caption: 'Traditional brass bench plaque proof',
    }),
  },
  {
    file: 'memorial-bench-example-aged.png',
    svg: plaqueSvg({
      material: 'aged',
      title: 'For Ben',
      subtitle: 'Faithful friend',
      body: ['Every walk led us here'],
      footer: '2012 - 2026',
      caption: 'Aged brass bench plaque proof',
    }),
  },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const asset of assets) {
  const match = asset.svg.match(/<svg[^>]*width="(\d+)"[^>]*height="(\d+)"/);
  const width = Number(match?.[1] || 1200);
  const height = Number(match?.[2] || 760);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}</style></head><body>${asset.svg}</body></html>`);
  const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  await writeFile(path.join(outDir, asset.file), png);
  await page.close();
}

await browser.close();

console.log(`Wrote ${assets.length} memorial bench SEO assets to ${outDir}`);
