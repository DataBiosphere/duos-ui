import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { citationColumn } from 'src/components/data_library/columns/sharedColumns'

type CitedRow = { citation?: boolean, datasetCitation?: string }

const column = citationColumn<CitedRow>(row => row.datasetCitation || '')

const renderCitation = (row: CitedRow) => render(
  <>{column.renderCell!({ row, value: row.citation } as GridRenderCellParams<CitedRow>)}</>,
)

// Shared by both grids, so covered once here; the grid specs assert wiring only.
describe('citationColumn', () => {
  it('reads Yes when the asset cites datasets', () => {
    renderCitation({ citation: true })
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('reads No when it does not', () => {
    renderCitation({ citation: false })
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  // Both transforms default a missing field to false, so the column has to agree.
  it('reads No when the field is absent entirely', () => {
    renderCitation({})
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('surfaces the citation text on hover when the row carries one', async () => {
    const user = userEvent.setup()
    renderCitation({ citation: true, datasetCitation: 'Smith et al. 2024, dbGaP phs000123' })
    await user.hover(screen.getByText('Yes'))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Smith et al. 2024, dbGaP phs000123')
  })

  it('makes the cell focusable so the tooltip is not hover-only', () => {
    renderCitation({ citation: true, datasetCitation: 'Smith et al. 2024' })
    expect(screen.getByText('Yes')).toHaveAttribute('tabindex', '0')
  })

  // describeChild, so the citation is the description and not the name.
  it('keeps Yes/No as the accessible name', () => {
    renderCitation({ citation: true, datasetCitation: 'Smith et al. 2024' })
    expect(screen.getByText('Yes')).toHaveAccessibleDescription('Smith et al. 2024')
  })

  it('renders no tooltip when the row carries no citation text', async () => {
    const user = userEvent.setup()
    renderCitation({ citation: false, datasetCitation: '' })
    await user.hover(screen.getByText('No'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('sorts and filters on the rendered Yes/No, not the raw boolean', () => {
    const valueGetter = column.valueGetter as unknown as (value: boolean) => string
    expect(valueGetter(true)).toBe('Yes')
    expect(valueGetter(false)).toBe('No')
  })
})
