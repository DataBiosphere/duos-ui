import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { Storage } from 'src/libs/storage'
import { Support } from 'src/libs/ajax/Support'
import { useUserIsLogged } from 'src/hooks/useSession'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/storage')
vi.mock('src/libs/ajax/Support')
vi.mock('src/hooks/useSession', () => ({
  useUserIsLogged: vi.fn(),
}))
// Avoid importOriginal — only mock what SupportRequestModal uses from utils
vi.mock('src/libs/utils', () => ({
  Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  isEmailAddress: (email: string) => /\S+@\S+\.\S+/.test(email),
}))
vi.mock('src/libs/signInUtils', () => ({ handleSignIn: vi.fn() }))

const mockUser = { displayName: 'Display Name', email: 'email@test.com' }
const handler = vi.fn()

const mountModal = () =>
  render(
    <BrowserRouter>
      <SupportRequestModal onCloseRequest={handler} url="url" showModal={true} />
    </BrowserRouter>,
  )

describe('SupportRequestModal - RedirectLink cursor styling (browser)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    handler.mockReset()
  })

  it.each([
    // getCurrentUser never returns undefined — signed-out storage holds the
    // default (empty) user, and the prefill falls back to empty strings.
    { label: 'logged in', isLogged: true, currentUser: mockUser as DuosUser },
    { label: 'not logged in', isLogged: false, currentUser: { displayName: '', email: '' } as DuosUser },
  ])('DUOS Data Library link has cursor:pointer when $label', ({ isLogged, currentUser }) => {
    vi.mocked(useUserIsLogged).mockReturnValue(isLogged)
    vi.mocked(Storage.getCurrentUser).mockReturnValue(currentUser)
    vi.mocked(Support.createSupportRequest).mockResolvedValue(undefined)
    mountModal()
    const link = Array.from(document.querySelectorAll('a')).find(
      a => a.textContent?.includes('DUOS Data Library'),
    )!
    expect(window.getComputedStyle(link).cursor).toBe('pointer')
  })
})
