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

/** Both dates are required, as the schema requires them on every dated item. */
export type DateWindow = { startDate: string, endDate: string }

/** Today's UTC calendar date as `YYYY-MM-DD`. */
export const utcToday = (clock: Clock = systemClock): string => clock().toISOString().slice(0, 10)

// `YYYY-MM-DD` strings compare in calendar order, so no date parsing is needed.
const includesDay = ({ startDate, endDate }: DateWindow, day: string) =>
  startDate <= day && day <= endDate

export const isInDateWindow = (window: DateWindow, clock: Clock = systemClock): boolean =>
  includesDay(window, utcToday(clock))

/** The items whose window includes today, in their original order. Reads the clock once, so a
 * list filtered across midnight is still consistent. */
export const filterByDateWindow = <T extends DateWindow>(items: readonly T[], clock: Clock = systemClock): T[] => {
  const today = utcToday(clock)
  return items.filter(item => includesDay(item, today))
}

/** The "New in DUOS" window: a dataset is new for 30 days after its available date (contracts
 * record), counting that day as day 0. */
export const NEW_IN_DUOS_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * True when a dataset's "New in DUOS" date (`DatasetSummary.availableDate`, a UTC calendar date) is
 * today or up to `NEW_IN_DUOS_DAYS` days before it. A future date is not new: it is a data error,
 * and a badge on it would last longer than the window.
 */
export const isNewInDuos = (availableDate: string | null, clock: Clock = systemClock): boolean => {
  if (availableDate === null) return false
  const today = utcToday(clock)
  const first = new Date(Date.parse(`${today}T00:00:00Z`) - NEW_IN_DUOS_DAYS * DAY_MS).toISOString().slice(0, 10)
  return first <= availableDate && availableDate <= today
}
