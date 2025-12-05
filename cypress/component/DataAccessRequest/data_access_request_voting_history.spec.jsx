import { React } from 'react'
import { mount } from 'cypress/react'
import DataAccessRequestApplication from 'src/pages/dar_application/DataAccessRequestApplication'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Navigation } from 'src/libs/utils'
import { NotificationService } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Countries } from 'src/libs/ajax/Countries'
import { Collections } from 'src/libs/ajax/Collections'
import darCollection from './darCollection.json'
import { VOTE_TYPES } from 'src/utils/DarUtils'

const props = {
  draftDar: true,
  isProgressReportApplication: false,
  existingDarsReadOnlyMode: true,
}

const user = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  libraryCard: {},
  properties: [],
}

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    name: 'Dataset A',
    dataUse: {},
  },
  {
    datasetId: 123457,
    datasetIdentifier: 'DUOS-123457',
    name: 'Dataset B',
    dataUse: {},
  },
]

const darId = '011467b7-5544-499f-9210-3c2035810639'

const mountDataAccessRequestApp = ({ initialEntries, props, collection }) => {
  mount(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/dar_application/:collectionId"
          element={<DataAccessRequestApplication {...props} collection={collection} />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Voting History - Vote Status Display', () => {
  beforeEach(() => {
    cy.stub(Countries, 'getCountries').returns(Promise.resolve(['United States of America (the)']))
    cy.stub(Metrics, 'captureEvent').returns(Promise.resolve())
    cy.stub(DataSet, 'getDatasetsByIds').returns(Promise.resolve(datasets))
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.stub(User, 'getMe').returns(user)
    cy.stub(Navigation, 'console').returns({})
    cy.stub(NotificationService, 'getBannerObjectById').returns(Promise.resolve({}))
  })

  it('displays Awaiting Election Opening when no election exists', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456, 123457],
          elections: {},
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Awaiting Election Opening').should('be.visible')
  })

  it('displays Approved and rationale when final vote is true and rationale present', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Closed',
              votes: [
                {
                  type: VOTE_TYPES.FINAL,
                  vote: true,
                  rationale: 'Approved for research.',
                  updateDate: '2024-06-01T00:00:00Z',
                },
              ],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Approved').should('be.visible')
    cy.contains('Approved for research.').should('be.visible')
  })

  it('displays Denied and rationale when final vote is false and rationale present', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Closed',
              votes: [
                {
                  type: VOTE_TYPES.FINAL,
                  vote: false,
                  rationale: 'Not enough justification.',
                  updateDate: '2024-06-02T00:00:00Z',
                },
              ],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Denied').should('be.visible')
    cy.contains('Not enough justification.').should('be.visible')
  })

  it('displays Pending and Awaiting Final Vote when final vote is missing', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Open',
              votes: [
                {
                  type: 'Preliminary',
                  vote: null,
                  rationale: 'Still under review.',
                  updateDate: '2024-06-03T00:00:00Z',
                },
              ],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Pending').should('be.visible')
    cy.contains('Awaiting Final Vote').should('be.visible')
  })

  it('displays No rationale provided when vote is cast but rationale is missing', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Closed',
              votes: [
                {
                  type: VOTE_TYPES.FINAL,
                  vote: true,
                  rationale: '',
                  updateDate: '2024-06-04T00:00:00Z',
                },
              ],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Approved').should('be.visible')
    cy.contains('No rationale provided.').should('be.visible')
  })

  it('displays No rationale provided when vote is cast but rationale is whitespace', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Closed',
              votes: [
                {
                  type: VOTE_TYPES.FINAL,
                  vote: false,
                  rationale: '   ',
                  updateDate: '2024-06-05T00:00:00Z',
                },
              ],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Denied').should('be.visible')
    cy.contains('No rationale provided.').should('be.visible')
  })

  it('displays correct status/rationale for multiple datasets with mixed voting results', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456, 123457],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Closed',
              votes: [
                {
                  type: VOTE_TYPES.FINAL,
                  vote: true,
                  rationale: 'Approved for dataset A.',
                  updateDate: '2024-06-06T00:00:00Z',
                },
              ],
            },
            'election-2': {
              electionType: 'DataAccess',
              datasetId: 123457,
              status: 'Closed',
              votes: [
                {
                  type: VOTE_TYPES.FINAL,
                  vote: false,
                  rationale: '',
                  updateDate: '2024-06-07T00:00:00Z',
                },
              ],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Approved').should('be.visible')
    cy.contains('Approved for dataset A.').should('be.visible')
    cy.contains('Denied').should('be.visible')
    cy.contains('No rationale provided.').should('be.visible')
  })

  it('displays Pending and Awaiting Final Vote when election exists but no votes at all', () => {
    cy.stub(Collections, 'getCollectionById').returns(Promise.resolve({
      ...darCollection,
      dars: {
        [darId]: {
          id: 1,
          referenceId: darId,
          datasetIds: [123456],
          elections: {
            'election-1': {
              electionType: 'DataAccess',
              datasetId: 123456,
              status: 'Open',
              votes: [],
            },
          },
          data: {
            darCode: darId,
            projectTitle: 'Test Project',
            piName: 'Jane Doe',
          },
        },
      },
    }))
    mountDataAccessRequestApp({
      initialEntries: [`/dar_application/${darId}`],
      props,
      collection: darCollection,
    })
    cy.get('#voting-history-info').should('exist').and('be.visible').click({ force: true })
    cy.contains('Pending').should('be.visible')
    cy.contains('Awaiting Final Vote').should('be.visible')
  })
})
