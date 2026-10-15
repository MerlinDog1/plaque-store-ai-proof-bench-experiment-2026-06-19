const standardSizes = [[150,50],[225,75],[225,65],[150,75],[150,65],[200,50],
  [210,148],[297,210],[200,150],[300,200],[400,300]];
const matches = (state, pair) => Math.max(state.width,state.height) === Math.max(...pair)
  && Math.min(state.width,state.height) === Math.min(...pair);
export function getProductionEstimate(state) {
  let days = 5;
  let note = 'Standard size and finish.';
  if (state.wood) {
    days = [[210,148],[297,210]].some(pair => matches(state,pair)) ? 10 : 15;
    note = 'Wood backing needs extra workshop time.';
  } else if (state.shape !== 'rect' || !standardSizes.some(pair => matches(state,pair))) {
    days = 15; note = 'Custom sizes and shapes need a longer workshop slot.';
  } else if (state.material === 'aged-brass') {
    days = 7; note = 'Aged brass needs additional finishing time.';
  }
  return { days, deliveryDays: days + 1,
    label: `Estimated production: ${days} working days after proof approval and payment, plus delivery.`, note };
}
