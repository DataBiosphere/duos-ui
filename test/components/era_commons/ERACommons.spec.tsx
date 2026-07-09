import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('src/libs/ajax/User', () => ({
  User: { getMe: vi.fn() },
}))

vi.mock('src/libs/ajax/AuthenticateNIH', () => ({
  AuthenticateNIH: {
    getECMProviderAuthUrl: vi.fn(),
    deleteAccountLinkage: vi.fn(),
  },
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn().mockReturnValue({ email: 'test@email.com' }),
    getEnv: vi.fn().mockReturnValue(null),
  },
}))

import ERACommons from 'src/components/era_commons/ERACommons'
import { User } from 'src/libs/ajax/User'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'

interface Researcher {
  id: number
  firstName: string
  lastName: string
  email: string
  eraCommonsId?: string
  properties?: Array<{ propertyKey: string, propertyValue: string | number }>
}

const researcher: Researcher = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@email.com',
}

const mountComponent = () =>
  render(
    <ERACommons
      destination=""
      header={true}
      onNihStatusUpdate={() => {}}
      required={true}
      validationError={false}
    />,
  )

beforeEach(() => {
  Element.prototype.scrollIntoView = () => {}
})

afterEach(() => vi.clearAllMocks())

describe('ERA Commons Component', () => {
  it('renders an empty ERA Commons component with header and required', async () => {
    vi.mocked(User.getMe).mockResolvedValue(researcher as never)
    mountComponent()
    await waitFor(() => expect(document.getElementById('era-commons-id')).toBeInTheDocument())
    expect(document.querySelector('[data-cy=era-commons-header]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy=era-commons-required]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy=era-commons-authenticate-link]')).toBeInTheDocument()
    expect(document.querySelector('.required-field-error-span')).not.toBeInTheDocument()
  })

  it('renders a populated ERA Commons component after having authenticated with NIH', async () => {
    const exp = Date.now() + (30 * 24 * 60 * 60 * 1000)
    const clonedResearcher: Researcher = {
      ...researcher,
      eraCommonsId: 'testing',
      properties: [
        { propertyKey: 'eraAuthorized', propertyValue: 'true' },
        { propertyKey: 'eraExpiration', propertyValue: exp },
      ],
    }
    vi.mocked(User.getMe).mockResolvedValue(clonedResearcher as never)
    mountComponent()
    await waitFor(() => expect(document.querySelector('[data-cy=era-commons-id-value]')).toBeInTheDocument())
    expect(document.getElementById('era-commons-id')).toBeInTheDocument()
    expect(document.querySelector('[data-cy=era-commons-header]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy=era-commons-required]')).toBeInTheDocument()
    expect(document.querySelector('[data-cy=era-commons-authenticate-link]')).not.toBeInTheDocument()
    expect(document.querySelector('.required-field-error-span')).not.toBeInTheDocument()
  })

  it('shows an error when removing linked account fails', async () => {
    const exp = Date.now() + (30 * 24 * 60 * 60 * 1000)
    const eraAuthedUser: Researcher = {
      ...researcher,
      eraCommonsId: 'testing',
      properties: [
        { propertyKey: 'eraAuthorized', propertyValue: 'true' },
        { propertyKey: 'eraExpiration', propertyValue: exp },
      ],
    }
    vi.mocked(User.getMe).mockResolvedValue(eraAuthedUser as never)
    vi.mocked(AuthenticateNIH.deleteAccountLinkage).mockRejectedValue(new Error('error'))
    const user = userEvent.setup()
    mountComponent()
    await waitFor(() => expect(document.querySelector('[data-cy=era-delete-icon]')).toBeInTheDocument())
    await user.click(document.querySelector('[data-cy=era-delete-icon]')!)
    await waitFor(() => expect(document.querySelector('[data-cy=era-commons-error-span]')).toBeVisible())
  })

  it('shows an error when ECM fails', async () => {
    vi.mocked(User.getMe).mockResolvedValue(researcher as never)
    vi.mocked(AuthenticateNIH.getECMProviderAuthUrl).mockRejectedValue({
      response: { data: { message: 'ECM unavailable' } },
    })
    const user = userEvent.setup()
    mountComponent()
    await waitFor(() => expect(document.querySelector('[data-cy=era-commons-authenticate-link]')).toBeInTheDocument())
    await user.click(document.querySelector('[data-cy=era-commons-authenticate-link]')!)
    await waitFor(() => {
      expect(document.querySelector('[data-cy=era-commons-error-span]')).toHaveTextContent(
        'Error from Authentication Provider: ECM unavailable: test@email.com',
      )
    })
  })
})
