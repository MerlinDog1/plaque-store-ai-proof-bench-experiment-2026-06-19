# Remove length-only checkout gate — 27 September 2026

Owner requested removing the blanket restriction after a 297×210mm approved proof was blocked with “long inscription needs readability review”. This was a >360-character checkout rule, not measured lettering size.

Application source: e73db85e1e0993569be44aa55bfb33c21843da55, branch codex/remove-length-gate, worktree projects/instaplaque-remove-length-gate. Based on verified MEDIUM production release 730f748 plus its handover0487b50.

Only production code change: remove the three-line length-only condition in services/checkoutPolicy.mjs, shared by browser pricing, server order creation and Stripe parameter validation. Existing artwork/oversize/heart quote rules, proof approval, price authority, 4,000-character server input maximum, AI lettering/fit rules and MEDIUM/16k configuration remain unchanged. No lowering of layout font-size limits.

Checks: server-checkout suite including360/361/650/4000-character acceptance through order construction and Stripe parameter creation; other quote reasons remain active. Typecheck and production build/runtime checks pass. Local390/1440 browser test of441-character A4 wood-backed brass proof passes with real UI checkout payload validated locally and all API calls intercepted. Test needed the existing accessible step name “Proof” and ALLOW_LOCAL_CHECKOUT_ORIGIN=true for local validation; no app change was needed for those harness corrections.

Live deployment dpl_MKer6sXvFh1U6HBNLKCAZgZdDAn7 READY; canonical and www independently verified. Hosted390/1440 intercepted checkout checks passed for441-character approved proof. Real public API probe with555 characters returned422 proof_not_approved, proving the length quote gate was passed and mandatory approval still stops the request before persistence. Initial probe omitted fixingHoleCount and correctly returned400; corrected synthetic request gave the expected approval rejection. No actual order, payment, email, proof save, AI call or database write is necessary for these checks. Browser checks stop at intercepted checkout; a real API rejection probe may deliberately omit proof approval to verify the length gate is gone without reaching persistence.

Compatible previous release/rollback: dpl_sM6tNv6rC2ouab27KDUzypd6P8qL (MEDIUM). Re-promote only if needed, then verify both aliases. No database rollback.
