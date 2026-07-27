import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import EnvRoute from 'src/routing/EnvRoute'
import { Storage } from 'src/libs/storage'

const TestProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>

const allowedEnvs = ['dev', 'staging']

describe('EnvRoute', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the protected component when the current environment is in the allowed list', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue('dev')
    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<EnvRoute env={allowedEnvs} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="not-found"]')).not.toBeInTheDocument()
  })

  it('renders the not-found page when the current environment is not in the allowed list', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue('prod')
    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<EnvRoute env={allowedEnvs} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-cy="not-found"]')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders the not-found page when the environment is not set', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue(null)
    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<EnvRoute env={allowedEnvs} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-cy="not-found"]')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
