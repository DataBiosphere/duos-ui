import React from 'react'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications } from 'src/libs/utils'
import { DAAObject, DuosUser } from 'src/types/model'

const makeResearcher = (authorizedDaaIds: number[]): DuosUser => ({
  userId: 1,
  displayName: 'Dr. Jane Doe',
  email: 'jdoe@broadinstitute.org',
  createDate: new Date('2020-01-01') as unknown as Date,
  emailPreference: true,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
  libraryCard: {
    id: 11,
    userId: 1,
    userName: 'Dr. Jane Doe',
    userEmail: 'jdoe@broadinstitute.org',
    createDate: new Date('2023-01-01'),
    createUserId: 1,
    daaIds: authorizedDaaIds,
  },
})

const makeDaa = (daaId: number, broadDaa = false, mapped = true): DAAObject & { broadDaa?: boolean } => ({
  daaId,
  createUserId: 1,
  createDate: '2024-01-15',
  updateUserId: 1,
  updateDate: '2024-01-15',
  initialDacId: 10,
  file: {
    fileStorageObjectId: daaId,
    entityId: `entity-${daaId}`,
    fileName: `DAA-${daaId}.pdf`,
    category: 'dataAccessAgreement',
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1705276800,
  },
  dacs: mapped ? [{ dacId: 10, name: 'DAC-10' }] : [],
  broadDaa,
})

describe('ManageResearcherDAAs', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('loads the page and filters out DAAs with no DAC mapping', () => {
    cy.stub(User, 'list').resolves([makeResearcher([1, 2])])
    cy.stub(DAA, 'getDaas').resolves([
      makeDaa(1, false, true),
      makeDaa(2, true, false),
      makeDaa(3, false, false),
    ])

    cy.mount(<ManageResearcherDAAs />)

    cy.get('[data-cy="researcher-view"]').should('exist')
    cy.get('[data-cy="researcher-row-toggle-1"]').click()
    cy.get('[data-cy^="daa-row-"]').should('have.length', 2)
  })

  it('shows an error notification when initial data load fails', () => {
    cy.stub(User, 'list').rejects(new Error('network'))
    cy.stub(Notifications, 'showError').as('showError')

    cy.mount(<ManageResearcherDAAs />)

    cy.get('@showError').should('have.been.calledOnce')
  })
})
