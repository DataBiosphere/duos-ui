import { mount } from 'cypress/react'
import React from 'react'
import { Storage } from 'src/libs/storage'
import DatasetSearch from 'src/pages/DatasetSearch'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const duosUser = {
  isSigningOfficial: false,
}

describe('Data Library', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('Renders the data library without a query', () => {
    cy.stub(Storage, 'getCurrentUser').returns(duosUser)
    mount(
      <MemoryRouter initialEntries={['/data-search']}>
        <Routes>
          <Route path="/data-search" element={<DatasetSearch />} />
        </Routes>
      </MemoryRouter>,
    )
  })

  it('Renders the data library with a query', () => {
    cy.stub(Storage, 'getCurrentUser').returns(duosUser)
    mount(
      <MemoryRouter initialEntries={['/data-search/test']}>
        <Routes>
          <Route path="/data-search" element={<DatasetSearch />} />
        </Routes>
      </MemoryRouter>,
    )
  })
})
