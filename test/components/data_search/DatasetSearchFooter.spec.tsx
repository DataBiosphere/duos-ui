import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatasetSearchFooter } from 'src/components/data_search/DatasetSearchFooter'
import { Storage } from 'src/libs/storage'
import { DatasetTerm } from 'src/types/model'

const datasets: DatasetTerm[] = [
  { datasetId: 123456, study: { studyId: 1 } } as DatasetTerm,
  { datasetId: 234567, study: { studyId: 1 } } as DatasetTerm,
  { datasetId: 345678, study: { studyId: 2 } } as DatasetTerm,
]

const oneDatasetProps = { selectedDatasets: [123456], datasets, onClick: () => {} }
const oneStudyProps = { selectedDatasets: [123456, 234567], datasets, onClick: () => {} }
const twoStudiesProps = { selectedDatasets: [123456, 234567, 345678], datasets, onClick: () => {} }

describe('Dataset Search Footer renders correct text and button', () => {
  beforeEach(() => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: { cardNumber: '12345' } } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Shows button and single dataset and study text', () => {
    const { container } = render(<DatasetSearchFooter {...oneDatasetProps} />)
    expect(container).toHaveTextContent('1 dataset selected from 1 study')
    expect(screen.getByRole('button', { name: 'Apply for Access' })).toBeInTheDocument()
  })

  it('Shows button and two datasets from one study text', () => {
    const { container } = render(<DatasetSearchFooter {...oneStudyProps} />)
    expect(container).toHaveTextContent('2 datasets selected from 1 study')
    expect(screen.getByRole('button', { name: 'Apply for Access' })).toBeInTheDocument()
  })

  it('Shows button and three datasets from two studies text', () => {
    const { container } = render(<DatasetSearchFooter {...twoStudiesProps} />)
    expect(container).toHaveTextContent('3 datasets selected from 2 studies')
    expect(screen.getByRole('button', { name: 'Apply for Access' })).toBeInTheDocument()
  })
})

describe('Dataset Search Footer renders tooltip and disables apply button', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Disables Apply for Access button when user does not have Active Researcher Status', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: null } as never)
    render(<DatasetSearchFooter {...oneDatasetProps} />)
    expect(screen.getByRole('button', { name: 'Apply for Access' })).toBeDisabled()
  })

  it('Shows tooltip when hovering over disabled button', async () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: null } as never)
    render(<DatasetSearchFooter {...oneDatasetProps} />)
    const button = screen.getByRole('button', { name: 'Apply for Access' })
    await userEvent.hover(button.parentElement!)
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Active Researcher Status is required to apply for data access')
  })

  it('Enables button when user has Active Researcher Status', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: { cardNumber: '12345' } } as never)
    render(<DatasetSearchFooter {...oneDatasetProps} />)
    expect(screen.getByRole('button', { name: 'Apply for Access' })).not.toBeDisabled()
  })
})
