import React, { useState } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { useDebouncedValue } from 'src/hooks/useDebouncedValue'

const TestComponent = ({ delay }: { delay?: number }) => {
  const [value, setValue] = useState('initial')
  const debouncedValue = useDebouncedValue(value, delay)

  return (
    <div>
      <div id="value">{value}</div>
      <div id="debounced">{debouncedValue}</div>
      <input
        id="input"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  )
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    render(<TestComponent />)
    expect(document.getElementById('value')!.textContent).toBe('initial')
    expect(document.getElementById('debounced')!.textContent).toBe('initial')
  })

  it('debounces value updates', async () => {
    render(<TestComponent delay={100} />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated' } })
    })

    expect(document.getElementById('value')!.textContent).toBe('updated')

    // Should still be initial immediately after the change
    expect(document.getElementById('debounced')!.textContent).toBe('initial')

    // Advance timers past the delay
    await act(async () => {
      vi.advanceTimersByTime(150)
    })

    expect(document.getElementById('debounced')!.textContent).toBe('updated')
  })

  it('cancels previous timeout when value changes again', async () => {
    render(<TestComponent delay={1000} />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'first' } })
    })

    // Advance a little, then change the value again — should cancel the first timeout
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    act(() => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'second' } })
    })

    // Advance past where the first timeout would have fired, but before the second
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(document.getElementById('debounced')!.textContent).toBe('initial')

    // Advance enough to fire the second timeout
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(document.getElementById('debounced')!.textContent).toBe('second')
  })
})
