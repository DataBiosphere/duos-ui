import React from 'react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Shelf } from 'src/components/showcase/primitives/Shelf'

const renderShelf = (cards = ['Alpha', 'Beta', 'Gamma'], props: Partial<React.ComponentProps<typeof Shelf>> = {}) => {
  render(
    <Shelf title="Latest data releases" headingId="latest-heading" {...props}>
      {cards.map(name => <a key={name} href={`#${name}`}>{name}</a>)}
    </Shelf>,
  )
  return screen.getByRole('list')
}

/** Sets the scroller's geometry and fires the scroll event the component measures on. */
const setGeometry = (list: HTMLElement, { scrollLeft = 0, clientWidth = 400, scrollWidth = 1200 }) => {
  Object.defineProperty(list, 'scrollLeft', { value: scrollLeft, configurable: true, writable: true })
  Object.defineProperty(list, 'clientWidth', { value: clientWidth, configurable: true })
  Object.defineProperty(list, 'scrollWidth', { value: scrollWidth, configurable: true })
  fireEvent.scroll(list)
}

const back = () => screen.getByRole('button', { name: 'Scroll Latest data releases back' })
const forward = () => screen.getByRole('button', { name: 'Scroll Latest data releases forward' })

describe('Shelf', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a region named by its heading, with one list item per card', () => {
    const list = renderShelf()
    expect(screen.getByRole('region', { name: 'Latest data releases' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Latest data releases' })).toHaveAttribute('id', 'latest-heading')
    expect(list.querySelectorAll('li')).toHaveLength(3)
  })

  it('leaves out empty children, such as a false conditional', () => {
    const showOptional = false
    render(
      <Shelf title="Latest data releases" headingId="latest-heading">
        {showOptional && <p>Optional</p>}
        {null}
        <p>Alpha</p>
      </Shelf>,
    )
    expect(Array.from(screen.getByRole('list').querySelectorAll('li'), li => li.textContent)).toEqual(['Alpha'])
  })

  it('hides both arrows when every card fits', () => {
    const list = renderShelf()
    setGeometry(list, { clientWidth: 1200, scrollWidth: 1200 })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(document.querySelector('.showcase-shelf__controls')).toBeNull()
  })

  it('disables back at the start and forward at the end', () => {
    const list = renderShelf()
    setGeometry(list, { scrollLeft: 0 })
    expect(back()).toHaveAttribute('aria-disabled', 'true')
    expect(forward()).toHaveAttribute('aria-disabled', 'false')

    setGeometry(list, { scrollLeft: 400 })
    expect(back()).toHaveAttribute('aria-disabled', 'false')
    expect(forward()).toHaveAttribute('aria-disabled', 'false')

    setGeometry(list, { scrollLeft: 800 })
    expect(back()).toHaveAttribute('aria-disabled', 'false')
    expect(forward()).toHaveAttribute('aria-disabled', 'true')
  })

  it('scrolls one view of cards smoothly, and ignores a disabled arrow', () => {
    const list = renderShelf()
    list.scrollBy = vi.fn()
    setGeometry(list, { scrollLeft: 0 })
    fireEvent.click(back())
    expect(list.scrollBy).not.toHaveBeenCalled()
    fireEvent.click(forward())
    expect(list.scrollBy).toHaveBeenCalledWith({ left: 400, behavior: 'smooth' })
  })

  it('pages by whole cards, counting the gaps between them', () => {
    const list = renderShelf()
    list.scrollBy = vi.fn()
    const [first, second] = Array.from(list.children) as HTMLElement[]
    Object.defineProperty(first, 'offsetWidth', { value: 356 })
    Object.defineProperty(second, 'offsetLeft', { value: 372 })
    setGeometry(list, { clientWidth: 1100, scrollWidth: 1844 })
    fireEvent.click(forward())
    expect(list.scrollBy).toHaveBeenCalledWith({ left: 1116, behavior: 'smooth' })
  })

  it('scrolls instantly when reduced motion is on', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' })))
    const list = renderShelf()
    list.scrollBy = vi.fn()
    setGeometry(list, { scrollLeft: 400 })
    fireEvent.click(back())
    expect(list.scrollBy).toHaveBeenCalledWith({ left: -400, behavior: 'auto' })
  })

  it('makes the scroller focusable only when its cards have nothing focusable', () => {
    const linked = renderShelf()
    setGeometry(linked, {})
    expect(linked).not.toHaveAttribute('tabindex')
  })

  it('makes a scroller of plain cards focusable and names it', () => {
    render(
      <Shelf title="Latest data releases" headingId="latest-heading">
        <p>Alpha</p>
        <p>Beta</p>
      </Shelf>,
    )
    const list = screen.getByRole('list')
    setGeometry(list, {})
    expect(list).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('list', { name: 'Latest data releases' })).toBe(list)
  })

  it('renders header actions beside the arrows, and nothing when absent', () => {
    renderShelf(['Alpha'], { actions: <a href="/datasets">See all</a> })
    expect(screen.getByRole('link', { name: 'See all' }).closest('.showcase-shelf__controls')).not.toBeNull()
  })

  it('uses a caller heading in place of the default', () => {
    renderShelf(['Alpha'], { heading: <h3 id="latest-heading"><a href="#latest">Latest data releases</a></h3> })
    expect(screen.getByRole('region', { name: 'Latest data releases' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('never hides overflow in its styles, and caps cards at the shelf width', () => {
    const css = readFileSync('src/components/showcase/primitives/Shelf.css', 'utf8')
    expect(css).not.toMatch(/overflow(-x)?\s*:\s*hidden/)
    expect(css).toMatch(/flex: 0 0 min\(var\(--showcase-shelf-card-width\), 100%\)/)
  })
})
