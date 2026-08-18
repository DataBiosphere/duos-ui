import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import {
  DarCollectionGridRow,
  MakeDarCollectionColumnsArgs,
  buildDarCollectionGridRows,
  makeDarCollectionColumns,
} from 'src/components/dar_collection_table/DarCollectionGridColumns'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { DarCollectionSummary, DataUseGroup } from 'src/types/model'
import { renderWithRouter } from '../../test-utils'

vi.mock('src/components/dar_collection_table/Actions', () => ({
  default: ({ consoleType }: { consoleType: string }) => <div data-testid="actions">{consoleType}</div>,
}))

vi.mock('src/components/dar_collection_table/DarCollectionAdminReviewLink', () => ({
  default: ({ darCode }: { darCode: string }) => <span data-testid="admin-review-link">{darCode}</span>,
}))

vi.mock('src/libs/utils', async () => {
  const actual = await vi.importActual<typeof import('src/libs/utils')>('src/libs/utils')
  return { ...actual, formatDate: vi.fn((val: number) => `formatted-${val}`) }
})

const darCollectionId = 10
const baseCollection: DarCollectionSummary = {
  darCollectionId,
  darCode: 'DAR-10',
  name: 'Test Collection',
  actions: [],
  dacNames: ['DAC-A', 'DAC-B', 'DAC-A'],
  dacCode: '',
  datasetCount: 5,
  datasetIds: [1, 2],
  expired: false,
  expiresAt: 9000,
  institutionName: 'Broad',
  latestReferenceId: 'ref-1',
  progressReport: false,
  referenceIds: ['ref-1'],
  requiresSOApproval: false,
  researcherName: 'Jane',
  status: 'Open',
  submissionDate: 1234567890,
}

const makeGroup = (overrides: Partial<DataUseGroup> = {}): DataUseGroup => ({
  key: 'bucket-1',
  label: 'GRU',
  datasets: [],
  votes: [],
  ...overrides,
})

const baseArgs: MakeDarCollectionColumnsArgs = {
  consoleType: consoleTypes.RESEARCHER,
  showConfirmationModal: vi.fn(),
}

function makeRow(overrides: Partial<DarCollectionGridRow> = {}): DarCollectionGridRow {
  return {
    id: `${darCollectionId}-row`,
    collection: baseCollection,
    group: null,
    ...overrides,
  }
}

function getColumn(columns: GridColDef<DarCollectionGridRow>[], field: string): GridColDef<DarCollectionGridRow> {
  const column = columns.find(c => c.field === field)
  if (!column) throw new Error(`Column not found: ${field}`)
  return column
}

function makeParams(row: DarCollectionGridRow, value?: unknown): GridRenderCellParams<DarCollectionGridRow> {
  return { row, value } as unknown as GridRenderCellParams<DarCollectionGridRow>
}

function renderCell(column: GridColDef<DarCollectionGridRow>, row: DarCollectionGridRow, value?: unknown) {
  const node = column.renderCell!(makeParams(row, value))
  return renderWithRouter(node as React.ReactElement)
}

type LooseGetter = (value: unknown, row: DarCollectionGridRow, column: GridColDef<DarCollectionGridRow>, apiRef: unknown) => unknown

function getValue(column: GridColDef<DarCollectionGridRow>, row: DarCollectionGridRow): unknown {
  return (column.valueGetter as unknown as LooseGetter)(undefined, row, column, {})
}

function getFormatted(column: GridColDef<DarCollectionGridRow>, value: unknown, row: DarCollectionGridRow): unknown {
  return (column.valueFormatter as unknown as LooseGetter)(value, row, column, {})
}

function getSpanValue(column: GridColDef<DarCollectionGridRow>, row: DarCollectionGridRow): unknown {
  return (column.rowSpanValueGetter as unknown as LooseGetter)(undefined, row, column, {})
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildDarCollectionGridRows', () => {
  it('produces one row per data-use group on the collection', () => {
    const collection = {
      ...baseCollection,
      dataUseGroups: [makeGroup({ label: 'GRU' }), makeGroup({ key: 'bucket-2', label: 'NPU' })],
    }
    const rows = buildDarCollectionGridRows([collection])
    expect(rows).toHaveLength(2)
    expect(rows[0].group?.label).toBe('GRU')
    expect(rows[1].group?.label).toBe('NPU')
    expect(rows.every(r => r.collection.darCollectionId === darCollectionId)).toBe(true)
    expect(new Set(rows.map(r => r.id)).size).toBe(2)
  })

  it('produces a single empty-state row when the collection has no groups', () => {
    const rows = buildDarCollectionGridRows([{ ...baseCollection, dataUseGroups: [] }])
    expect(rows).toHaveLength(1)
    expect(rows[0].group).toBeNull()
  })

  it('produces a single empty-state row when groups are absent entirely', () => {
    const rows = buildDarCollectionGridRows([baseCollection])
    expect(rows).toHaveLength(1)
    expect(rows[0].group).toBeNull()
  })
})

describe('darCode column', () => {
  it('renders the admin review link for ADMIN console type', () => {
    const columns = makeDarCollectionColumns(['darCode'], { ...baseArgs, consoleType: consoleTypes.ADMIN })
    renderCell(getColumn(columns, 'darCode'), makeRow())
    expect(screen.getByTestId('admin-review-link')).toHaveTextContent('DAR-10')
  })

  it('renders a link for CHAIR console type', () => {
    const columns = makeDarCollectionColumns(['darCode'], { ...baseArgs, consoleType: consoleTypes.CHAIR })
    renderCell(getColumn(columns, 'darCode'), makeRow())
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('renders raw darCode for unknown console type', () => {
    const columns = makeDarCollectionColumns(['darCode'], { ...baseArgs, consoleType: 'unknown' })
    renderCell(getColumn(columns, 'darCode'), makeRow())
    expect(screen.getByText('DAR-10')).toBeInTheDocument()
  })

  it('spans by collection id, not by row', () => {
    const columns = makeDarCollectionColumns(['darCode'], baseArgs)
    const column = getColumn(columns, 'darCode')
    const rowA = makeRow({ id: 'a' })
    const rowB = makeRow({ id: 'b' })
    expect(getSpanValue(column, rowA)).toBe(getSpanValue(column, rowB))
    expect(getSpanValue(column, rowA)).toBe(darCollectionId)
  })
})

describe('dacNames column', () => {
  it('joins unique dacNames with a comma', () => {
    const columns = makeDarCollectionColumns(['dacNames'], baseArgs)
    const column = getColumn(columns, 'dacNames')
    expect(getValue(column, makeRow())).toBe('DAC-A, DAC-B')
  })
})

describe('name column', () => {
  it('returns the collection name when non-empty', () => {
    const columns = makeDarCollectionColumns(['name'], baseArgs)
    const column = getColumn(columns, 'name')
    expect(getValue(column, makeRow())).toBe('Test Collection')
  })

  it('falls back to "- -" when name is empty', () => {
    const columns = makeDarCollectionColumns(['name'], baseArgs)
    const column = getColumn(columns, 'name')
    expect(getValue(column, makeRow({ collection: { ...baseCollection, name: '' } }))).toBe('- -')
  })
})

describe('submissionDate column', () => {
  it('extracts a numeric value for sorting', () => {
    const columns = makeDarCollectionColumns(['submissionDate'], baseArgs)
    const column = getColumn(columns, 'submissionDate')
    expect(getValue(column, makeRow())).toBe(1234567890)
  })

  it('returns null when submissionDate is "unsubmitted"', () => {
    const columns = makeDarCollectionColumns(['submissionDate'], baseArgs)
    const column = getColumn(columns, 'submissionDate')
    const row = makeRow({ collection: { ...baseCollection, submissionDate: 'unsubmitted' as unknown as number } })
    expect(getValue(column, row)).toBeNull()
  })

  it('formats a resolved value via formatDate', async () => {
    const { formatDate } = await import('src/libs/utils')
    vi.mocked(formatDate).mockReturnValue('Jan 1 2023')
    const columns = makeDarCollectionColumns(['submissionDate'], baseArgs)
    const column = getColumn(columns, 'submissionDate')
    expect(getFormatted(column, 1234567890, makeRow())).toBe('Jan 1 2023')
  })

  it('formats a null value as "- -"', () => {
    const columns = makeDarCollectionColumns(['submissionDate'], baseArgs)
    const column = getColumn(columns, 'submissionDate')
    expect(getFormatted(column, null, makeRow())).toBe('- -')
  })
})

describe('researcher and institution columns', () => {
  it('falls back to "- -" when researcherName is missing', () => {
    const columns = makeDarCollectionColumns(['researcher'], baseArgs)
    const column = getColumn(columns, 'researcher')
    expect(getValue(column, makeRow({ collection: { ...baseCollection, researcherName: '' } }))).toBe('- -')
  })

  it('falls back to "- -" when institutionName is missing', () => {
    const columns = makeDarCollectionColumns(['institution'], baseArgs)
    const column = getColumn(columns, 'institution')
    expect(getValue(column, makeRow({ collection: { ...baseCollection, institutionName: '' } }))).toBe('- -')
  })
})

describe('datasetCount column', () => {
  it('renders 0 when the row has no group', () => {
    const columns = makeDarCollectionColumns(['datasetCount'], baseArgs)
    renderCell(getColumn(columns, 'datasetCount'), makeRow({ group: null }))
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders the per-group dataset count as a plain integer', () => {
    const group = makeGroup({ datasets: [{ datasetId: 1, name: 'Set A', datasetIdentifier: 'DUOS-1' }] })
    const columns = makeDarCollectionColumns(['datasetCount'], baseArgs)
    const { container } = renderCell(getColumn(columns, 'datasetCount'), makeRow({ group }))
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(container.querySelector('.MuiChip-root')).toBeNull()
  })

  it('shows the dataset names and identifiers on hover', async () => {
    const user = userEvent.setup()
    const group = makeGroup({
      datasets: [
        { datasetId: 1, name: 'Dataset One', datasetIdentifier: 'DUOS-000001' },
        { datasetId: 2, name: 'Dataset Two', datasetIdentifier: 'DUOS-000002' },
      ],
    })
    const column = getColumn(makeDarCollectionColumns(['datasetCount'], baseArgs), 'datasetCount')
    renderCell(column, makeRow({ group }))

    await user.hover(screen.getByText('2'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Dataset One (DUOS-000001), Dataset Two (DUOS-000002)',
    )
  })

  it('never spans, since the count varies per data-use group', () => {
    const columns = makeDarCollectionColumns(['datasetCount'], baseArgs)
    const column = getColumn(columns, 'datasetCount')
    const rowA = makeRow({ id: 'a' })
    const rowB = makeRow({ id: 'b' })
    expect(getSpanValue(column, rowA)).not.toBe(getSpanValue(column, rowB))
  })
})

describe('votes column', () => {
  const groupWithVotes = makeGroup({
    votes: [
      { userId: 1, displayName: 'Alice', vote: true },
      { userId: 2, displayName: 'Bob', vote: false },
    ],
  })

  it('renders nothing for non chair/member consoles', () => {
    const columns = makeDarCollectionColumns(['votes'], { ...baseArgs, consoleType: consoleTypes.RESEARCHER })
    const { container } = renderCell(getColumn(columns, 'votes'), makeRow({ group: groupWithVotes }))
    expect(container.querySelector('.MuiChip-root')).toBeNull()
  })

  it('renders number-only approve/deny pills for CHAIR console', () => {
    const columns = makeDarCollectionColumns(['votes'], { ...baseArgs, consoleType: consoleTypes.CHAIR })
    const { container } = renderCell(getColumn(columns, 'votes'), makeRow({ group: groupWithVotes }))
    expect(container.querySelector('.MuiChip-colorSuccess')).toHaveTextContent('1')
    expect(container.querySelector('.MuiChip-colorError')).toHaveTextContent('1')
  })

  it('renders nothing when the row has no group', () => {
    const columns = makeDarCollectionColumns(['votes'], { ...baseArgs, consoleType: consoleTypes.MEMBER })
    const { container } = renderCell(getColumn(columns, 'votes'), makeRow({ group: null }))
    expect(container.querySelector('.MuiChip-root')).toBeNull()
  })

  it('never spans, since votes vary per data-use group', () => {
    const columns = makeDarCollectionColumns(['votes'], { ...baseArgs, consoleType: consoleTypes.CHAIR })
    const column = getColumn(columns, 'votes')
    const rowA = makeRow({ id: 'a' })
    const rowB = makeRow({ id: 'b' })
    expect(getSpanValue(column, rowA)).not.toBe(getSpanValue(column, rowB))
  })
})

describe('status column', () => {
  it('renders the status value', () => {
    const columns = makeDarCollectionColumns(['status'], baseArgs)
    renderCell(getColumn(columns, 'status'), makeRow(), 'Open')
    expect(screen.getByText('Open')).toBeInTheDocument()
  })
})

describe('actions column', () => {
  it('renders the Actions component with the current consoleType', () => {
    const columns = makeDarCollectionColumns(['actions'], { ...baseArgs, consoleType: consoleTypes.CHAIR })
    renderCell(getColumn(columns, 'actions'), makeRow())
    expect(screen.getByTestId('actions')).toHaveTextContent(consoleTypes.CHAIR)
  })
})

describe('dataUse column', () => {
  it('renders an empty-state placeholder when the row has no group', () => {
    const columns = makeDarCollectionColumns(['dataUse'], baseArgs)
    renderCell(getColumn(columns, 'dataUse'), makeRow({ group: null }))
    expect(screen.getByText('No datasets')).toBeInTheDocument()
  })

  it('renders only the data-use pill, with no dataset count or vote content', () => {
    const group = makeGroup({ label: 'GRU', datasets: [{ datasetId: 1, name: 'Set A', datasetIdentifier: 'DUOS-1' }] })
    const columns = makeDarCollectionColumns(['dataUse'], { ...baseArgs, consoleType: consoleTypes.CHAIR })
    renderCell(getColumn(columns, 'dataUse'), makeRow({ group }))
    expect(screen.getByText('GRU')).toBeInTheDocument()
    expect(screen.queryByText(/datasets/)).not.toBeInTheDocument()
  })

  it('shows the full, untruncated data-use label on hover', async () => {
    const user = userEvent.setup()
    const label = 'General Research Use, No Methods Development, Publication Required'
    const column = getColumn(makeDarCollectionColumns(['dataUse'], baseArgs), 'dataUse')
    renderCell(column, makeRow({ group: makeGroup({ label }) }))

    await user.hover(screen.getByText(label))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(label)
  })

  it('never spans across rows, even within the same collection', () => {
    const columns = makeDarCollectionColumns(['dataUse'], baseArgs)
    const column = getColumn(columns, 'dataUse')
    const rowA = makeRow({ id: 'a', group: makeGroup({ key: 'a' }) })
    const rowB = makeRow({ id: 'b', group: makeGroup({ key: 'b' }) })
    expect(getSpanValue(column, rowA)).not.toBe(getSpanValue(column, rowB))
  })
})
