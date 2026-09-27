# Checkout return — 27 September 2026

Owner requested that leaving Stripe return to the current designer review/PDF page, not the legacy checkout screen.

New hosted Stripe sessions cancel to /design with the existing protected order recovery parameters. Both new and previously issued /checkout recovery URLs restore the saved local design, select final review, and replace the route with /design. Refresh retains recovery. Recovery tokens are not proof-session tokens: only the authenticated order endpoint handles these links. Loading hides the old checkout UI. Missing local artwork or failed authorization shows recovery guidance instead of presenting a blank replacement proof. The browser's existing local checkout snapshot remains necessary for editable artwork; cross-device recovery uses the original PDF return link.

No pricing, payment completion, approval, model, lettering or database changes. Existing local-state recovery behaviour preserved; no customer data committed. Tests use synthetic state and intercepted APIs, including the PDF-save endpoint; no actual orders, Stripe sessions, payments, AI calls or database writes.

Checks: typecheck, build, server-checkout contract; browser cancellation via both routes at390/1440, exact lettering restoration, final review/PDF button, refresh, actual PDF download, no overflow/JS errors; unauthorized recovery fails closed.

Base ba80243 (app cfbf876), previous live dpl_5Ym9b3aPCaWcm8j234cMFJedHw4E is the compatible rollback. Task branch codex/checkout-return.
