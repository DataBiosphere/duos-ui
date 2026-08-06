import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { DataLocation, DataLocationComponentProps, DataLocationInfo } from 'src/components/forms/DataLocation'

const baseProps: DataLocationComponentProps = {
  idx: 0,
  location: { cloudProvider: null, dataLocation: null, locationUrl: null, researchStage: null } as DataLocationInfo,
  onChange: () => {},
  onDelete: () => {},
}

describe('Data Locations List Component - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a Data Location control', async () => {
    await act(async () => {
      render(<BrowserRouter><DataLocation {...baseProps} /></BrowserRouter>)
    })
    expect(document.querySelector('.formField-researchStage')).not.toBeNull()
    expect(document.querySelector('.formField-dataLocation')).not.toBeNull()
    expect(document.querySelector('.formField-locationUrl')).not.toBeNull()
    expect(document.querySelector('.formField-cloudProvider')).not.toBeNull()
  })

  it('should fire an onChange event when researchStage is selected', async () => {
    const onChangeSpy = vi.fn()
    const customProps = { ...baseProps, onChange: onChangeSpy }

    await act(async () => {
      render(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    })

    const researchStageContainer = document.querySelector('.formField-researchStage')!
    const input = within(researchStageContainer as HTMLElement).getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Pre' } })
    })

    const option = await screen.findByText('Pre-analysis')
    await act(async () => {
      fireEvent.click(option)
    })

    expect(onChangeSpy).toHaveBeenCalledWith({
      idx: 0,
      location: {
        cloudProvider: null,
        dataLocation: null,
        locationUrl: null,
        researchStage: {
          displayText: 'Pre-analysis',
          key: 'PRA',
        },
      },
    })
  })

  it('should fire an onChange event when dataLocation is selected', async () => {
    const onChangeSpy = vi.fn()
    const customProps = { ...baseProps, onChange: onChangeSpy }

    await act(async () => {
      render(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    })

    const dataLocationContainer = document.querySelector('.formField-dataLocation')!
    const input = within(dataLocationContainer as HTMLElement).getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Ter' } })
    })

    const option = await screen.findByText('Terra')
    await act(async () => {
      fireEvent.click(option)
    })

    expect(onChangeSpy).toHaveBeenCalledWith({
      idx: 0,
      location: {
        cloudProvider: null,
        dataLocation: {
          displayText: 'Terra',
          key: 'TERRA',
        },
        locationUrl: null,
        researchStage: null,
      },
    })
  })

  it('should fire an onChange event when cloudProvider is selected', async () => {
    const onChangeSpy = vi.fn()
    const customProps = { ...baseProps, onChange: onChangeSpy }

    await act(async () => {
      render(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    })

    const cloudProviderContainer = document.querySelector('.formField-cloudProvider')!
    const input = within(cloudProviderContainer as HTMLElement).getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'AW' } })
    })

    const option = await screen.findByText('AWS')
    await act(async () => {
      fireEvent.click(option)
    })

    expect(onChangeSpy).toHaveBeenCalledWith({
      idx: 0,
      location: {
        cloudProvider: {
          displayText: 'AWS',
          key: 'AWS',
        },
        dataLocation: null,
        locationUrl: null,
        researchStage: null,
      },
    })
  })

  it('should fire an onChange event when locationUrl is entered', async () => {
    const onChangeSpy = vi.fn()
    const customProps = { ...baseProps, onChange: onChangeSpy }

    await act(async () => {
      render(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    })

    const locationUrlInput = document.getElementById('locationUrl')!
    await act(async () => {
      fireEvent.change(locationUrlInput, { target: { value: 'https://www.duos.org' } })
    })

    expect(onChangeSpy).toHaveBeenCalledWith({
      idx: 0,
      location: {
        cloudProvider: null,
        dataLocation: null,
        locationUrl: 'https://www.duos.org',
        researchStage: null,
      },
    })
  })

  it('clicking on delete triggers onDelete function', async () => {
    const onDeleteSpy = vi.fn()
    const customProps = { ...baseProps, onDelete: onDeleteSpy }

    await act(async () => {
      render(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    })

    const deleteLink = screen.getByRole('link')
    await act(async () => {
      fireEvent.click(deleteLink)
    })

    expect(onDeleteSpy).toHaveBeenCalledWith(0)
  })
})
