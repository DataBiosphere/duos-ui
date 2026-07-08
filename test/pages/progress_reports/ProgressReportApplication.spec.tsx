import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BrowserRouter } from 'react-router-dom'
import { ProgressReportApplication } from 'src/pages/dar_application/ProgressReportApplication'
import {
  CombinedDataAccessRequest,
  DataManagementIncident,
  Dataset,
  DuosUser,
  Election,
  FileStorageObject,
} from 'src/types/model'
import { Storage } from 'src/libs/storage'
import {
  needsIrbApprovalDocument,
  validatePRFormData,
  validationFailed,
} from 'src/utils/darFormUtils'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'

// ─── Mock sub-components ────────────────────────────────────────────────────

vi.mock('src/pages/progress_reports/SummarySection', () => {
  function MockSummarySection({
    formState,
    validation,
    onNihStatusUpdate,
    researcher: researcherProp,
  }: {
    formState: FormState
    validation?: Record<string, unknown>
    onNihStatusUpdate?: (valid: boolean) => void
    researcher?: { properties?: Array<{ propertyKey: string, propertyValue: string }> }
  }) {
    React.useEffect(() => {
      const eraAuthorized
        = researcherProp?.properties?.find(p => p.propertyKey === 'eraAuthorized')?.propertyValue === 'true'
      const rawExpiry = Number(
        researcherProp?.properties?.find(p => p.propertyKey === 'eraExpiration')?.propertyValue ?? '0',
      )
      onNihStatusUpdate?.(eraAuthorized && rawExpiry > Date.now())
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return (
      <div data-testid="summary-section">
        <input
          id="intellectualPropertiesYesNo_yes"
          type="radio"
          checked={formState.intellectualPropertiesYesNo}
          onChange={() => {}}
        />
        <input
          id="intellectualPropertiesYesNo_no"
          type="radio"
          checked={!formState.intellectualPropertiesYesNo}
          onChange={() => {}}
        />
        <input
          id="publicationsYesNo_yes"
          type="radio"
          checked={formState.publicationsYesNo}
          onChange={() => {}}
        />
        <input
          id="publicationsYesNo_no"
          type="radio"
          checked={!formState.publicationsYesNo}
          onChange={() => {}}
        />
        <input
          id="presentationsYesNo_yes"
          type="radio"
          checked={formState.presentationsYesNo}
          onChange={() => {}}
        />
        <input
          id="presentationsYesNo_no"
          type="radio"
          checked={!formState.presentationsYesNo}
          onChange={() => {}}
        />
        {(formState.intellectualProperties || []).map((ip, i) => (
          <span key={i}>{ip.title}</span>
        ))}
        {(formState.publications || []).map((pub, i) => (
          <span key={i}>{pub.title}</span>
        ))}
        {(formState.presentations || []).map((p, i) => (
          <span key={i}>{p.title}</span>
        ))}
        {!!validation?.nihEraId && <div className="errored">NIH ERA Commons ID is required</div>}
        <a
          data-cy="era-commons-authenticate-link"
          className={validation?.nihEraId ? 'era-button-state-error' : 'era-button-state'}
          href="#"
        >
          Link NIH Account
        </a>
      </div>
    )
  }
  return { default: MockSummarySection }
})

vi.mock('src/pages/dar_application/SelectableDatasets', () => ({
  default: ({ datasets }: { datasets: Dataset[] }) => (
    <div data-testid="selectable-datasets">
      {(datasets || []).map((ds, i) => (
        <div key={i} className="collaborator-summary-card">
          {ds.name || ds.datasetName}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('src/pages/progress_reports/DataManagementIncident', () => ({
  default: ({ formState }: { formState: FormState }) => (
    <div data-testid="data-management-incident">
      <input
        id="dmiYesNo_yes"
        type="radio"
        checked={formState.dmiYesNo}
        onChange={() => {}}
      />
      <input
        id="dmiYesNo_no"
        type="radio"
        checked={!formState.dmiYesNo}
        onChange={() => {}}
      />
    </div>
  ),
}))

vi.mock('src/pages/progress_reports/DarCloseout', () => ({
  default: ({ formState }: { formState: FormState }) => (
    <div data-testid="dar-closeout">
      <input
        id="closeoutYesNo_yes"
        type="radio"
        checked={formState.closeoutYesNo}
        onChange={() => {}}
      />
      <input
        id="closeoutYesNo_no"
        type="radio"
        checked={!formState.closeoutYesNo}
        onChange={() => {}}
      />
    </div>
  ),
}))

vi.mock('src/pages/progress_reports/SubmitProgressReport', () => ({
  default: ({
    isValid,
    onValidate,
  }: {
    isValid?: boolean
    onValidate?: () => void
  }) => (
    <div>
      {isValid
        ? <button data-cy="pr-submit-button">Submit</button>
        : (
            <button data-cy="pr-validate-button" onClick={onValidate}>
              Validate
            </button>
          )}
    </div>
  ),
}))

vi.mock('src/pages/progress_reports/IrbDocumentUpload', () => ({
  default: () => (
    <div>
      <h2>IRB Documentation</h2>
    </div>
  ),
}))

let lastDaaProps: { datasets: Dataset[], onDaaIdsChange: (ids: number[]) => void } | null = null

vi.mock('src/pages/progress_reports/ProgressReportDataAccessAgreements', () => ({
  default: (props: { datasets: Dataset[], onDaaIdsChange: (ids: number[]) => void }) => {
    lastDaaProps = props
    return null
  },
}))

vi.mock('src/pages/progress_reports/CloseoutReview', () => ({
  CloseoutReview: () => null,
}))

vi.mock('src/pages/progress_reports/CollaboratorChanges', () => ({
  default: () => null,
}))

vi.mock('src/pages/dar_application/DataUseAcknowlegements', () => ({
  DataUseAcknowledgements: () => null,
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/libs/utils', () => ({
  Navigation: { console: vi.fn() },
}))

vi.mock('src/libs/dataUseTranslation', () => ({
  translateDataUseRestrictionsFromDataUseArray: vi.fn().mockResolvedValue([]),
}))

vi.mock('src/utils/darFormUtils', () => ({
  needsIrbApprovalDocument: vi.fn().mockReturnValue(false),
  validatePRFormData: vi.fn().mockReturnValue({ darErrors: {} }),
  validationFailed: vi.fn().mockReturnValue(true),
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const researcher: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'user@test.com',
  emailPreference: true,
  eraCommonsId: 'commons-id',
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{ roleId: 1, name: 'Researcher', userId: 1, userRoleId: 1 }],
  userId: 1,
}

const fso: FileStorageObject = {
  fileStorageObjectId: 1,
  entityId: 'id',
  fileName: 'name',
  category: 'irbCollaborationLetter',
  mediaType: 'image/pdf',
  createUserId: 3,
  createDate: 1,
}

const createDataset = (id: number, name: string, dacApproval = true): Dataset => ({
  datasetId: id,
  name,
  dacApproval,
  dataUse: { generalUse: true },
  datasetName: '',
  createUserId: 0,
  createUser: researcher as unknown as DuosUser,
  dacId: 2,
  translatedDataUse: '',
  deletable: false,
  properties: [],
  alias: id,
  datasetIdentifier: `DUOS-000${id}`,
  objectId: '',
  nihInstitutionalCertificationFile: fso,
  study: {
    studyId: 39,
    description: 'Test Dataset Submission',
    piName: 'Test PI',
    publicVisibility: true,
    dataTypes: ['CITE-seq'],
    name: '',
    datasetIds: [],
    datasets: [],
    properties: [],
    alternativeDataSharingPlan: fso,
    createDate: '',
    createUserId: 0,
  },
  createDate: new Date('2023-10-01T00:00:00Z'),
})

const mockDatasets: Dataset[] = [createDataset(1, 'Test Dataset', true)]

const createApprovedElection = (electionId: number, datasetId: number): Election => ({
  electionId,
  electionType: 'DataAccess',
  status: 'Closed',
  createDate: 1748736000,
  lastUpdate: 1748736000,
  referenceId: 'DAR-123',
  datasetId,
  displayId: `DUOS-000${datasetId}`,
  dulName: '',
  version: 1,
  archived: false,
  votes: {
    1: {
      voteId: 1,
      userId: 1,
      createDate: 1748736000,
      electionId,
      displayName: 'Test User',
      type: 'FINAL',
      vote: true,
    },
  },
})

const createDeniedElection = (electionId: number, datasetId: number): Election => ({
  ...createApprovedElection(electionId, datasetId),
  votes: {
    1: {
      voteId: 1,
      userId: 1,
      createDate: 1748736000,
      electionId,
      displayName: 'Test User',
      type: 'FINAL',
      vote: false,
    },
  },
})

const baseDar: Partial<CombinedDataAccessRequest> = {
  userId: 1,
  projectTitle: 'Test Project',
  draft: false,
  datasetIds: [1],
  referenceId: 'DAR-123',
  collectionId: 1,
  elections: {},
  createDate: 1748736000,
  submissionDate: 1748736000,
  updateDate: 1748736000,
}

const mountComponent = async (
  dar: Partial<CombinedDataAccessRequest> = {},
  readOnly = true,
  datasets = mockDatasets,
  researcherOverride?: DuosUser,
) => {
  const fullDar = { ...baseDar, ...dar } as CombinedDataAccessRequest
  await act(async () => {
    render(
      <BrowserRouter>
        <ProgressReportApplication
          dar={fullDar}
          datasets={datasets}
          readOnlyMode={readOnly}
          researcher={researcherOverride ?? researcher}
          countriesOfOperation={[]}
        />
      </BrowserRouter>,
    )
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ProgressReportApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastDaaProps = null
    Element.prototype.scrollIntoView = () => {}
    vi.mocked(Storage.getCurrentUser).mockReturnValue(researcher)
    vi.mocked(needsIrbApprovalDocument).mockReturnValue(false)
    vi.mocked(validatePRFormData).mockImplementation(nihValid => ({
      darErrors: nihValid ? {} : { nihEraId: { valid: false, message: 'NIH ERA Commons ID is required' } },
    } as ReturnType<typeof validatePRFormData>))
    vi.mocked(validationFailed).mockReturnValue(true)
  })

  it('renders the component without errors', async () => {
    await mountComponent({})
    expect(document.querySelector('.accordion-step-container')).toBeVisible()
  })

  it('does not render dataset/DAA relationship section in read-only mode', async () => {
    await mountComponent({}, true)
    expect(
      screen.queryByText('Dataset and Data Access Agreement Relationships'),
    ).not.toBeInTheDocument()
  })

  it('does not render dataset/DAA relationship section in non-read-only mode', async () => {
    await mountComponent({}, false)
    expect(
      screen.queryByText('Dataset and Data Access Agreement Relationships'),
    ).not.toBeInTheDocument()
  })

  it('does not display required DAA links in read-only mode', async () => {
    await mountComponent({}, true)
    expect(screen.queryByText('Required Data Access Agreements')).not.toBeInTheDocument()
    expect(screen.queryByText('TestDAA')).not.toBeInTheDocument()
  })

  it('does not show the required DAA step in read-only mode', async () => {
    await mountComponent({}, true)
    expect(
      screen.queryByText('Step 2.1: Required Data Access Agreements'),
    ).not.toBeInTheDocument()
  })

  it('mounts ProgressReportDataAccessAgreements with approved datasets in create mode', async () => {
    const ds1 = { ...createDataset(1, 'Dataset 1', true), dacId: 2 }
    const ds2 = { ...createDataset(2, 'Dataset 2', true), dacId: 3 }
    const elections = {
      1: createApprovedElection(1, 1),
      2: createApprovedElection(2, 2),
    }
    await mountComponent({ elections, datasetIds: [1, 2] }, false, [ds1, ds2])
    expect(lastDaaProps).not.toBeNull()
    expect(lastDaaProps!.datasets.map(d => d.datasetId)).toEqual([1, 2])
  })

  it('does not mount ProgressReportDataAccessAgreements in read-only mode', async () => {
    await mountComponent({}, true)
    expect(lastDaaProps).toBeNull()
  })

  // ── intellectualPropertiesYesNo ──────────────────────────────────────────

  it('defaults intellectualPropertiesYesNo to false when dar.intellectualProperties is undefined', async () => {
    await mountComponent({})
    expect(
      document.getElementById('intellectualPropertiesYesNo_no') as HTMLInputElement,
    ).toBeChecked()
    expect(
      document.getElementById('intellectualPropertiesYesNo_yes') as HTMLInputElement,
    ).not.toBeChecked()
  })

  it('defaults intellectualPropertiesYesNo to false when dar.intellectualProperties is empty array', async () => {
    await mountComponent({ intellectualProperties: [] })
    expect(
      document.getElementById('intellectualPropertiesYesNo_no') as HTMLInputElement,
    ).toBeChecked()
    expect(
      document.getElementById('intellectualPropertiesYesNo_yes') as HTMLInputElement,
    ).not.toBeChecked()
  })

  it('sets intellectualPropertiesYesNo to true when dar.intellectualProperties has items', async () => {
    const ip1 = {
      ipId: '1', studyId: '1', type: 'patent', title: 'IP 1',
      assignee: '', patentNumber: '', filingDate: '', status: '', url: '', contact: '',
    }
    const ip2 = {
      ipId: '2', studyId: '1', type: 'patent', title: 'IP 2',
      assignee: '', patentNumber: '', filingDate: '', status: '', url: '', contact: '',
    }
    await mountComponent({ intellectualProperties: [ip1, ip2] })
    expect(
      document.getElementById('intellectualPropertiesYesNo_yes') as HTMLInputElement,
    ).toBeChecked()
    expect(screen.getByText('IP 1')).toBeVisible()
    expect(screen.getByText('IP 2')).toBeVisible()
  })

  // ── publicationsYesNo ────────────────────────────────────────────────────

  it('defaults publicationsYesNo to false when dar.publications is undefined', async () => {
    await mountComponent({})
    expect(
      document.getElementById('publicationsYesNo_no') as HTMLInputElement,
    ).toBeChecked()
  })

  it('defaults publicationsYesNo to false when dar.publications is empty array', async () => {
    await mountComponent({ publications: [] })
    expect(
      document.getElementById('publicationsYesNo_no') as HTMLInputElement,
    ).toBeChecked()
  })

  it('sets publicationsYesNo to true when dar.publications has items', async () => {
    const pub1 = {
      title: 'Publication 1', publishedDate: '', authors: [],
      datasetCitation: '', citation: false, publicationId: '1', studyId: '1',
      journal: '', doi: '',
    }
    const pub2 = {
      title: 'Publication 2', publishedDate: '', authors: [],
      datasetCitation: '', citation: false, publicationId: '2', studyId: '1',
      journal: '', doi: '',
    }
    await mountComponent({ publications: [pub1, pub2] })
    expect(
      document.getElementById('publicationsYesNo_yes') as HTMLInputElement,
    ).toBeChecked()
    expect(screen.getByText('Publication 1')).toBeVisible()
    expect(screen.getByText('Publication 2')).toBeVisible()
  })

  it('displays publications in read-only when they exist', async () => {
    const pub = {
      title: 'Test Publication', publishedDate: '', authors: [],
      datasetCitation: '', citation: false, publicationId: '1', studyId: '1',
      journal: '', doi: '',
    }
    await mountComponent({ publications: [pub] })
    expect(screen.getByText('Test Publication')).toBeVisible()
  })

  // ── presentationsYesNo ───────────────────────────────────────────────────

  it('defaults presentationsYesNo to false when dar.presentations is undefined', async () => {
    await mountComponent({})
    expect(
      document.getElementById('presentationsYesNo_no') as HTMLInputElement,
    ).toBeChecked()
  })

  it('defaults presentationsYesNo to false when dar.presentations is empty array', async () => {
    await mountComponent({ presentations: [] })
    expect(
      document.getElementById('presentationsYesNo_no') as HTMLInputElement,
    ).toBeChecked()
  })

  it('sets presentationsYesNo to true when dar.presentations has items', async () => {
    const p1 = {
      title: 'Presentation 1', date: '', citation: false,
      presentationId: '1', studyId: '1',
    }
    const p2 = {
      title: 'Presentation 2', date: '', citation: false,
      presentationId: '2', studyId: '1',
    }
    await mountComponent({ presentations: [p1, p2] })
    expect(
      document.getElementById('presentationsYesNo_yes') as HTMLInputElement,
    ).toBeChecked()
    expect(screen.getByText('Presentation 1')).toBeVisible()
    expect(screen.getByText('Presentation 2')).toBeVisible()
  })

  // ── IRB document ─────────────────────────────────────────────────────────

  it('does not display IRB document upload when not required by dataUse', async () => {
    vi.mocked(needsIrbApprovalDocument).mockReturnValue(false)
    await mountComponent({}, true)
    expect(screen.queryByText('IRB Documentation')).not.toBeInTheDocument()
  })

  it('displays IRB document upload when required by dataUse', async () => {
    vi.mocked(needsIrbApprovalDocument).mockReturnValue(true)
    await mountComponent({}, true)
    expect(screen.getByText('IRB Documentation')).toBeVisible()
  })

  // ── dmiYesNo ─────────────────────────────────────────────────────────────

  it('defaults dmiYesNo to false when dar.dmi is undefined', async () => {
    await mountComponent({})
    expect(document.getElementById('dmiYesNo_no') as HTMLInputElement).toBeChecked()
  })

  it('defaults dmiYesNo to false when dar.dmi.incidents is undefined', async () => {
    await mountComponent({ dmi: { description: '', incidents: [] } as DataManagementIncident })
    expect(document.getElementById('dmiYesNo_no') as HTMLInputElement).toBeChecked()
  })

  it('sets dmiYesNo to true when dar.dmi.incidents has items', async () => {
    await mountComponent({
      dmi: {
        incidents: ['dmiCombination', 'dmiSharing', 'dmiSecurity'],
        description: '',
      },
    })
    expect(document.getElementById('dmiYesNo_yes') as HTMLInputElement).toBeChecked()
  })

  // ── closeoutYesNo ────────────────────────────────────────────────────────

  it('defaults closeoutYesNo to false when dar.closeoutSupplement is undefined', async () => {
    await mountComponent({})
    expect(document.getElementById('closeoutYesNo_no') as HTMLInputElement).toBeChecked()
  })

  it('sets closeoutYesNo to true when closeoutSupplement has reasons', async () => {
    await mountComponent({
      closeoutSupplement: {
        reasons: ['closeoutProjectCompleted'],
        otherText: '',
        signingOfficialId: 1,
      },
    })
    expect(document.getElementById('closeoutYesNo_yes') as HTMLInputElement).toBeChecked()
  })

  // ── Dataset display ──────────────────────────────────────────────────────

  it('shows only approved datasets in create-mode progress report', async () => {
    const approvedDataset1 = createDataset(1, 'Approved Dataset 1', true)
    const approvedDataset2 = createDataset(2, 'Approved Dataset 2', true)
    const deniedDataset1 = createDataset(3, 'Not DAC Approved Dataset', false)
    const deniedDataset2 = createDataset(4, 'Not DAC Approved Dataset 2', false)

    const elections: Record<number, Election> = {
      1: createApprovedElection(1, 1),
      2: createApprovedElection(2, 2),
      3: createDeniedElection(3, 3),
      4: createDeniedElection(4, 4),
    }

    await mountComponent(
      { elections, datasetIds: [1, 2, 3, 4] },
      false,
      [approvedDataset1, approvedDataset2, deniedDataset1, deniedDataset2],
    )

    await waitFor(() => {
      const cards = document.querySelectorAll(
        '[data-cy="remove-datasets"] .collaborator-summary-card',
      )
      expect(cards).toHaveLength(2)
    })

    expect(screen.getByText('Approved Dataset 1')).toBeVisible()
    expect(screen.getByText('Approved Dataset 2')).toBeVisible()
    expect(screen.queryByText('Not DAC Approved Dataset')).not.toBeInTheDocument()
  })

  it('in create-mode, shows no datasets when none are approved through elections', async () => {
    const ds1 = createDataset(1, 'Dataset 1', false)
    const ds2 = createDataset(2, 'Dataset 2', false)

    const elections: Record<number, Election> = {
      1: createDeniedElection(1, 1),
      2: createDeniedElection(2, 2),
    }

    await mountComponent({ elections, datasetIds: [1, 2] }, false, [ds1, ds2])

    await waitFor(() => {
      const cards = document.querySelectorAll(
        '[data-cy="remove-datasets"] .collaborator-summary-card',
      )
      expect(cards).toHaveLength(0)
    })
  })

  it('in create-mode, only shows datasets that pass all approval criteria', async () => {
    const allCriteriaMet = createDataset(1, 'All Criteria Met', true)
    const noElectionApproval = createDataset(2, 'No Election Approval', true)
    const noDacApproval = createDataset(3, 'No DAC Approval', false)

    const elections: Record<number, Election> = {
      1: createApprovedElection(1, 1),
      2: createDeniedElection(2, 2),
      3: createApprovedElection(3, 3),
    }

    await mountComponent(
      { elections, datasetIds: [1, 2, 3] },
      false,
      [allCriteriaMet, noElectionApproval, noDacApproval],
    )

    await waitFor(() => {
      const cards = document.querySelectorAll(
        '[data-cy="remove-datasets"] .collaborator-summary-card',
      )
      expect(cards).toHaveLength(1)
    })

    expect(screen.getByText('All Criteria Met')).toBeVisible()
    expect(screen.queryByText('No Election Approval')).not.toBeInTheDocument()
    expect(screen.queryByText('No DAC Approval')).not.toBeInTheDocument()
  })

  it('shows only datasets with IDs included in DAR.datasetIds as available datasets (read-only mode)', async () => {
    const ds1 = createDataset(1, 'Dataset 1')
    const ds2 = createDataset(2, 'Dataset 2')
    const ds3 = createDataset(3, 'Dataset 3')
    const ds4 = createDataset(4, 'Dataset 4')

    await mountComponent({ datasetIds: [1, 2] }, true, [ds1, ds2, ds3, ds4])

    await waitFor(() => {
      const cards = document.querySelectorAll(
        '[data-cy="remove-datasets"] .collaborator-summary-card',
      )
      expect(cards).toHaveLength(2)
    })
  })

  // ── Validate / Submit buttons ────────────────────────────────────────────

  it('shows Validate button in create mode when required fields are missing', async () => {
    await mountComponent({}, false)
    expect(document.querySelector('[data-cy="pr-validate-button"]')).toBeVisible()
    expect(screen.getByText('Validate')).toBeVisible()
    expect(document.querySelector('[data-cy="pr-submit-button"]')).not.toBeInTheDocument()
  })

  it('does not show Validate or Submit button in read-only mode', async () => {
    await mountComponent({}, true)
    expect(document.querySelector('[data-cy="pr-validate-button"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-cy="pr-submit-button"]')).not.toBeInTheDocument()
  })

  it('Validate button stays visible after being clicked', async () => {
    await mountComponent({}, false)
    const validateBtn = document.querySelector('[data-cy="pr-validate-button"]')!
    await act(async () => {
      fireEvent.click(validateBtn)
    })
    expect(document.querySelector('[data-cy="pr-validate-button"]')).toBeVisible()
  })

  it('clicking Validate reveals error indicators on required fields', async () => {
    await mountComponent({}, false)
    const validateBtn = document.querySelector('[data-cy="pr-validate-button"]')!
    await act(async () => {
      fireEvent.click(validateBtn)
    })
    await waitFor(() => {
      expect(document.querySelector('.errored')).toBeVisible()
    })
  })

  it('clicking Validate shows error styling on ERA Commons authenticate button when NIH is not linked', async () => {
    await mountComponent({}, false)
    const validateBtn = document.querySelector('[data-cy="pr-validate-button"]')!
    await act(async () => {
      fireEvent.click(validateBtn)
    })
    await waitFor(() => {
      const eraLink = document.querySelector('[data-cy="era-commons-authenticate-link"]')!
      expect(eraLink).toHaveClass('era-button-state-error')
    })
  })

  it('shows Submit button when all required fields are complete and NIH is linked', async () => {
    vi.mocked(validationFailed).mockReturnValue(false)
    const validResearcher: DuosUser = {
      ...researcher,
      properties: [
        { propertyId: 1, userId: 1, propertyKey: 'eraAuthorized', propertyValue: 'true' },
        { propertyId: 2, userId: 1, propertyKey: 'eraExpiration', propertyValue: '4000000000000' },
      ],
    }
    await mountComponent(
      {
        progressReportSummary: 'A complete summary of research progress.',
        intellectualProperties: [],
        publications: [],
        presentations: [],
        dmi: { incidents: [], description: '' },
        closeoutSupplement: { reasons: [], otherText: '', signingOfficialId: 0 },
      },
      false,
      mockDatasets,
      validResearcher,
    )
    expect(document.querySelector('[data-cy="pr-submit-button"]')).toBeVisible()
    expect(document.querySelector('[data-cy="pr-validate-button"]')).not.toBeInTheDocument()
  })
})
