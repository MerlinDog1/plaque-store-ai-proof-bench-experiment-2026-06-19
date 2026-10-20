# Contact follow-ups, compact phone cookie banner and PDF double-tap guard — released

Owner request (Telegram, 20 October 2026 15:44 UTC): "change everything you can for now without my
involvement - this number please 07464 843841". Built on the live WhatsApp release
(`d46288d`, `dpl_24vUHJbRcoE9vHGs2XX9Mw7LfTSK`) on branch `codex/instaplaque-contact-followups-20261020`.

## Changes

- `eaff934` One business number. Phone, `tel:` link and the schema `telephone` are now 07464 843841,
  the same as WhatsApp. Suggested WhatsApp/email text says "a memorial plaque", "an A5 plaque" or
  "a stainless steel plaque" (`plaqueSubject`), not the plural page title. WhatsApp click tracking
  takes the number from `businessContact.whatsappHref` instead of a second hard-coded copy, and
  `check:posthog` now loads the real `shopInformation`. The cookie banner keeps the same wording and
  equally weighted Accept/Reject, styled in `shopfront.css`. Desktop is unchanged (520 px, 16 px from
  the bottom). On screens up to 720 px it is compact (187 px instead of about 310 px) and sits above
  the Design online / WhatsApp / Email bar, so the bar is usable before a choice is made.
- `a232517` One proof PDF at a time. Live at about 15:39 UTC a phone double-tapped Download proof PDF:
  both `/api/proof-sessions` saves returned 201 (Vercel logs), yet the phone recorded
  `proof_download_failed`. `handleExportPdf` now ignores taps while an export runs (released in
  `finally`). `proof_download_failed` carries `reason` = `save_http` | `network` | `no_token`.

## Checks

Typecheck (run with no `dist/`: the tsconfig has `allowJs` and no `include`), `check:posthog`,
`check:google-consent`, `check:analytics-redaction`, `check:google-purchase`, and `build` with all
postbuild consent, SEO, product-policy, catalogue and merchant-feed checks.

Local preview at 390 and 1440 px, external requests blocked. The memorial banner is 582–769 and the bar
starts at 777, with no overlap or horizontal overflow; Reject leaves the bar. The contact page shows
WhatsApp and Phone 07464 843841 with `tel:+447464843841`, and the JSON-LD telephone is +447464843841.
The memorial and bench prefills are singular; the designer has no bar; desktop banner styles are
unchanged; there are no page errors.

PDF guard check, mobile, with the save mocked as 201 after 1.5 s: a double tap made one save, and a
later tap made the second. The PDF itself fails in that harness only because the CDN libraries were
blocked.

## Release

| Step | Deployment | Entry chunk | Notes |
|---|---|---|---|
| Promoted first | `dpl_3NV4phJ7tydQE53zNV6w7LL8g7vK` | `index-Bci1HRc2.js` | sha256 `4b4be0ae5be7fa93…`, same as the local build |
| Live now | `dpl_ED4Br3NUyBhcHemAbzLHFyWN3zb7` (`instaplaque-2qe28sgz0…`) | `index-4sjvs3Ge.js` | CSS `index-CjTnvjmD.css` unchanged |

Both were staged with `vercel deploy --prod --skip-domain` (no link files, node_modules symlink
removed) and then promoted.

Candidate and live checks: Supabase and Gemini health are ok. Home, memorial, bench, brass, garden,
contact and design return 200 with the new bundle, and www returns 308. The live 390/1440 browser check
repeats the local results.

Rollback: `vercel promote dpl_24vUHJbRcoE9vHGs2XX9Mw7LfTSK --scope dullaghan31-3959s-projects` (the
WhatsApp release), or `dpl_3NV4phJ7tydQE53zNV6w7LL8g7vK` to keep the number and banner changes without
the PDF guard.

## Google Analytics (property 418296125), changed by Cody's service account

- Event-scoped custom dimensions: `channel`, `placement`, `contact_reference`, `price_context`, `step`
  and `product` (customDimensions 16167650487, 16167681443, 16167677255, 16167704607, 16167684659,
  16167653904).
- InstaPlaque stream 15942844144 event create rules: `whatsapp_click`, `email_click` and `phone_click`
  from `contact_clicked` with the matching `channel` (16167581924, 16167711582, 16167705271).
- Key events, once per session: `whatsapp_click`, `email_click`, `phone_click` and `enquiry_submitted`
  (16167652765, 16167679172, 16167683205, 16167702450).
- Undo: archive the custom dimensions, delete the event create rules and delete the key events by
  those ids.
- Still owner-only: the GA4 to Google Ads link (googleAdsLinks is 0 on 20 Oct), importing the key events
  into Ads as secondary conversions, the WhatsApp Business profile on 07464 843841, and Gmail
  "send as" for hello@.
