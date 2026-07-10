import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  sanitizeProofSessionRecord,
  sanitizeProofSessionSvgFields,
} from "../services/svgSanitizer.mjs";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let serviceClient = null;

export const getSupabaseConfig = () => ({
  hasUrl: Boolean(supabaseUrl),
  hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
  configured: Boolean(supabaseUrl && supabaseServiceRoleKey),
});

export const getSupabaseServiceClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceClient;
};

const makePublicToken = () => {
  return randomBytes(32).toString("base64url");
};

export const createProofSession = async (payload) => {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase is not configured on the server.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const sanitizedSvg = sanitizeProofSessionSvgFields(payload);
  const sanitizedRecord = sanitizeProofSessionRecord({
    plaque_state: sanitizedSvg.plaqueState,
    generated_svg: sanitizedSvg.generatedSvg,
    metadata: payload.metadata || {},
  });
  const row = {
    public_token: makePublicToken(),
    email: payload.email || null,
    status: payload.status || "draft",
    plaque_state: sanitizedSvg.plaqueState,
    wording: payload.wording || "",
    generated_svg: sanitizedSvg.generatedSvg,
    ai_reasoning: payload.aiReasoning || payload.ai_reasoning || null,
    price_estimate_pence: Number.isInteger(payload.priceEstimatePence)
      ? payload.priceEstimatePence
      : payload.price_estimate_pence || 0,
    currency: payload.currency || "gbp",
    quote_flags: payload.quoteFlags || payload.quote_flags || {},
    metadata: sanitizedRecord.metadata,
    expires_at: payload.expiresAt || payload.expires_at || expiresAt.toISOString(),
  };

  const { data, error } = await supabase
    .from("proof_sessions")
    .insert(row)
    .select("id, public_token, status, expires_at, created_at")
    .single();

  if (error) throw error;
  return data;
};

export const getProofSessionByToken = async (publicToken) => {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase is not configured on the server.");
  }

  const { data, error } = await supabase
    .from("proof_sessions")
    .select(
      "id, public_token, email, status, plaque_state, wording, generated_svg, ai_reasoning, price_estimate_pence, currency, quote_flags, metadata, expires_at, created_at, updated_at",
    )
    .eq("public_token", publicToken)
    .maybeSingle();

  if (error) throw error;
  return sanitizeProofSessionRecord(data);
};
