import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications } from 'src/libs/utils'
import { makeDaa, makeResearcher } from './DAAAssignment/fixtures'

afterEach(() => vi.restoreAllMocks())

describe('ManageResearcherDAAs', () => {
  beforeEach(() => {
    vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
  })

  it('loads the page and filters out DAAs with no DAC mapping', async () => {
    vi.spyOn(User, 'list').mockResolvedValue([makeResearcher({
      userId: 1,
      displayName: 'Test User Eta',
      email: 'test@test.com',
      daaDetails: [{ daaId: 1 }, { daaId: 2 }],
    })])
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([
      makeDaa({ daaId: 1, mapped: true }),
      makeDaa({ daaId: 2, mapped: false }),
      makeDaa({ daaId: 3, mapped: false }),
    ])

    const { container } = render(<ManageResearcherDAAs />)

    expect(screen.getByText(/permanent employee of their institution/i)).toBeInTheDocument()

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    // The researcher holds DAAs 1 and 2, but 2 has no DAC mapping so only 1 is shown.
    expect(container.querySelectorAll('[data-cy^="daa-row-"]')).toHaveLength(1)
  })

  it('shows an error notification when initial data load fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(User, 'list').mockRejectedValue(new Error('network'))
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([])

    render(<ManageResearcherDAAs />)

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledOnce())
  })
})
