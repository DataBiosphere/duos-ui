/**
 * Date-window filtering for time-bounded showcase content (DT-4276, S1.3): announcements, events
 * and anything else with a `startDate`/`endDate`. Dates are `YYYY-MM-DD` calendar dates in UTC and
 * a window includes both ends, so an item shows from the start of its `startDate` through the end
 * of its `endDate` (UTC), and appears or expires without a code change.
 *
 * Every function takes a `Clock`, so tests pass a fixed instant instead of mocking global time.
 */

/** Returns the current instant. */
export type Clock = () => Date

export const systemClock: Clock = () => new Date()

/** A window with no `startDate` is open from the past, for items that show until they end. */
export type DateWindow = { startDate?: string, endDate: string }

/** Today's UTC calendar date as `YYYY-MM-DD`. */
export const utcToday = (clock: Clock = systemClock): string => clock().toISOString().slice(0, 10)

// `YYYY-MM-DD` strings compare in calendar order, so no date parsing is needed.
const includesDay = ({ startDate, endDate }: DateWindow, day: string) =>
  (startDate === undefined || startDate <= day) && day <= endDate

export const isInDateWindow = (window: DateWindow, clock: Clock = systemClock): boolean =>
  includesDay(window, utcToday(clock))

/** The items whose window includes today, in their original order. Reads the clock once, so a
 * list filtered across midnight is still consistent. */
export const filterByDateWindow = <T extends DateWindow>(items: readonly T[], clock: Clock = systemClock): T[] => {
  const today = utcToday(clock)
  return items.filter(item => includesDay(item, today))
}
