// Production times in working days, from proof approval and payment (owner msg 6947, 28 Oct 2026):
// - any shape that fits within 600 × 400 mm (either way round): 5;
// - aged brass: 7;
// - wood backing: 10 up to A4 (297 × 210 mm, either way round), 15 above that;
// - larger than 600 × 400 mm: 15.
// They don't add together: the longest that applies is the estimate, so 15 is the most.
const fitsWithin = (state, longMm, shortMm) => Math.max(state.width, state.height) <= longMm
  && Math.min(state.width, state.height) <= shortMm;
export function getProductionEstimate(state) {
  let days = 5;
  let note = 'Usual production time.';
  if (!fitsWithin(state, 600, 400)) {
    days = 15; note = 'Plaques larger than 600 × 400 mm need a longer workshop slot.';
  }
  if (state.material === 'aged-brass' && days < 7) {
    days = 7; note = 'Aged brass needs additional finishing time.';
  }
  const woodDays = state.wood ? (fitsWithin(state, 297, 210) ? 10 : 15) : 0;
  if (woodDays > days) {
    days = woodDays; note = 'Wood backing needs extra workshop time.';
  }
  return { days, deliveryDays: days + 1,
    label: `Estimated production: ${days} working days after proof approval and payment, plus delivery.`, note };
}
