# Design routes and instruction-based adjustments

Review implementation, not deployed. Branch `codex/design-routes-instructions`,
based on audited `origin/dev/verified-live` (7edd144). Preserve the R2 migration
and `git.deploymentEnabled: false`. No backend/storage changes.

## Customer presentation

Three selectable cards in the existing Wording step share the same physical
plaque, artwork and proof. They are editing methods, not three different products.

- **Quick design** (default): exact wording → existing automatic layout. Named
  style choices and manual tweaks remain available afterwards.
- **Arrange it myself**: wording with explicit line breaks → locally fitted Lato
  starter. Edit text, fonts, sizes, bold and 1mm vertical nudges. No model call is
  required to start. Rebuild replaces the arrangement with a new local starter.
- **Design it for me**: exact wording plus separate optional design instructions
  → existing authored generation with guidance. Explicitly labelled AI, not a
  human service. The owner's meaning of this third route was ambiguous; this is
  the implemented interpretation, not a new staffed design/quote service.

Switching routes does not clear the proof or wording. Mode selection is transient;
existing proof save/resume stores the proof and guidance, not the selected panel.
Guidance is shared, retained across modes, and remains part of proof freshness.

## Instructions, not chat

After a layout exists, **Adjust with AI** accepts one appearance instruction.
Examples: make the name larger; move the lines closer; use one font; smaller dates.
**Apply changes** submits exact locked wording, current SVG and the actual available
inscription box. It does not regenerate artwork or alter physical product choices.
No conversation history, assistant replies or chat transport is introduced.

Typography validation enforces exact wording, safe SVG/fonts, bounds and overlap.
One validation repair is allowed; invalid results do not replace the prior proof.
A late response is discarded if the wording, guidance or plaque state changed.
Requests to rewrite words are not supported here: use the wording/manual text
fields instead. **Try another layout** remains a separate full-generation action.

One-step undo restores the previous accepted layout and wording. It is disabled
once other proof inputs change, so it cannot silently undo unrelated changes.
Proof approval is reset when proof state or wording changes.

## Manual safety and limitations

Manual text edits synchronize canonical wording, preventing old text from returning
on regeneration. Wrapped spans retain separate lines. Direct edits are rejected
when the main wording/product configuration is stale; rebuild first. Accepted
manual/style changes pass the same typography validator, including its font and
readability restrictions. Invalid size/spacing changes leave the old proof intact.

Starter is max 12 explicit lines, no automatic wrapping. It rejects text that
cannot fit at its readable minimum; it loads Lato before measuring, with a
conservative fallback if browser metrics are unavailable. This is a line editor,
not a freehand desktop-publishing canvas. Existing geometry validation uses
estimated glyph widths; it is not a guarantee of physical engraving quality.

## Verification

- `npm run typecheck`
- `npm run check:typography`: mocked generation and instruction edit/repair;
  exact wording, Unicode/dates, unsafe SVG, geometry and overlap.
- `npm run check:manual-typography`: escaped text, line preservation, actual box,
  minimum fit and canvas metrics.
- `npm run build`: API runtime smoke, Vite, prerender.
- Local Vite on loopback 4196 + `npm run check:design-routes`: 390/1440 browser
  flows; manual no-model start, synchronized wording, undo, mode preservation,
  failure/success AI fixtures, stale responses/drafts, rejected oversize edits,
  proof reapproval, overflow/JS errors.

Browser test intercepts API calls; it never sends customer data or requests a
paid generation. Tests used Node 24 (installed host runtime); package pins Node
22 and install warns about that difference. No claim of a live model-quality
probe, purchase journey or deployment. Review the real AI behaviour in an
explicitly authorised preview before publishing. Local screenshots are ignored
under output/playwright; browser executable can be set with CHROMIUM_EXECUTABLE.

## Owner-requested live AI tunnel review

26 September follow-up: owner requested working AI in the Cloudflare preview.
`scripts/serve-ai-review.mjs` serves the existing compiled `dist` on loopback
4196 and forwards only Gemini health/generate-content to the existing
InstaPlaque API. It does not download keys or enable order, proof-session,
admin, payment, email or storage endpoints. Non-AI API paths return 503.
The upstream site keeps its existing model configuration and rate limits;
the review adds same-origin checks, request validation/size limits and a
shared 20-unit/minute limit. It forwards validated browser payloads, not
SDK-normalized payloads, because the upstream canonicalizes independently.

Start after building with `npm run build`:

```sh
ENABLE_LIVE_AI_REVIEW=true node scripts/serve-ai-review.mjs
```

Point an owner-requested Cloudflare tunnel to `http://127.0.0.1:4196`.
This is a temporary public review URL, not a production release or private login.
Only start it for an explicitly requested live review; stop the preview and
tunnel processes when finished. Real requests use the site's existing AI quota.

The opt-in real browser check is:

```sh
ENABLE_LIVE_AI_REVIEW=true AI_REVIEW_URL=https://YOUR-TUNNEL.trycloudflare.com node scripts/check-ai-review-live.cjs
```

Verified through the actual tunnel at mobile width: a two-line demonstration
plaque generated through AI without local fallback; a subsequent instruction
edit was accepted, exact wording preserved and Undo restored the original.
The successful run made two model requests, both HTTP 200. Checkout/proof-session/
admin paths returned 503; cross-site AI returned 403; malformed AI returned 400.
This proves a real generation/edit flow, not every instruction or image feature.
Production code/configuration unchanged; no order/database/email operations.
