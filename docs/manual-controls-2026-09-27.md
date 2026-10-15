# Manual control verification and decimal fix — 27 September 2026

Owner asked whether Tweak manually works correctly. Live390/1440 reproduction found that typing6.5 could become0.15 because each keystroke immediately updated the controlled numeric field. Clearing the field shrank the text to0.01, decimal punctuation was normalized away, and display precision hid the actual result.

New FontSizeInput retains incomplete local text and commits a positive finite value only on blur/Enter. Empty/invalid input restores the actual value. Rejected geometry edits also restore the displayed value. Step buttons still apply immediately and synchronize the field. No model, lettering-limit, geometry, price or checkout change.

Local390/1440 checks passed: actual sequential decimal typing6.5, empty draft leaves proof untouched,3.5 accepted,+/−, oversized edit rejected with actual value restored, invalid draft reset, bold, text-to-wording synchronization, Undo and proof-approval invalidation. Zero AI calls; all APIs intercepted; no orders or writes. scripts/check-manual-controls.cjs is the repeatable test. Existing design-route regression updated to blur before expecting size application.

Typecheck/build and hosted verification recorded at release. No per-line position or font-picker feature was added: this correction covers the currently exposed text/size/bold controls. Previous compatible deployment dpl_3RyiPdtffNRKuy7vZT9p8WbCDapr retains the typing bug.

Release: app cfbf876 deployed to dpl_5Ym9b3aPCaWcm8j234cMFJedHw4E. Canonical/www independently READY. Typecheck/build passed. Full390/1440 manual-control test repeated on public site passed; no model calls or writes.
