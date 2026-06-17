import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { DataLocationList, DataLocationsProps } from 'src/components/forms/DataLocationList'
import { DataLocationInfo } from 'src/components/forms/DataLocation'

describe('Data Locations List Component - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a Data Locations component with Add location button', () => {
    const props: DataLocationsProps = {
      locations: [] as DataLocationInfo[],
      onChange: vi.fn(),
    }

    render(<DataLocationList {...props} />)
    expect(screen.getByRole('button', { name: /Add location/i })).toBeInTheDocument()
  })

  it('Add location click should fire expected event', () => {
    const onChange = vi.fn()
    const props: DataLocationsProps = {
      locations: [] as DataLocationInfo[],
      onChange,
    }

    render(<DataLocationList locations={props.locations} onChange={props.onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Add location/i }))
    expect(onChange).toHaveBeenCalledWith({
      key: 'locations',
      value: [{ cloudProvider: null, locationUrl: null, researchStage: null, dataLocation: null }],
    })
  })

  it('Button text should be updated when one or more locations is present', () => {
    const locations: DataLocationInfo[] = [{
      cloudProvider: null,
      locationUrl: null,
      researchStage: null,
      dataLocation: null,
    }]

    render(
      <BrowserRouter>
        <DataLocationList locations={locations} onChange={vi.fn()} />
      </BrowserRouter>,
    )
    expect(screen.getByRole('button', { name: /Add another location/i })).toBeInTheDocument()
  })
})
