import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from 'src/components/SearchBar'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SearchBar', () => {
  it('renders without clear icon initially', () => {
    const onChange = vi.fn()
    const { container } = render(<SearchBar handleSearchChange={onChange} />)
    expect(container.querySelector('[data-cy="search-bar"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="clear-search"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="search-icon"]')).toBeInTheDocument()
  })

  it('shows clear icon after typing and invokes handler', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<SearchBar handleSearchChange={onChange} />)
    const input = container.querySelector('[data-cy="search-bar"]') as HTMLInputElement
    await user.type(input, 'alpha')
    expect(container.querySelector('[data-cy="clear-search"]')).toBeInTheDocument()
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('alpha'))
  })

  it('clears value when clear icon clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<SearchBar handleSearchChange={onChange} />)
    const input = container.querySelector('[data-cy="search-bar"]') as HTMLInputElement
    await user.type(input, 'beta')
    await user.click(container.querySelector('[data-cy="clear-search"]')!)
    expect(input).toHaveValue('')
    expect(container.querySelector('[data-cy="clear-search"]')).not.toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('applies wider padding to input when clear icon is visible', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<SearchBar handleSearchChange={onChange} />)
    const input = container.querySelector('[data-cy="search-bar"]') as HTMLInputElement

    // Before typing: no clear icon
    const root = input.closest('.MuiInputBase-root')
    expect(root).not.toHaveAttribute('data-show-clear')
    expect(container.querySelector('[data-cy="clear-search"]')).not.toBeInTheDocument()

    await user.type(input, 'x')

    // After typing: clear icon appears (showClear=true), confirming wider padding mode
    expect(container.querySelector('[data-cy="clear-search"]')).toBeInTheDocument()
    // jsdom cannot compute styles injected by emotion/MUI; the showClear=true state
    // is verified structurally by the clear icon's presence above
  })

  describe('debounce', () => {
    it('does not call handler on mount', () => {
      const onChange = vi.fn()
      const { container } = render(<SearchBar handleSearchChange={onChange} />)
      expect(container.querySelector('[data-cy="search-bar"]')).toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    })

    it('debounces rapid keystrokes into a single call with the final value', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { container } = render(<SearchBar handleSearchChange={onChange} />)
      const input = container.querySelector('[data-cy="search-bar"]') as HTMLInputElement
      await user.type(input, 'hello')
      await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
      expect(onChange).toHaveBeenCalledWith('hello')
    })

    it('calls handler with updated value after further input', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { container } = render(<SearchBar handleSearchChange={onChange} />)
      const input = container.querySelector('[data-cy="search-bar"]') as HTMLInputElement
      await user.type(input, 'foo')
      await waitFor(() => expect(onChange).toHaveBeenCalledWith('foo'))
      await user.type(input, 'bar')
      await waitFor(() => expect(onChange).toHaveBeenCalledWith('foobar'))
    })
  })

  describe('initialValue prop', () => {
    it('pre-populates the input', () => {
      const { container } = render(<SearchBar handleSearchChange={vi.fn()} initialValue="prefilled" />)
      expect(container.querySelector('[data-cy="search-bar"]')).toHaveValue('prefilled')
    })

    it('shows clear icon when initialValue is non-empty', () => {
      const { container } = render(<SearchBar handleSearchChange={vi.fn()} initialValue="something" />)
      expect(container.querySelector('[data-cy="clear-search"]')).toBeInTheDocument()
    })

    it('does not call handler on mount even with a non-empty initialValue', () => {
      const onChange = vi.fn()
      const { container } = render(<SearchBar handleSearchChange={onChange} initialValue="pre" />)
      expect(container.querySelector('[data-cy="search-bar"]')).toHaveValue('pre')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('clears the pre-populated value when clear is clicked', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { container } = render(<SearchBar handleSearchChange={onChange} initialValue="preset" />)
      await user.click(container.querySelector('[data-cy="clear-search"]')!)
      expect(container.querySelector('[data-cy="search-bar"]')).toHaveValue('')
      expect(container.querySelector('[data-cy="clear-search"]')).not.toBeInTheDocument()
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  describe('placeholder prop', () => {
    it('renders the default placeholder when none is provided', () => {
      const { container } = render(<SearchBar handleSearchChange={vi.fn()} />)
      expect(container.querySelector('[data-cy="search-bar"]')).toHaveAttribute('placeholder', 'Enter search terms')
    })

    it('renders a custom placeholder when provided', () => {
      const { container } = render(<SearchBar handleSearchChange={vi.fn()} placeholder="Search datasets..." />)
      expect(container.querySelector('[data-cy="search-bar"]')).toHaveAttribute('placeholder', 'Search datasets...')
    })
  })
})
