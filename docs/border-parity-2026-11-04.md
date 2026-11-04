# Production borders match the approved proof — PREVIEW ONLY, 4 November 2026

Branch `codex/instaplaque-border-parity-20261104`, based on live source `86188c9`
(`dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`). Production is not changed by this task.

## Fix and scope

`prepareCloneForProduction` in `services/exportService.ts` no longer replaces every
`.engraved-border` stroke width with 0.5 mm. It retains the actual cloned proof's
widths, coordinates, paths and corner radii. The existing cleanup still makes the
etch solid black and removes screen-only opacity. The production PDF uses this
same SVG preparation. No preview design, wording, fonts, prices, layouts, cut
lines, holes, or other export layers changed.

## Exact widths (mm, outer / inner)

The SVG viewBox uses millimetres; export writes the same numeric width/height in
`mm`, so these are physical widths, not screen pixels. The proof halves border
strokes when **either dimension is less than 100 mm** (not at exactly 100 mm).
It does not continuously scale widths with plaque size or on-screen zoom.

| Style | Old production | Proof and fixed production, both dimensions >=100 | Proof and fixed production, either dimension <100 |
| --- | --- | --- | --- |
| Single | 0.5 | 1 | 0.5 |
| Double | 0.5 / 0.5 | 1 / 0.75 | 0.5 / 0.375 |
| Scalloped | 0.5 | 1 | 0.5 |
| Double scalloped, with fixings | 0.5 / 0.5 | 0.75 / 0.5 | 0.375 / 0.25 |
| Inset (legacy renderer only) | 0.5 / 0.5 | 1.6 / 0.55 | 0.8 / 0.275 |
| Border off | none | none | none |

The current menu offers Single, Double, Scalloped, Double scalloped and Off.
Inset is not offered and the controls normalise it to Single. Bench-format
rectangles hide scalloped choices. With **no physical fixings** (including heart
shapes), both scalloped styles currently fall back to **one standard line**,
1 mm or 0.5 mm; this existing proof behaviour is retained, not redesigned.

### Positions, gaps and radii (unchanged)

- Standard Single centreline: 3 mm inset. Double: 3 and 5 mm, **2 mm centreline
  separation**. Straight-edge clear gap is 1.125 mm at full stroke or 1.5625 mm
  at half stroke (old file: 1.5 mm). Rectangular border radius is
  `max(0, cornerRadius - 2)` for both lines; ovals/circles use `width/2 - inset`
  and `height/2 - inset`; hearts retain the original cubic path.
- Legacy Inset: 6 / 12 mm insets (6 mm centreline separation).
- Scalloped rectangles with four fixings follow the actual fixing centres.
  The inner double line moves those centres inward 2 mm. The cut-out radius is
  `fixingRadius + fixingBorderClearance`, reducing by 0.5 mm on the inner line
  (10 mm caps: 7 / 6.5 mm; 15 mm caps: 9.5 / 9 mm; screws: 4.75 / 4.25 mm).
- Oval/circle scallops keep the existing ellipse/circle intersection paths and
  actual fixing-centre-based ellipse inset. With two rectangle fixings the
  renderer uses the standard inset fallback, while retaining double widths.
- Wood adds exactly 12.5 mm to both coordinate origins and 25 mm to the viewBox
  dimensions, without scaling borders. Every existing path/coordinate is cloned.
- Screen opacity: Double inner 80%, Double scalloped inner 75%, legacy Inset
  inner 45%; production is 100% solid black, with those same stroke widths.

## Verification and evidence

`npm run check:border-parity` is the new standalone regression command. It renders the real React
`PlaquePreview` and runs the real `createCorelSvgText` in Chrome, without AI,
checkout, customer data or network requests beyond loopback. It checks **1,604
cases**: all five enum styles, four shapes, ten sizes (small, threshold on both
axes, A5 both orientations, A4, 600 mm), eight fixing/wood/corner configurations,
and border off. Geometry attributes, units, viewBox, solid-black output and
non-mutation of the source proof are checked. A baseline run additionally runs
the exporter read from `86188c9` and proves the complete border-only fixture SVG
is identical except for the engraved borders' stroke widths.

Passed: both the 1,604-case baseline matrix and the standalone command; TypeScript; full build plus every
postbuild guard; existing glyph parity **58/58**; preview geometry, small-border
stroke, curved-scallop geometry, circular-plaque geometry, manual typography;
CI checkout/audit/security/public-input, analytics-redaction, PostHog/promo and
Google-purchase checks. System Chrome was used because Playwright's downloaded
Chromium is not installed on this server.

Some older optional browser scripts are stale and are **not claimed passing**:
`small-fixings` and `symbols` still look for the old numbered Text button;
`pricing` expects the old Design entry; `design-routes` expects the old AI prompt
root markup (after supplying its hard-coded port 4196). `fixings-border-ui`
first misidentifies the cookie banner's `role=dialog` as a preview modal; with
cookies rejected, its relevant border/3D checks progress to a final assertion
expecting A4 297x210 although that fixture actually selected A5 210x148. These
failures precede/use unrelated unchanged UI paths; they were not hidden or
rewritten as part of this export-only fix. The old live-AI `test:export-fidelity`
script was not used; the deterministic border and glyph suites cover this fix.

Evidence (outside Git):
`/home/coding-agent/workspace/output/instaplaque-border-parity-20261104/`.

- `border-parity-phone.jpg`: phone sheet; `small-border-parity.jpg`,
  `a5-border-parity.jpg`, `a4-border-parity.jpg`: shorter per-size sheets.
- Twelve cases: Single, Double, Scalloped and Double scalloped at 120x80,
  210x148 and 297x210 mm. Each has actual proof SVG, border-only proof SVG,
  **old and fixed real production SVGs**. No invented old geometry.
- All comparison detail panels show the same 32x28 mm corner at the same scale;
  actual customer-proof thumbnails are included. Proof opacity is not disguised.
- `results.json`, `samples.json`, `border-parity.log`, build/typecheck/glyph and
  individual existing-suite logs; `make-sheet.mjs` reproduces the JPEGs.

Reproduce the baseline evidence:

```sh
BORDER_PARITY_BASELINE=86188c9 BORDER_PARITY_OUT=/path/to/output npm run check:border-parity
```

## Manufacturing decisions / historical impact

Small Double inner strokes are 0.375 mm; small Double scalloped strokes are
0.375 / **0.25 mm** (legacy Inset inner 0.275 mm). These are the existing approved
proof widths, now retained. Whether the thinnest lines are suitable for the
workshop needs the owner's judgement; changing them would require a separate,
consistent preview-and-export design change. No minimum-width redesign was made.

**Code-only conclusion:** yes, orders since 26 October that used a mismatching
border width were exposed. The 0.5 mm override is present in the June baseline;
the current half-stroke rule and insets predate 26 October (September or earlier).
It is not accurate to say every order was too thin: no-border orders and small
Single/Scalloped proofs already matched; small double inner lines could instead
be **too thick**. Stored files will not change automatically. No order records
were read or changed, so no affected-order count or fulfilment claim is made.

The optional workflow-file integration could not be pushed: the connected GitHub
OAuth token lacks `workflow` scope. The unpushed attempt is preserved locally as
`wip/instaplaque-border-parity-ci-20261104` (`13c2cf1`). The task branch keeps the
existing workflow unchanged; the complete regression command and fixtures are
pushed and were run successfully. No credential/scopes or workflow access changed.

## Release / rollback

Application commit **`8d36d7ea0b6531804414b82f71844979390ccb9a`**, pushed.
Preview: https://instaplaque-fuj2hb5v3-dullaghan31-3959s-projects.vercel.app
(`dpl_3wdfv5KuRf4e765sieHkceCNHEwS`, independently inspected **READY**, target
**preview**). It was deployed once from the linked existing project, under
`flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel deploy --yes`.
The API probe returned 403 JSON (no Security Checkpoint); cloud build and every
postbuild guard passed. No production command, promotion or domain assignment ran.

A real Chrome visit to the protected preview configured an A5 landscape plaque,
10 mm caps and Double border through the actual UI, then invoked the deployed
public exporter (the workshop button is intentionally hidden on hosted sites).
The resulting `hosted-double-a5.svg` has **1 / 0.75 mm** strokes at **3 / 5 mm**,
solid black, no opacity or text nodes, and **210mm x 148mm** dimensions. The
actual preview geometry and exported geometry match; zero browser errors.
`hosted-check.json`, `hosted-check.log`, and desktop/phone screenshots record it.
Only synthetic/default guide text was used; non-GET backend and tracker requests
were blocked. The supported Vercel bypass header stayed in memory, scoped to
that preview origin, never logged, saved or sent to other hosts.

Production was independently inspected and remains READY on
`dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`. Temporary local servers and task browsers were
closed. This task is **preview only**. A future production release requires the
owner's separate decision. There is no live change to roll back. To remove the
candidate fix, revert its application commit on a new branch and rebuild; do
not promote or redeploy the old default branch. Existing production remains
`dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN` throughout this task.
