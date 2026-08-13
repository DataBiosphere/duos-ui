import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { StudyNameSearch } from 'src/routing/StudyNameSearch'

const LocationSpy = ({ onLocationChange }: { onLocationChange: (loc: string) => void }) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

const renderAt = (route: string) => {
  const onLocationChange = vi.fn()
  render(
    <MemoryRouter initialEntries={[route]}>
      <LocationSpy onLocationChange={onLocationChange} />
      <Routes>
        <Route path="/studies/name/*" element={<StudyNameSearch />} />
        <Route path="/studies/:studyId" element={<div>Study Details</div>} />
        <Route path="/datalibrary" element={<div>Data Library</div>} />
      </Routes>
    </MemoryRouter>,
  )
  return onLocationChange
}

describe('StudyNameSearch', () => {
  it('redirects to the Studies tab of the Data Library with the term as the search', () => {
    const onLocationChange = renderAt('/studies/name/Framingham')

    expect(onLocationChange).toHaveBeenLastCalledWith('/datalibrary?tab=studies&query=Framingham')
  })

  it('carries a multi-word term through, decoded from the path', () => {
    const onLocationChange = renderAt(`/studies/name/${encodeURIComponent('Framingham Heart Study')}`)

    expect(onLocationChange).toHaveBeenLastCalledWith('/datalibrary?tab=studies&query=Framingham+Heart+Study')
  })

  it('keeps a term containing a slash intact', () => {
    const onLocationChange = renderAt('/studies/name/Heart/Lung Study')

    expect(onLocationChange).toHaveBeenLastCalledWith('/datalibrary?tab=studies&query=Heart%2FLung+Study')
  })

  it('opens the Studies tab with no search when no term is given', () => {
    const onLocationChange = renderAt('/studies/name')

    expect(onLocationChange).toHaveBeenLastCalledWith('/datalibrary?tab=studies')
  })

  it('does not shadow the study details route', () => {
    const onLocationChange = renderAt('/studies/123')

    expect(onLocationChange).toHaveBeenLastCalledWith('/studies/123')
  })
})
