import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { DarAnalyticsControls } from 'src/components/dar_analytics/DarAnalyticsControls'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-06-30', bucket: 'quarter' }

describe('DarAnalyticsControls', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const typeDate = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } })

  it('reports a valid date change once typing settles', () => {
    render(<DarAnalyticsControls range={range} onChange={onChange} />)

    typeDate('From', '2025-10-01')
    expect(onChange).not.toHaveBeenCalled()

    act(() => vi.runAllTimers())
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ from: '2025-10-01', to: '2026-06-30' })
  })

  it('reports only the date typing settled on, not the years passed through', () => {
    render(<DarAnalyticsControls range={range} onChange={onChange} />)

    typeDate('From', '0002-10-01')
    typeDate('From', '0020-10-01')
    typeDate('From', '2025-10-01')
    act(() => vi.runAllTimers())

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ from: '2025-10-01', to: '2026-06-30' })
  })

  it('holds back a range that ends before it starts and says why', () => {
    render(<DarAnalyticsControls range={range} onChange={onChange} />)

    typeDate('To', '2025-12-31')
    act(() => vi.runAllTimers())

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Enter dates from 1900 on, with To on or after From')).toBeInTheDocument()
  })

  it('drops a pending valid change when the next keystroke makes the range invalid', () => {
    render(<DarAnalyticsControls range={range} onChange={onChange} />)

    typeDate('To', '2026-01-31')
    typeDate('To', '2025-01-31')
    act(() => vi.runAllTimers())

    expect(onChange).not.toHaveBeenCalled()
  })

  it('defaults to the bucket it is given and reports a new one', () => {
    render(<DarAnalyticsControls range={range} onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Quarter' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Month' }))

    expect(onChange).toHaveBeenCalledWith({ bucket: 'month' })
  })

  it('ignores a click that would clear the bucket', () => {
    render(<DarAnalyticsControls range={range} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Quarter' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
