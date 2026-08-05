import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ReviewHeader from 'src/pages/dar_collection_review/ReviewHeader'
import { User } from 'src/libs/ajax/User'

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

    expect(screen.getByText('DAR-100')).toBeTruthy()
    expect(screen.getByText('Title')).toBeTruthy()
    expect(screen.getByText('No datasets approved')).toBeTruthy()
  })

  it('keeps the DAR code and project title on one consistently styled line', () => {
    const { container } = render(
      <ReviewHeader darCode="DAR-100" projectTitle="A long project title" approvedDatasets={[]} />,
    )
    const titleRow = container.querySelector<HTMLElement>('.title-row')
    const darCode = container.querySelector<HTMLElement>('.dar-code')
    const projectTitle = container.querySelector<HTMLElement>('.collection-project-title')

    expect(titleRow?.style.flexWrap).toBe('nowrap')
    expect(projectTitle?.style.whiteSpace).toBe('nowrap')
    expect(projectTitle?.style.fontSize).toBe(darCode?.style.fontSize)
    expect(projectTitle?.style.fontWeight).toBe(darCode?.style.fontWeight)
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

    expect(screen.getByText('2 Datasets approved: Dataset1, Dataset2')).toBeTruthy()
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

    expect(screen.getByText('(read-only)')).toBeTruthy()
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

    expect(screen.queryByText(/read-only/)).toBeNull()
  })

  it('renders researcher and institution facts', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        userName="Jane Doe"
        institutionName="Broad Institute"
      />,
    )

    expect(container.querySelector('#researcher-fact')?.textContent).toContain('Jane Doe')
    expect(container.querySelector('#institution-fact')?.textContent).toContain('Broad Institute')
  })

  it('Renders skeleton loader when isLoading is true', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        isLoading={true}
      />,
    )

    expect(container.querySelector('.header-skeleton-loader')).toBeTruthy()
    expect(container.querySelector('.header-container')).toBeNull()
  })

  it('Does not render skeleton loader when isLoading is false', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        isLoading={false}
      />,
    )

    expect(container.querySelector('.header-container')).toBeTruthy()
    expect(container.querySelector('.header-skeleton-loader')).toBeNull()
  })

  it('renders researcher email as a mailto link', () => {
    render(<ReviewHeader approvedDatasets={[]} userName="Jane Doe" email="jane@example.com" />)
    const link = screen.getByRole('link', { name: /Email Jane Doe/ })
    expect(link.getAttribute('href')).toBe('mailto:jane@example.com')
  })

  it('does not render researcher email fact when absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#researcher-email-fact')).toBeNull()
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
    expect(container.querySelector('#external-collaborators-fact')?.textContent).toContain('External Collaborators')
    expect(container.querySelector('#external-collaborators-fact')?.textContent).toContain('Person A, Person B')
  })

  it('renders a list of internal collaborators', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} internalCollaborators={[{ name: 'Person C' }, { name: 'Person D' }]} />,
    )
    expect(container.querySelector('#internal-collaborators-fact')?.textContent).toContain('Person C, Person D')
  })

  it('renders a list of internal lab staff', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} internalLabStaff={[{ name: 'Person E' }, { name: 'Person F' }]} />,
    )
    expect(container.querySelector('#internal-lab-staff-fact')?.textContent).toContain('Person E, Person F')
  })

  it('does not render collaborator facts when none are provided', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#external-collaborators-fact')).toBeNull()
    expect(container.querySelector('#internal-collaborators-fact')).toBeNull()
    expect(container.querySelector('#internal-lab-staff-fact')).toBeNull()
  })

  it('renders the four facts columns in the required order and placeholders for missing people', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    const factsContainer = container.querySelector('.application-facts-container')
    const columnIds = Array.from(factsContainer?.children ?? []).map(child => child.id)

    expect(columnIds).toEqual([
      'researcher-info-column',
      'collaborators-column',
      'signing-official-column',
      'it-cloud-column',
    ])
    // Scoped to the facts container: the narrative section renders its own "None listed"
    // placeholder for DUO terms, which is not one of the people/IT placeholders under test.
    expect(within(factsContainer as HTMLElement).getAllByText('None listed')).toHaveLength(3)
  })

  it('renders AnVIL, local computing, and cloud computing facts', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} anvilStorage={true} localComputing={false} cloudComputing={false} />)
    expect(container.querySelector('#anvil-storage-fact')?.textContent).toContain('Yes')
    expect(container.querySelector('#local-computing-fact')?.textContent).toContain('No')
    expect(container.querySelector('#cloud-computing-fact')?.textContent).toContain('No')
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
    expect(container.querySelector('#cloud-computing-fact')?.textContent).toContain('Yes (AWS)')
    expect(container.querySelector('.cloud-provider-description-textbox')?.textContent).toContain('test description')
  })

  it('does not render cloud provider description when cloud computing is false', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} cloudComputing={false} cloudProviderDescription="test description" />,
    )
    expect(container.querySelector('.cloud-provider-description-textbox')).toBeNull()
  })

  it('renders the signing official name and email from props when API returns no match', async () => {
    render(<ReviewHeader {...soBaseProps} />)

    expect(await screen.findByText('John SO')).toBeTruthy()
    expect(await screen.findByText('john.so@broad.mit.edu')).toBeTruthy()
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

    expect(await screen.findByText('Broad Institute')).toBeTruthy()
    expect(await screen.findByText('John SO')).toBeTruthy()
  })

  it('does not apply a stale signing official lookup after the DAR changes', async () => {
    type SigningOfficials = Awaited<ReturnType<typeof User.getSOsForInstitution>>
    let resolveFirstLookup: (value: SigningOfficials) => void = () => undefined
    const firstLookup = new Promise<SigningOfficials>((resolve) => {
      resolveFirstLookup = resolve
    })
    vi.mocked(User.getSOsForInstitution)
      .mockReturnValueOnce(firstLookup)
      .mockResolvedValueOnce([{
        userId: 8,
        displayName: 'New SO',
        email: 'new.so@broad.mit.edu',
        institutionName: 'New Institution',
        userData: {},
      }])

    const view = render(
      <ReviewHeader
        approvedDatasets={[]}
        signingOfficialName="Old SO"
        signingOfficialEmail="old.so@broad.mit.edu"
        researcherInstitutionId={41}
      />,
    )
    await act(async () => {
      view.rerender(
        <ReviewHeader
          approvedDatasets={[]}
          signingOfficialName="New SO"
          signingOfficialEmail="new.so@broad.mit.edu"
          researcherInstitutionId={42}
        />,
      )
    })

    expect(await screen.findByText('New Institution')).toBeTruthy()
    await act(async () => {
      resolveFirstLookup([{
        userId: 7,
        displayName: 'Old SO',
        email: 'old.so@broad.mit.edu',
        institutionName: 'Old Institution',
        userData: {},
      }])
    })

    expect(screen.queryByText('Old Institution')).toBeNull()
    expect(screen.getByText('New Institution')).toBeTruthy()
  })

  it('calls getSOsForInstitution with the researcher institution id', async () => {
    render(<ReviewHeader {...soBaseProps} />)

    await screen.findByText('John SO')
    expect(User.getSOsForInstitution).toHaveBeenCalledWith(42)
  })

  it('does not call getSOsForInstitution when researcherInstitutionId is absent', () => {
    render(<ReviewHeader {...soBaseProps} researcherInstitutionId={undefined} />)
    expect(User.getSOsForInstitution).not.toHaveBeenCalled()
  })

  it('does not render the signing official fact when both name and email are absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} signingOfficialName="" signingOfficialEmail="" />)
    expect(container.querySelector('#signing-official-fact')).toBeNull()
  })

  it('renders the signing official email as a mailto link, matching the researcher fact structure', async () => {
    const { container } = render(<ReviewHeader {...soBaseProps} />)

    const link = await screen.findByRole('link', { name: /Email John SO/ })
    expect(link.getAttribute('href')).toBe('mailto:john.so@broad.mit.edu')
    expect(container.querySelector('#signing-official-name-fact')?.textContent).toContain('John SO')
    expect(container.querySelector('#signing-official-email-fact')).toBeTruthy()
  })

  it('renders the IT Director email as a mailto link', () => {
    render(<ReviewHeader approvedDatasets={[]} itDirectorEmail="it@broad.mit.edu" />)
    const link = screen.getByRole('link', { name: /Email IT Director/ })
    expect(link.getAttribute('href')).toBe('mailto:it@broad.mit.edu')
  })

  it('renders a "None listed" placeholder for the IT Director when absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#it-director-fact')?.textContent).toContain('None listed')
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
    expect(container.querySelector('#collab-letter')?.textContent).toContain('Download Collaboration Letter')
  })

  it('does not render the download link when referenceId is absent', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        collaborationLetterLocation="some-other-uuid"
        collaborationLetterName="collab-letter.txt"
      />,
    )
    expect(container.querySelector('#collab-letter')).toBeNull()
  })

  it('renders the "Requesting Researcher Info" column heading', () => {
    render(<ReviewHeader approvedDatasets={[]} />)
    expect(screen.getByText('Requesting Researcher Info')).toBeTruthy()
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
    expect(container.querySelector('#researcher-linkedin-fact')).toBeTruthy()
    expect(screen.getByRole('link', { name: /LinkedIn/ }).getAttribute('href')).toBe('https://www.linkedin.com/in/janedoe')
    expect(container.querySelector('#researcher-orcid-fact')).toBeTruthy()
    expect(screen.getByRole('link', { name: /ORCID/ }).getAttribute('href')).toBe('https://orcid.org/0000-0002-1825-0097')
    expect(container.querySelector('#researcher-through-bio-fact')).toBeTruthy()
    expect(container.querySelector('#researcher-institutional-website-fact')).toBeTruthy()
    expect(screen.queryByText('External Profile')).toBeNull()
    expect(screen.queryByText('External Profiles')).toBeNull()
  })

  it('preserves fully qualified researcher external profile URLs', () => {
    render(
      <ReviewHeader
        approvedDatasets={[]}
        researcherExternalProfiles={{
          linkedIn: 'https://www.linkedin.com/in/janedoe',
          ORCID: 'https://orcid.org/0000-0002-1825-0097',
          throughBio: 'https://through.bio/janedoe',
        }}
      />,
    )

    expect(screen.getByRole('link', { name: /LinkedIn/ }).getAttribute('href')).toBe('https://www.linkedin.com/in/janedoe')
    expect(screen.getByRole('link', { name: /ORCID/ }).getAttribute('href')).toBe('https://orcid.org/0000-0002-1825-0097')
    expect(screen.getByRole('link', { name: /Through.bio/ }).getAttribute('href')).toBe('https://through.bio/janedoe')
  })

  it('renders a non-HTTP external profile value as plain text, not a link', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        researcherExternalProfiles={{
          institutionalWebsite: 'broad.mit.edu',
        }}
      />,
    )

    const fact = container.querySelector('#researcher-institutional-website-fact')
    expect(fact?.textContent).toContain('broad.mit.edu')
    expect(fact?.querySelector('a')).toBeNull()
  })

  it('does not render researcher external profile facts when absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    expect(container.querySelector('#researcher-linkedin-fact')).toBeNull()
    expect(container.querySelector('#researcher-orcid-fact')).toBeNull()
    expect(container.querySelector('#researcher-through-bio-fact')).toBeNull()
    expect(container.querySelector('#researcher-institutional-website-fact')).toBeNull()
  })

  it('treats whitespace-only researcher external profile values as absent', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        researcherExternalProfiles={{
          linkedIn: '   ',
          ORCID: '   ',
          throughBio: '   ',
          institutionalWebsite: '   ',
        }}
      />,
    )
    expect(container.querySelector('#researcher-linkedin-fact')).toBeNull()
    expect(container.querySelector('#researcher-orcid-fact')).toBeNull()
    expect(container.querySelector('#researcher-through-bio-fact')).toBeNull()
    expect(container.querySelector('#researcher-institutional-website-fact')).toBeNull()
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

    expect(await screen.findByRole('link', { name: /LinkedIn/ })).toBeTruthy()
    expect(screen.queryByText('External Profile')).toBeNull()
    expect(screen.queryByText('External Profiles')).toBeNull()
  })

  it('treats whitespace-only signing official external profile values as absent', async () => {
    vi.mocked(User.getSOsForInstitution).mockResolvedValue([{
      userId: 7,
      displayName: 'John SO',
      email: 'john.so@broad.mit.edu',
      institutionName: 'Broad Institute',
      userData: {
        externalProfiles: {
          linkedIn: '   ',
          ORCID: '   ',
          throughBio: '   ',
          institutionalWebsite: '   ',
        },
      },
    }])

    const { container } = render(<ReviewHeader {...soBaseProps} />)

    await screen.findByText('John SO')
    expect(container.querySelector('#signing-official-linkedin-fact')).toBeNull()
    expect(container.querySelector('#signing-official-orcid-fact')).toBeNull()
    expect(container.querySelector('#signing-official-through-bio-fact')).toBeNull()
    expect(container.querySelector('#signing-official-institutional-website-fact')).toBeNull()
  })

  it('renders the Non-Technical Summary and Research Use Statement (Narrative) columns', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        darInfo={{ nonTechRus: 'test non-technical summary', rus: 'test narrative rus' }}
      />,
    )
    expect(container.querySelector('#non-technical-summary-column')).toHaveTextContent('Non-Technical Summary')
    expect(container.querySelector('.non-technical-summary-textbox')).toHaveTextContent('test non-technical summary')
    expect(container.querySelector('#rus-narrative-column')).toHaveTextContent('Research Use Statement (Narrative)')
    expect(container.querySelector('.rus-textbox')).toHaveTextContent('test narrative rus')
  })

  it('renders "None provided" for Non-Technical Summary and RUS narrative when absent', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} darInfo={{}} />)
    expect(container.querySelector('.non-technical-summary-textbox')).toHaveTextContent('None provided')
    expect(container.querySelector('.rus-textbox')).toHaveTextContent('None provided')
  })

  it('shows a scroll-affordance hint when narrative content overflows its box', () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 400 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 200 })

    try {
      const { container } = render(
        <ReviewHeader approvedDatasets={[]} darInfo={{ rus: 'a long research use statement' }} />,
      )
      const rusColumn = container.querySelector('#rus-narrative-column')
      expect(rusColumn?.querySelector('.scroll-hint-chevron')).toBeInTheDocument()
    }
    finally {
      if (originalScrollHeight) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
      if (originalClientHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
    }
  })

  it('does not show a scroll-affordance hint when content fits within the box', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} darInfo={{ rus: 'short' }} />,
    )
    const rusColumn = container.querySelector('#rus-narrative-column')
    expect(rusColumn?.querySelector('.scroll-hint-chevron')).not.toBeInTheDocument()
  })

  it('renders the RUS in DUO Terms column with translated codes', () => {
    const { container } = render(
      <ReviewHeader
        approvedDatasets={[]}
        darInfo={{ hmb: true }}
      />,
    )
    expect(container.querySelector('#rus-duo-terms-column')).toHaveTextContent('Research Use Statement (DUO Terms)')
    expect(container.querySelector('#duo-primary-0-fact')).toHaveTextContent('HMB')
  })

  it('renders "None listed" in the DUO Terms column when no darInfo is provided', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} />)
    const duoColumn = container.querySelector('#rus-duo-terms-column')
    expect(duoColumn).toHaveTextContent('None listed')
  })

  it('renders manual-review DUO terms (e.g. POA) in light red text', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} darInfo={{ poa: true }} />,
    )
    const poaCard = container.querySelector('#duo-primary-0-fact')
    expect(poaCard).toHaveTextContent('POA')
    const description = poaCard?.querySelector('span:last-child') as HTMLElement
    expect(description.style.color).toBe('rgb(229, 115, 115)')
  })

  it('does not apply the manual-review color to terms that do not require review', () => {
    const { container } = render(
      <ReviewHeader approvedDatasets={[]} darInfo={{ hmb: true }} />,
    )
    const hmbCard = container.querySelector('#duo-primary-0-fact')
    const description = hmbCard?.querySelector('span:last-child') as HTMLElement
    expect(description.style.color).not.toBe('rgb(229, 115, 115)')
  })

  it('renders primary DUO term pills in a blue shade', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} darInfo={{ hmb: true }} />)
    const badge = container.querySelector('#duo-primary-0-fact span:first-child') as HTMLElement
    expect(badge.style.backgroundColor).toBe('rgb(0, 96, 159)')
  })

  it('renders secondary DUO term pills in a lighter blue shade', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} darInfo={{ hmb: true, methods: true }} />)
    const badge = container.querySelector('#duo-secondary-0-fact span:first-child') as HTMLElement
    expect(badge.textContent).toBe('MDS')
    expect(badge.style.backgroundColor).toBe('rgb(122, 184, 224)')
  })

  it('renders manual-review DUO term pills (e.g. POA) in red', () => {
    const { container } = render(<ReviewHeader approvedDatasets={[]} darInfo={{ poa: true }} />)
    const badge = container.querySelector('#duo-primary-0-fact span:first-child') as HTMLElement
    expect(badge.style.backgroundColor).toBe('rgb(219, 84, 84)')
  })
})
