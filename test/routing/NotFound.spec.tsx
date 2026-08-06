import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import NotFound from 'src/pages/NotFound'

const StudyDetailsComponent = () => <div data-testid="study-details-page">Study Details Page</div>
const DatasetStatisticsComponent = () => <div data-testid="dataset-statistics-page">Dataset Statistics Page</div>
const HomeComponent = () => <div data-testid="home-page">Home Page</div>

const LocationSpy = ({ onLocationChange }: { onLocationChange: (loc: string) => void }) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

describe('NotFound', () => {
  it('displays the 404 page for a generic unknown path', () => {
    render(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Sorry, the page you were looking for was not found.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/home')
  })

  it('redirects from a DUOS-S path to the study details page', () => {
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={['/DUOS-S12345']}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/studies/:studyId" element={<StudyDetailsComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('study-details-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenCalledWith('/studies/12345')
  })

  it('redirects from a DUOS- path to the dataset statistics page', () => {
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={['/DUOS-000123']}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/dataset/:datasetIdentifier" element={<DatasetStatisticsComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('dataset-statistics-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenCalledWith('/dataset/DUOS-000123')
  })

  it('navigates to the home page when the "Back to Home" link is clicked', async () => {
    const user = userEvent.setup()
    const onLocationChange = vi.fn()
    render(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <LocationSpy onLocationChange={onLocationChange} />
        <Routes>
          <Route path="/home" element={<HomeComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('link', { name: 'Back to Home' }))
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
    expect(onLocationChange).toHaveBeenCalledWith('/home')
  })
})
