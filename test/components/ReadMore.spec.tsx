import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ReadMore } from 'src/components/ReadMore'

describe('ReadMore', () => {
  it('renders content and a Read More button by default', () => {
    render(
      <ReadMore
        content={[<span key="a">Hello</span>]}
        moreContent={[<span key="b">World</span>]}
      />,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.queryByText('World')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument()
  })

  it('shows moreContent and Read Less button after clicking Read More', () => {
    render(
      <ReadMore
        content={[<span key="a">Hello</span>]}
        moreContent={[<span key="b">World</span>]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /read more/i }))
    expect(screen.getByText('World')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /read less/i })).toBeInTheDocument()
  })

  it('collapses back after clicking Read Less', () => {
    render(
      <ReadMore
        content={[<span key="a">Hello</span>]}
        moreContent={[<span key="b">World</span>]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /read more/i }))
    fireEvent.click(screen.getByRole('button', { name: /read less/i }))
    expect(screen.queryByText('World')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument()
  })

  it('uses custom readMoreText and readLessText', () => {
    render(
      <ReadMore
        content={[<span key="a">A</span>]}
        readMoreText="Show More"
        readLessText="Show Less"
      />,
    )
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /show more/i }))
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument()
  })

  it('hides the read link when hideUnderLimit is true and content is within charLimit', () => {
    render(
      <ReadMore
        content={[<span key="a">A</span>, <span key="b">B</span>]}
        charLimit={10}
        hideUnderLimit={true}
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('still shows the read link when hideUnderLimit is true but content exceeds charLimit', () => {
    const content = Array.from({ length: 15 }, (_, i) => <span key={i}>{i}</span>)
    render(
      <ReadMore
        content={content}
        charLimit={10}
        hideUnderLimit={true}
      />,
    )
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument()
  })
})
