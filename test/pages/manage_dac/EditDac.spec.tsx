import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import Modal from 'react-modal'
import EditDac from 'src/pages/manage_dac/EditDac'
import { DAC } from 'src/libs/ajax/DAC'
import { DAA } from 'src/libs/ajax/DAA'
import { User } from 'src/libs/ajax/User'
import { Institution } from 'src/libs/ajax/Institution'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import type { DAAObject, DacObject, DuosUser } from 'src/types/model'

type DAAObjectWithBroadFlag = DAAObject & { broadDaa?: boolean }

vi.mock('src/libs/ajax/DAC')
vi.mock('src/libs/ajax/DAA')
vi.mock('src/libs/ajax/Institution')
vi.mock('src/libs/ajax/User')
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

let uploadTrigger: ((files: File[]) => Promise<void>) | null = null
let capturedOnUserCreated: ((user: DuosUser, role: 'chair' | 'member') => void) | null = null
let mockDaaDownloadFn: ((daaId: number, fileName: string) => void) | null = null

vi.mock('src/components/modals/UploadDaaModal', () => ({
  UploadDaaModal: ({
    showModal,
    onAttachmentChange,
    onCloseRequest,
  }: {
    showModal: boolean
    onAttachmentChange: (files: File[]) => Promise<void>
    onCloseRequest: () => void
  }) => {
    if (showModal) {
      uploadTrigger = async (files: File[]) => {
        await onAttachmentChange(files)
        onCloseRequest()
      }
    }
    else {
      uploadTrigger = null
    }
    if (!showModal) return null
    return <div data-cy="document-upload-fixed-category">Data Access Agreement</div>
  },
}))

vi.mock('src/components/modals/CreateDacUserModal', () => ({
  CreateDacUserModal: ({
    showModal,
    targetRole,
    onUserCreated,
  }: {
    showModal: boolean
    targetRole: 'chair' | 'member'
    onUserCreated: (user: DuosUser, role: 'chair' | 'member') => void
    onCloseRequest: () => void
  }) => {
    if (showModal) {
      capturedOnUserCreated = onUserCreated
    }
    else {
      capturedOnUserCreated = null
    }
    if (!showModal) return null
    return <div data-testid={`create-user-modal-${targetRole}`} />
  },
}))

vi.mock('src/components/DaaTabs', () => ({
  DaaTabs: ({
    ownedDaas,
    sharedDaas,
    selectedDaa,
    onSelectDaa,
    activeTab,
    onTabChange,
  }: {
    ownedDaas: DAAObject[]
    sharedDaas: DAAObject[]
    selectedDaa: DAAObject | null | undefined
    onSelectDaa: (daa: DAAObject) => void
    activeTab: 'owned' | 'shared'
    onTabChange: (tab: 'owned' | 'shared') => void
    isLoading?: boolean
  }) => {
    const displayedDaas = activeTab === 'owned' ? (ownedDaas ?? []) : (sharedDaas ?? [])
    const emptyMessage = activeTab === 'owned'
      ? 'No DAAs created by this DAC'
      : 'No DAAs shared with this DAC'
    return (
      <div data-cy="daa_tabs">
        <button
          role="tab"
          data-cy="daa_tab_owned"
          aria-selected={activeTab === 'owned'}
          onClick={() => onTabChange('owned')}
        >
          {`Owned (${ownedDaas?.length ?? 0})`}
        </button>
        <button
          role="tab"
          data-cy="daa_tab_shared"
          aria-selected={activeTab === 'shared'}
          onClick={() => onTabChange('shared')}
        >
          {`Shared (${sharedDaas?.length ?? 0})`}
        </button>
        {displayedDaas.length === 0
          ? (
              <div>{emptyMessage}</div>
            )
          : (
              displayedDaas.map(daa => (
                <div key={daa.daaId}>
                  <div>
                    <button
                      role="radio"
                      data-cy={`daa_option_${daa.daaId}`}
                      aria-checked={selectedDaa?.daaId === daa.daaId}
                      onClick={() => onSelectDaa(daa)}
                    />
                    <button
                      id={daa.file?.fileName.replace(/\./g, '-')}
                      onClick={() => mockDaaDownloadFn?.(daa.daaId!, daa.file?.fileName ?? '')}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            )}
      </div>
    )
  },
}))

const adminUser = {
  userId: 2,
  displayName: 'Admin',
  institution: { id: 150, name: 'The Broad Institute of MIT and Harvard' },
  roles: [{ userId: 2, roleId: 4, name: 'Admin' }],
  isAdmin: true,
  isChairPerson: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  isAlumni: false,
  isDataSubmitter: false,
  email: 'admin@broadinstitute.org',
  emailPreference: true,
} as unknown as DuosUser

const chairUser = {
  userId: 1,
  displayName: 'Chairperson',
  institutionId: 150,
  institution: { id: 150, name: 'The Broad Institute of MIT and Harvard' },
  roles: [{ userId: 1, roleId: 2, name: 'Chairperson', dacId: 1 }],
  isAdmin: false,
  isChairPerson: true,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  isAlumni: false,
  isDataSubmitter: false,
  email: 'chair@broadinstitute.org',
  emailPreference: true,
} as unknown as DuosUser

const existingDac = {
  dacId: 1,
  name: 'Test DAC',
  description: 'Test DAC',
  email: 'grushton@broadinstitute.org',
  chairpersons: [{
    userId: 1, email: 'test@broadinstitute.org', displayName: 'Chairperson',
    createDate: 1704827256598, roles: [{ userId: 1, roleId: 2, name: 'Chairperson', dacId: 1 }],
    emailPreference: true,
  }],
  members: [{
    userId: 2, email: 'test2@broadinstitute.org', displayName: 'Member',
    createDate: 1704827256598, roles: [{ userId: 2, roleId: 1, name: 'Member', dacId: 1 }],
    emailPreference: true,
  }],
  associatedDaa: {
    daaId: 1, createUserId: 5146, createDate: '2024-04-17', initialDacId: 8,
    file: {
      fileStorageObjectId: 216, entityId: '1', fileName: 'test_daa.txt',
      category: 'dataAccessAgreement', mediaType: 'application/octet-stream',
      createUserId: 5146, createDate: 1713386755554,
    },
    broadDaa: true,
  },
} as unknown as DacObject

const createMockBroadDaa = (overrides: Partial<DAAObjectWithBroadFlag> = {}): DAAObjectWithBroadFlag => ({
  daaId: 1,
  createUserId: 3479,
  createDate: '2024-08-27T00:00:00Z',
  updateUserId: 3479,
  updateDate: '2024-08-27T00:00:00Z',
  initialDacId: 1,
  file: {
    fileStorageObjectId: 1,
    entityId: '1',
    fileName: 'DUOS_Uniform_Data_Access_Agreement.pdf',
    category: 'dataAccessAgreement' as const,
    mediaType: 'application/octet-stream',
    createUserId: 3479,
    createDate: 1722023675199,
  },
  dacs: [],
  ...overrides,
})

const broadDaaList = [createMockBroadDaa()]

const buildExistingDaas = (): DAAObjectWithBroadFlag[] => [
  createMockBroadDaa(),
  createMockBroadDaa({
    daaId: 2,
    initialDacId: existingDac.dacId as number,
    file: {
      fileStorageObjectId: 2,
      entityId: '2',
      fileName: 'custom-daa.pdf',
      category: 'dataAccessAgreement' as const,
      mediaType: 'application/octet-stream',
      createUserId: 3479,
      createDate: 1722023675199,
    },
  }),
]

const mountCreateEditDac = () =>
  render(
    <MemoryRouter initialEntries={['/manage_add_dac_daa']}>
      <Routes>
        <Route path="/manage_add_dac_daa" element={<EditDac />} />
        <Route path="/manage_dac" element={<div data-testid="manage-dac-page" />} />
      </Routes>
    </MemoryRouter>,
  )

const mountExistingEditDac = (dacId: number) =>
  render(
    <MemoryRouter initialEntries={[`/manage_edit_dac_daa/${dacId}`]}>
      <Routes>
        <Route path="/manage_edit_dac_daa/:dacId" element={<EditDac />} />
        <Route path="/manage_dac" element={<div data-testid="manage-dac-page" />} />
      </Routes>
    </MemoryRouter>,
  )

const fillForm = (
  container: HTMLElement,
  name = 'New DAC Name',
  description = 'New DAC Description',
  email = 'newdac@email.com',
): void => {
  fireEvent.change(container.querySelector('[data-cy="dac_name"]')!, { target: { value: name } })
  fireEvent.change(container.querySelector('[data-cy="dac_description"]')!, { target: { value: description } })
  fireEvent.change(container.querySelector('[data-cy="dac_email"]')!, { target: { value: email } })
}

const openUploadModal = (container: HTMLElement): void => {
  fireEvent.click(container.querySelector('[data-cy="daa_upload_button"]')!)
}

const triggerUpload = async (files: File[]): Promise<void> => {
  await act(async () => {
    await uploadTrigger!(files)
  })
}

beforeAll(() => {
  Modal.setAppElement(document.body)
})

beforeEach(() => {
  vi.clearAllMocks()
  uploadTrigger = null
  capturedOnUserCreated = null
  mockDaaDownloadFn = vi.fn()

  vi.mocked(DAC.removeDacMember).mockResolvedValue(200 as never)
  vi.mocked(DAC.addDacChair).mockResolvedValue(200 as never)
  vi.mocked(DAC.removeDacChair).mockResolvedValue(200 as never)
  vi.mocked(DAC.addDacMember).mockResolvedValue(200 as never)
  vi.mocked(Institution.getById).mockResolvedValue({ domains: [] } as never)
})

describe('EditDAC Tests', () => {
  it.each([adminUser, chairUser])('Edit DAC page should load for $displayName', async (user) => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(user)
    vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.getDaas).mockResolvedValue([])
    const { container } = mountExistingEditDac(existingDac.dacId as number)

    await waitFor(() => {
      expect(container.querySelector('[data-cy="dac_name"]')).toBeInTheDocument()
    })

    expect(container.querySelector('[data-cy="dac_name"]')).not.toBeDisabled()
    expect(container.querySelector('[data-cy="dac_description"]')).not.toBeDisabled()
    expect(container.querySelector('[data-cy="dac_email"]')).not.toBeDisabled()
    expect(container.querySelector('[data-cy="btn_save"]')).not.toBeDisabled()
    expect(container.querySelector('[data-cy="btn_cancel"]')).not.toBeDisabled()
    expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa_upload_button"]')).not.toBeDisabled()
  })

  it('Chairs cannot create a DAC', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chairUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    vi.mocked(DAC.create).mockResolvedValue(existingDac as never)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_option_1"]')).toBeInTheDocument()
    })

    fillForm(container)
    fireEvent.click(container.querySelector('[data-cy="daa_option_1"]')!)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAC.create)).not.toHaveBeenCalled()
      expect(vi.mocked(DAA.addDaaToDac)).not.toHaveBeenCalled()
    })
  })

  it('Does not auto-select a DAA when creating a new DAC', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_option_1"]')).toBeInTheDocument()
    })

    expect(container.querySelector('[data-cy="daa_option_1"]')).not.toBeChecked()
  })

  it('Handles onUserCreated for a new chair by adding them during new DAC save', async () => {
    const createdChair = { userId: 7001, displayName: 'New Chair User', email: 'new-chair@broadinstitute.org' } as DuosUser

    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    vi.mocked(DAC.create).mockResolvedValue({ ...existingDac, dacId: 99 } as never)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    vi.mocked(User.create).mockResolvedValue(createdChair as never)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="btn_create_chair"]')).toBeInTheDocument()
    })

    fireEvent.click(container.querySelector('[data-cy="btn_create_chair"]')!)
    await waitFor(() => {
      expect(capturedOnUserCreated).not.toBeNull()
    })
    await act(async () => {
      capturedOnUserCreated!(createdChair, 'chair')
    })

    await waitFor(() => {
      expect(screen.getByText(`${createdChair.displayName} (${createdChair.email})`)).toBeInTheDocument()
    })

    fillForm(container)
    fireEvent.click(container.querySelector('[data-cy="daa_option_1"]')!)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAC.create)).toHaveBeenCalledOnce()
      expect(vi.mocked(DAC.addDacChair)).toHaveBeenCalledWith(99, 7001)
      expect(vi.mocked(DAC.addDacMember)).not.toHaveBeenCalledWith(99, 7001)
    })
  })

  it('Handles onUserCreated for a new member by adding them during existing DAC save', async () => {
    const createdMember = { userId: 7002, displayName: 'New Member User', email: 'new-member@broadinstitute.org' } as DuosUser

    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.getDaas).mockResolvedValue(buildExistingDaas())
    vi.mocked(DAC.update).mockResolvedValue(existingDac as never)
    vi.mocked(User.create).mockResolvedValue(createdMember as never)
    const { container } = mountExistingEditDac(existingDac.dacId as number)

    await waitFor(() => {
      expect(container.querySelector('[data-cy="btn_create_member"]')).toBeInTheDocument()
    })

    fireEvent.click(container.querySelector('[data-cy="btn_create_member"]')!)
    await waitFor(() => {
      expect(capturedOnUserCreated).not.toBeNull()
    })
    await act(async () => {
      capturedOnUserCreated!(createdMember, 'member')
    })

    await waitFor(() => {
      expect(screen.getByText(`${createdMember.displayName} (${createdMember.email})`)).toBeInTheDocument()
    })

    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAC.update)).toHaveBeenCalledOnce()
      expect(vi.mocked(DAC.addDacMember)).toHaveBeenCalledWith(existingDac.dacId, 7002)
    })
  })

  it('Shows error when saving a new DAC without selecting a data access agreement', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    vi.mocked(DAC.create).mockResolvedValue(existingDac as never)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="dac_name"]')).toBeInTheDocument()
    })

    fillForm(container)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Please select a data access agreement or upload your own data access agreement before saving.' }),
      )
      expect(vi.mocked(DAC.create)).not.toHaveBeenCalled()
    })
  })

  it('Allows uploading a custom DAA for new DAC and creates it on save', async () => {
    const customFileName = 'new-custom-daa.pdf'

    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    vi.mocked(DAC.create).mockResolvedValue({ ...existingDac, dacId: 99 } as never)
    vi.mocked(DAA.createDaa).mockResolvedValue({ data: { ...broadDaaList[0], daaId: 55 } } as never)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_upload_button"]')).toBeInTheDocument()
    })

    openUploadModal(container)
    await waitFor(() => {
      expect(uploadTrigger).not.toBeNull()
    })
    const file = new File(['mock daa file'], customFileName, { type: 'application/pdf' })
    await triggerUpload([file])

    await waitFor(() => {
      expect(container.querySelector('[data-cy="uploaded_daa_name"]')).toHaveTextContent(customFileName)
      expect(container.querySelector('[data-cy="uploaded_daa_radio"]')).toBeChecked()
    })

    fillForm(container)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAC.create)).toHaveBeenCalled()
      expect(vi.mocked(DAA.createDaa)).toHaveBeenCalledWith(
        expect.objectContaining({ name: customFileName }),
        99,
      )
    })
  })

  it('Associates selected non-default DAA when editing an existing DAC', async () => {
    const existingDaas = buildExistingDaas()

    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.getDaas).mockResolvedValue(existingDaas)
    vi.mocked(DAC.update).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    const { container } = mountExistingEditDac(existingDac.dacId as number)

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_option_2"]')).toBeInTheDocument()
    })

    fireEvent.click(container.querySelector('[data-cy="daa_option_2"]')!)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAC.update)).toHaveBeenCalled()
      expect(vi.mocked(DAA.addDaaToDac)).toHaveBeenCalledWith(2, existingDac.dacId)
    })
  })

  it('Creates and selects uploaded DAA immediately when editing an existing DAC', async () => {
    const existingDaas = buildExistingDaas()
    const daa77 = createMockBroadDaa({ daaId: 77, initialDacId: 1 })

    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.getDaas)
      .mockResolvedValueOnce(existingDaas)
      .mockResolvedValue([...existingDaas, daa77])
    vi.mocked(DAC.update).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    vi.mocked(DAA.createDaa).mockResolvedValue({ data: { ...broadDaaList[0], daaId: 77 } } as never)
    const { container } = mountExistingEditDac(existingDac.dacId as number)

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
    })

    openUploadModal(container)
    await waitFor(() => {
      expect(uploadTrigger).not.toBeNull()
    })
    const file = new File(['existing dac daa'], 'existing-custom-daa.pdf', { type: 'application/pdf' })
    await triggerUpload([file])

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_option_77"]')).toBeChecked()
    })

    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAA.createDaa)).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'existing-custom-daa.pdf' }),
        existingDac.dacId,
      )
      expect(vi.mocked(DAC.update)).toHaveBeenCalled()
      expect(vi.mocked(DAA.addDaaToDac)).not.toHaveBeenCalledWith(77, existingDac.dacId)
    })
  })

  it('Creates one DAA per uploaded file when creating a new DAC with multiple files', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    vi.mocked(DAC.create).mockResolvedValue({ ...existingDac, dacId: 99 } as never)
    vi.mocked(DAA.createDaa)
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 201 } } as never)
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 202 } } as never)
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 203 } } as never)
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 204 } } as never)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_upload_button"]')).toBeInTheDocument()
    })

    openUploadModal(container)
    await waitFor(() => {
      expect(uploadTrigger).not.toBeNull()
    })
    const files = [1, 2, 3, 4].map(n => new File([`file ${n}`], `new-custom-daa-${n}.pdf`, { type: 'application/pdf' }))
    await triggerUpload(files)

    fillForm(container)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAC.create)).toHaveBeenCalledOnce()
      expect(vi.mocked(DAA.createDaa)).toHaveBeenCalledTimes(4)
    })
  })

  it('Shows per-file error and continues creating remaining DAAs when one uploaded file fails', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAA.getDaas).mockResolvedValue(broadDaaList)
    vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
    vi.mocked(DAC.create).mockResolvedValue({ ...existingDac, dacId: 99 } as never)
    vi.mocked(DAA.createDaa)
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 301, broadDaa: false } } as never)
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 303, broadDaa: false } } as never)
      .mockResolvedValueOnce({ data: { ...broadDaaList[0], daaId: 304, broadDaa: false } } as never)
    const { container } = mountCreateEditDac()

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_upload_button"]')).toBeInTheDocument()
    })

    openUploadModal(container)
    await waitFor(() => {
      expect(uploadTrigger).not.toBeNull()
    })
    const files = ['f1.pdf', 'f2.pdf', 'f3.pdf', 'f4.pdf'].map(
      (name, i) => new File([`file ${i + 1}`], name, { type: 'application/pdf' }),
    )
    await triggerUpload(files)

    fillForm(container)
    fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

    await waitFor(() => {
      expect(vi.mocked(DAA.createDaa)).toHaveBeenCalledTimes(4)
      expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Unable to create DAA for \'f2.pdf\'.' }),
      )
    })
  })

  describe('DAA Tab Selection - Multiple Shared DAAs', () => {
    it('displays owned and shared DAA tabs', async () => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(buildExistingDaas())
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
        expect(container.querySelector('[data-cy="daa_tab_owned"]')).toBeInTheDocument()
        expect(container.querySelector('[data-cy="daa_tab_shared"]')).toBeInTheDocument()
      })
    })

    it('shows owned and shared DAA counts in tab labels', async () => {
      const existingDaas = [
        createMockBroadDaa({ daaId: 1, initialDacId: 99, broadDaa: true }),
        createMockBroadDaa({
          daaId: 2,
          broadDaa: false,
          initialDacId: existingDac.dacId as number,
          file: { fileStorageObjectId: 2, entityId: '2', fileName: 'custom-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
        }),
        createMockBroadDaa({
          daaId: 3,
          broadDaa: false,
          initialDacId: 100,
          file: { fileStorageObjectId: 3, entityId: '3', fileName: 'shared-daa-2.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
        }),
      ]
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(existingDaas)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tab_owned"]')).toBeInTheDocument()
      })

      expect(container.querySelector('[data-cy="daa_tab_owned"]')).toHaveTextContent('(1)')
      expect(container.querySelector('[data-cy="daa_tab_shared"]')).toHaveTextContent('(2)')
    })

    it('defaults to shared tab if no DAA assigned', async () => {
      const daasWithoutAssignment = [
        createMockBroadDaa({ daaId: 1, initialDacId: 99, broadDaa: true }),
        createMockBroadDaa({
          daaId: 2,
          broadDaa: false,
          initialDacId: existingDac.dacId as number,
          file: { fileStorageObjectId: 2, entityId: '2', fileName: 'custom-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
        }),
      ]
      const dacWithoutAssignment = { ...existingDac, associatedDaa: undefined }
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(dacWithoutAssignment as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasWithoutAssignment)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tab_shared"]')).toBeInTheDocument()
      })

      expect(container.querySelector('[data-cy="daa_tab_shared"]')).toHaveAttribute('aria-selected', 'true')
      expect(container.querySelector('[data-cy="daa_tab_owned"]')).toHaveAttribute('aria-selected', 'false')
    })

    it('defaults to owned tab if selected DAA is owned by this DAC', async () => {
      const ownedDaa = createMockBroadDaa({
        daaId: 2, broadDaa: false, initialDacId: existingDac.dacId as number,
        file: { fileStorageObjectId: 2, entityId: '2', fileName: 'custom-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
      })
      const daasWithSelection = [...broadDaaList, ownedDaa]
      const dacWithAssignment = { ...existingDac, associatedDaa: ownedDaa }

      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(dacWithAssignment as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasWithSelection)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tab_owned"]')).toBeInTheDocument()
      })

      expect(container.querySelector('[data-cy="daa_tab_owned"]')).toHaveAttribute('aria-selected', 'true')
      expect(container.querySelector('[data-cy="daa_tab_shared"]')).toHaveAttribute('aria-selected', 'false')
    })

    it('defaults to shared tab if selected DAA is shared from another DAC', async () => {
      const sharedDaa = createMockBroadDaa({
        daaId: 5, broadDaa: false, initialDacId: 99,
        file: { fileStorageObjectId: 5, entityId: '5', fileName: 'shared-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
      })
      const daasWithSelection = [...buildExistingDaas(), sharedDaa]
      const dacWithAssignment = { ...existingDac, associatedDaa: sharedDaa }

      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(dacWithAssignment as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasWithSelection)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tab_shared"]')).toBeInTheDocument()
      })

      expect(container.querySelector('[data-cy="daa_tab_shared"]')).toHaveAttribute('aria-selected', 'true')
      expect(container.querySelector('[data-cy="daa_tab_owned"]')).toHaveAttribute('aria-selected', 'false')
    })

    it('can select DAA from owned tab', async () => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(buildExistingDaas())
      vi.mocked(DAC.update).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_option_2"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_tab_owned"]')!)
      fireEvent.click(container.querySelector('[data-cy="daa_option_2"]')!)
      fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

      await waitFor(() => {
        expect(vi.mocked(DAC.update)).toHaveBeenCalled()
        expect(vi.mocked(DAA.addDaaToDac)).toHaveBeenCalledWith(2, existingDac.dacId)
      })
    })

    it('can select DAA from shared tab', async () => {
      const sharedDaa = createMockBroadDaa({
        daaId: 5, broadDaa: false, initialDacId: 99,
        file: { fileStorageObjectId: 5, entityId: '5', fileName: 'shared-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
      })
      const daasWithSelection = [...buildExistingDaas(), sharedDaa]
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasWithSelection)
      vi.mocked(DAC.update).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.addDaaToDac).mockResolvedValue(200 as never)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_tab_shared"]')!)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_option_5"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_option_5"]')!)
      fireEvent.click(container.querySelector('[data-cy="btn_save"]')!)

      await waitFor(() => {
        expect(vi.mocked(DAC.update)).toHaveBeenCalled()
        expect(vi.mocked(DAA.addDaaToDac)).toHaveBeenCalledWith(5, existingDac.dacId)
      })
    })

    it('newly uploaded DAA appears in owned tab and is auto-selected', async () => {
      const existingDaas = buildExistingDaas()
      const daa88 = createMockBroadDaa({ daaId: 88, broadDaa: false, initialDacId: existingDac.dacId as number })

      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas)
        .mockResolvedValueOnce(existingDaas)
        .mockResolvedValue([...existingDaas, daa88])
      vi.mocked(DAA.createDaa).mockResolvedValue({
        data: { ...broadDaaList[0], daaId: 88, broadDaa: false, initialDacId: existingDac.dacId },
      } as never)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      })

      openUploadModal(container)
      await waitFor(() => {
        expect(uploadTrigger).not.toBeNull()
      })
      await triggerUpload([new File(['new daa'], 'new-daa.pdf', { type: 'application/pdf' })])

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tab_owned"]')).toHaveAttribute('aria-selected', 'true')
        expect(container.querySelector('[data-cy="daa_option_88"]')).toBeChecked()
      })
    })

    it('shows empty state for owned tab when no custom DAAs exist', async () => {
      const daasWithoutOwned = [createMockBroadDaa({ daaId: 1, initialDacId: 99, broadDaa: true })]
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasWithoutOwned)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_tab_owned"]')!)

      await waitFor(() => {
        expect(screen.getByText('No DAAs created by this DAC')).toBeInTheDocument()
      })
    })

    it('shows empty state for shared tab when no shared DAAs exist', async () => {
      const daasAllOwned = [
        createMockBroadDaa({ daaId: 1, initialDacId: existingDac.dacId as number }),
        createMockBroadDaa({
          daaId: 2, initialDacId: existingDac.dacId as number,
          file: { fileStorageObjectId: 2, entityId: '2', fileName: 'custom.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
        }),
      ]
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasAllOwned)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_tab_shared"]')!)

      await waitFor(() => {
        expect(screen.getByText('No DAAs shared with this DAC')).toBeInTheDocument()
      })
    })

    it('download button works for DAA in owned tab', async () => {
      const ownedDaas = [
        createMockBroadDaa({
          daaId: 2, broadDaa: false, initialDacId: existingDac.dacId as number,
          file: { fileStorageObjectId: 2, entityId: '2', fileName: 'custom-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
        }),
      ]
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(ownedDaas)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_tab_owned"]')!)
      fireEvent.click(container.querySelector('#custom-daa-pdf')!)

      expect(mockDaaDownloadFn).toHaveBeenCalledWith(2, 'custom-daa.pdf')
    })

    it('download button works for DAA in shared tab', async () => {
      const sharedDaa = createMockBroadDaa({
        daaId: 5, broadDaa: false, initialDacId: 99,
        file: { fileStorageObjectId: 5, entityId: '5', fileName: 'shared-daa.pdf', category: 'dataAccessAgreement' as const, mediaType: 'application/octet-stream', createUserId: 3479, createDate: 1722023675199 },
      })
      const daasWithSelection = [...buildExistingDaas(), sharedDaa]
      vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
      vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
      vi.mocked(DAA.getDaas).mockResolvedValue(daasWithSelection)
      const { container } = mountExistingEditDac(existingDac.dacId as number)

      await waitFor(() => {
        expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('[data-cy="daa_tab_shared"]')!)

      await waitFor(() => {
        expect(container.querySelector('#shared-daa-pdf')).toBeInTheDocument()
      })

      fireEvent.click(container.querySelector('#shared-daa-pdf')!)

      expect(mockDaaDownloadFn).toHaveBeenCalledWith(5, 'shared-daa.pdf')
    })
  })
})

describe('EditDAC Tests - No DAAs Configured', () => {
  it('should display tabs when no DAAs are configured', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(adminUser)
    vi.mocked(DAC.get).mockResolvedValue(existingDac as never)
    vi.mocked(DAA.getDaas).mockResolvedValue([])
    const { container } = mountExistingEditDac(existingDac.dacId as number)

    await waitFor(() => {
      expect(container.querySelector('[data-cy="daa_tabs"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="daa_tab_owned"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="daa_tab_shared"]')).toBeInTheDocument()
    })

    expect(container.querySelector('[data-cy="daa_upload_button"]')).toBeEnabled()
  })
})
