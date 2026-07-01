import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ApplicationInformation from 'src/pages/dar_collection_review/ApplicationInformation'

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getSOsForInstitution: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: {
    downloadDARDocument: vi.fn(),
  },
}))

import { User } from 'src/libs/ajax/User'

const baseProps = {
  researcher: 'Jane Researcher',
  email: 'jane@example.com',
  institution: 'Broad Institute',
  signingOfficialName: 'John SO',
  signingOfficialEmail: 'john.so@broad.mit.edu',
  researcherInstitutionId: 42,
  itDirectorEmail: 'it@broad.mit.edu',
  isLoading: false,
}

describe('ApplicationInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
  })

  it('renders the application information page container', () => {
    const { container } = render(<ApplicationInformation />)
    expect(container.querySelector('.application-information-page')).toBeInTheDocument()
  })

  it('renders applicant information', () => {
    render(<ApplicationInformation {...baseProps} />)
    expect(screen.getByText('Jane Researcher')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Broad Institute')).toBeInTheDocument()
  })

  it('renders researcher label and span with correct ids', () => {
    const { container } = render(<ApplicationInformation researcher="test person" />)
    expect(container.querySelector('#researcher-label')).toHaveTextContent('Researcher')
    expect(container.querySelector('#researcher-span')).toHaveTextContent('test person')
  })

  it('renders email label and span with correct ids', () => {
    const { container } = render(<ApplicationInformation email="test email" />)
    expect(container.querySelector('#researcher-email-label')).toHaveTextContent('Researcher Email')
    expect(container.querySelector('#researcher-email-span')).toHaveTextContent('test email')
  })

  it('renders institution label and span with correct ids', () => {
    const { container } = render(<ApplicationInformation institution="test" />)
    expect(container.querySelector('#institution-label')).toHaveTextContent('Institution')
    expect(container.querySelector('#institution-span')).toHaveTextContent('test')
  })

  it('renders the Non-Technical Summary section', () => {
    const { container } = render(<ApplicationInformation nonTechSummary="test summary" />)
    expect(container.querySelector('.non-technical-summary-subheader')).toBeInTheDocument()
    expect(container.querySelector('.non-technical-summary-textbox')).toHaveTextContent('test summary')
  })

  it('renders the Research Use Statement section', () => {
    const { container } = render(<ApplicationInformation rus="test rus" />)
    expect(container.querySelector('.rus-subheader')).toBeInTheDocument()
    expect(container.querySelector('.rus-textbox')).toHaveTextContent('test rus')
  })

  it('renders collaborator subheader when collaborators are provided', () => {
    const { container } = render(
      <ApplicationInformation externalCollaborators={[{ name: 'Person A' }, { name: 'Person B' }]} />,
    )
    expect(container.querySelector('.collaborator-details-container')).toBeInTheDocument()
    expect(container.querySelector('.collaborator-details-subheader')).toHaveTextContent('Collaborators')
  })

  it('does not render the collaborator subheader when none are provided', () => {
    render(<ApplicationInformation />)
    expect(screen.queryByText('Collaborators')).not.toBeInTheDocument()
  })

  it('renders the institution details container and subheader', () => {
    const { container } = render(<ApplicationInformation />)
    expect(container.querySelector('.institution-details-container')).toBeInTheDocument()
    expect(container.querySelector('.institution-details-subheader')).toHaveTextContent('Institution')
  })

  it('renders the cloud use container and subheader', () => {
    const { container } = render(<ApplicationInformation />)
    expect(container.querySelector('.cloud-use-details-container')).toBeInTheDocument()
    expect(container.querySelector('.cloud-use-details-subheader')).toHaveTextContent('Cloud Use')
  })

  it('renders cloud computing provider information when cloudComputing is true', () => {
    const { container } = render(
      <ApplicationInformation
        cloudProvider="test name"
        cloudProviderDescription="test description"
        cloudComputing={true}
      />,
    )
    expect(container.querySelector('#cloud-computing-span')).toHaveTextContent('Yes')
    expect(container.querySelector('#cloud-provider-span')).toHaveTextContent('test name')
    expect(container.querySelector('.cloud-provider-description-textbox')).toHaveTextContent('test description')
  })

  it('hides cloud provider row and description when cloudComputing is false', () => {
    const { container } = render(
      <ApplicationInformation
        cloudProvider="test name"
        cloudProviderDescription="test description"
        cloudComputing={false}
      />,
    )
    expect(container.querySelector('#cloud-computing-span')).toHaveTextContent('No')
    expect(container.querySelector('#cloud-provider-label')).not.toBeInTheDocument()
    expect(container.querySelector('.cloud-provider-description-textbox')).not.toBeInTheDocument()
  })

  it('renders local computing information', () => {
    const { container } = render(<ApplicationInformation localComputing={false} />)
    expect(container.querySelector('#local-computing-label')).toHaveTextContent('Requesting permission to use local computing')
    expect(container.querySelector('#local-computing-span')).toHaveTextContent('No')
  })

  it('renders a list of external collaborators', () => {
    const { container } = render(
      <ApplicationInformation externalCollaborators={[{ name: 'Person A' }, { name: 'Person B' }]} />,
    )
    expect(container.querySelector('#external-collaborators-label')).toHaveTextContent('External Collaborators')
    expect(container.querySelector('#external-collaborators-span')).toHaveTextContent('Person A, Person B')
  })

  it('renders a list of internal collaborators', () => {
    const { container } = render(
      <ApplicationInformation internalCollaborators={[{ name: 'Person C' }, { name: 'Person D' }]} />,
    )
    expect(container.querySelector('#internal-collaborators-label')).toHaveTextContent('Internal Collaborators')
    expect(container.querySelector('#internal-collaborators-span')).toHaveTextContent('Person C, Person D')
  })

  it('renders a list of internal lab staff', () => {
    const { container } = render(
      <ApplicationInformation internalLabStaff={[{ name: 'Person E' }, { name: 'Person F' }]} />,
    )
    expect(container.querySelector('#internal-lab-staff-label')).toHaveTextContent('Internal Lab Staff')
    expect(container.querySelector('#internal-lab-staff-span')).toHaveTextContent('Person E, Person F')
  })

  it('renders AnVIL storage information', () => {
    const { container } = render(<ApplicationInformation anvilStorage={true} />)
    expect(container.querySelector('#anvil-storage-span')).toHaveTextContent('Yes')
    expect(container.querySelector('#anvil-storage-label')).toHaveTextContent('Using AnVIL only for storage and analysis')
  })

  it('renders the signing official name and email from props when API returns no match', async () => {
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
    render(<ApplicationInformation {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByText('John SO')).toBeInTheDocument()
      expect(screen.getByText('john.so@broad.mit.edu')).toBeInTheDocument()
    })
  })

  it('renders enriched SO data including institution name from the API response', async () => {
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([{
      userId: 7,
      displayName: 'John SO',
      email: 'john.so@broad.mit.edu',
      institutionName: 'Broad Institute',
      userData: {},
    }])

    render(<ApplicationInformation {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByText('Broad Institute')).toBeInTheDocument()
      expect(screen.getByText('John SO')).toBeInTheDocument()
    })
  })

  it('renders external profile links from the API response', async () => {
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([{
      userId: 7,
      displayName: 'John SO',
      email: 'john.so@broad.mit.edu',
      institutionName: 'Broad Institute',
      userData: {
        externalProfiles: {
          linkedIn: 'johnso',
          institutionalWebsite: 'https://broad.mit.edu',
        },
      },
    }])

    render(<ApplicationInformation {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /LinkedIn/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Institutional Website/ })).toBeInTheDocument()
    })
  })

  it('calls getSOsForInstitution with the researcher institution id', async () => {
    render(<ApplicationInformation {...baseProps} />)

    await waitFor(() => {
      expect(User.getSOsForInstitution).toHaveBeenCalledWith(42)
    })
  })

  it('does not call getSOsForInstitution when researcherInstitutionId is absent', () => {
    render(<ApplicationInformation {...baseProps} researcherInstitutionId={undefined} />)
    expect(User.getSOsForInstitution).not.toHaveBeenCalled()
  })

  it('does not render the signing official card when both name and email are absent', () => {
    render(<ApplicationInformation {...baseProps} signingOfficialName="" signingOfficialEmail="" />)
    expect(screen.queryByText('Signing Official')).not.toBeInTheDocument()
  })

  it('renders the IT Director email', async () => {
    render(<ApplicationInformation {...baseProps} />)
    await waitFor(() => {
      expect(screen.getByText('it@broad.mit.edu')).toBeInTheDocument()
    })
  })

  it('renders the collaboration letter download link when all fields are present', () => {
    const { container } = render(
      <ApplicationInformation
        collaborationLetterLocation="some-other-uuid"
        referenceId="dar-uuid"
        collaborationLetterName="collab-letter.txt"
      />,
    )
    expect(container.querySelector('#collab-letter')).toHaveTextContent('Download Collaboration Letter')
  })

  it('does not render document links when referenceId is absent', () => {
    const { container } = render(
      <ApplicationInformation
        irbDocumentLocation="some-uuid"
        collaborationLetterLocation="some-other-uuid"
        irbDocumentName="irbdoc.txt"
        collaborationLetterName="collab-letter.txt"
      />,
    )
    expect(container.querySelector('#irb-doc')).not.toBeInTheDocument()
    expect(container.querySelector('#collab-letter')).not.toBeInTheDocument()
  })
})
