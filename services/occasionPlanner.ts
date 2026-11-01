// The opening page's date planner (components/CategoryTemplate.tsx, OccasionPlanner; occasion research section c,
// /opening-plaques item 2): for the date of an event, the last day to approve the proof and pay so that a plaque made
// in the catalogue's production days (offer.productionDays) arrives in time. Counted back in working days: the
// production days, one working day's delivery (as checkout and Merchant Center state it, services/merchantPolicies.mjs)
// and one working day to spare, missing out weekends and bank holidays. Pure (no imports), so
// scripts/check-category-template.mjs can test it against a calendar of its own.

/** England and Wales bank holidays (GOV.UK). */
export const BANK_HOLIDAYS = new Set(['2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28',
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28']);
/** The bank holidays are listed up to this day. A later date isn't counted (the planner asks people to check with us). */
export const PLANNER_LAST_DAY = '2027-12-31';
export const DELIVERY_WORKING_DAYS = 1;
export const SPARE_WORKING_DAYS = 1;

/** Dates are UTC midnights; days are YYYY-MM-DD. */
export const isoDay = (date: Date) => date.toISOString().slice(0, 10);
export const isWorkingDay = (date: Date) => date.getUTCDay() % 6 !== 0 && !BANK_HOLIDAYS.has(isoDay(date));

/** The working day `count` working days before `date`. */
export function workingDaysBefore(date: Date, count: number) {
  const day = new Date(date.getTime());
  for (let left = count; left > 0;) {
    day.setUTCDate(day.getUTCDate() - 1);
    if (isWorkingDay(day)) left -= 1;
  }
  return day;
}

export type ApproveBy = { status: 'ok' | 'today' | 'late' | 'unknown'; day?: string };

/** For an event on `event` (YYYY-MM-DD) and a plaque made in `productionDays` working days: the last day to approve and
 * pay. 'late' when that day is before `today` (too close to promise), 'unknown' when the event is past PLANNER_LAST_DAY
 * or not a date. */
export function approveBy(event: string, productionDays: number, today: string): ApproveBy {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event) || Number.isNaN(Date.parse(`${event}T00:00:00Z`)) || event > PLANNER_LAST_DAY) return { status: 'unknown' };
  const day = isoDay(workingDaysBefore(new Date(`${event}T00:00:00Z`), productionDays + DELIVERY_WORKING_DAYS + SPARE_WORKING_DAYS));
  if (day < today) return { status: 'late', day };
  return { status: day === today ? 'today' : 'ok', day };
}
