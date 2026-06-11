import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ResearcherReview } from 'src/components/ResearcherReview'
import { DuosUser } from 'src/types/model'

const baseUser: DuosUser = {
  displayName: 'John Doe',
  institution: { name: 'Test University' },
  eraCommonsId: 'JOHNDOE123',
  properties: [
    { propertyKey: 'eraExpiration', propertyValue: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    { propertyKey: 'eraAuthorized', propertyValue: 'true' },
  ],
} as unknown as DuosUser

describe('ResearcherReview', () => {
  const createMockUser = (overrides = {}): DuosUser => ({
    ...baseUser,
    ...overrides,
  })

  it('Renders user information correctly', () => {
    const user = createMockUser()
    const { container } = render(<ResearcherReview user={user} />)

    expect(container.querySelector('[data-cy="display-name"]')?.textContent).toContain(baseUser.displayName)
    expect(container.querySelector('[data-cy="institution-name"]')?.textContent).toContain(baseUser.institution?.name)
    expect(container.querySelector('[data-cy="era-commons-id"]')?.textContent).toContain(baseUser.eraCommonsId)
    expect(container.querySelector('[data-cy="nih-valid"]')?.textContent).toContain('Authorized')
    expect(container.querySelector('[data-cy="nih-expiration"]')?.textContent).toContain('days remaining')
  })

  it('Displays "Not Authorized" when NIH is invalid', () => {
    const user = createMockUser({
      properties: [
        { propertyKey: 'eraAuthorized', propertyValue: 'false' },
      ],
    })
    const { container } = render(<ResearcherReview user={user} />)

    expect(container.querySelector('[data-cy="nih-valid"]')?.textContent).toContain('Not Authorized')
  })

  it('Displays "Expired" when NIH authentication has expired', () => {
    const user = createMockUser({
      properties: [
        { propertyKey: 'eraExpiration', propertyValue: Date.now() - 1000 },
      ],
    })
    const { container } = render(<ResearcherReview user={user} />)

    expect(container.querySelector('[data-cy="nih-expiration"]')?.textContent).toContain('Expired')
  })

  it('Handles missing user data gracefully', () => {
    const user = createMockUser({
      displayName: null,
      institution: null,
      eraCommonsId: null,
      properties: [],
    })
    const { container } = render(<ResearcherReview user={user} />)

    expect(container.querySelector('[data-cy="display-name"]')?.textContent).toBe('')
    expect(container.querySelector('[data-cy="institution-name"]')?.textContent).toBe('')
    expect(container.querySelector('[data-cy="era-commons-id"]')?.textContent).toBe('')
    expect(container.querySelector('[data-cy="nih-valid"]')?.textContent).toContain('Not Authorized')
    expect(container.querySelector('[data-cy="nih-expiration"]')?.textContent).toContain('Expired')
  })
})
