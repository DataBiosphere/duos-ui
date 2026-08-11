import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import useDacRules from 'src/hooks/useDacRules'
import { DAC } from 'src/libs/ajax/DAC'

const TestDacRules: React.FC<{ dacIds: number[] }> = ({ dacIds }) => {
  const fetchDacRules = useDacRules()
  const [count, setCount] = React.useState(0)

  const handleFetch = async () => {
    await Promise.allSettled(dacIds.map(dacId => fetchDacRules(dacId)))
    setCount(current => current + 1)
  }

  return (
    <div>
      <button onClick={handleFetch}>Fetch</button>
      <div data-testid="rounds">{count}</div>
    </div>
  )
}

describe('useDacRules', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches each DAC once and reuses the result on later passes', async () => {
    const fetchRules = vi.spyOn(DAC, 'fetchDACbotRules').mockResolvedValue([] as never)
    render(<TestDacRules dacIds={[1, 2]} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(fetchRules).toHaveBeenCalledTimes(2)

    // A second pass — paging, sorting, or the other lookup — hits the cache
    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(screen.getByTestId('rounds').textContent).toBe('2')
    expect(fetchRules).toHaveBeenCalledTimes(2)
  })

  it('issues a single request when the same DAC is requested concurrently', async () => {
    const fetchRules = vi.spyOn(DAC, 'fetchDACbotRules').mockResolvedValue([] as never)
    render(<TestDacRules dacIds={[7, 7, 7]} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(fetchRules).toHaveBeenCalledTimes(1)
  })

  it('retries a DAC whose rules request failed', async () => {
    const fetchRules = vi.spyOn(DAC, 'fetchDACbotRules')
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValue([] as never)
    render(<TestDacRules dacIds={[3]} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(fetchRules).toHaveBeenCalledTimes(2)
  })
})
