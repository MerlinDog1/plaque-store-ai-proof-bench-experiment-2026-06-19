# Homepage routes, descriptive H1 and the WhatsApp push — released 20 October 2026, about 20:10 UTC

Owner messages 5128, 5132, 5137, 5142 and 5156, then "Go" (msg 5161). Branch
`codex/instaplaque-home-routes-20261020` (be3f335 … 6cde5e5) on top of the live H1 release (`088fea9`).

## What changed

- **Home H1:** "Personalised brass & stainless steel plaques". The old slogan "Some words deserve to
  stay." is now a gold serif tagline under it.
- **Kicker:** "Free proof · UK delivery included".
- **Lead line:** "Design online instantly, or talk to one of our designers on WhatsApp."
- **Two equal first choices:** the dark-green "Design online" button and a "Chat on WhatsApp" button
  with the WhatsApp glyph, in teal `#0f7d70` with white text (at least 4.5:1 contrast).
- **ChatGPT prompt:** under the choices, "Made a design in ChatGPT? Send us the picture and we'll make it
  real." The link opens WhatsApp. The same line is in the product-page help box.
- **Phones:** "What's your plaque for?" shows four photo tiles (Bench / Memorial / Garden / Opening with
  their from-prices), using 480 px thumbnails of about 88 KB total, followed by "Something else? WhatsApp
  us your idea". At 390×844 all four tiles sit above the contact bar (tiles 503–772, bar 777).
- **Contact bar:** the WhatsApp button in the phone contact bar uses the same teal and glyph on every
  page.
- **WhatsApp suggested message:** now "Hi InstaPlaque, I'm interested in a plaque (ref IP-…)" on every
  page.
- **Email:** moved to the note under the price.
- **Desktop:** same hero copy and buttons with the bench photo unchanged; the tiles are phone-only.
- `check-live-seo` asserts the new H1 and tagline.

## Checks

- typecheck, `check:posthog`, `check:google-consent`, `check:analytics-redaction`,
  `check:google-purchase`, and `build` with all postbuild checks.
- Local 390 and 1440 px screenshots for every iteration.

## Release

- Live `dpl_4fxkjCKyECqXUTuSnjoFjKxh1BcY` (`instaplaque-i31hqtyej…`), entry `index-5l9e4xtj.js`
  (sha256 `916de30d9a76d73a…`, same as the local build), CSS `index-BuR92kjp.css`.
- Rollback: `vercel promote dpl_9owv5L5wmkfjBNBTXRFTxPu3r7AP --scope dullaghan31-3959s-projects`.
- Candidate checks: Supabase and Gemini health ok.
- Live pages: home, memorial, bench, brass, garden, opening, contact and design return 200 with one H1,
  and www returns 308.
- Live phone check:
  - tiles above the bar, images loaded
  - suggested message "Hi InstaPlaque, I'm interested in a plaque"
  - memorial help box shows the ChatGPT line
  - teal WhatsApp bar
  - no page errors, no overflow; desktop tiles hidden

## Product pages in line with the homepage — released about 20:40 UTC

Owner msg 5165: "Improve SEO h1 stuff on this page and bring ctas in line with home page"
(/memorial-plaques). Commit `d1169d4` on `codex/instaplaque-product-ctas-20261020`.

- **New H1s:** "Personalised memorial plaques", "Personalised bench plaques", "Personalised brass
  plaques", "Personalised stainless steel plaques", "Personalised garden plaques", "Personalised pet
  memorial plaques" and "Personalised memorial bench plaques". Other pages keep their titles; the
  title tags and descriptions are unchanged.
- **Every product page:**
  - The kicker is "Free proof · UK delivery included".
  - The single Design button, its note and the help box are replaced by the homepage pattern:
    - lead line
    - "Design online" plus the teal "Chat on WhatsApp"
    - the "Made a design in ChatGPT?" prompt
    - the free-proof note with an email link
  - The photo, price and small print stay above the buttons.
- **Checks:** typecheck, posthog, consent, redaction, purchase and build all pass. Local 390 and
  1440 px screenshots taken.
- **Release:** live `dpl_J47PdMVYUD3rEaiXFcW7ExB3ZywT` (`index-BTg_29uo.js`, sha256 `22712c3b6c0bd0de…`,
  same as the local build). Rollback: `dpl_4fxkjCKyECqXUTuSnjoFjKxh1BcY`.
- **Live verification:** home, memorial, bench, brass, stainless, garden, opening, contact and design
  return 200 with the new bundle; the live phone check passes with no errors.
