import { useEffect, useState } from 'react'
import { type Clock, utcToday } from 'src/showcases/dateWindow'

const DAY_MS = 24 * 60 * 60 * 1000
/** A little past midnight, so a timer that fires early still sees the new day. */
const MIDNIGHT_MARGIN_MS = 1000

const msToNextUtcDay = (clock: Clock) => DAY_MS - (clock().getTime() % DAY_MS) + MIDNIGHT_MARGIN_MS

/**
 * Today's UTC date (`YYYY-MM-DD`), which updates at each UTC midnight and when a hidden tab shows
 * again, because a suspended tab can miss its timer. A component that filters by date window
 * calls it so that a page left open across midnight shows the new day's items.
 */
export const useUtcDay = (clock: Clock): string => {
  const [day, setDay] = useState(() => utcToday(clock))
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = () => {
      setDay(utcToday(clock))
      clearTimeout(timer)
      timer = setTimeout(update, msToNextUtcDay(clock))
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') update()
    }
    timer = setTimeout(update, msToNextUtcDay(clock))
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [clock])
  return day
}
