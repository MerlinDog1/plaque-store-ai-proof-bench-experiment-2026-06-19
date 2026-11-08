// Rebuild the unchanged admin baseline without switching branches or modifying source files.
// Usage: FIXTURE_BASELINE_DIST=/absolute/output/path node scripts/admin-visual-baseline.mjs
import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const base = process.env.FIXTURE_BASE_REF || 'be7a5471b064ee601597789c4e8def09c2e5dcac';
const files = ['components/SiteExperience.tsx','components/Header.tsx','components/DesignerUse.tsx','index.css'];
const originals = new Map(files.map(file => [path.resolve(file), execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'})]));
if (!process.env.FIXTURE_BASELINE_DIST) throw Error('Set FIXTURE_BASELINE_DIST outside dist to preserve current build.');
await build({ plugins:[{name:'unchanged-admin-baseline',enforce:'pre',load(id){return originals.get(id.split('?')[0]);}}],build:{outDir:process.env.FIXTURE_BASELINE_DIST,emptyOutDir:true} });
