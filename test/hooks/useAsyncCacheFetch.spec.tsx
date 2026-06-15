import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import useAsyncCacheFetch from 'src/hooks/useAsyncCacheFetch'

type TestAsyncCacheFetchProps<T> = {
  fetchFn: (id: string) => Promise<T>
}

function TestAsyncCacheFetch<T>({ fetchFn }: Readonly<TestAsyncCacheFetchProps<T>>) {
  const { fetchWithCache, clearCache } = useAsyncCacheFetch<string, T>()
  const [result, setResult] = useState<T | null>(null)

  const handleFetch = async () => {
    const data = await fetchWithCache('test', fetchFn)
    setResult(data)
  }

  const handleClear = () => {
    clearCache('test')
    setResult(null)
  }

  return (
    <div>
      <button onClick={handleFetch}>Fetch</button>
      <button onClick={handleClear}>Clear</button>
      <div data-testid="result">{result !== null ? String(result) : ''}</div>
    </div>
  )
}

describe('useAsyncCacheFetch', () => {
  it('fetches and caches data', async () => {
    const fetchFn = vi.fn().mockResolvedValue('fetched-data')
    render(<TestAsyncCacheFetch fetchFn={fetchFn} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(screen.getByTestId('result').textContent).toBe('fetched-data')

    // second click should use the cache
    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(screen.getByTestId('result').textContent).toBe('fetched-data')

    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('clears cache and refetches', async () => {
    const fetchFn = vi.fn().mockResolvedValue('fetched-data')
    render(<TestAsyncCacheFetch fetchFn={fetchFn} />)

    // first fetch
    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(screen.getByTestId('result').textContent).toBe('fetched-data')
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // clear cache
    act(() => {
      fireEvent.click(screen.getByText('Clear'))
    })
    expect(screen.getByTestId('result').textContent).toBe('')

    // fetch again -> should call fetchFn a second time
    await act(async () => {
      fireEvent.click(screen.getByText('Fetch'))
    })
    expect(screen.getByTestId('result').textContent).toBe('fetched-data')
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
})
