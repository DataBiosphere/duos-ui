import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import {
  projectTitleCellData,
  darCodeCellData,
  DacCellData,
  submissionDateCellData,
  researcherCellData,
  institutionCellData,
  datasetCountCellData,
  expiresAtCellData,
  statusCellData,
  consoleActionsCellData,
} from 'src/components/dar_collection_table/DarCollectionTableCellData'
import { DarCollectionSummary } from 'src/types/model'

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
  dacNames: ['DAC-A', 'DAC-B'],
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('projectTitleCellData', () => {
  it('returns the collection name when non-empty', () => {
    const cell = projectTitleCellData({ name: 'My Project', darCollectionId })
    expect(cell.data).toBe('My Project')
    expect(cell.id).toBe(darCollectionId)
    expect(cell.label).toBe('project-title')
  })

  it('falls back to "- -" when name is empty string', () => {
    const cell = projectTitleCellData({ name: '', darCollectionId })
    expect(cell.data).toBe('- -')
  })

  it('falls back to "- -" when name is omitted', () => {
    const cell = projectTitleCellData({ darCollectionId })
    expect(cell.data).toBe('- -')
  })

  it('uses provided label', () => {
    const cell = projectTitleCellData({ darCollectionId, label: 'custom-label' })
    expect(cell.label).toBe('custom-label')
  })
})

describe('DacCellData', () => {
  it('joins unique dacNames with newlines', () => {
    const cell = DacCellData({ dacNames: ['DAC-A', 'DAC-B', 'DAC-A'], darCollectionId })
    expect(cell.data).toBe('DAC-A\nDAC-B')
  })

  it('uses default label "dacNames"', () => {
    const cell = DacCellData({ dacNames: [], darCollectionId })
    expect(cell.label).toBe('dacNames')
  })
})

describe('submissionDateCellData', () => {
  it('formats a numeric submissionDate', async () => {
    const { formatDate } = await import('src/libs/utils')
    vi.mocked(formatDate).mockReturnValue('Jan 1 2023')
    const cell = submissionDateCellData({ submissionDate: 1234567890, darCollectionId })
    expect(cell.data).toBe('Jan 1 2023')
  })

  it('returns "- -" when submissionDate is null', () => {
    const cell = submissionDateCellData({ submissionDate: null, darCollectionId })
    expect(cell.data).toBe('- -')
  })

  it('returns "- -" when submissionDate is "unsubmitted"', () => {
    const cell = submissionDateCellData({ submissionDate: 'unsubmitted', darCollectionId })
    expect(cell.data).toBe('- -')
  })
})

describe('researcherCellData', () => {
  it('returns the researcher name', () => {
    const cell = researcherCellData({ researcherName: 'Jane Doe', darCollectionId })
    expect(cell.data).toBe('Jane Doe')
  })

  it('defaults to "- -" when omitted', () => {
    const cell = researcherCellData({ darCollectionId })
    expect(cell.data).toBe('- -')
  })
})

describe('institutionCellData', () => {
  it('returns the institution name', () => {
    const cell = institutionCellData({ institutionName: 'Broad', darCollectionId })
    expect(cell.data).toBe('Broad')
  })

  it('defaults to "- -" when omitted', () => {
    const cell = institutionCellData({ darCollectionId })
    expect(cell.data).toBe('- -')
  })
})

describe('datasetCountCellData', () => {
  it('returns datasetCount when non-zero', () => {
    const cell = datasetCountCellData({ collection: baseCollection, darCollectionId })
    expect(cell.data).toBe(5)
  })

  it('falls back to "- -" when datasetCount is 0', () => {
    const cell = datasetCountCellData({ collection: { ...baseCollection, datasetCount: 0 }, darCollectionId })
    expect(cell.data).toBe('- -')
  })
})

describe('expiresAtCellData', () => {
  it('formats the expiresAt date', async () => {
    const { formatDate } = await import('src/libs/utils')
    vi.mocked(formatDate).mockReturnValue('Dec 31 2023')
    const cell = expiresAtCellData({ collection: baseCollection, darCollectionId })
    expect(cell.data).toBe('Dec 31 2023')
  })

  it('returns "- -" when expiresAt is null', () => {
    const cell = expiresAtCellData({ collection: { ...baseCollection, expiresAt: null as unknown as number }, darCollectionId })
    expect(cell.data).toBe('- -')
  })
})

describe('statusCellData', () => {
  it('returns the status string', () => {
    const cell = statusCellData({ status: 'Open', darCollectionId })
    expect(cell.data).toBe('Open')
  })

  it('defaults to "- -" when omitted', () => {
    const cell = statusCellData({ darCollectionId })
    expect(cell.data).toBe('- -')
  })
})

describe('consoleActionsCellData', () => {
  it('returns isComponent true and the Actions component as data', () => {
    const cell = consoleActionsCellData({
      collection: baseCollection,
      showConfirmationModal: vi.fn(),
      consoleType: 'chair',
    })
    expect(cell.isComponent).toBe(true)
    expect(cell.id).toBe(darCollectionId)
    expect(cell.label).toBe('table-actions')

    const { container } = render(<MemoryRouter>{cell.data as React.ReactElement}</MemoryRouter>)
    expect(container.querySelector('[data-testid="actions"]')).toHaveTextContent('chair')
  })
})

describe('darCodeCellData', () => {
  const baseParams = {
    darCode: 'DAR-10',
    darCollectionId,
    collectionIsExpanded: false,
    updateCollectionIsExpanded: vi.fn(),
    status: 'Open',
    consoleType: 'chair',
  }

  it('renders the admin review link for ADMIN console type', () => {
    const cell = darCodeCellData({ ...baseParams, consoleType: 'admin' })
    render(<MemoryRouter>{cell.data as React.ReactElement}</MemoryRouter>)
    expect(screen.getByTestId('admin-review-link')).toHaveTextContent('DAR-10')
  })

  it('renders a link for CHAIR console type', () => {
    const cell = darCodeCellData({ ...baseParams, consoleType: 'chair' })
    render(<MemoryRouter>{cell.data as React.ReactElement}</MemoryRouter>)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('renders raw darCode for unknown console type', () => {
    const cell = darCodeCellData({ ...baseParams, consoleType: 'unknown' })
    render(<MemoryRouter>{cell.data as React.ReactElement}</MemoryRouter>)
    expect(screen.getByText('DAR-10')).toBeInTheDocument()
  })

  it('hides the expand icon for draft status', () => {
    const cell = darCodeCellData({ ...baseParams, status: 'Draft' })
    const { container } = render(<MemoryRouter>{cell.data as React.ReactElement}</MemoryRouter>)
    expect(container.querySelector(`[id="${darCollectionId}_dropdown"]`)).toBeNull()
  })

  it('shows the expand icon for non-draft status', () => {
    const cell = darCodeCellData({ ...baseParams, status: 'Open' })
    const { container } = render(<MemoryRouter>{cell.data as React.ReactElement}</MemoryRouter>)
    expect(container.querySelector(`[id="${darCollectionId}_dropdown"]`)).not.toBeNull()
  })

  it('sets value to darCode', () => {
    const cell = darCodeCellData(baseParams)
    expect(cell.value).toBe('DAR-10')
  })
})
