import '@testing-library/jest-dom/vitest'
import 'src/index.css'
import 'src/styles/bootstrap_replacement.css'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ThemeProvider } from '@mui/material/styles'
import { muiThemeFix } from 'src/libs/muiThemeFix'
import StudySidebar from 'src/components/study_details/StudySidebar'
import UserProfile from 'src/pages/user_profile/UserProfile'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { NotificationService } from 'src/libs/notificationService'

// The data layers are spied on rather than module-mocked: these modules are plain objects,
// and replacing whole modules in browser mode stalls while their dependencies load.
vi.mock('src/pages/user_profile/AffiliationAndRoles', () => ({ default: () => null }))
vi.mock('src/pages/user_profile/ResearcherStatus', () => ({ default: () => null }))
vi.mock('src/pages/user_profile/AcceptedAcknowledgements', () => ({ default: () => null }))

const restingBorderColor = 'rgb(204, 204, 204)'

const renderProfile = async () => {
  render(
    <ThemeProvider theme={muiThemeFix}>
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    </ThemeProvider>,
  )
  await waitFor(() => expect(screen.getByLabelText('LinkedIn')).toHaveValue('jane-doe'))
  return {
    fullName: document.getElementById('profileName') as HTMLInputElement,
    email: document.getElementById('profileEmail') as HTMLInputElement,
    linkedIn: screen.getByLabelText('LinkedIn'),
  }
}

beforeEach(() => {
  vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(undefined as never)
  vi.spyOn(NotificationService, 'getBannerObjectById').mockResolvedValue(null as never)
  vi.spyOn(User, 'getMe').mockResolvedValue({
    userId: 7,
    displayName: 'Jane Doe',
    email: 'jane.doe@example.com',
    emailPreference: true,
    userData: { externalProfiles: { linkedIn: 'jane-doe' } },
  } as never)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('UserProfile controls (browser)', () => {
  it('renders every input and Save button at the same height', async () => {
    const { fullName, email, linkedIn } = await renderProfile()
    const saveButtons = screen.getAllByRole('button', { name: 'Save' })
    expect(saveButtons).toHaveLength(2)

    for (const control of [fullName, email, linkedIn, ...saveButtons]) {
      expect(control.getBoundingClientRect().height).toBe(40)
    }
  })

  it('styles both Save buttons like the study details Apply for Access button', async () => {
    await renderProfile()
    // A library card makes Apply for Access enabled, so both buttons are compared at rest.
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ libraryCard: {} } as never)
    render(
      <ThemeProvider theme={muiThemeFix}>
        <StudySidebar selectedDatasetIds={[11]} selectedStudyIds={[3]} onApplyForAccess={vi.fn()} />
      </ThemeProvider>,
    )
    const applyStyle = getComputedStyle(screen.getByRole('button', { name: 'Apply for Access' }))
    const styleProperties = ['backgroundColor', 'color', 'fontFamily', 'fontSize', 'fontWeight', 'textTransform', 'borderRadius', 'boxShadow'] as const

    for (const saveButton of screen.getAllByRole('button', { name: 'Save' })) {
      const saveStyle = getComputedStyle(saveButton)
      for (const property of styleProperties) {
        expect(saveStyle[property], property).toBe(applyStyle[property])
      }
    }
  })

  it('gives the Full Name, email and external profile inputs the same resting border', async () => {
    const { fullName, email, linkedIn } = await renderProfile()

    for (const input of [fullName, email, linkedIn]) {
      expect(getComputedStyle(input).borderColor).toBe(restingBorderColor)
    }
  })

  it('keeps the focus indicator on the Full Name input', async () => {
    const { fullName } = await renderProfile()
    fullName.focus()
    expect(document.activeElement).toBe(fullName)

    // Bootstrap animates the focus border, so poll until the transition settles.
    await expect.poll(() => getComputedStyle(fullName).borderColor).toBe('rgb(102, 175, 233)')
    expect(getComputedStyle(fullName).boxShadow).not.toBe('none')
  })

  it('keeps the error state on the Full Name input', async () => {
    const { fullName } = await renderProfile()
    fullName.classList.add('errored')

    await expect.poll(() => getComputedStyle(fullName).borderColor).toBe('rgb(255, 0, 0)')
    expect(getComputedStyle(fullName).boxShadow).not.toBe('none')
  })
})
