# Production outlines match the designer preview — 15 October 2026

## Problem

The owner noticed that the "fi" in a paid order's production PDF looked wrong. The customer had approved a neat
joined "fi" on screen, but the PDF had the i's dot sitting on the f's hook as a lump. The emailed proof copy, made by
the same code, had the same fault. The owner asked that what customers see when they order is always what is made.

A new check (below) rendered every inscription font and weight both ways and found several separate causes:

- **Ligatures.** `outlineTextLayer` outlined one character at a time at the browser's `getStartPositionOfChar`
  positions. Browsers draw fi, fl, ff, ffi and ffl as one glyph and split its width between the characters, so a full
  "f" and a dotted "i" were squeezed into the joined width: about 1 mm too close at 16 mm text. This affected
  EB Garamond, Lora, Playfair Display, Open Sans, Lato, Montserrat, Raleway, Bitter, Cinzel, Roboto Slab and others.
- **Different font files.** The preview loaded Google Fonts' current files. Production outlined Fontsource 5.0.0
  copies from 2023, which are older versions for Bitter (2.002 against 3.021), Montserrat (8 against 9), Merriweather,
  Great Vibes, Lora, Open Sans, Oswald, Roboto Slab, Pinyon Script and EB Garamond.
- **Script fonts** were laid out by opentype.js as whole runs, then moved so the path's ink box met the browser's text
  box. A text box is not an ink box, so every line shifted up and left, and contextual forms differed.
- **latin-ext characters** (ŵ, ŷ, Ł, Ć, Ō) were never outlined, because production loaded only the latin files.
- **Weights** were matched by "closest", not the CSS rules. For example, Roboto Slab 400 showed 500 on screen and was
  made at 300. Synthetic bold or italic on screen, and contextual alternates, could not be reproduced.
- **Satisfy** kerns only through a legacy `kern` table. Browsers using HarfBuzz move the second glyph of a pair by
  half the kern without reporting it in character positions.

## Change

- `services/inscriptionFontCatalog.ts` is the single catalogue of families, weights, styles and subsets. Its files are
  pinned to Fontsource **5.3.0**, which match Google's current releases. `inscriptionFonts.ts` writes `@font-face`
  rules for exactly these files (latin and latin-ext) instead of loading the Google stylesheet. The outliner loads the
  same files. Weight matching follows the CSS Fonts rules.
- Characters a family lacks come from Open Sans in both places. Its rules come first in each family, so browsers use
  them only after the family's own faces. A character that no catalogue face has (♥, emoji, Greek) now stops the
  export with a message instead of producing a different plaque.
- The preview text layer turns common ligatures on explicitly and switches off contextual alternates, contextual
  ligatures, `rclt` and synthetic bold/italic. Satisfy is shown unkerned. The outliner reproduces exactly what remains.
- `outlineTextLayer` outlines every face glyph by glyph at the browser's positions, with standard and required
  ligatures as single glyphs (longest first, not in letter-spaced text). The whole-run script path and its bounding-box
  registration are removed. A catalogue font that fails to load now stops the export rather than switching to
  another face.

Visible differences for customers: Bitter, Caveat, Great Vibes and Pacifico lose contextual alternates. Single-weight
fonts no longer show synthetic bold. Satisfy is unkerned. Missing characters show in Open Sans rather than a device
font. All of these now match the made plaque.

## Check

`npm run check:glyph-parity` (Vite, Playwright with system Chrome via `CHROME_PATH`, network access) draws six lines of
synthetic wording and a centred tspan pair in every catalogue font, weight and style, plus letter-spaced, missing
weight, missing italic and latin-ext cases (58 in total). Each is drawn as live text and through
`outlinePreviewTextLayer`. An ink pixel with no match within one pixel counts as a mismatch, and no 32 px square may
hold more than 20. Screen hinting leaves isolated specks: the worst passing case has 10. On the previous code
EB Garamond's ligatures alone reach 58, script fonts reach hundreds, and every font fails on latin-ext characters.

## Release (owner: "what they see on order always needs to be what i make")

- Source `cf7f79098c45d7849c41623c51614dccb34dd8f5` on `codex/instaplaque-ligature-fidelity-20261015`, draft PR 20.
  CI "Typecheck and build" passed. Local typecheck, full build with postbuild checks, and the glyph check passed.
- Staged with `vercel deploy --prod --skip-domain` as `dpl_HPNDR4HhTj31LiTChGgaXBYeJpqq`; the remote build's
  postbuild checks passed. Through `vercel curl`, the candidate served the same `index-Dnip0rov.js` and a byte-identical
  `exportService-M0vAY0om.js` as the local build. That bundle was tested in Chrome: designer page without errors,
  199 font-face rules, the six sample outlines matched, and ♥ stopped the export.
- Promoted about 10:23 UTC. Canonical READY on `dpl_HPNDR4HhTj31LiTChGgaXBYeJpqq`. `/`, `/design` and `/api/health`
  return 200, and www returns 308. Repeating the bundle test on https://instaplaque.co.uk passed, with analytics
  requests blocked.
- Rollback: `vercel promote dpl_HQBYhNJxVhe5mcBrcKCBi7afd4Cp`.

Proof files already stored with earlier orders are unchanged. An affected order can be regenerated from its stored
design with the fixed code. The order the owner raised was regenerated privately, and nothing was sent to the customer.
