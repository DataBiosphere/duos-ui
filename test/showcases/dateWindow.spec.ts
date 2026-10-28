import { describe, expect, it, vi } from 'vitest'
import { type Clock, filterByDateWindow, isInDateWindow, utcToday } from 'src/showcases/dateWindow'

const at = (iso: string): Clock => () => new Date(iso)

const announcement = { id: 'a', text: 'Call for proposals', url: '/datalibrary', startDate: '2026-03-01', endDate: '2026-03-31' }

describe('utcToday', () => {
  it('reads the UTC calendar date', () => {
    expect(utcToday(at('2026-03-01T00:00:00Z'))).toBe('2026-03-01')
  })

  it('uses UTC, not the offset of the instant', () => {
    // 20:00 on Feb 28 in New York is already Mar 1 in UTC.
    expect(utcToday(at('2026-02-28T20:00:00-05:00'))).toBe('2026-03-01')
  })
})

describe('isInDateWindow', () => {
  it.each([
    ['2026-02-28T23:59:59.999Z', false, 'the day before startDate'],
    ['2026-03-01T00:00:00Z', true, 'the first instant of startDate'],
    ['2026-03-15T12:00:00Z', true, 'mid-window'],
    ['2026-03-31T23:59:59.999Z', true, 'the last instant of endDate'],
    ['2026-04-01T00:00:00Z', false, 'the day after endDate'],
  ])('at %s is %s (%s)', (now, expected) => {
    expect(isInDateWindow(announcement, at(now))).toBe(expected)
  })

  it('shows a one-day window for that whole UTC day', () => {
    const oneDay = { startDate: '2026-03-01', endDate: '2026-03-01' }
    expect(isInDateWindow(oneDay, at('2026-03-01T00:00:00Z'))).toBe(true)
    expect(isInDateWindow(oneDay, at('2026-03-01T23:59:59.999Z'))).toBe(true)
    expect(isInDateWindow(oneDay, at('2026-03-02T00:00:00Z'))).toBe(false)
  })
})

describe('filterByDateWindow', () => {
  const items = [
    { ...announcement, id: 'past', startDate: '2026-01-01', endDate: '2026-01-31' },
    { ...announcement, id: 'current-1' },
    { ...announcement, id: 'future', startDate: '2026-05-01', endDate: '2026-05-31' },
    { ...announcement, id: 'current-2', startDate: '2026-03-10', endDate: '2026-03-10' },
  ]
  const ids = (now: string) => filterByDateWindow(items, at(now)).map(item => item.id)

  it('keeps the items whose window includes today, in order', () => {
    expect(ids('2026-03-10T08:00:00Z')).toEqual(['current-1', 'current-2'])
  })

  it('shows items appearing and expiring as the clock moves', () => {
    expect(ids('2026-01-15T00:00:00Z')).toEqual(['past'])
    expect(ids('2026-03-11T00:00:00Z')).toEqual(['current-1'])
    expect(ids('2026-04-15T00:00:00Z')).toEqual([])
    expect(ids('2026-05-01T00:00:00Z')).toEqual(['future'])
  })

  it('reads the clock once per call', () => {
    const clock = vi.fn(at('2026-03-10T00:00:00Z'))
    filterByDateWindow(items, clock)
    expect(clock).toHaveBeenCalledTimes(1)
  })

  it('returns a new array and leaves the input alone', () => {
    const result = filterByDateWindow(items, at('2026-03-10T00:00:00Z'))
    expect(result).not.toBe(items)
    expect(items).toHaveLength(4)
  })
})
