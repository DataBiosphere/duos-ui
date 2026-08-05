import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ReviewHeader from 'src/pages/dar_collection_review/ReviewHeader'

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

const soBaseProps = {
  approvedDatasets: [],
  signingOfficialName: 'John SO',
  signingOfficialEmail: 'john.so@broad.mit.edu',
  researcherInstitutionId: 42,
}

describe('ReviewHeader - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
  })

  it('Renders the header with no datasets approved', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
        approvedDatasets={[]}
      />,
    )

    expect(screen.getByText('DAR-100')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('No datasets approved')).toBeInTheDocument()
  })

  it('Renders the header with datasets approved', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
        approvedDatasets={['Dataset1', 'Dataset2']}
      />,
    )

    expect(screen.getByText('2 Datasets approved: Dataset1, Dataset2')).toBeInTheDocument()
  })

  it('Renders read-only tag next to the title when readOnly prop is true', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
        approvedDatasets={[]}
      />,
    )

    expect(screen.getByText('(read-only)')).toBeInTheDocument()
  })

  it('Does not render read-only tag when readOnly prop is false', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={false}
        approvedDatasets={[]}
      />,
    )

    expect(screen.queryByText(/read-only/)).not.toBeInTheDocument()
  })

  it('renders researcher and institution facts', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        userName="Jane Doe"
        institutionName="Broad Institute"
      />,
    )

    expect(container.querySelector('#researcher-fact')).toHaveTextContent('Jane Doe')
    expect(container.querySelector('#institution-fact')).toHaveTextContent('Broad Institute')
  })

  it('Renders skeleton loader when isLoading is true', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        isLoading={true}
      />,
    )

    expect(container.querySelector('.header-skeleton-loader')).toBeInTheDocument()
    expect(container.querySelector('.header-container')).not.toBeInTheDocument()
  })

  it('Does not render skeleton loader when isLoading is false', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        isLoading={false}
      />,
    )

    expect(container.querySelector('.header-container')).toBeInTheDocument()
    expect(container.querySelector('.header-skeleton-loader')).not.toBeInTheDocument()
  })

  it('renders researcher email as a mailto link', () => {
    render(<ReviewHeader approvedDatasets={[]} userName="Jane Doe" email="jane@example.com" />)
    const link = screen.getByRole('link', { name: /Email Jane Doe/ })
    expect(link.getAttribute('href')).toBe('mailto:jane@example.com')
  })

  it('does not render researcher email fact when absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#researcher-email-fact')).not.toBeInTheDocument()
  })

  it('renders Researcher, Email, then Institution in that order', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        userName="Jane Doe"
        email="jane@example.com"
        institutionName="Broad Institute"
      />,
    )
    const column = container.querySelector('#researcher-info-column')
    const ids = Array.from(column?.children ?? []).map(child => child.id).filter(Boolean)
    expect(ids).toEqual(['researcher-fact', 'researcher-email-fact', 'institution-fact'])
  })

  it('renders a list of external collaborators', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} externalCollaborators={[{ name: 'Person A' }, { name: 'Person B' }]} />,
    )
    expect(container.querySelector('#external-collaborators-fact')).toHaveTextContent('External Collaborators')
    expect(container.querySelector('#external-collaborators-fact')).toHaveTextContent('Person A, Person B')
  })

  it('renders a list of internal collaborators', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} internalCollaborators={[{ name: 'Person C' }, { name: 'Person D' }]} />,
    )
    expect(container.querySelector('#internal-collaborators-fact')).toHaveTextContent('Person C, Person D')
  })

  it('renders a list of internal lab staff', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} internalLabStaff={[{ name: 'Person E' }, { name: 'Person F' }]} />,
    )
    expect(container.querySelector('#internal-lab-staff-fact')).toHaveTextContent('Person E, Person F')
  })

  it('does not render collaborator facts when none are provided', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#external-collaborators-fact')).not.toBeInTheDocument()
    expect(container.querySelector('#internal-collaborators-fact')).not.toBeInTheDocument()
    expect(container.querySelector('#internal-lab-staff-fact')).not.toBeInTheDocument()
  })

  it('renders AnVIL, local computing, and cloud computing facts', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} anvilStorage={true} localComputing={false} cloudComputing={false} />)
    expect(container.querySelector('#anvil-storage-fact')).toHaveTextContent('Yes')
    expect(container.querySelector('#local-computing-fact')).toHaveTextContent('No')
    expect(container.querySelector('#cloud-computing-fact')).toHaveTextContent('No')
  })

  it('renders cloud provider name and description when cloud computing is true', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        cloudComputing={true}
        cloudProvider="AWS"
        cloudProviderDescription="test description"
      />,
    )
    expect(container.querySelector('#cloud-computing-fact')).toHaveTextContent('Yes (AWS)')
    expect(container.querySelector('.cloud-provider-description-textbox')).toHaveTextContent('test description')
  })

  it('does not render cloud provider description when cloud computing is false', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} cloudComputing={false} cloudProviderDescription="test description" />,
    )
    expect(container.querySelector('.cloud-provider-description-textbox')).not.toBeInTheDocument()
  })

  it('renders the signing official name and email from props when API returns no match', async () => {
    render(<ReviewHeader {...soBaseProps} />)

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

    render(<ReviewHeader {...soBaseProps} />)

    await waitFor(() => {
      expect(screen.getByText('Broad Institute')).toBeInTheDocument()
      expect(screen.getByText('John SO')).toBeInTheDocument()
    })
  })

  it('calls getSOsForInstitution with the researcher institution id', async () => {
    render(<ReviewHeader {...soBaseProps} />)

    await waitFor(() => {
      expect(User.getSOsForInstitution).toHaveBeenCalledWith(42)
    })
  })

  it('does not call getSOsForInstitution when researcherInstitutionId is absent', () => {
    render(<ReviewHeader {...soBaseProps} researcherInstitutionId={undefined} />)
    expect(User.getSOsForInstitution).not.toHaveBeenCalled()
  })

  it('does not render the signing official fact when both name and email are absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} signingOfficialName="" signingOfficialEmail="" />)
    expect(container.querySelector('#signing-official-fact')).not.toBeInTheDocument()
  })

  it('renders the signing official email as a mailto link, matching the researcher fact structure', async () => {
    const { container } = render(<ReviewHeader {...soBaseProps} />)

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Email John SO/ })
      expect(link.getAttribute('href')).toBe('mailto:john.so@broad.mit.edu')
    })
    expect(container.querySelector('#signing-official-name-fact')).toHaveTextContent('John SO')
    expect(container.querySelector('#signing-official-email-fact')).toBeInTheDocument()
  })

  it('renders the IT Director email', () => {
    render(<ReviewHeader approvedDatasets={[]} itDirectorEmail="it@broad.mit.edu" />)
    expect(screen.getByText('it@broad.mit.edu')).toBeInTheDocument()
  })

  it('renders the collaboration letter download link when all fields are present', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        collaborationLetterLocation="some-other-uuid"
        referenceId="dar-uuid"
        collaborationLetterName="collab-letter.txt"
      />,
    )
    expect(container.querySelector('#collab-letter')).toHaveTextContent('Download Collaboration Letter')
  })

  it('does not render the download link when referenceId is absent', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        collaborationLetterLocation="some-other-uuid"
        collaborationLetterName="collab-letter.txt"
      />,
    )
    expect(container.querySelector('#collab-letter')).not.toBeInTheDocument()
  })

  it('renders the "Requesting Researcher Info" column heading', () => {
    render(<ReviewHeader approvedDatasets={[]} />)
    expect(screen.getByText('Requesting Researcher Info')).toBeInTheDocument()
  })

  it('renders researcher external profile links without an "External Profile" heading', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        researcherExternalProfiles={{
          linkedIn: 'janedoe',
          ORCID: '0000-0002-1825-0097',
          throughBio: 'janedoe',
          institutionalWebsite: 'https://broad.mit.edu',
        }}
      />,
    )
    expect(container.querySelector('#researcher-linkedin-fact')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /LinkedIn/ }).getAttribute('href')).toBe('https://www.linkedin.com/in/janedoe')
    expect(container.querySelector('#researcher-orcid-fact')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ORCID/ }).getAttribute('href')).toBe('https://orcid.org/0000-0002-1825-0097')
    expect(container.querySelector('#researcher-through-bio-fact')).toBeInTheDocument()
    expect(container.querySelector('#researcher-institutional-website-fact')).toBeInTheDocument()
    expect(screen.queryByText('External Profile')).not.toBeInTheDocument()
    expect(screen.queryByText('External Profiles')).not.toBeInTheDocument()
  })

  it('does not render researcher external profile facts when absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#researcher-linkedin-fact')).not.toBeInTheDocument()
    expect(container.querySelector('#researcher-orcid-fact')).not.toBeInTheDocument()
    expect(container.querySelector('#researcher-through-bio-fact')).not.toBeInTheDocument()
    expect(container.querySelector('#researcher-institutional-website-fact')).not.toBeInTheDocument()
  })

  it('does not render an "External Profile" heading in the Signing Official section', async () => {
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([{
      userId: 7,
      displayName: 'John SO',
      email: 'john.so@broad.mit.edu',
      institutionName: 'Broad Institute',
      userData: { externalProfiles: { linkedIn: 'johnso' } },
    }])

    render(<ReviewHeader {...soBaseProps} />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /LinkedIn/ })).toBeInTheDocument()
    })
    expect(screen.queryByText('External Profile')).not.toBeInTheDocument()
    expect(screen.queryByText('External Profiles')).not.toBeInTheDocument()
  })
})
