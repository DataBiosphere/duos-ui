import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('src/components/data_search/DatasetExportButton', () => {
  const DatasetExportButton = ({ snapshots }: { snapshots: Array<{ id: string, name: string }> }) =>
    snapshots.length > 0
      ? <a href="#" title={`Export snapshot ${snapshots[0].name}`}>Export</a>
      : null
  return { DatasetExportButton, default: DatasetExportButton }
})
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { LibraryDataGrid } from 'src/components/data_library/LibraryDataGrid'
import { AssetType, ExportableDatasets, SortOrder, StudyAggregation } from 'src/types/library'
import { DatasetTerm, StudyTerm, UserTerm } from 'src/types/model'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const makeUserTerm = (overrides: Partial<UserTerm> = {}): UserTerm => ({
  userId: 0,
  displayName: 'user',
  institution: { id: 0, name: 'inst' },
  ...overrides,
} as UserTerm)

const makeStudyTerm = (overrides: Partial<StudyTerm> = {}): StudyTerm => ({
  description: 'desc',
  studyName: 'name',
  studyId: 0,
  phsId: 'phsid',
  phenotype: 'phenotype',
  species: 'species',
  piName: 'pi',
  dataSubmitterEmail: 'email',
  dataSubmitterId: 0,
  dataCustodianEmail: ['email'],
  publicVisibility: false,
  dataTypes: [],
  ...overrides,
} as StudyTerm)

const makeDatasetTerm = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 0,
  createUserId: 0,
  createUserDisplayName: 'user',
  datasetIdentifier: 'DUOS-123456',
  deletable: true,
  datasetName: 'dataset',
  participantCount: 1,
  dataUse: { primary: [], secondary: [] },
  dataLocation: 'somewhere',
  url: 'url',
  dacId: 0,
  dacApproval: true,
  accessManagement: 'access',
  approvedUserIds: [],
  study: makeStudyTerm(),
  submitter: makeUserTerm(),
  updateUser: makeUserTerm(),
  dac: { dacId: 0, dacName: 'dac', dacEmail: 'dac@email' },
  piName: 'pi',
  ...overrides,
} as DatasetTerm)

const studies: StudyAggregation[] = [
  { studyId: 1, studyName: 'Study 1', piName: 'PI 1', species: 'Human', phenotype: 'Condition A', dataCustodianEmail: ['custodian1@example.com'], dataTypes: [], dataUseCodes: [], accessTypes: [], datasetCount: 2, totalParticipants: 100, datasetIds: [101, 102], modelCount: 0, workspaceCount: 0 },
  { studyId: 2, studyName: 'Study 2', piName: 'PI 2', species: 'Mouse', phenotype: 'Condition B', dataCustodianEmail: ['custodian2@example.com'], dataTypes: [], dataUseCodes: [], accessTypes: [], datasetCount: 1, totalParticipants: 50, datasetIds: [201], modelCount: 0, workspaceCount: 0 },
]

const datasets = [
  makeDatasetTerm({ datasetId: 101, datasetName: 'Dataset 101', participantCount: 60, accessManagement: 'controlled' }),
  makeDatasetTerm({ datasetId: 102, datasetName: 'Dataset 102', participantCount: 40, accessManagement: 'open' }),
  makeDatasetTerm({ datasetId: 103, datasetName: 'Dataset 103', participantCount: 20, accessManagement: 'external' }),
]

const paginationModel = { page: 0, pageSize: 25 }
const sortModel: Array<{ field: string, sort: SortOrder | null }> = []

const mountGrid = (element: React.ReactElement) =>
  render(
    <div style={{ height: 600, width: 1200 }}>
      <MemoryRouter>{element}</MemoryRouter>
    </div>,
  )

const baseProps = {
  loading: false,
  paginationModel,
  onPaginationChange: vi.fn(),
  sortModel,
  onSortChange: vi.fn(),
  selectedDatasetIds: [] as number[],
  onSelectionChange: vi.fn(),
}

describe('LibraryDataGrid', () => {
  it('renders study data correctly', () => {
    const { container } = mountGrid(
      <LibraryDataGrid assetType={AssetType.STUDIES} data={studies} total={2} {...baseProps} />,
    )
    expect(screen.getByText('Study 1')).toBeInTheDocument()
    expect(screen.getByText('PI 1')).toBeInTheDocument()
    expect(screen.getByText('Human')).toBeInTheDocument()
    expect(screen.getByText('Condition A')).toBeInTheDocument()
    expect(screen.getByText('Study 2')).toBeInTheDocument()
    const row1 = container.querySelector('.MuiDataGrid-row[data-id="1"]')!
    expect(within(row1 as HTMLElement).getByText('100')).toBeInTheDocument()
    expect(within(row1 as HTMLElement).getByText('2')).toBeInTheDocument()
  })

  it('renders dataset data correctly', () => {
    mountGrid(
      <LibraryDataGrid assetType={AssetType.DATASETS} data={datasets} total={3} {...baseProps} />,
    )
    expect(screen.getByText('Dataset 101')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('Dataset 102')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('Dataset 103')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('via DUOS').closest('.MuiChip-root')).toHaveClass('MuiChip-colorPrimary')
    expect(screen.getByText('Open Access').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
    expect(screen.getByText('External to DUOS').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSecondary')
  })

  it('renders loading state', () => {
    mountGrid(
      <LibraryDataGrid assetType={AssetType.STUDIES} data={[]} total={0} {...{ ...baseProps, loading: true }} />,
    )
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })

  it('renders empty state when no data exists', () => {
    mountGrid(
      <LibraryDataGrid assetType={AssetType.STUDIES} data={[]} total={0} {...baseProps} />,
    )
    expect(screen.getByText('No studies found matching your criteria')).toBeInTheDocument()
  })

  describe('exportableDatasets prop', () => {
    const exportableDataset = makeDatasetTerm({ datasetId: 201, datasetName: 'Dataset With Snapshots', datasetIdentifier: 'DUOS-000201', participantCount: 75, accessManagement: 'controlled' })
    const nonExportableDataset = makeDatasetTerm({ datasetId: 202, datasetName: 'Dataset Without Snapshots', datasetIdentifier: 'DUOS-000202', participantCount: 25, accessManagement: 'open' })
    const exportableDatasets: ExportableDatasets = {
      'DUOS-000201': [{ id: 'snap-001', name: 'Snapshot 001', duosId: 'DUOS-000201', cloudPlatform: 'gcp', resourceLocks: {} }],
    }

    it('renders an Actions column header when exportableDatasets has entries', () => {
      mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={[exportableDataset]} total={1} {...baseProps} exportableDatasets={exportableDatasets} />,
      )
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders an Export link for a dataset with matching snapshots', () => {
      mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={[exportableDataset]} total={1} {...baseProps} exportableDatasets={exportableDatasets} />,
      )
      const link = screen.getByRole('link', { name: /Export/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('title', 'Export snapshot Snapshot 001')
    })

    it('does not render an Export link for a dataset with no matching snapshots', () => {
      mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={[nonExportableDataset]} total={1} {...baseProps} exportableDatasets={exportableDatasets} />,
      )
      expect(screen.queryByRole('link', { name: /Export/ })).not.toBeInTheDocument()
    })

    it('renders Export links only for datasets that have matching snapshots', () => {
      const { container } = mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={[exportableDataset, nonExportableDataset]} total={2} {...baseProps} exportableDatasets={exportableDatasets} />,
      )
      expect(screen.getAllByRole('link', { name: /Export/ })).toHaveLength(1)
      const row201 = container.querySelector('.MuiDataGrid-row[data-id="201"]')!
      const row202 = container.querySelector('.MuiDataGrid-row[data-id="202"]')!
      expect(within(row201 as HTMLElement).getByRole('link', { name: /Export/ })).toBeInTheDocument()
      expect(within(row202 as HTMLElement).queryByRole('link', { name: /Export/ })).not.toBeInTheDocument()
    })

    it('does not render Export links when exportableDatasets is not provided', () => {
      mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={[exportableDataset]} total={1} {...baseProps} />,
      )
      expect(screen.queryByRole('link', { name: /Export/ })).not.toBeInTheDocument()
    })

    it('does not render Export links for the Studies grid even if exportableDatasets is provided', () => {
      mountGrid(
        <LibraryDataGrid assetType={AssetType.STUDIES} data={studies} total={2} {...baseProps} exportableDatasets={exportableDatasets} />,
      )
      expect(screen.queryByRole('link', { name: /Export/ })).not.toBeInTheDocument()
    })
  })

  describe('radarEnabledDatasetIds prop', () => {
    it('shows Bolt icon for radar-enabled datasets', () => {
      const { container } = mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={datasets} total={3} {...baseProps} radarEnabledDatasetIds={new Set([101])} />,
      )
      const row101 = container.querySelector('.MuiDataGrid-row[data-id="101"]')!
      const row102 = container.querySelector('.MuiDataGrid-row[data-id="102"]')!
      const row103 = container.querySelector('.MuiDataGrid-row[data-id="103"]')!
      expect(within(row101 as HTMLElement).queryByTestId('BoltIcon')).toBeInTheDocument()
      expect(within(row102 as HTMLElement).queryByTestId('BoltIcon')).not.toBeInTheDocument()
      expect(within(row103 as HTMLElement).queryByTestId('BoltIcon')).not.toBeInTheDocument()
    })

    it('does not show Bolt icon when radarEnabledDatasetIds is empty', () => {
      mountGrid(
        <LibraryDataGrid assetType={AssetType.DATASETS} data={datasets} total={3} {...baseProps} radarEnabledDatasetIds={new Set()} />,
      )
      expect(screen.queryByTestId('BoltIcon')).not.toBeInTheDocument()
    })
  })

  it('handles row selection for datasets', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const { container } = mountGrid(
      <LibraryDataGrid assetType={AssetType.DATASETS} data={datasets} total={3} {...{ ...baseProps, onSelectionChange }} />,
    )
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="101"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(onSelectionChange).toHaveBeenCalledWith([101])
  })

  it('handles row selection for studies (mapping to dataset IDs)', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const { container } = mountGrid(
      <LibraryDataGrid assetType={AssetType.STUDIES} data={studies} total={2} {...{ ...baseProps, onSelectionChange }} />,
    )
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="1"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(onSelectionChange).toHaveBeenCalledWith([101, 102])
  })

  // Rows off the current page are not in `data`, so a rebuild would silently drop them.
  it('preserves selections made on another page', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const { container } = mountGrid(
      <LibraryDataGrid
        assetType={AssetType.DATASETS}
        data={datasets}
        total={3}
        {...{ ...baseProps, selectedDatasetIds: [999], onSelectionChange }}
      />,
    )
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="101"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(onSelectionChange).toHaveBeenCalledWith([999, 101])
  })

  it('drops only this page\'s rows when they are deselected', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const { container } = mountGrid(
      <LibraryDataGrid
        assetType={AssetType.DATASETS}
        data={datasets}
        total={3}
        {...{ ...baseProps, selectedDatasetIds: [999, 101], onSelectionChange }}
      />,
    )
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="101"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(onSelectionChange).toHaveBeenCalledWith([999])
  })

  it('calls onPaginationChange when page changes', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    mountGrid(
      <LibraryDataGrid assetType={AssetType.STUDIES} data={studies} total={100} {...{ ...baseProps, onPaginationChange }} />,
    )
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(onPaginationChange).toHaveBeenCalledWith({ page: 1, pageSize: 25 }, expect.anything())
  })

  it('calls onSortChange when a column header is clicked', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    mountGrid(
      <LibraryDataGrid assetType={AssetType.STUDIES} data={studies} total={2} {...{ ...baseProps, onSortChange }} />,
    )
    await user.click(screen.getByText('Study Name'))
    expect(onSortChange).toHaveBeenCalledWith([{ field: 'studyName', sort: 'asc' }])
  })
})
