// Eligibility only. This never grants a price override: the private checkout
// API still requires owner authentication and explicit live-payment intent.
export const isOnePoundTestPlaque = (state) => (
  state?.width === 123 && state?.height === 456 && state?.shape === 'rect'
  && state?.wood === false && state?.memorialImageEnabled === false
);
