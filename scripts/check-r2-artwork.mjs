// Explicit destination integration test. Creates and removes only its own
// synthetic records/objects; never sends email or calls a payment provider.
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";

assert.equal(process.env.SUPABASE_URL, "https://fygweiynqkglmjwqlouc.supabase.co");
assert.equal(process.env.R2_ACCOUNT_ID, "d844912202f1e4590f683e78980f8109");
process.env.ARTWORK_STORAGE_PROVIDER = "r2";
const { storeArtwork, loadArtwork } = await import("../server/artwork-storage.mjs");
const { createProofSession, getProofSessionByToken, getSupabaseServiceClient } = await import("../server/supabase.mjs");
const { createExternalOrder, getOrderById, attachVisualProofToOrder } = await import("../server/orders.mjs");
const { buildEmail } = await import("../server/email.mjs");
const db = getSupabaseServiceClient();
const s3 = new S3Client({ region: "auto", forcePathStyle: true,
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const id = `migration-test-${randomUUID()}`;
const scopes = [`order:${id}`, `fixture:${id}`];
const sha = (text) => createHash("sha256").update(text).digest("hex");
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0L10 10" /></svg>';
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
let proofId;
try {
  const fixture = { generated_svg: svg, metadata: { image: png }, productionArtworkPdf: Buffer.from("%PDF-1.7\nSynthetic migration test").toString("base64") };
  const stored = await storeArtwork(fixture, scopes[1]);
  assert.match(stored.generated_svg, /^r2-artwork:v1:svg:/);
  assert.equal(JSON.stringify(await loadArtwork(stored, scopes[1])), JSON.stringify(fixture));
  assert.equal(JSON.stringify(await storeArtwork(fixture, scopes[1])), JSON.stringify(stored), "Retries preserve immutable content");
  await assert.rejects(loadArtwork(stored, `${scopes[1]}-different-record`), "Cross-record reads must fail");
  await assert.rejects(storeArtwork(stored, scopes[1]), /cannot be supplied/);
  const invalid = { generated_svg: stored.generated_svg.replace(/[a-f0-9]{64}$/, "0".repeat(64)) };
  await s3.send(new PutObjectCommand({ Bucket: "order-proofs", Key: `instaplaque/${sha(scopes[1])}/${"0".repeat(64)}.svg`, Body: "wrong bytes" }));
  await assert.rejects(loadArtwork(invalid, scopes[1]), /integrity/);

  const proof = await createProofSession({ wording: "Synthetic migration check", generatedSvg: svg,
    plaqueState: { generatedSvgContent: svg }, metadata: { image: png } });
  proofId = proof.id;
  scopes.push(`proof:${proof.public_token}`);
  const { data: rawProof, error: proofError } = await db.from("proof_sessions").select("generated_svg,plaque_state,metadata").eq("id", proofId).single();
  assert.ifError(proofError);
  assert.match(rawProof.generated_svg, /^r2-artwork:/);
  assert.match(rawProof.plaque_state.generatedSvgContent, /^r2-artwork:/);
  assert.match(rawProof.metadata.image, /^r2-artwork:/);
  const hydratedProof = await getProofSessionByToken(proof.public_token);
  assert.match(hydratedProof.generated_svg, /^<svg/);
  assert.equal(hydratedProof.metadata.image, png);

  const order = await createExternalOrder({ id, customerEmail: "migration-test@example.invalid",
    stripeCheckoutSessionId: `cs_test_${id}`, status: "checkout_started", paymentStatus: "unpaid",
    plaqueState: { generatedSvgContent: svg }, proofPackage: { productionSvg: svg } });
  assert.match(order.proofPackage.productionSvg, /^<svg/);
  const attached = await attachVisualProofToOrder(id, { stripeCheckoutSessionId: `cs_test_${id}`, visualProofPng: png,
    visualProofSvg: svg, productionArtworkPdf: fixture.productionArtworkPdf });
  assert.equal(attached.attached, true);
  assert.equal(attached.order.proofPackage.visualProofPng, png);
  const duplicate = await attachVisualProofToOrder(id, { stripeCheckoutSessionId: `cs_test_${id}`, visualProofPng: png });
  assert.equal(duplicate.attached, false);
  const { data: rawOrder, error: orderError } = await db.from("storefront_orders").select("proof_package,plaque_state").eq("id", id).single();
  assert.ifError(orderError);
  assert.match(rawOrder.proof_package.visualProofPng, /^r2-artwork:/);
  assert.match(rawOrder.proof_package.productionArtworkPdf, /^r2-artwork:/);
  const reloaded = await getOrderById(id);
  const message = buildEmail("admin-production-pack", reloaded);
  assert(message.attachments.some((item) => item.content_type === "application/pdf"));
  assert(message.attachments.some((item) => item.content_type === "image/png"));
  console.log("R2/private database integration passed: artwork hydration, immutable proof claim, retries, scoped reads, integrity and email attachment preparation. No messages or payments sent.");
} finally {
  if (proofId) { const { error } = await db.from("proof_sessions").delete().eq("id", proofId); assert.ifError(error); }
  const { error } = await db.from("storefront_orders").delete().eq("id", id); assert.ifError(error);
  for (const scope of scopes) {
    const { Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket: "order-proofs", Prefix: `instaplaque/${sha(scope)}/` }));
    if (Contents.length) {
      const result = await s3.send(new DeleteObjectsCommand({ Bucket: "order-proofs", Delete: { Objects: Contents.map(({ Key }) => ({ Key })) } }));
      assert(!result.Errors?.length);
    }
  }
}
