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

## Product pages in line with the homepage — released about 20:30 UTC

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

## Branded share images — released about 20:43 UTC

Owner msg 5167: "Also change open graph image". Commit `6298ff1` on the same branch.

- **Images:** eight 1200 x 630 JPGs (78–125 KB) in `public/site-images/og/`, one each for home and the
  seven indexable category and landing pages (memorial, bench, brass, stainless steel, custom,
  garden, opening). The retired slugs 301 to one of these. Each card has:
  - the page's hero photo on the left
  - a dark green panel with the InstaPlaque wordmark
  - the page H1 and a tagline (memorial "Remember them in your own words.", bench "A small place for
    a lasting memory.", garden "A dedication for a favourite place.", opening "Mark the occasion
    clearly.", home "Some words deserve to stay.")
  - "Free proof · UK delivery included" and instaplaque.co.uk
  The old share images were WebP (memorial, bench, garden) or an unbranded photo (home). WebP
  previews are unreliable in some apps.
- **Regenerate:** `node scripts/generate-og-images.mjs`. The slug list and paths are in
  `services/shareImages.mjs`.
- **Tags:** `og:image` and `twitter:image` use the cards in the prerender
  (`scripts/prerender-product-pages.mjs`) and after hydration (`useSeoMeta`). Pages without a card
  (about, design, materials and similar) use the home card instead of the old proof-row photo.
  Merchant product pages keep their product photo. Structured-data images are unchanged.
- **Checks:** typecheck, posthog, consent, redaction, purchase and build (all postbuild checks)
  pass. Built and hydrated tags were checked locally for home, memorial, bench, garden, a merchant
  page and about.
- **Release:** live `dpl_AiAD9heNUrrWHdRE2PSUEfhfRpqu` (`index-COfE0Vt7.js`, sha256
  `c04ee00a653a23fc…`, same as the local build); health endpoints OK. Rollback:
  `dpl_J47PdMVYUD3rEaiXFcW7ExB3ZywT`.
- **Live verification:** all eight pages serve their card in raw HTML and after hydration, and the
  merchant page keeps its photo. `og-home.jpg` and `og-memorial-plaques.jpg` return 200 image/jpeg.
  Facebook and WhatsApp cache previews, so a link shared before today can show the old image until
  their cache refreshes. The Facebook Sharing Debugger's "Scrape again" forces a refresh.

## Lower-page CTAs and help copy in line with WhatsApp — released about 21:00 UTC

Owner msg 5174: "Just sense check all the text and stuff now that we added the WhatsApp stuff. Do
any cta further down the page sound wrong now". Commit `49febe1`.

What sounded wrong, and the change:

- **Home "Want us to take care of the design?"** offered only the form ("Have us design it") and
  "email your proof", although the hero says to talk to a designer on WhatsApp. It now leads with
  **Chat on WhatsApp**, with **Use the design form ↗** as the second option. The steps now read
  "Your wording, a photo of where it's going, or a design you made in ChatGPT" and "We design it:
  your proof within 3 hours, by WhatsApp or email". The owner's 3-hour promise is kept, and now also
  covers WhatsApp.
- **Closing bands (home and every product page)** offered only "Design your plaque". They now have
  **Chat on WhatsApp** beside it, both 240 px wide.
- **FAQ side link** "Talk to us ↗" (contact page) is now **Ask us on WhatsApp ↗**.
- **FAQ "Can you help with an unusual plaque?"** said email only. It now gives WhatsApp and email,
  and mentions a photo of the spot or a ChatGPT design. **"Can I see my plaque before I pay?"** now
  also says we send the proof to approve when we design it.
- **Product heroes** had a fourth route under the description, "Or send a design brief online ↗",
  which duplicated WhatsApp and email. It has been removed, along with the unused `onRequestDesign`
  prop.
- **Memorial wording:** "Prefer us to arrange your wording?" (form) is now "Prefer us to design it?
  Send your wording on WhatsApp ↗".
- **Designer guide:** the line now offers WhatsApp or the design form.
- **About page:** "InstaPlaque is for designing your own inscription plaque" contradicted the design
  service. It now reads "design your own online, or send us your wording and we'll design it for you".
- **Contact page:** adds "WhatsApp is usually quickest" and the photo/ChatGPT hint.
- **Analytics:** new `page` contact placement (type and PostHog enum) for these lower-page WhatsApp
  links. `scripts/check-design-request.cjs` now clicks "Use the design form ↗".

Left as they were: the design form page and its 3-hour promise, the how-it-works designer copy, the
opening page's "Discuss a deadline or artwork requirement" (contact page) and the materials closing.

- **Checks:** typecheck, posthog, consent, redaction, purchase and build (all postbuild checks)
  pass. Local and live 390/1440 checks cover the WhatsApp links (placement `page`), the design form
  link opening `/design-request`, the brief link being gone, the FAQ answer, no page errors and no
  overflow.
- **Release:** live `dpl_BDFdvxSqAhkRNsPn5cCALgNzGPwd` (`index-Dv8vp22V.js`, sha256
  `f29e6306f99082d4…`, same as the local build); health endpoints OK. Rollback:
  `dpl_AiAD9heNUrrWHdRE2PSUEfhfRpqu`.

