import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import DACDatasets from 'src/pages/DACDatasets'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DatasetTerm, DuosUser } from 'src/types/model'

const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { searchDatasetIndex: vi.fn() },
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
    getSearchFilterFunctions: () => ({
      datasetTerms: (searchTerm: string, datasets: DatasetTerm[]) =>
        datasets.filter(d => d.datasetName.toLowerCase().includes(searchTerm.toLowerCase())),
    }),
  }
})

vi.mock('src/libs/theme', () => ({
  Styles: {
    PAGE: {},
    SEARCH_ACTION_HEADER_SECTION: {},
  },
}))

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) => (
    <input
      aria-label="search"
      onChange={e => handleSearchChange(e.target.value)}
    />
  ),
}))

vi.mock('src/components/dac_dataset_table/DACDatasetsTable', () => ({
  DACDatasetsTable: ({ datasets, isLoading }: { datasets: DatasetTerm[], isLoading: boolean }) => (
    <div data-testid="dac-datasets-table" data-loading={String(isLoading)}>
      {datasets.map(d => <span key={d.datasetId}>{d.datasetName}</span>)}
    </div>
  ),
}))

vi.mock('src/components/dac_dataset_table/DACDatasetConstants.js', () => ({
  DACDatasetTableColumnOptions: {
    DUOS_ID: 'duos_id',
    PHS_ID: 'phs_id',
    DATASET_NAME: 'dataset_name',
    STUDY_NAME: 'study_name',
    DATA_SUBMITTER: 'data_submitter',
    DATA_CUSTODIAN: 'data_custodian',
    DATA_USE: 'data_use',
    CERTIFICATION_LINK: 'certification_link',
    STATUS: 'status',
  },
}))

vi.mock('src/components/dac_dataset_table/DACDatasetTableCellData', () => ({
  consoleTypes: { CHAIR: 'CHAIR' },
}))

vi.mock('src/components/AddObjectButton', () => ({
  default: ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}))

vi.mock('@mui/icons-material/AddCircleOutlineOutlined', () => ({
  default: () => null,
}))

const testDatasets: DatasetTerm[] = [
  { datasetId: 1, datasetName: 'Dataset Alpha' } as DatasetTerm,
  { datasetId: 2, datasetName: 'Dataset Beta' } as DatasetTerm,
]

const makeUser = (dacIds: number[]): DuosUser =>
  ({
    userId: 99,
    roles: dacIds.map((id, i) => ({
      dacId: id,
      roleId: i + 1,
      name: 'Chairperson' as const,
      userId: 99,
      userRoleId: i + 1,
    })),
  }) as DuosUser

describe('DACDatasets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title and description', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(testDatasets)
    await act(async () => render(<DACDatasets />))
    expect(screen.getByText('My DAC\'s Datasets')).toBeInTheDocument()
    expect(screen.getByText('View the status of datasets submitted to your Data Access Committee')).toBeInTheDocument()
  })

  it('fetches datasets from elasticsearch on mount', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5, 10]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(testDatasets)
    await act(async () => render(<DACDatasets />))
    expect(DataSet.searchDatasetIndex).toHaveBeenCalledTimes(1)
  })

  it('passes loaded datasets to the table', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(testDatasets)
    await act(async () => render(<DACDatasets />))
    expect(screen.getByText('Dataset Alpha')).toBeInTheDocument()
    expect(screen.getByText('Dataset Beta')).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockReturnValue(new Promise(() => {}))
    render(<DACDatasets />)
    expect(screen.getByTestId('dac-datasets-table')).toHaveAttribute('data-loading', 'true')
  })

  it('clears loading state after fetch completes', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(testDatasets)
    await act(async () => render(<DACDatasets />))
    expect(screen.getByTestId('dac-datasets-table')).toHaveAttribute('data-loading', 'false')
  })

  it('shows an error when user has no DAC associations', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([]))
    await act(async () => render(<DACDatasets />))
    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'User does not have any DAC associations',
    })
    expect(DataSet.searchDatasetIndex).not.toHaveBeenCalled()
  })

  it('shows an error when the elasticsearch fetch fails', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockRejectedValue(new Error('network error'))
    await act(async () => render(<DACDatasets />))
    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Failed to load Elasticsearch index',
    })
  })

  it('renders the search bar', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(testDatasets)
    await act(async () => render(<DACDatasets />))
    expect(screen.getByRole('textbox', { name: 'search' })).toBeInTheDocument()
  })

  it('filters the dataset list when searching', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(testDatasets)
    await act(async () => render(<DACDatasets />))
    expect(screen.getByText('Dataset Alpha')).toBeInTheDocument()
    expect(screen.getByText('Dataset Beta')).toBeInTheDocument()
    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: 'search' }), { target: { value: 'Alpha' } })
    })
    expect(screen.getByText('Dataset Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Dataset Beta')).not.toBeInTheDocument()
  })

  it('navigates to the data submission form when ADD DATASET is clicked', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(makeUser([5]))
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([])
    await act(async () => render(<DACDatasets />))
    fireEvent.click(screen.getByText('ADD DATASET'))
    expect(mockNavigate).toHaveBeenCalledWith('/data_submission_form')
  })
})
