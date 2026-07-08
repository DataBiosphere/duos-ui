import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryTabs } from 'src/components/data_library/LibraryTabs'
import { AssetType } from 'src/types/library'

const tabs = [
  { key: AssetType.STUDIES, label: 'Studies' },
  { key: AssetType.DATASETS, label: 'Datasets' },
]

describe('LibraryTabs', () => {
  it('renders all tabs', () => {
    render(<LibraryTabs value={AssetType.STUDIES} onChange={() => {}} tabs={tabs} />)
    expect(screen.getByText('Studies')).toBeInTheDocument()
    expect(screen.getByText('Datasets')).toBeInTheDocument()
  })

  it('marks the active tab as selected', () => {
    render(<LibraryTabs value={AssetType.DATASETS} onChange={() => {}} tabs={tabs} />)
    expect(screen.getByRole('tab', { name: 'Datasets' })).toHaveClass('Mui-selected')
    expect(screen.getByRole('tab', { name: 'Studies' })).not.toHaveClass('Mui-selected')
  })

  it('calls onChange with the tab key when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LibraryTabs value={AssetType.STUDIES} onChange={onChange} tabs={tabs} />)
    await user.click(screen.getByRole('tab', { name: 'Datasets' }))
    expect(onChange).toHaveBeenCalledWith(AssetType.DATASETS)
  })
})
