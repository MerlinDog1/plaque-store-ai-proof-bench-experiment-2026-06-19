# Plaque Store AI Proof Bench Experiment - 2026-06-19

Experimental copy of the consumer-facing Plaque Store AI proof bench. This repo
is for fast iteration, diagnostics, and risky proof-flow experiments without
disturbing the canonical proof-bench repo.

Source snapshot:

- original working repo: `MerlinDog1/plaque-store-ai-consumer`
- source commit: `42bd86af2718f94fd2b15f75fb09f58edcb13758`
- fresh repo label: `plaque-store-ai-proof-bench-2026-06-18`
- experiment source repo: `MerlinDog1/plaque-store-ai-proof-bench-2026-06-18`
- experiment base commit: `6163957`
- experiment repo label: `plaque-store-ai-proof-bench-experiment-2026-06-19`

This copy currently includes the local realistic-preview diagnostic patch:

- realistic preview sends a visible product reference instead of the old
  white-on-white mask;
- any remaining SVG text/tspan nodes are forced black before PNG capture;
- the modal exposes a `Download reference sent to Gemini` button;
- preview defaults to `Auto product fit` and requires a generated inscription
  layout first.

This snapshot includes the current proof-bench UI and the latest fixes:

- compact `Fixings and border` controls;
- no customer-facing inset border option;
- no scalloped border options on bench-plaque class sizes;
- corrected wood-backed stainless/brass texture alignment;
- fixed double-scallop decorative cap positions;
- 3D preview text rendered from outlined live SVG text so fonts stay correct;
- 3D preview physical layer work for metal face, wood backing, caps, and live
  SVG proof textures.

## Ecommerce Prototype Checkpoint

An overnight ecommerce prototype layer has been started around the proof bench.
It keeps the instant AI proof as the core selling point and adds product pages,
proof-launch presets, mock checkout, mock order capture, and a mock admin view.
See `docs/OVERNIGHT_ECOMMERCE_CHECKPOINT.md` for the current shape.

## Security

- No API keys, credentials, customer records, local agent files, generated
  proofs, screenshots, build output, or machine-specific paths are included.
- Keep real credentials in `.env.local`; that file is ignored by Git.
- `.env.example` contains variable names only.

## Run Locally

Prerequisite: Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY to .env.local
npm run dev
```

## Verify

```bash
npx tsc --noEmit
npm run build
npm run check:preview-geometry
npm run check:fixings-border-ui
```

The optional export-fidelity check expects a running app and may create local
output files, which are ignored:

```bash
npm run test:export-fidelity
```
