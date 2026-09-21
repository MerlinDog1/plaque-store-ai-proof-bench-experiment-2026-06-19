# Artwork storage

Set ARTWORK_STORAGE_PROVIDER=r2 with server-only R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY. New saved proofs, order proof packages and embedded artwork use the private order-proofs bucket. Supabase keeps content references; existing API responses and email attachments hydrate the original content. Legacy inline records remain readable and move to R2 when saved again. No historical artwork backfill is required for this migration: the owner confirmed those assets are tests.

R2 writes finish before database references are committed. Keys are scoped to the record and SHA-256 content, conditional writes prevent overwrite, and reads verify the hash and size. A client cannot supply storage references. Existing SVG sanitation runs before storage and after hydration. Payment checks and the atomic proof-attachment claim are unchanged. Missing/corrupt R2 content fails the request instead of silently returning an older file.

Leaving the provider unset retains inline storage for existing installations. Once a database contains R2 references, rollback must retain compatible readers and the R2 credentials. Do not simply disable R2 or restore an older application after accepting new writes.

Validation: checkout security, input sanitization, fail-closed configuration, TypeScript, production build and scripts/check-r2-artwork.mjs. The integration script tests the actual fresh database/R2, proof claim immutability, saved proof hydration, content retries, scope isolation, corruption detection and email attachment preparation. It removes only its own synthetic records and files and sends no messages or payments.
