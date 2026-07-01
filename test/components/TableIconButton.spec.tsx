import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import TableIconButton from 'src/components/TableIconButton'

vi.mock('tss-react/mui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('tss-react/mui')>()
  return {
    ...actual,
    makeStyles: () => () => () => ({ classes: { root: 'root' } }),
  }
})

const TestIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg data-testid="test-icon" className={className} style={style} />
)

describe('TableIconButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a span wrapper', () => {
    const { container } = render(<TableIconButton />)
    expect(container.querySelector('span')).toBeInTheDocument()
  })

  it('renders the icon when isRendered is true and icon is provided', () => {
    render(<TableIconButton icon={TestIcon} isRendered={true} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('does not render the icon when isRendered is false', () => {
    render(<TableIconButton icon={TestIcon} isRendered={false} />)
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
  })

  it('does not render the icon when icon is not provided', () => {
    render(<TableIconButton isRendered={true} />)
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
  })

  it('calls onClick when the span is clicked', async () => {
    const onClick = vi.fn()
    const { container } = render(<TableIconButton icon={TestIcon} onClick={onClick} />)
    await userEvent.click(container.querySelector('span') as HTMLElement)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    const { container } = render(<TableIconButton icon={TestIcon} onClick={onClick} disabled={true} />)
    await userEvent.click(container.querySelector('span') as HTMLElement)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('sets the data-tip attribute when dataTip is provided', () => {
    const { container } = render(<TableIconButton icon={TestIcon} dataTip="Delete item" />)
    expect(container.querySelector('span')).toHaveAttribute('data-tip', 'Delete item')
  })

  it('sets the id attribute from keyProp', () => {
    const { container } = render(<TableIconButton icon={TestIcon} keyProp="my-button" />)
    expect(container.querySelector('span')).toHaveAttribute('id', 'my-button')
  })

  it('calls a custom onMouseEnter handler', async () => {
    const onMouseEnter = vi.fn()
    const { container } = render(<TableIconButton icon={TestIcon} onMouseEnter={onMouseEnter} />)
    await userEvent.hover(container.querySelector('span') as HTMLElement)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
  })

  it('calls a custom onMouseLeave handler', async () => {
    const onMouseLeave = vi.fn()
    const { container } = render(<TableIconButton icon={TestIcon} onMouseLeave={onMouseLeave} />)
    await userEvent.unhover(container.querySelector('span') as HTMLElement)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)
  })
})
