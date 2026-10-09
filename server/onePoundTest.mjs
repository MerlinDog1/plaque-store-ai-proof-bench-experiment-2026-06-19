// The server route must authenticate the owner before requesting this policy.
// A client-provided metadata flag never enables it.
export const ONE_POUND_TEST_POLICY = "123x456-sandbox-v1";

export const isOnePoundTestOrder = (order) => (
  order?.metadata?.checkoutTestPolicy === ONE_POUND_TEST_POLICY
);

export const getOnePoundTestPrice = (state) => {
  if (state?.width !== 123 || state?.height !== 456 || state.shape !== "rect"
    || state.wood !== false || state.memorialImageEnabled !== false) {
    const error = new Error("The £1 sandbox test requires a 123 × 456 mm rectangular plaque without wood or artwork.");
    error.statusCode = 422;
    error.code = "invalid_test_plaque";
    throw error;
  }
  return { total: 1, base: 1, wood: 0, delivery: 0, quoteRequired: false, quoteReasons: [] };
};

export const assertOnePoundTestSession = (order, session) => {
  if (!isOnePoundTestOrder(order)) return;
  getOnePoundTestPrice(order.plaqueState);
  if (order.totalPence !== 100 || order.currency !== "gbp"
    || session?.livemode !== false || !/^cs_test_[A-Za-z0-9]+$/.test(session?.id || "")) {
    const error = new Error("This £1 order only accepts a matching Stripe sandbox session.");
    error.statusCode = 409;
    error.code = "test_payment_mode_mismatch";
    throw error;
  }
};
