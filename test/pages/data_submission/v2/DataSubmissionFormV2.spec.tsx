import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { DataSubmissionFormV2 } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { renderWithRouter } from '../../../test-utils'

// The form's sections are irrelevant here; only the submit handlers are under test
vi.mock('src/pages/data_submission/v2/GeneralStudyInformation', () => ({ GeneralStudyInformation: () => null }))
vi.mock('src/pages/data_submission/v2/NihAnvilUseRelated', () => ({ NihAnvilUseRelated: () => null }))
vi.mock('src/pages/data_submission/v2/NihAdministrativeInformation', () => ({ NihAdministrativeInformation: () => null }))
vi.mock('src/pages/data_submission/v2/NihDataManagement', () => ({ NihDataManagement: () => null }))
vi.mock('src/pages/data_submission/v2/StudyAssetManagement', () => ({ StudyAssetManagement: () => null }))
vi.mock('src/components/modals/SupportRequestModal', () => ({ SupportRequestModal: () => null }))
vi.mock('src/components/TableHeaderSection', () => ({ default: () => null }))

const mockUseParams = vi.fn()
vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof import('react-router')>()
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => mockUseParams() }
})

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return { ...actual, Notifications: { showError: vi.fn(), showNotification: vi.fn() } }
})

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    registerDataset: vi.fn(),
    updateStudy: vi.fn(),
    getStudyById: vi.fn(),
  },
}))

vi.mock('src/pages/data_submission/v2/v2-common-functions', () => ({
  studyToDatasetSchemaSubmission: (study: Study) => study,
  buildConsentGroupsFromStudy: (study: Study) => study.assets?.consentGroups ?? [],
  getStudyPropertyValueByKey: () => ({}),
}))

/** Consent joins Data Use consistency violations with newlines in a single 400 message. */
const VIOLATIONS = [
  'Consent group 1: Open-access datasets must have no primary data use',
  'Consent group 2: controlled datasets must have exactly one primary data use',
  'Consent group 3: general research use, health/medical/biomedical, or other',
]

const validationRejection = (): Error => {
  const error = new Error(VIOLATIONS.join('\n')) as Error & { response: { status: number, data: object } }
  error.response = { status: 400, data: { message: VIOLATIONS.join('\n') } }
  return error
}

const renderForm = () => renderWithRouter(<DataSubmissionFormV2 />)

/** Render whatever was handed to showError so each violation can be asserted as its own line. */
const renderedNotification = (): HTMLElement => {
  const showError = vi.mocked(Notifications.showError)
  expect(showError).toHaveBeenCalledTimes(1)
  const { text } = showError.mock.calls[0][0] as { text: React.ReactNode }
  return render(<>{text}</>).container
}

describe('DataSubmissionFormV2 Data Use validation errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders every violation from a 400 on study creation', async () => {
    const user = userEvent.setup()
    mockUseParams.mockReturnValue({})
    vi.mocked(DataSet.registerDataset).mockRejectedValue(validationRejection())

    renderForm()
    await user.click(await screen.findByRole('button', { name: /create study/i }))

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    const container = renderedNotification()
    expect(container).toHaveTextContent('Study creation failed:')
    for (const violation of VIOLATIONS) {
      expect(container).toHaveTextContent(violation)
    }
    expect(container.querySelectorAll('br')).toHaveLength(VIOLATIONS.length + 1)
  })

  it('renders every violation from a 400 on study update', async () => {
    const user = userEvent.setup()
    mockUseParams.mockReturnValue({ studyId: '42' })
    vi.mocked(DataSet.getStudyById).mockResolvedValue({ data: {} } as Study)
    vi.mocked(DataSet.updateStudy).mockRejectedValue(validationRejection())

    renderForm()
    await user.click(await screen.findByRole('button', { name: /update study/i }))

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    const container = renderedNotification()
    expect(container).toHaveTextContent('Study update failed:')
    for (const violation of VIOLATIONS) {
      expect(container).toHaveTextContent(violation)
    }
  })

  // A rejected write persisted nothing, so the form still holds the only copy of the user's edits
  it('does not reload the study after a 400 on update', async () => {
    const user = userEvent.setup()
    mockUseParams.mockReturnValue({ studyId: '42' })
    vi.mocked(DataSet.getStudyById).mockResolvedValue({ data: {} } as Study)
    vi.mocked(DataSet.updateStudy).mockRejectedValue(validationRejection())

    renderForm()
    await waitFor(() => expect(DataSet.getStudyById).toHaveBeenCalledTimes(1))
    await user.click(await screen.findByRole('button', { name: /update study/i }))

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    expect(DataSet.getStudyById).toHaveBeenCalledTimes(1)
  })

  // The form is the only copy of the edits after a 400, so it must still hold the attachments
  it('resubmits both attachments after a 400 rather than dropping them', async () => {
    const user = userEvent.setup()
    const plan = new File(['plan'], 'plan.pdf')
    const certification = new File(['cert'], 'cert.pdf')
    mockUseParams.mockReturnValue({ studyId: '42' })
    vi.mocked(DataSet.getStudyById).mockResolvedValue({
      data: {},
      alternativeDataSharingPlanFile: plan,
      assets: { consentGroups: [{ addedNIHInstitutionalCertificationFile: certification }] },
    } as unknown as Study)
    vi.mocked(DataSet.updateStudy).mockRejectedValueOnce(validationRejection()).mockResolvedValueOnce({} as Study)

    renderForm()
    await user.click(await screen.findByRole('button', { name: /update study/i }))
    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    await user.click(await screen.findByRole('button', { name: /update study/i }))

    await waitFor(() => expect(DataSet.updateStudy).toHaveBeenCalledTimes(2))
    const [, resubmitted] = vi.mocked(DataSet.updateStudy).mock.calls[1] as unknown as [string, FormData]
    expect((resubmitted.get('alternativeDataSharingPlan') as File)?.name).toBe('plan.pdf')
    expect((resubmitted.get('consentGroups[0].nihInstitutionalCertificationFile') as File)?.name).toBe('cert.pdf')
    // The file travels as its own part; leaving it in the JSON too would serialize it as `{}`.
    expect(resubmitted.get('dataset')).not.toContain('addedNIHInstitutionalCertificationFile')
  })

  // A rejection can arrive as the raw response rather than as a thrown Error
  it('renders every violation from a 400 that is not an Error instance', async () => {
    const user = userEvent.setup()
    mockUseParams.mockReturnValue({})
    vi.mocked(DataSet.registerDataset).mockRejectedValue({ response: { status: 400, data: { message: VIOLATIONS.join('\n') } } })

    renderForm()
    await user.click(await screen.findByRole('button', { name: /create study/i }))

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    const container = renderedNotification()
    for (const violation of VIOLATIONS) {
      expect(container).toHaveTextContent(violation)
    }
    expect(container).not.toHaveTextContent('[object Object]')
  })

  // A server fault is not a form problem the submitter can fix, so it must not read like one
  it('does not render a server fault on creation as a violation list', async () => {
    const user = userEvent.setup()
    mockUseParams.mockReturnValue({})
    const serverError = new Error('Internal Server Error') as Error & { response: { status: number } }
    serverError.response = { status: 500 }
    vi.mocked(DataSet.registerDataset).mockRejectedValue(serverError)

    renderForm()
    await user.click(await screen.findByRole('button', { name: /create study/i }))

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    const { text } = vi.mocked(Notifications.showError).mock.calls[0][0] as { text: React.ReactNode }
    expect(text).toBe('Study creation failed: Internal Server Error')
  })

  // A failed update that did change server state still warrants reloading
  it('reloads the study after a non-validation failure on update', async () => {
    const user = userEvent.setup()
    mockUseParams.mockReturnValue({ studyId: '42' })
    vi.mocked(DataSet.getStudyById).mockResolvedValue({ data: {} } as Study)
    const serverError = new Error('Internal Server Error') as Error & { response: { status: number } }
    serverError.response = { status: 500 }
    vi.mocked(DataSet.updateStudy).mockRejectedValue(serverError)

    renderForm()
    await waitFor(() => expect(DataSet.getStudyById).toHaveBeenCalledTimes(1))
    await user.click(await screen.findByRole('button', { name: /update study/i }))

    await waitFor(() => expect(DataSet.getStudyById).toHaveBeenCalledTimes(2))
  })
})
