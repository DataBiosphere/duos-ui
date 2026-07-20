import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollectionVoteButton from 'src/components/collection_vote_box/CollectionVoteButton'

const baseColor = 'rgb(9, 72, 183)'
const getButton = () => screen.getByRole('button')

describe('CollectionVoteButton', () => {
  it('renders the default (unselected) style', () => {
    render(<CollectionVoteButton label="Yes" />)
    const button = getButton()
    expect(button.style.border).toBe('1px solid')
    expect(button.style.cursor).toBe('default')
  })

  it('renders the selected style using baseColor', () => {
    render(<CollectionVoteButton label="Yes" isSelected baseColor={baseColor} />)
    const button = getButton()
    expect(button.style.border).toBe('0px')
    expect(button.style.backgroundColor).toBe(baseColor)
    expect(button.style.cursor).toBe('pointer')
  })

  it('shows the selected style on hover and reverts on leave when unselected', () => {
    render(<CollectionVoteButton label="Yes" baseColor={baseColor} />)
    const button = getButton()
    expect(button.style.border).toBe('1px solid')

    fireEvent.mouseEnter(button)
    expect(button.style.border).toBe('0px')
    expect(button.style.backgroundColor).toBe(baseColor)

    fireEvent.mouseLeave(button)
    expect(button.style.border).toBe('1px solid')
  })

  it('keeps the selected style after mouse leave when selected', () => {
    render(<CollectionVoteButton label="Yes" isSelected baseColor={baseColor} />)
    const button = getButton()
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)
    expect(button.style.border).toBe('0px')
  })

  it('uses the default cursor when selected but disabled', () => {
    render(<CollectionVoteButton label="Yes" isSelected disabled baseColor={baseColor} />)
    expect(getButton().style.cursor).toBe('default')
  })

  it('calls onClick when clicked and not disabled', () => {
    const onClick = vi.fn().mockResolvedValue(undefined)
    render(<CollectionVoteButton label="Yes" onClick={onClick} />)
    fireEvent.click(getButton())
    expect(onClick).toHaveBeenCalled()
  })
})
