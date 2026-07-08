import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SummarySection from 'src/pages/progress_reports/SummarySection'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { DuosUser } from 'src/types/model'
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants'

vi.mock('src/components/era_commons/ERACommons', () => ({
  default: ({ onNihStatusUpdate }: { onNihStatusUpdate?: (valid: boolean) => void }) => {
    const ERACommonsMock = () => {
      React.useEffect(() => {
        onNihStatusUpdate?.(true)
      }, [])
      return <div data-cy="era-commons-authenticate-link">Authenticate your account</div>
    }
    return <ERACommonsMock />
  },
}))

vi.mock('src/components/era_commons/ERACommonsDisplay', () => ({
  ERACommonsDisplay: ({ eraCommonsId }: { eraCommonsId?: string }) => (
    <div data-cy="era-commons-display-id-value">{eraCommonsId}</div>
  ),
}))

vi.mock('src/components/publications_list/PublicationList', () => ({
  default: ({ publications }: { publications?: Array<{ title?: string }> }) => (
    <div data-testid="publication-list">
      {(publications || []).map((p, i) => <span key={i}>{p.title}</span>)}
    </div>
  ),
}))

vi.mock('src/components/presentations_list/PresentationList', () => ({
  default: ({ presentations }: { presentations?: Array<{ title?: string }> }) => (
    <div data-testid="presentation-list">
      {(presentations || []).map((p, i) => <span key={i}>{p.title}</span>)}
    </div>
  ),
}))

vi.mock('src/components/intellectual_property_list/IntellectualPropertyList', () => ({
  default: () => <button>Add IP</button>,
}))

const researcher: DuosUser = {
  userId: 1,
  displayName: 'Test Researcher',
  email: 'researcher@example.com',
  emailPreference: true,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
  createDate: new Date('2020-01-01'),
}

const initialPublications = [
  { title: 'Test Publication 1', publishedDate: '2023-01-01' },
  { title: 'Test Publication 2', publishedDate: '2023-06-01' },
]

const baseFormState: Partial<FormState> = {
  progressReportSummary: '',
  intellectualPropertiesYesNo: false,
  intellectualProperties: [],
  publicationsYesNo: false,
  publications: [],
  presentationsYesNo: false,
  presentations: [],
}

function renderComponent(customState: Partial<FormState> = {}, readOnly = false) {
  const onFormChange = vi.fn()
  const onNihStatusUpdate = vi.fn()
  render(
    <SummarySection
      readOnly={readOnly}
      formState={{ ...baseFormState, ...customState } as FormState}
      onFormChange={onFormChange}
      researcher={researcher}
      onNihStatusUpdate={onNihStatusUpdate}
    />,
  )
  return { onFormChange, onNihStatusUpdate }
}

describe('SummarySection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the component correctly', () => {
    renderComponent()
    expect(document.querySelector('[data-cy="summary-section"]')).toBeVisible()
    expect(screen.getByText('Step 1: Submit a Progress Report')).toBeVisible()
    expect(screen.getByText('1.1 Researcher Identification')).toBeVisible()
    expect(screen.getByText('1.2 Summary of Progress')).toBeVisible()
    expect(screen.getByText('1.3 Intellectual Property')).toBeVisible()
    expect(screen.getByText('1.4 Publications')).toBeVisible()
    expect(screen.getByText('1.5 Presentations')).toBeVisible()
  })

  it('renders in read-only mode correctly', () => {
    renderComponent({}, true)
    expect(screen.getByText('Review a Progress Report')).toBeVisible()
    expect(screen.queryByText('Step 1: Submit a Progress Report')).not.toBeInTheDocument()
  })

  it('displays the correct descriptions for each section', () => {
    renderComponent()
    // 1.2 Summary of Progress — plain text, no child elements
    expect(screen.getByText(/Please summarize your research on this project/)).toBeVisible()
    // 1.3 Intellectual Property — text node before the <strong> is matched; the bold word is checked separately
    expect(screen.getByText(/Have you generated any/)).toBeVisible()
    expect(screen.getByText('intellectual property (IP)')).toBeVisible()
    // 1.4 Publications and 1.5 Presentations — "publications"/"presentations" live inside <strong>,
    // so getByText targets the <strong> element directly
    expect(screen.getByText('publications')).toBeVisible()
    expect(screen.getByText('presentations')).toBeVisible()
  })

  it('handles summary text input', () => {
    const { onFormChange } = renderComponent()
    const textarea = document.getElementById('progressReportSummary') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'My research progress update.' } })
    expect(onFormChange).toHaveBeenCalledWith({ progressReportSummary: 'My research progress update.' })
  })

  it('enforces character limit on summary text', () => {
    renderComponent()
    const textarea = document.getElementById('progressReportSummary') as HTMLTextAreaElement
    expect(textarea).toHaveAttribute('maxlength', String(FORM_TEXT_AREA_MAX_LENGTH))
  })

  it('handles intellectual property radio buttons', () => {
    const { onFormChange } = renderComponent()
    const yesRadio = document.getElementById('intellectualPropertiesYesNo_yes') as HTMLInputElement
    fireEvent.click(yesRadio)
    expect(onFormChange).toHaveBeenCalledWith({ intellectualPropertiesYesNo: true })

    const noRadio = document.getElementById('intellectualPropertiesYesNo_no') as HTMLInputElement
    fireEvent.click(noRadio)
    expect(onFormChange).toHaveBeenLastCalledWith({ intellectualPropertiesYesNo: false })
  })

  it('shows intellectualProperties list when "Yes" is selected', () => {
    renderComponent({ intellectualPropertiesYesNo: true })
    expect(screen.getByRole('button', { name: 'Add IP' })).toBeVisible()
  })

  it('handles publications radio buttons', () => {
    const { onFormChange } = renderComponent()
    const yesRadio = document.getElementById('publicationsYesNo_yes') as HTMLInputElement
    fireEvent.click(yesRadio)
    expect(onFormChange).toHaveBeenCalledWith({ publicationsYesNo: true })

    const noRadio = document.getElementById('publicationsYesNo_no') as HTMLInputElement
    fireEvent.click(noRadio)
    expect(onFormChange).toHaveBeenLastCalledWith({ publicationsYesNo: false })
  })

  it('shows publications list when "Yes" is selected', () => {
    renderComponent({ publicationsYesNo: true })
    expect(screen.getByTestId('publication-list')).toBeVisible()
  })

  it('handles presentations radio buttons', () => {
    const { onFormChange } = renderComponent()
    const yesRadio = document.getElementById('presentationsYesNo_yes') as HTMLInputElement
    fireEvent.click(yesRadio)
    expect(onFormChange).toHaveBeenCalledWith({ presentationsYesNo: true })

    const noRadio = document.getElementById('presentationsYesNo_no') as HTMLInputElement
    fireEvent.click(noRadio)
    expect(onFormChange).toHaveBeenLastCalledWith({ presentationsYesNo: false })
  })

  it('shows presentations list when "Yes" is selected', () => {
    renderComponent({ presentationsYesNo: true })
    expect(screen.getByTestId('presentation-list')).toBeVisible()
  })

  it('displays preloaded publications', () => {
    renderComponent({ publicationsYesNo: true, publications: initialPublications as FormState['publications'] })
    expect(screen.getByText('Test Publication 1')).toBeVisible()
    expect(screen.getByText('Test Publication 2')).toBeVisible()
  })

  it('shows era authenticated researcher commons id', () => {
    renderComponent({ eraCommonsId: 'scoobydoo' }, true)
    expect(screen.getByText('scoobydoo')).toBeVisible()
    expect(document.querySelector('[data-cy="era-commons-display-id-value"]')).toBeVisible()
  })

  it('shows authentication message for un-authed user', () => {
    renderComponent()
    expect(screen.getByText('Authenticate your account')).toBeVisible()
    expect(document.querySelector('[data-cy="era-commons-authenticate-link"]')).toBeVisible()
  })
})
