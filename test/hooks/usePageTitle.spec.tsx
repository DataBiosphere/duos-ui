import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { usePageTitle } from 'src/hooks/usePageTitle'

// Test component that uses the hook
const TestComponent = ({ title, suffix }: { title: string, suffix?: string }) => {
  usePageTitle(title, suffix)
  return <div>Test Component</div>
}

describe('usePageTitle Hook', () => {
  const originalTitle = 'Original Title'

  beforeEach(() => {
    document.title = originalTitle
  })

  it('sets the document title with default DUOS suffix', () => {
    render(<TestComponent title="Test Page" />)
    expect(document.title).toBe('Test Page | DUOS')
  })

  it('sets the document title with custom suffix', () => {
    render(<TestComponent title="Test Page" suffix="Custom" />)
    expect(document.title).toBe('Test Page | Custom')
  })

  it('sets only suffix when pageTitle is empty', () => {
    render(<TestComponent title="" />)
    expect(document.title).toBe('DUOS')
  })

  it('updates title when props change', () => {
    const TestWrapper = () => {
      const [title, setTitle] = React.useState('First Page')

      return (
        <div>
          <TestComponent title={title} />
          <button onClick={() => setTitle('Second Page')}>Change Title</button>
        </div>
      )
    }

    render(<TestWrapper />)
    expect(document.title).toBe('First Page | DUOS')

    act(() => {
      fireEvent.click(screen.getByText('Change Title'))
    })
    expect(document.title).toBe('Second Page | DUOS')
  })
})
