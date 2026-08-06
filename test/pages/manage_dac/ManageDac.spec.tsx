import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import Modal from 'react-modal'
import ManageDac from 'src/pages/manage_dac/ManageDac'
import { DAC } from 'src/libs/ajax/DAC'
import { DataUseTranslation } from 'src/libs/dataUseTranslation'
import { Notifications } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import type { DacObject, Dataset, DuosUser, UserRole } from 'src/types/model'
import type { ManageDacTableProps } from 'src/components/manage_dac_table/ManageDacTable'

vi.mock('src/libs/ajax/DAC')
vi.mock('src/libs/dataUseTranslation')
vi.mock('src/libs/storage')
vi.mock('src/libs/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...original,
    Notifications: {
      ...original.Notifications,
      showError: vi.fn(),
      showSuccess: vi.fn(),
    },
  }
})
vi.mock('src/components/modals/ConfirmationModal', () => ({
  default: ({ showConfirmation, onConfirm, title }: {
    showConfirmation: boolean
    onConfirm: () => Promise<void>
    title: React.ReactNode
    closeConfirmation: () => void
    message: React.ReactNode
    header: React.ReactNode
  }) =>
    showConfirmation
      ? (
          <div>
            <span>{title}</span>
            <button onClick={() => void onConfirm()}>Confirm</button>
          </div>
        )
      : null,
}))

// Module-level function that tests can point at DAC.datasets to restore the call assertion.
// Defaults to returning [] so tests that don't click View Datasets are unaffected.
let mockDacDatasetsImpl: (dacId: number) => Promise<Dataset[]> = () => Promise.resolve([])

vi.mock('src/components/manage_dac_table/ManageDacTable', async () => {
  const { Link } = await vi.importActual<typeof import('react-router')>('react-router')

  const MockTable = ({
    dacs,
    isLoading,
    onViewDatasets,
    setShowConfirmationModal,
    setSelectedDac,
  }: ManageDacTableProps) => (
    <div data-testid="manage-dac-table">
      {isLoading && <img alt="spinner" src="" />}
      {dacs.map(dac => (
        <div key={dac.dacId} data-testid={`dac-row-${dac.dacId}`}>
          <Link to={`/manage_dac/${dac.dacId}`}>{dac.name}</Link>
          <button
            id={`${dac.dacId}_dacDatasets`}
            onClick={() => {
              void mockDacDatasetsImpl(dac.dacId!).then((datasets) => {
                onViewDatasets(dac, datasets.filter(d => d.dacApproval))
              })
            }}
          >
            View Datasets
          </button>
          <Link
            to={`/manage_dac/${dac.dacId}`}
            data-tip={`Edit ${dac.name}`}
          >
            Edit
          </Link>
          <button
            data-tip="Delete DAC"
            onClick={() => {
              setShowConfirmationModal(true)
              setSelectedDac(dac)
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
  return { ManageDacTable: MockTable, default: MockTable }
})

const fixedDate = new Date('2026-05-01T12:00:00.000Z')

const makeUser = (userId: number, displayName: string, roles: UserRole[]): DuosUser => ({
  createDate: fixedDate,
  displayName,
  email: `${displayName.toLowerCase().replace(/\s+/g, '.')}@example.org`,
  emailPreference: true,
  isAdmin: roles.some(r => r.name === 'Admin'),
  isAlumni: false,
  isChairPerson: roles.some(r => r.name === 'Chairperson'),
  isDataSubmitter: false,
  isMember: roles.some(r => r.name === 'Member'),
  isResearcher: false,
  isSigningOfficial: false,
  roles,
  userId,
})

const chairRole = (userId: number, dacId: number): UserRole => ({
  roleId: 1,
  name: 'Chairperson',
  userId,
  userRoleId: 100 + userId,
  dacId,
})

const adminRole = (userId: number): UserRole => ({
  roleId: 2,
  name: 'Admin',
  userId,
  userRoleId: 200 + userId,
})

const adminUser = makeUser(10, 'Admin User', [adminRole(10)])
const chairUser = makeUser(11, 'Chair User', [chairRole(11, 1)])

const primaryDac: DacObject = {
  dacId: 1,
  name: 'Alpha DAC',
  description: 'Alpha description',
  email: 'alpha@example.org',
  chairpersons: [makeUser(1, 'Chair Person', [chairRole(1, 1)])],
  members: [],
}

const secondaryDac: DacObject = {
  dacId: 2,
  name: 'Beta DAC',
  description: 'Beta description',
  email: 'beta@example.org',
  chairpersons: [makeUser(1, 'Chair Person', [chairRole(1, 2)])],
  members: [],
}

const makeDataset = (datasetId: number, name: string, dacApproval: boolean): Dataset => ({
  name,
  datasetId,
  createUserId: 10,
  createUser: adminUser,
  createDate: fixedDate,
  dacId: 1,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: undefined,
  alias: datasetId,
  datasetIdentifier: `DUOS-${String(datasetId).padStart(6, '0')}`,
  dataUse: {},
  dacApproval,
} as unknown as Dataset)

const RouteViewer = () => {
  const location = useLocation()
  return <div data-testid="route-path">{location.pathname}</div>
}

const mountManageDac = () => render(
  <MemoryRouter initialEntries={['/manage_dac']}>
    <Routes>
      <Route path="/manage_dac" element={<ManageDac />} />
      <Route path="/manage_dac/:dacId" element={<RouteViewer />} />
      <Route path="/manage_add_dac_daa" element={<RouteViewer />} />
    </Routes>
  </MemoryRouter>,
)

beforeAll(() => {
  Modal.setAppElement(document.body)
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

beforeEach(() => {
  vi.clearAllMocks()
  mockDacDatasetsImpl = () => Promise.resolve([])
  vi.mocked(DataUseTranslation.translateDataUseRestrictions).mockResolvedValue([])
})

describe('ManageDac', () => {
  it('shows all DACs for admin users', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac, secondaryDac])

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
      expect(screen.getByText('Beta DAC')).toBeInTheDocument()
    })
  })

  it('filters DACs to the chairperson assigned DACs', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chairUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac, secondaryDac])

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })
    expect(screen.queryByText('Beta DAC')).toBeNull()
  })

  it('navigates to the add DAC page when ADD DAC is clicked', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([])

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Manage My Data Access Committee')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /ADD DAC/i }))

    await waitFor(() => {
      expect(screen.getByTestId('route-path')).toHaveTextContent('/manage_add_dac_daa')
    })
  })

  it('navigates to the DAC profile page when the DAC name is clicked', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac])

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Alpha DAC'))

    await waitFor(() => {
      expect(screen.getByTestId('route-path')).toHaveTextContent('/manage_dac/1')
    })
  })

  it('navigates to the edit DAC page when the edit icon is clicked', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac])

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit'))

    await waitFor(() => {
      expect(screen.getByTestId('route-path')).toHaveTextContent(`/manage_dac/${primaryDac.dacId}`)
    })
  })

  it('shows approved datasets inline when View Datasets is clicked', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac])
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset(1, 'Approved Dataset', true),
      makeDataset(2, 'Unapproved Dataset', false),
    ] as never)
    mockDacDatasetsImpl = dacId => DAC.datasets(dacId)

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'View Datasets' }))

    await waitFor(() => {
      expect(vi.mocked(DAC.datasets)).toHaveBeenCalledWith(1)
      expect(screen.getByText('DAC Datasets associated with DAC: Alpha DAC')).toBeInTheDocument()
      expect(screen.getByText('Approved Dataset')).toBeInTheDocument()
    })
    expect(screen.queryByText('Unapproved Dataset')).toBeNull()
    await act(async () => {})
  })

  it('shows an error when a DAC has no approved datasets', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac])
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset(2, 'Unapproved Dataset', false),
    ] as never)
    mockDacDatasetsImpl = dacId => DAC.datasets(dacId)

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'View Datasets' }))

    await waitFor(() => {
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith({ text: 'DAC has no datasets.' })
    })
  })

  it('shows an error and stops loading when the DAC list fails to load', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockRejectedValue(new Error('Network error'))

    mountManageDac()

    await waitFor(() => {
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith({ text: 'Failed to load DACs.' })
    })
    expect(document.querySelector('img[alt="spinner"]')).toBeNull()
  })

  it('hides the datasets section when the Close button is clicked', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list).mockResolvedValue([primaryDac])
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset(1, 'Approved Dataset', true),
    ] as never)
    mockDacDatasetsImpl = dacId => DAC.datasets(dacId)

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'View Datasets' }))

    await waitFor(() => {
      expect(screen.getByText('DAC Datasets associated with DAC: Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByText('DAC Datasets associated with DAC: Alpha DAC')).toBeNull()
    await act(async () => {})
  })

  it('deletes the selected DAC after confirmation and refreshes the list', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.list)
      .mockResolvedValueOnce([primaryDac])
      .mockResolvedValueOnce([])
    vi.mocked(DAC.delete).mockResolvedValue({ status: 200 } as never)

    mountManageDac()

    await waitFor(() => {
      expect(screen.getByText('Alpha DAC')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByText('Delete DAC?')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(vi.mocked(DAC.delete)).toHaveBeenCalledWith(1)
      expect(vi.mocked(DAC.list)).toHaveBeenCalledTimes(2)
      expect(vi.mocked(Notifications.showSuccess)).toHaveBeenCalledWith({ text: 'DAC successfully deleted.' })
      expect(screen.queryByText('Alpha DAC')).toBeNull()
    })
  })
})
