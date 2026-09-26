# Regular etched plaque follow-up

Owner requested more tests limited to regular etched plaques of different sizes. Used the already-deployed application source7af33c1 and live AI service, no reverse etching or shaped plaques. Local renderer matched that source; API model responses were real. Proof-session reads were synthetic intercepted fixtures, not database writes.

Eight new synthetic inscriptions in `scripts/fixtures/regular-etched-layouts.json`:100×25 short memorial,150×25 donation,200×50 bench poem,150×75 joint memorial,200×100 office sign,148×210 portrait award,297×210 railway history,400×300 garden dedication. Brass/stainless, adhesive/two screws/four screws/10mm and15mm caps, with/without borders.

All eight generated, seven first attempt, one automatic repair on the largest dedication. No simple-layout fallback. Visually inspected every rendered desktop proof plus representative mobile screenshots. No observed clipped text, hardware overlap or wording loss. All measured text corners inside face; minimum hardware clearance3.02mm; no browser errors/horizontal overflow. Portrait award is spacious but balanced; no application adjustment justified by this sample.

No new deployment, order, email, payment or database write. The harness now accepts QA_CASE_FILE to repeat custom sets. Run from local matching Vite server:

```sh
LIVE_LAYOUT_QA=true QA_CASE_FILE=scripts/fixtures/regular-etched-layouts.json QA_OUT=output/layout-quality/regular node scripts/check-layout-quality.cjs
```

This explicitly invokes real AI and must remain owner-authorised, not CI or automatic scheduled work. Ignored screenshots/results at output/layout-quality/regular; contact-sheet.png contains eight actual proofs. A representative check, not an exhaustive manufacturing certification.
