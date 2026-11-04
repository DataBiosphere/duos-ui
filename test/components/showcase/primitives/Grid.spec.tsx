import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Grid } from 'src/components/showcase/primitives/Grid'

describe('Grid', () => {
  it('renders the featured item first, then one list item per card', () => {
    render(<Grid featured={<p>Terra</p>}><p>Galaxy</p><p>Dockstore</p></Grid>)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map(item => item.textContent)).toEqual(['Terra', 'Galaxy', 'Dockstore'])
    expect(items[0]).toHaveClass('showcase-grid__featured')
  })

  it('renders no featured item when none is given', () => {
    render(<Grid><p>Galaxy</p></Grid>)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('leaves out empty children, such as a false conditional', () => {
    const showOptional = false
    render(<Grid>{showOptional && <p>Optional</p>}{null}<p>Galaxy</p></Grid>)
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(['Galaxy'])
  })

  it('keeps a surviving card mounted when another is removed', () => {
    const { rerender } = render(<Grid><a key="a" href="#a">Alpha</a><a key="b" href="#b">Beta</a></Grid>)
    const beta = screen.getByRole('link', { name: 'Beta' })
    beta.focus()
    rerender(<Grid><a key="b" href="#b">Beta</a></Grid>)
    expect(screen.getByRole('link', { name: 'Beta' })).toBe(beta)
    expect(beta).toHaveFocus()
  })
})
