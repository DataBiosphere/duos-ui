import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HighlightText } from 'src/components/HighlightText'

describe('HighlightText', () => {
  it('renders an empty div when text is undefined', () => {
    const { container } = render(
      <HighlightText highlight={[{ bgColor: 'black', textColor: 'white', words: ['hello'] }]} />,
    )
    expect(container.querySelector('div > div')).not.toBeNull()
    expect(container.querySelectorAll('span').length).toBe(0)
  })

  it('renders text with no highlighting when no words match', () => {
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    const { container } = render(
      <HighlightText
        highlight={[{ bgColor: 'black', textColor: 'black', words: ['unrelated', 'unused', 'words'] }]}
        text={lorem}
      />,
    )
    const spans = container.querySelectorAll('[data-cy^="highlight-"]')
    expect(spans.length).toBe(1)
    expect(spans[0].textContent).toBe(lorem)
    expect((spans[1] as HTMLElement | undefined)?.textContent).toBeUndefined()
  })

  it('highlights with the correct color, irrelevant of casing', () => {
    const text = 'ThE quick BroWn fox jUMpS over tHe laZy log.'
    const { container } = render(
      <HighlightText
        highlight={[{ bgColor: 'rgb(0, 0, 0)', textColor: 'rgb(255, 255, 255)', words: ['the', 'jumps'] }]}
        text={text}
      />,
    )
    const spans = container.querySelectorAll('[data-cy^="highlight-"]')

    expect(spans[0].textContent).toMatch(/^ThE$/)
    expect((spans[0] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect((spans[0] as HTMLElement).style.color).toBe('rgb(255, 255, 255)')

    expect(spans[1].textContent).toMatch(/^ quick BroWn fox $/)
    expect((spans[1] as HTMLElement).style.backgroundColor).toBe('')

    expect(spans[2].textContent).toMatch(/^jUMpS$/)
    expect((spans[2] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect((spans[2] as HTMLElement).style.color).toBe('rgb(255, 255, 255)')

    expect(spans[3].textContent).toMatch(/^ over $/)
    expect((spans[3] as HTMLElement).style.backgroundColor).toBe('')

    expect(spans[4].textContent).toMatch(/^tHe$/)
    expect((spans[4] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')

    expect(spans[5].textContent).toMatch(/^ laZy log\.$/)
    expect((spans[5] as HTMLElement).style.backgroundColor).toBe('')
  })

  it('highlights with multiple colors', () => {
    const text = 'Example text. Test'
    const { container } = render(
      <HighlightText
        highlight={[
          { bgColor: 'rgb(0, 0, 0)', textColor: 'rgb(255, 255, 255)', words: ['example', 'test'] },
          { bgColor: 'rgb(0, 255, 0)', textColor: 'rgb(255, 0, 0)', words: ['text'] },
        ]}
        text={text}
      />,
    )
    const spanColors = container.querySelectorAll('[data-cy^="highlight-"]')

    expect(spanColors[0].textContent).toMatch(/^Example$/)
    expect((spanColors[0] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect((spanColors[0] as HTMLElement).style.color).toBe('rgb(255, 255, 255)')

    expect(spanColors[1].textContent).toMatch(/^ $/)
    expect((spanColors[1] as HTMLElement).style.backgroundColor).toBe('')

    expect(spanColors[2].textContent).toMatch(/^text$/)
    expect((spanColors[2] as HTMLElement).style.backgroundColor).toBe('rgb(0, 255, 0)')
    expect((spanColors[2] as HTMLElement).style.color).toBe('rgb(255, 0, 0)')

    expect(spanColors[3].textContent).toMatch(/^\. $/)
    expect((spanColors[3] as HTMLElement).style.backgroundColor).toBe('')

    expect(spanColors[4].textContent).toMatch(/^Test$/)
    expect((spanColors[4] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect((spanColors[4] as HTMLElement).style.color).toBe('rgb(255, 255, 255)')
  })

  it('does not highlight a word not surrounded by whitespace or punctuation', () => {
    const text = 'Example; asdfexample exampleasdf Words. multiple words. ahhhhmultiple words'
    const { container } = render(
      <HighlightText
        highlight={[{ bgColor: 'rgb(0, 0, 0)', textColor: 'rgb(255, 255, 255)', words: ['example', 'multiple words'] }]}
        text={text}
      />,
    )
    const spans = container.querySelectorAll('[data-cy^="highlight-"]')

    expect(spans[0].textContent).toMatch(/^Example$/)
    expect((spans[0] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect((spans[0] as HTMLElement).style.color).toBe('rgb(255, 255, 255)')

    expect(spans[1].textContent).toMatch(/^; asdfexample exampleasdf Words\. $/)
    expect((spans[1] as HTMLElement).style.backgroundColor).toBe('')

    expect(spans[2].textContent).toMatch(/^multiple words$/)
    expect((spans[2] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect((spans[2] as HTMLElement).style.color).toBe('rgb(255, 255, 255)')

    expect(spans[3].textContent).toMatch(/^\. ahhhhmultiple words$/)
    expect((spans[3] as HTMLElement).style.backgroundColor).toBe('')
  })
})
