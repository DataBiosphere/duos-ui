import React from 'react'
import ResearcherStatus from 'src/pages/user_profile/ResearcherStatus'
import { DAAObject, DuosUser, FileStorageObject, SimplifiedDuosUser } from 'src/types/model'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'

describe('ResearcherStatus', () => {
  const user: DuosUser = {
    userId: 2,
    displayName: 'Test User',
    createDate: new Date(),
    email: 'test.user@test.com',
    emailPreference: false,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: true,
    isSigningOfficial: false,
    roles: [
      {
        roleId: 1,
        userId: 1,
        userRoleId: 1,
        name: 'Researcher',
      },
    ],
  }

  const signingOfficialUser: SimplifiedDuosUser = {
    userId: 3,
    displayName: 'Signing Official',
    email: 'so@test.com',
  }

  const fso: FileStorageObject = {
    fileStorageObjectId: 1,
    entityId: 'id',
    fileName: 'name',
    category: 'irbCollaborationLetter',
    mediaType: 'image/pdf',
    createUserId: 3,
    createDate: new Date().getDate(),
  }

  const daa: DAAObject = {
    broadDaa: true,
    daaId: 1,
    createUserId: 3,
    createDate: new Date().toISOString(),
    updateUserId: 3,
    updateDate: new Date().toISOString(),
    initialDacId: 1,
    file: fso,
    dacs: [],
  }

  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(DAA, 'getDaaById').resolves(daa)
    cy.stub(User, 'getMe').resolves(user)
    cy.viewport(800, 600)
  })

  it('Renders the Researcher Status With Library Card Info', () => {
    cy.stub(User, 'getSOsForCurrentUser').resolves([signingOfficialUser])
    const userWithCard = {
      ...user, ...{
        libraryCard: {
          id: 1,
          userId: 1,
          userName: 'Test User',
          userEmail: 'test.usre@test.com',
          createDate: new Date(),
          createUserId: 3,
          daaIds: [1],
        },
      },
    }

    cy.mount(<ResearcherStatus user={userWithCard} />)
    cy.contains('Researcher Status')
    cy.contains('RAS Account')
    cy.contains('Library Card issued to you')
    cy.contains('Issued on: ' + userWithCard.libraryCard?.createDate.toISOString().slice(0, 10))
    cy.contains('Issued by: ' + signingOfficialUser.displayName)
  })

  it('Renders the Researcher Status Without Library Card Info', () => {
    cy.stub(User, 'getSOsForCurrentUser').resolves([signingOfficialUser])

    cy.mount(<ResearcherStatus user={user} />)
    cy.contains('No Library Card Found')
  })

  it('shows message when no signing officials are found', () => {
    cy.stub(User, 'getSOsForCurrentUser').resolves([])
    const userWithCard = {
      ...user, ...{
        libraryCard: {
          id: 1,
          userId: 1,
          userName: 'Test User',
          userEmail: 'test.user@test.com',
          createDate: new Date(),
          createUserId: 3,
          daaIds: [1],
        },
      },
    }
    cy.mount(<ResearcherStatus user={userWithCard} />)
    cy.contains('No Signing Official found for your institution')
    cy.contains('help article')
  })

  it('shows the Institutional Signing Officials list', () => {
    cy.stub(User, 'getSOsForCurrentUser').resolves([signingOfficialUser])
    const userWithCard = {
      ...user, ...{
        libraryCard: {
          id: 1,
          userId: 1,
          userName: 'Test User',
          userEmail: 'test.user@test.com',
          createDate: new Date(),
          createUserId: 3,
          daaIds: [1],
        },
      },
    }
    cy.mount(<ResearcherStatus user={userWithCard} />)
    cy.contains('Signing Official(s):')
    cy.contains('Signing Official - so@test.com')
  })
})
