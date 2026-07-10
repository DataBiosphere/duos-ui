import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: {
    list: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: { showError: vi.fn() },
}))

import { DacPicker } from 'src/components/forms/DacPicker'
import { DAC } from 'src/libs/ajax/DAC'

const dacs = [
  { name: 'Awesome DAC', dacId: 1, dataCustodianEmail: ['Some Data Custodian Email 1'] },
  { name: 'Extra DAC', dacId: 2, dataCustodianEmail: ['Some Data Custodian Email 2'] },
]

afterEach(() => vi.clearAllMocks())

describe('Data Library Filters', () => {
  it('Renders the DAC picker', async () => {
    vi.mocked(DAC.list).mockResolvedValue(dacs as never)
    const onChange = vi.fn()
    const id = 'DacPicker'
    const title = 'Data Access Committee'

    const { container } = render(
      <DacPicker
        fieldTitle={title}
        fieldId={id}
        isRequired={false}
        onChange={onChange}
      />,
    )

    await waitFor(() => expect(screen.getByText(title)).toBeInTheDocument())

    // select 'Awesome DAC'
    const input = container.querySelector(`#${id} input`) as HTMLInputElement
    await userEvent.click(input!)
    await userEvent.keyboard('Awes{Enter}')
    expect(onChange).toHaveBeenCalledWith({ key: id, value: 1, isValid: true })

    // select 'Extra DAC'
    await userEvent.click(input!)
    await userEvent.keyboard('Ext{Enter}')
    expect(onChange).toHaveBeenCalledWith({ key: id, value: 2, isValid: true })
  })
})
