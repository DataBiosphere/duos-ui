import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeographyPicker } from 'src/pages/data_submission/v2/GeographyPicker'
import { GeographyMetadata } from 'src/libs/data-metadata'
import { formatGeography } from 'src/pages/data_submission/v2/population'
import { Countries } from 'src/libs/ajax/Countries'

vi.mock('src/libs/ajax/Countries', () => ({
  Countries: { getCountries: vi.fn() },
}))

let latest: GeographyMetadata[] = []
const Harness = ({ initial = [], disabled = false }: { initial?: GeographyMetadata[], disabled?: boolean }) => {
  const [value, setValue] = useState<GeographyMetadata[]>(initial)
  latest = value
  return <GeographyPicker id="geo" title="Geography" value={value} onChange={setValue} disabled={disabled} />
}

const chooseCountry = async (user: ReturnType<typeof userEvent.setup>, row: number, country: string) => {
  await user.type(within(document.querySelector(`.formField-geo-${row}-country`) as HTMLElement).getByRole('combobox'), country)
  await user.click(await screen.findByText(country, { selector: '.form-select__option' }))
}

describe('GeographyPicker', () => {
  beforeEach(() => {
    latest = []
    vi.mocked(Countries.getCountries).mockResolvedValue(['Japan', 'United States of America (the)'])
  })

  it('lays places out like the PI rows: column titles once, then a row per place', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const headers = document.querySelectorAll('.dsf-person-header')
    expect(headers).toHaveLength(1)
    expect(Array.from(headers[0].querySelectorAll('.control-label')).map(el => el.textContent))
      .toEqual(['Country', 'State/Department', 'County', 'City/Town'])
    expect(document.querySelectorAll('.dsf-geo-row:not(.dsf-person-header)')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Add place' }))
    expect(document.querySelectorAll('.dsf-geo-row:not(.dsf-person-header)')).toHaveLength(2)
    expect(document.querySelector('.geography-picker-chip')).toBeNull()
  })

  it('reports a row as a place once anything is in it, country or not', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(latest).toEqual([])
    await user.type(document.getElementById('geo-0-city')!, 'Boston')
    expect(latest).toEqual([{ city: 'Boston' }])

    await chooseCountry(user, 0, 'United States of America (the)')
    await user.type(document.getElementById('geo-0-region')!, 'Massachusetts')
    expect(latest).toEqual([{ country: 'United States of America (the)', region: 'Massachusetts', city: 'Boston' }])

    await user.click(screen.getByRole('button', { name: 'Add place' }))
    await user.clear(document.getElementById('geo-1-region')!)
    expect(latest).toEqual([
      { country: 'United States of America (the)', region: 'Massachusetts', city: 'Boston' },
      { country: 'United States of America (the)' },
    ])
  })

  it('removes a row', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[{ country: 'Japan' }, { country: 'United States of America (the)' }]} />)
    await user.click(screen.getByRole('button', { name: 'Remove place 1' }))
    expect(latest).toEqual([{ country: 'United States of America (the)' }])
  })

  it('lets a country be typed when the country list cannot be loaded', async () => {
    vi.mocked(Countries.getCountries).mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(within(document.querySelector('.formField-geo-0-country') as HTMLElement).getByRole('combobox'), 'Atlantis{Enter}')
    expect(latest).toEqual([{ country: 'Atlantis' }])
  })

  it('shows the places read-only, with nothing to add or remove, when disabled', () => {
    render(<Harness initial={[{ country: 'Japan', city: 'Kyoto' }]} disabled={true} />)
    expect(document.getElementById('geo-0-city')).toHaveValue('Kyoto')
    expect(document.getElementById('geo-0-city')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Add place' })).toBeNull()
  })

  it('writes places most specific first', () => {
    expect(formatGeography({ country: 'United States', region: 'Massachusetts', county: 'Suffolk County', city: 'Boston' }))
      .toBe('Boston, Suffolk County, Massachusetts, United States')
  })
})
