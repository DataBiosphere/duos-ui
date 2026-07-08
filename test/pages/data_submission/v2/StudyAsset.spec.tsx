import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { StudyAsset, StudyAssetConfig } from 'src/pages/data_submission/v2/StudyAsset'

describe('StudyAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders icon, title, description, children, and button', () => {
    const onButtonClick = vi.fn()
    const config: StudyAssetConfig = {
      icon: <span data-testid="test-icon">Icon</span>,
      title: 'Test Title',
      description: 'Test description text',
      children: <div data-testid="test-children">Child content</div>,
      button: <button onClick={onButtonClick}>Action</button>,
    }

    render(<StudyAsset config={config} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Test Title' })).toBeInTheDocument()
    expect(screen.getByText('Test description text')).toBeInTheDocument()
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByTestId('test-children')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Action' })
    fireEvent.click(button)
    expect(onButtonClick).toHaveBeenCalledTimes(1)
  })

  it('renders without optional children and button', () => {
    const config: StudyAssetConfig = {
      icon: <span>Icon</span>,
      title: 'Minimal Title',
      description: 'Minimal description',
    }

    render(<StudyAsset config={config} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Minimal Title' })).toBeInTheDocument()
    expect(screen.getByText('Minimal description')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('container has expected inline styles', () => {
    const config: StudyAssetConfig = {
      icon: <span>Icon</span>,
      title: 'Style Check',
      description: 'Style description',
    }

    render(<StudyAsset config={config} />)

    const heading = screen.getByRole('heading', { level: 3, name: 'Style Check' })
    const container = heading.parentElement!.parentElement!.parentElement!.parentElement!
    expect(container).toHaveStyle({ background: '#eaf0fa', borderRadius: '12px' })
  })
})
