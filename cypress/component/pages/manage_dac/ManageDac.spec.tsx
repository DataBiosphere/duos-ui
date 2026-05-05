import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ManageDac from 'src/pages/manage_dac/ManageDac'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import type { DacObject, Dataset, DuosUser, Study, UserRole } from 'src/types/model'

const fixedDate = new Date('2026-05-01T12:00:00.000Z')

const makeUser = ({
  userId,
  displayName,
  roles,
}: {
  userId: number
  displayName: string
  roles: UserRole[]
}): DuosUser => ({
  createDate: fixedDate,
  displayName,
  email: `${displayName.toLowerCase().replaceAll(/\s+/g, '.')}@example.org`,
  emailPreference: true,
  isAdmin: roles.some(role => role.name === 'Admin'),
  isAlumni: false,
  isChairPerson: roles.some(role => role.name === 'Chairperson'),
  isDataSubmitter: false,
  isMember: roles.some(role => role.name === 'Member'),
  isResearcher: false,
  isSigningOfficial: false,
  roles,
  userId,
})

const makeStudy = (datasetId: number, createUser: DuosUser): Study => ({
  studyId: datasetId + 1000,
  name: `Study ${datasetId}`,
  description: `Study ${datasetId} description`,
  dataTypes: [],
  piName: 'Principal Investigator',
  publicVisibility: true,
  datasetIds: [datasetId],
  datasets: [],
  properties: [],
  createDate: '2026-05-01',
  createUserId: createUser.userId,
})

const makeDataset = ({
  datasetId,
  name,
  dacId,
  dacApproval,
  createUser,
}: {
  datasetId: number
  name: string
  dacId: number
  dacApproval: boolean
  createUser: DuosUser
}): Dataset => ({
  name,
  datasetId,
  createUserId: createUser.userId,
  createUser,
  createDate: fixedDate,
  dacId,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: makeStudy(datasetId, createUser),
  alias: datasetId,
  datasetIdentifier: `DUOS-${String(datasetId).padStart(6, '0')}`,
  dataUse: {},
  dacApproval,
})

const chairRole = (userId: number, dacId: number): UserRole => ({
  roleId: 1,
  name: 'Chairperson',
  userId,
  userRoleId: 100 + userId,
  dacId,
})

const adminRole = (userId: number): UserRole => ({
  roleId: 2,
  name: 'Admin',
  userId,
  userRoleId: 200 + userId,
})

const chairperson = makeUser({
  userId: 1,
  displayName: 'Chair Person',
  roles: [chairRole(1, 1)],
})

const member = makeUser({
  userId: 2,
  displayName: 'Committee Member',
  roles: [{ roleId: 3, name: 'Member', userId: 2, userRoleId: 302, dacId: 1 }],
})

const adminUser = makeUser({
  userId: 10,
  displayName: 'Admin User',
  roles: [adminRole(10)],
})

const chairUser = makeUser({
  userId: 11,
  displayName: 'Chair User',
  roles: [chairRole(11, 1)],
})

const primaryDac: DacObject = {
  dacId: 1,
  name: 'Alpha DAC',
  description: 'Alpha description',
  email: 'alpha@example.org',
  chairpersons: [chairperson],
  members: [member],
}

const secondaryDac: DacObject = {
  dacId: 2,
  name: 'Beta DAC',
  description: 'Beta description',
  email: 'beta@example.org',
  chairpersons: [chairperson],
  members: [],
}

type RouteState = {
  userRole?: string
  dac?: DacObject
  datasets?: Dataset[]
}

const RouteStateViewer = () => {
  const location = useLocation()
  const state = (location.state ?? {}) as RouteState

  return (
    <div>
      <div data-cy="route-path">{location.pathname}</div>
      <div data-cy="route-user-role">{state.userRole ?? ''}</div>
      <div data-cy="route-dac-name">{state.dac?.name ?? ''}</div>
      <div data-cy="route-dataset-count">{state.datasets?.length ?? 0}</div>
      <ul data-cy="route-datasets">
        {(state.datasets ?? []).map(dataset => (
          <li key={dataset.datasetId}>{dataset.name}</li>
        ))}
      </ul>
    </div>
  )
}

const mountManageDac = () => {
  cy.mount(
    <MemoryRouter initialEntries={['/manage_dac']}>
      <Routes>
        <Route path="/manage_dac" element={<ManageDac />} />
        <Route path="/manage_add_dac_daa" element={<RouteStateViewer />} />
        <Route path="/manage_dac_datasets" element={<RouteStateViewer />} />
        <Route path="/manage_edit_dac_daa/:dacId" element={<RouteStateViewer />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ManageDac', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(Notifications, 'showError').as('showError')
    cy.stub(Notifications, 'showSuccess').as('showSuccess')
  })

  it('shows all DACs for admin users', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'list').resolves([primaryDac, secondaryDac])

    mountManageDac()

    cy.contains('Manage Data Access Committee').should('be.visible')
    cy.contains('Alpha DAC').should('be.visible')
    cy.contains('Beta DAC').should('be.visible')
  })

  it('filters DACs to the chairperson assigned DACs', () => {
    cy.stub(Storage, 'getCurrentUser').returns(chairUser)
    cy.stub(DAC, 'list').resolves([primaryDac, secondaryDac])

    mountManageDac()

    cy.contains('Alpha DAC').should('be.visible')
    cy.contains('Beta DAC').should('not.exist')
  })

  it('navigates to add DAC page with the current user role in route state', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'list').resolves([])

    mountManageDac()

    cy.get('#btn_addDAC').click()
    cy.get('[data-cy="route-path"]').should('contain', '/manage_add_dac_daa')
    cy.get('[data-cy="route-user-role"]').should('contain', 'Admin')
  })

  it('opens the DAC members modal when the DAC name is clicked', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'list').resolves([primaryDac])

    mountManageDac()

    cy.get('.row-data-0 [role="cell"]').first().click()
    cy.contains('DAC Members associated with DAC: Alpha DAC').should('be.visible')
    cy.contains('Chair Person chair.person@example.org').should('be.visible')
  })

  it('navigates to the datasets page with approved datasets only', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'list').resolves([primaryDac])
    const datasetsStub = cy.stub(DAC, 'datasets').resolves([
      makeDataset({ datasetId: 1, name: 'Approved Dataset', dacId: 1, dacApproval: true, createUser: adminUser }),
      makeDataset({ datasetId: 2, name: 'Unapproved Dataset', dacId: 1, dacApproval: false, createUser: adminUser }),
    ])

    mountManageDac()

    cy.get('.row-data-0 a[name="dacDatasets"]').click()

    cy.wrap(datasetsStub).should('have.been.calledWith', 1)
    cy.get('[data-cy="route-path"]').should('contain', '/manage_dac_datasets')
    cy.get('[data-cy="route-dac-name"]').should('contain', 'Alpha DAC')
    cy.get('[data-cy="route-dataset-count"]').should('contain', '1')
    cy.get('[data-cy="route-datasets"]').should('contain', 'Approved Dataset')
    cy.get('[data-cy="route-datasets"]').should('not.contain', 'Unapproved Dataset')
  })

  it('shows an error when a DAC has no approved datasets', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    cy.stub(DAC, 'list').resolves([primaryDac])
    cy.stub(DAC, 'datasets').resolves([
      makeDataset({ datasetId: 2, name: 'Unapproved Dataset', dacId: 1, dacApproval: false, createUser: adminUser }),
    ])

    mountManageDac()

    cy.get('.row-data-0 a[name="dacDatasets"]').click()

    cy.get('@showError').should('have.been.calledWith', { text: 'DAC has no datasets.' })
    cy.contains('Manage Data Access Committee').should('be.visible')
  })

  it('deletes the selected DAC after confirmation and refreshes the list', () => {
    cy.stub(Storage, 'getCurrentUser').returns(adminUser)
    const listStub = cy.stub(DAC, 'list')
      .onFirstCall().resolves([primaryDac])
      .onSecondCall().resolves([])
    const deleteStub = cy.stub(DAC, 'delete').resolves({ status: 200 })

    mountManageDac()

    cy.get('.row-data-0 [data-tip="Delete DAC"]').click({ force: true })
    cy.contains('Delete DAC?').should('be.visible')
    cy.contains('button', 'Confirm').click()

    cy.wrap(deleteStub).should('have.been.calledWith', 1)
    cy.wrap(listStub).should('have.been.calledTwice')
    cy.get('@showSuccess').should('have.been.calledWith', { text: 'DAC successfully deleted.' })
    cy.contains('Alpha DAC').should('not.exist')
  })
})
