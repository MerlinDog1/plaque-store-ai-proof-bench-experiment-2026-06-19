# WhatsApp on computers: a QR code to scan with the phone (25 Oct 2026)

## Why

The owner (msg 6356): "how are we handling WhatsApp on desktop? A qr code would work huh?" On a computer, wa.me
opens WhatsApp's "Open app / Continue to WhatsApp Web" page, which only works for people with the desktop app or a
linked WhatsApp Web. Most people have WhatsApp only on their phone. GA4 since 1 Oct (owner's towns excluded): 42 of
235 sessions were on computers, but both recent sales (£520) came from computers, and both WhatsApp taps came from
phones.

## What changed

- **Computers.** A plain left click on any WhatsApp button (all of them go through `ContactLink` in
  `components/ContactOptions.tsx`) opens a small window instead of a WhatsApp tab. The window holds:
  - a QR code of the same wa.me link, with the message and the click's `IP-` reference;
  - the number, for typing it in;
  - "Open WhatsApp on this computer", which is the same link in a new tab and closes the window;
  - "Email us instead", with the same reference.
  The window is a `<dialog>` portalled to `<body>`, so Escape, the × and a click outside close it. The QR is drawn
  in the browser by the existing `qrcode` dependency, loaded only when the window opens.
- **What counts as a computer.** `onComputer()` requires all of these: no phone or tablet user agent, not an iPad
  posing as a Mac (touch points), and a mouse-type pointer (`(hover: hover) and (pointer: fine)`). Anything else
  keeps the old behaviour.
- **Unchanged.** Phones and tablets go straight to WhatsApp as before. Ctrl-, Cmd-, Shift- or Alt-clicks and
  middle-clicks are left to the browser, so they still open WhatsApp in a tab.
- **Analytics** (only with the visitor's consent, as before):
  - opening the window records one `contact_clicked` (channel whatsapp, placement and reference), because the
    document-level listener skips cancelled clicks;
  - the window's own "Open WhatsApp" link carries `data-contact-counted`, so `services/posthogAnalytics.ts` doesn't
    count it a second time;
  - the email link inside the window counts as an email contact, as any email link does.
- **Styles.** `.shop-wa-panel*` in `shopfront.css` use `var(--shop-…, fallback)` because the window sits outside
  `.shopfront`. The QR box is `box-sizing: content-box`, because the site's reset is border-box and the 220 px code
  otherwise covered the box's bottom edge (commit 0a597e8).

## Checks

Scripts in `workspace/output/instaplaque-whatsapp-qr-20261025/`:

- `run_check.sh PAGE [STAGES]` tests a staged deployment. It warms a cache of the page and its scripts through
  `proxy_server.py`, then runs `check_qr.cjs` with Chrome pointed at `https://instaplaque.co.uk` and every request
  answered from local files. Analytics code runs, but nothing reaches the live site, WhatsApp or PostHog.
  - **computer:** the window opens and the click opens no tab; the QR decodes (jsQR) to
    `https://wa.me/447464843841?text=…(ref IP-XXXXXXXXXX)`; the open and email links carry the same reference;
    Escape and a click outside close it; "Open WhatsApp" opens it in a tab and closes the window; a Ctrl-click is left
    to the browser.
  - **consent:** opening the window sends exactly one PostHog `ip_contact_clicked` with the reference, plus one GA4
    event, and the click-through adds none.
  - **phone:** iPhone 13, no window, straight to wa.me.
- `run_live.sh PAGE` runs the computer and phone stages on the live site. Analytics, Vercel insights and /api are
  blocked, and WhatsApp is answered locally.

Results:

- The candidate passed every stage on /memorial-plaques.
- After release, the live site passed on /garden-plaques.
- `verify_live.py` (BUNDLE=index-BDjeRSTY.js) passed: 175 product pages, 771 linked assets identical to `public/`.
- On a busy account, Chrome only fits with `--single-process` and the other flags in `check_qr.cjs`; peak ≈0.4 GiB.

## Release

- Commits e7202d5 and 0a597e8 on `codex/instaplaque-garden-real-photos-20261025`.
- Candidate `instaplaque-d69xdmlx7` (dpl_JDHcpsNf3gxTY6m5ZuQmBzAwtPrQ), promoted on the owner's "Yes run the qr code
  live" (msg 6373) at 18:04:54 UTC. Bundle index-BDjeRSTY.js, CSS index-BiwCtd0S.css.
- **Rollback:** dpl_HEmDPQNGwsHSA6xX7BS7ABVSDGPN. With `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set, run
  `vercel promote https://instaplaque-f3z1146u3-dullaghan31-3959s-projects.vercel.app --yes`. Keep this deployment
  in storage clean-ups until the next release.
- The first candidate, `instaplaque-7gxfcx0lp` (with the QR-box edge), is superseded and unused.

## Mistake during release

The second test deploy was run without `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`, and this worktree has no `.vercel` link.
The CLI therefore did three things:
- created a new Vercel project, `instaplaque-contact-followups`;
- connected it to this GitHub repository;
- wrote `.vercel/` here.

Its one deployment was private (Vercel login) and had no domain. To clean up, I:
1. removed `.vercel/`;
2. disconnected Git;
3. deleted the project on the owner's yes (msg 6373), and checked that `instaplaque` was untouched.

Always deploy with both env vars and check the log says `Deploying dullaghan31-3959s-projects/instaplaque`.
