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

  it('renders applicant information', () => {
    render(<ApplicationInformation {...baseProps} />)
    expect(screen.getByText('Jane Researcher')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Broad Institute')).toBeInTheDocument()
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
})
