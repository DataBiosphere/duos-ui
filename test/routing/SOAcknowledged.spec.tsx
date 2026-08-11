import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import SOAcknowledged from 'src/routing/SOAcknowledged'
import { AcknowledgementService } from 'src/libs/acknowledgements'

vi.mock('src/libs/acknowledgements', () => ({
  AcknowledgementService: {
    hasSOAcceptedDAAs: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...original,
    Notifications: {
      ...original.Notifications,
      showError: vi.fn(),
    },
  }
})

const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>

interface LocationSpyProps {
  onLocationChange: (location: string) => void
}

const LocationSpy = ({ onLocationChange }: LocationSpyProps) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

describe('SOAcknowledged', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the protected component if SO has accepted DAAs', async () => {
    vi.mocked(AcknowledgementService.hasSOAcceptedDAAs).mockResolvedValue(true)
    const pageVisitStub = vi.fn()

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <LocationSpy onLocationChange={pageVisitStub} />
          <Routes>
            <Route element={<SOAcknowledged />}>
              <Route path="/protected" element={<ProtectedComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      )
    })

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('Library Card')).not.toBeInTheDocument()
  })

  it('should redirect to SigningOfficialDaaAgreementWrapper if SO has not accepted DAAs', async () => {
    vi.mocked(AcknowledgementService.hasSOAcceptedDAAs).mockResolvedValue(false)

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<SOAcknowledged />}>
              <Route path="/protected" element={<ProtectedComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      )
    })

    expect(screen.getByText(/Agree to/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
