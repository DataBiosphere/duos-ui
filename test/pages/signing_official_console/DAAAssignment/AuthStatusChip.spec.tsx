import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import AuthStatusChip from 'src/pages/signing_official_console/DAAAssignment/AuthStatusChip'

describe('AuthStatusChip', () => {
  const cases = [
    { status: 'authorized' as const, label: 'Pre-Authorized' },
    { status: 'not_requested' as const, label: 'Not Pre-Authorized' },
    { status: 'revoked' as const, label: 'Revoked' },
  ]

  cases.forEach(({ status, label }) => {
    it(`renders ${label} status`, () => {
      const { container } = render(<AuthStatusChip status={status} />)
      const el = container.querySelector(`[data-cy="auth-status-chip-${status}"]`)
      expect(el).toBeInTheDocument()
      expect(el).toHaveTextContent(label)
    })
  })
})
