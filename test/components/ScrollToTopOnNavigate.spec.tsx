import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import ScrollToTopOnNavigate from 'src/components/ScrollToTopOnNavigate'

const Page = ({ label }: { label: string }) => {
  const navigate = useNavigate()
  return (
    <div>
      <span>{label}</span>
      <button onClick={() => navigate('/second')}>go forward</button>
      <button onClick={() => navigate(-1)}>go back</button>
    </div>
  )
}

const mount = (initialEntries = ['/first']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <ScrollToTopOnNavigate />
      <Routes>
        <Route path="/first" element={<Page label="First page" />} />
        <Route path="/second" element={<Page label="Second page" />} />
      </Routes>
    </MemoryRouter>,
  )

describe('ScrollToTopOnNavigate', () => {
  let scrollTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /**
   * The initial load is a POP, so a bookmark deep into a page keeps the offset the browser
   * restored rather than being snapped to the top before the reader sees it.
   */
  it('leaves the offset alone on first load', () => {
    mount()

    expect(screen.getByText('First page')).toBeInTheDocument()
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls to the top when following a link', async () => {
    const user = userEvent.setup()
    mount()

    await user.click(screen.getByRole('button', { name: 'go forward' }))

    expect(await screen.findByText('Second page')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 })
  })

  /** Back is exactly when the reader wants their place back, so the browser keeps it. */
  it('leaves the offset alone on Back', async () => {
    const user = userEvent.setup()
    mount()

    await user.click(screen.getByRole('button', { name: 'go forward' }))
    await screen.findByText('Second page')
    scrollTo.mockClear()

    await user.click(screen.getByRole('button', { name: 'go back' }))

    expect(await screen.findByText('First page')).toBeInTheDocument()
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
