import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollapseExpandLink from 'src/components/collection_voting_slab/CollapsibleExpandLink'

afterEach(() => vi.restoreAllMocks())

const defaultProps = {
  hiddenDatasetCount: 1,
  expanded: false,
  onExpand: vi.fn(),
  onCollapse: vi.fn(),
}

const mountComponent = (customProps = {}) =>
  render(<CollapseExpandLink {...defaultProps} {...customProps} />)

describe('CollapseExpandLink', () => {
  it('does not render if hiddenDatasetCount is 0', () => {
    const { container } = mountComponent({ hiddenDatasetCount: 0 })
    expect(container.querySelector('[data-cy="collapse-expand-link"]')).not.toBeInTheDocument()
  })

  it('renders expand link when not expanded', () => {
    const { container } = mountComponent({ hiddenDatasetCount: 2, expanded: false })
    expect(container.querySelector('[data-cy="collapse-expand-link"]')).toHaveTextContent('+ View 2 more')
  })

  it('renders collapse link when expanded', () => {
    const { container } = mountComponent({ hiddenDatasetCount: 3, expanded: true })
    expect(container.querySelector('[data-cy="collapse-expand-link"]')).toHaveTextContent('- View 3 less')
  })

  it('calls onExpand when expand link is clicked', async () => {
    const onExpand = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({ hiddenDatasetCount: 1, expanded: false, onExpand })
    await user.click(container.querySelector('[data-cy="collapse-expand-link"]')!)
    expect(onExpand).toHaveBeenCalledTimes(1)
  })

  it('calls onCollapse when collapse link is clicked', async () => {
    const onCollapse = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({ hiddenDatasetCount: 1, expanded: true, onCollapse })
    await user.click(container.querySelector('[data-cy="collapse-expand-link"]')!)
    expect(onCollapse).toHaveBeenCalledTimes(1)
  })
})
