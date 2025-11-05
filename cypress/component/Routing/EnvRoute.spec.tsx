import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { mount } from 'cypress/react'
import EnvRoute from 'src/routing/EnvRoute'
import { Storage } from 'src/libs/storage'

const TestProtectedComponent = () => <div data-cy="protected-content">Protected Content</div>

const allowedEnvs = ['dev', 'staging']
const currentAllowedEnv = 'dev'
const currentDisallowedEnv = 'prod'

describe('EnvRoute', () => {
  it('should render the protected component if the current environment is in the allowed list', () => {
    cy.stub(Storage, 'getEnv').returns(currentAllowedEnv)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<EnvRoute env={allowedEnvs} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="protected-content"]').should('be.visible')
    cy.get('[data-cy="not-found"]').should('not.exist')
  })

  it('should redirect to the not found page if the current environment is not in the allowed list', () => {
    cy.stub(Storage, 'getEnv').returns(currentDisallowedEnv)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<EnvRoute env={allowedEnvs} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="not-found"]').should('be.visible')
    cy.get('[data-cy="protected-content"]').should('not.exist')
  })

  it('should redirect to the not found page if the environment is not set', () => {
    cy.stub(Storage, 'getEnv').returns(null)

    mount(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<EnvRoute env={allowedEnvs} />}>
            <Route index element={<TestProtectedComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    cy.get('[data-cy="not-found"]').should('be.visible')
    cy.get('[data-cy="protected-content"]').should('not.exist')
  })
})
