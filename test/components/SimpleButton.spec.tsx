import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SimpleButton from 'src/components/SimpleButton'

const renderButton = async (overrides = {}) => {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <SimpleButton
        label="Submit"
        onClick={vi.fn()}
        {...overrides}
      />,
    )
  })
  return result!
}

describe('SimpleButton', () => {
  it('renders the label text', async () => {
    await renderButton()
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('uses label-derived id by default', async () => {
    await renderButton()
    expect(document.getElementById('Submit-button')).toBeInTheDocument()
  })

  it('uses keyProp as id when provided', async () => {
    await renderButton({ keyProp: 'custom-id' })
    expect(document.getElementById('custom-id')).toBeInTheDocument()
  })

  it('calls onClick when clicked and not disabled', async () => {
    const onClick = vi.fn()
    await renderButton({ onClick })
    fireEvent.click(screen.getByText('Submit'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    await renderButton({ onClick, disabled: true })
    fireEvent.click(screen.getByText('Submit'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies opacity 0.5 when disabled', async () => {
    const { container } = await renderButton({ disabled: true })
    const btn = container.querySelector('button') as HTMLElement
    expect(btn.style.opacity).toBe('0.5')
  })

  it('applies default blue background when no color prop is given', async () => {
    const { container } = await renderButton()
    const btn = container.querySelector('button') as HTMLElement
    expect(btn.style.backgroundColor).toBe('rgb(0, 96, 159)')
  })

  it('applies baseColor when provided', async () => {
    const { container } = await renderButton({ baseColor: 'rgb(255, 0, 0)' })
    const btn = container.querySelector('button') as HTMLElement
    expect(btn.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('applies backgroundColor over baseColor when both provided', async () => {
    const { container } = await renderButton({ backgroundColor: 'rgb(0, 255, 0)', baseColor: 'rgb(255, 0, 0)' })
    const btn = container.querySelector('button') as HTMLElement
    expect(btn.style.backgroundColor).toBe('rgb(0, 255, 0)')
  })

  it('merges additionalStyle into the button style', async () => {
    const { container } = await renderButton({ additionalStyle: { fontSize: '20px' } })
    const btn = container.querySelector('button') as HTMLElement
    expect(btn.style.fontSize).toBe('20px')
  })

  it('applies hover background color on mouse enter', async () => {
    const { container } = await renderButton({ hoverStyle: { backgroundColor: 'rgb(100, 0, 0)' } })
    const btn = container.querySelector('button') as HTMLElement
    fireEvent.mouseEnter(btn)
    expect(btn.style.backgroundColor).toBe('rgb(100, 0, 0)')
  })

  it('reverts to base color on mouse leave', async () => {
    const { container } = await renderButton({ baseColor: 'rgb(0, 96, 159)', hoverStyle: { backgroundColor: 'rgb(100, 0, 0)' } })
    const btn = container.querySelector('button') as HTMLElement
    fireEvent.mouseEnter(btn)
    fireEvent.mouseLeave(btn)
    expect(btn.style.backgroundColor).toBe('rgb(0, 96, 159)')
  })

  it('does not apply hover style when disabled', async () => {
    const { container } = await renderButton({ disabled: true, baseColor: 'rgb(0, 96, 159)', hoverStyle: { backgroundColor: 'rgb(100, 0, 0)' } })
    const btn = container.querySelector('button') as HTMLElement
    fireEvent.mouseEnter(btn)
    expect(btn.style.backgroundColor).toBe('rgb(0, 96, 159)')
  })
})
