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

## Revised presentation: human design service preview

26 September owner clarification supersedes the original three-card UI above:
“Have us design it” means a human prepares a proof later, not a third AI mode.
The homepage retains its primary designer CTA and adds a secondary service
section. `/design-request` is an independent form, not a designer step. Product
pages and the designer have secondary handoff links. The designer now has two
methods: AI-assisted and manual; initial AI guidance and Apply/Undo remain.

The human form collects size/shape/material/wood/fixings, exact wording, separate
notes, optional local image and contact details. It ends at a local Review request
summary with explicit “not sent” text. No endpoint/email/payment integration was
added. Current designer wording/options seed the first brief; product links seed
product presets. The independent draft stays in memory across SPA navigation;
an existing draft wins over later seeds so it is not overwritten. The preview
explains this. Refresh clears the draft and local reference image. Images are
limited to JPEG/PNG/WebP and 5 MB and are never uploaded.

This is a presentation/brief-flow preview, not the complete service. Owner inbox,
proof preparation/delivery, revision/approval and payment-link integration remain
to implement before launch. A fully featured manual text-block canvas also remains
future work; the existing line editor has not been represented as that full editor.

Preview response headers disable indexing and external script/connect traffic so
production advertising tags do not receive review traffic. Production HTML and
hosting settings are not changed. Stop only the temporary preview/tunnel processes
to remove the preview. `scripts/check-design-request.cjs` checks the human flow
without any submissions; `check-design-routes.cjs` retains mocked AI/manual checks.

Follow-up verification: TypeScript and build passed. Local 390/1440 human-flow
checks passed (required inputs, local image removal, escaped exact wording,
review/edit, draft navigation, direct route refresh, no form submissions,
no JS errors/overflow); designer handoff preserved A4 dimensions and wording,
and browser Back retained the original designer. Existing mocked AI/manual
regression checks passed after renaming methods. Mobile homepage service section
and form summary screenshots inspected. No new paid-model call was needed for
this presentation-only change; the AI connection remains enabled.

## Historical designer-only comparison previews

Owner requested the old designer-only experiment. Two plausible saved versions
were recovered without modifying their application sources:

- `MerlinDog1/plaque-store-ai-consumer` at `42bd86af2718f94fd2b15f75fb09f58edcb13758`: original designer-only proof bench.
- `MerlinDog1/plaque-store-ai-proof-bench-yuji-2026-06-18` at `ec5f9f8e5e6d9977836a4284f58d390de704ae86`: experimental creative-director brief cards.

Both passed independent npm ci/build and mobile initial-screen checks with no
page JS errors. These are candidates for the remembered version, not a claimed
identification. The shared review launcher accepts `REVIEW_BUILD_ROOT` for an
independent checkout's compiled dist and `PORT` for a separate loopback listener.
No credentials are read from that checkout; API-only forwarding/disabled checkout
and preview policies stay the same. Current AI upstream is not a historical
reproduction of their old model runtime. AI health was checked; generation in
these historical builds was not live-tested. Original sources remain on GitHub
unchanged. No site deployment, alias reassignment or database change.

## Simplified direction — 26 September, 16:32 UTC
Owner chose the current live designer UI plus instruction-based adjustments, not a new DIY route or the July showroom. Removed the experimental route selector, separate initial brief field and added 1mm nudge controls; restored original wording helper and Generate/Regenerate labels. Retained original manual tweaks and the correctness fixes (wording synchronisation, fit validation, approval reset), plus Adjust with AI and Undo.

Homepage human-design section and separate preview form now explicitly promise an emailed proof within 3 hours, as requested. Submission remains preview-only: no email, order, payment or database write. Production unchanged; automatic Git deployment guard retained.

Checks: typecheck, build, typography safety/instruction tests; updated mocked browser regression passes 390/1440 widths (original generation path, manual wording sync, approval reset, failed/successful/stale AI responses, undo, no JS errors/overflow). Public tunnel homepage/form checked at both widths; AI health enabled. No new real model generation in this revision.

## 3D preview font correction
Owner screenshots exposed serif-to-sans fallback in the temporary preview. Reproduced at390px: fontsOutlined=false and opentype.js blocked by review CSP. Corrected review-only CSP to allow the exact opentype.js1.3.4 script and Fontsource font fetch path; advertising scripts stay blocked. No designer/production renderer changes or rebuild required. Restarted only cody-current-preview. New scripts/check-preview-fonts.cjs fails before fix and passes on the public tunnel at390/1440 with fontsOutlined=true/no font failures; inspected mobile screenshot showing original serif title in3D. Existing production unchanged.

## Human design request submission — recovered checkpoint, 26 September

The form now reviews then POSTs `/api/design-requests`. The production server
validates bounded fields and an optional JPG/PNG/WebP attachment (2 MiB decoded,
3 MiB request-body cap), checks same-site JSON requests, applies the existing
per-instance IP limiter (5 attempts / 15 minutes), and rejects the honeypot.
Image signatures are checked; this is not a malware scanner or full image decode.

The endpoint sends a plain-text brief and optional attachment through Resend to
the same internal recipients as existing production order notifications, using
`getInternalProductionEmails()`. Customer email is Reply-to, never a selectable
recipient. It reuses `RESEND_API_KEY` and `ORDER_EMAIL_FROM`; those and
`ORDER_ADMIN_EMAIL` are present in Production metadata (values not retrieved).
No database migration, order, payment, upload bucket or customer email is created.
The inbox is the request record; there is no new admin queue or durable outbox.

Success requires the provider's successful response and message ID. Network or
provider errors retain the brief and attachment for retry. Stable request UUID
plus canonical payload digest supplies the Resend idempotency key (provider's
24-hour window); edited payloads are distinct. This is not indefinite duplicate
protection, and refreshing starts a new draft/UUID. In-memory rate limits are
per server instance, not a global distributed quota. No automatic retry job.

Checks: server validator/provider fixtures and actual HTTP routing/origin/body/
rate/method tests; TypeScript; build/runtime boot; 390/1440 browser tests with
mocked mail responses for review, attachment, sending, failure, unchanged retry
and receipt; existing server checkout regression. All passed. Build retains the
existing large-chunk warning. No live email was sent and no inbox delivery was
proved. Real Resend delivery must be checked after an authorised deployment;
provider acceptance alone cannot prove inbox delivery.

Production is unchanged and Git auto-deployment remains disabled. The existing
Cloudflare preview is still AI-only: its request-send endpoint returns 503,
not a simulated success. Proof preparation, sending the proof and supplying the
payment link remain manual team responsibilities; the three-hour text is the
owner's turnaround promise, not an automated scheduler. This section supersedes
earlier statements describing the implementation itself as a review-only form.

## Authorised production release — 26 September 2026, 17:32 UTC

Owner requested deployment and a quick live check. Deployed source
`3e800129b255c024563bbbac6916e28ad53b813a` to the existing InstaPlaque project:
`dpl_EG7t1wV91VTJJHeHUqWuDvmDET2A`. Vercel reported READY; independent inspection
confirmed https://instaplaque.co.uk and www aliases on this deployment.
Previous compatible release: `dpl_Etuo1oBDAerk7nFgXVa4qfCona2h` (R2-aware).
No environment changes, migration, payment changes or sibling-site deployment.

Hosted checks passed: real AI generation and instruction edit (two successful
model calls), exact wording and Undo; 3D font outlining at 390/1440; request UI
failure/retry/receipt at both widths with mocked responses; public Supabase and
Gemini configuration health. A real mobile homepage-to-form submission with a
labelled synthetic brief and PNG returned HTTP201/provider acceptance and receipt
`IP-DESIGN-42796306-3ba4-465a-b046-79d3f6c9fcfe-51ddb953`.
It explicitly says no design or reply required. Recipient inbox arrival has NOT
been independently confirmed; acceptance is not proof of delivery.

Hosted checkout UI regression passed product preset/pricing, manual bold,
approval gate/payload, PDF download, restored/stale-proof gating and mobile
containment. Model, checkout and saved-proof APIs were intercepted for that test;
no order, charge or stored proof was created. The harness needed its local asset
check to recognise /design-request as an index.html rewrite (not a static folder),
and the installed Chrome executable. Test copies/results are ignored under output.
19 prerendered pages passed local metadata/link checks. No full paid purchase.
Production is now changed; earlier undeployed statements above are historical.

## Bench fixing clearance correction — 26 September 2026

Owner's live screenshots showed lettering tight against screws and covered by
caps on 150x50 bench plaques. Shared hardware geometry now supplies the renderer
and inscription box. Bench long-axis margins increase from 6.5% to 10%; visible
hardware reserves its centre inset + radius + 3mm text gap. The existing rendered
layout refits automatically on fixing/cap changes, without generating new text.
On 150x50: side inset15mm without hardware/screws,18mm with10mm caps,22.5mm
with15mm caps. Four-screw layouts use the same conservative side band. Portrait
corner hardware uses top/bottom clearance. Non-bench dimensions remain unchanged.

Bench manual scale is bounded to the safe box; manual offsets cannot move text
outside it. The effective scale is also exposed to the existing export fitter,
so 3D/PDF outlining does not reintroduce unsafe manual enlargement. Source wording,
font proportions and generated SVG are retained. Existing approval resets remain.

Checks: TypeScript/build/runtime boot,400 layout/hardware/border/artwork cases,
and390/1440 browser checks using synthetic generation, rendered millimetre bounds
for none/two/four screws/10mm/15mmcaps/adhesive, live fixing changes with no further
AI calls, preserved wording and no horizontal overflow. Measurements allow0.05mm
for browser glyph/transform rounding. No payment, email or database action.
