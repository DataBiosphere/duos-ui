import React from 'react'
import { mount } from 'cypress/react'
import DatasetsRequestedPanel from 'src/components/collection_voting_slab/DatasetsRequestedPanel'
import { Storage } from 'src/libs/storage'
import { BrowserRouter } from 'react-router-dom'

const dataset = (id, dacId) => {
  return {
    datasetId: id,
    datasetIdentifier: `DUOS-${id}`,
    name: `Dataset ${id}`,
    dacId: dacId,
  }
}

const bucketDatasets = [
  dataset(1, 1),
  dataset(2, 1),
  dataset(3, 2),
  dataset(4, 2),
  dataset(5, 2),
  dataset(6, 3),
  dataset(7, 3),
]

const dacs = [
  { dacId: 1, dacName: 'DAC 1' },
  { dacId: 2, dacName: 'DAC 2' },
  { dacId: 3, dacName: 'DAC 3' },
]

const user = {
  userId: 1,
  displayName: 'Admin',
  institution: {
    id: 150,
    name: 'The Broad Institute of MIT and Harvard',
  },
  roles: [{ dacId: 4 }],
  isAdmin: true,
  isChairPerson: true,
}

describe('DatasetsRequestedPanel - Tests', function () {
  beforeEach(() => {
    cy.stub(Storage, 'getCurrentUser').returns(user)
  })
  it('Renders no dataset information if bucketDatasets is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={[]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        dacs={dacs}
      />,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 1)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(0)')
  })

  it('Renders no dataset information if bucketDatasets is null', function () {
    mount(
      <DatasetsRequestedPanel
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        dacs={dacs}
      />,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 1)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(0)')
  })

  it('Renders no dataset information if dacDatasetIds is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[]}
        dacs={dacs}
      />,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 1)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(0)')
  })

  it('Renders no dataset information if dacDatasetIds is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacs={dacs}
      />,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 1)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(0)')
  })

  it('Renders no dataset information if there are no matches between bucket datasets and DAC dataset ids', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[8, 9, 10]}
        dacs={dacs}
      />,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 1)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(0)')
  })

  it('Renders less than five datasets without an expansion link', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 3, 9, 10]}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 3)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(2)')

    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-1')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 1')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-3')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 3')

    cy.get('[data-cy=collapse-expand-link]').should('not.exist')
  })

  it('Renders five datasets without an expansion link', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5]}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 6)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(5)')

    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-1')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 1')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-2')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 2')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-3')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 3')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-4')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 4')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-5')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 5')

    cy.get('[data-cy=collapse-expand-link]').should('not.exist')
  })

  it('Renders more than five datasets with an expansion link', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 6)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(7)')

    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-1')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 1')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-2')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 2')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-3')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 3')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-4')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 4')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-5')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 5')

    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'DUOS-6')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'Dataset 6')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'DUOS-7')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'Dataset 7')

    cy.get('[data-cy=collapse-expand-link]').should('contain.text', '+ View 2 more')
  })

  it('Shows more or less datasets when link is clicked', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 6)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(7)')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'DUOS-6')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'Dataset 6')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'DUOS-7')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'Dataset 7')

    cy.get('[data-cy=collapse-expand-link]').should('contain.text', '+ View 2 more')
    cy.get('[data-cy=collapse-expand-link]').click()

    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 8)
    cy.get('[data-cy=dataset-count]').should('contain.text', '(7)')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-6')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 6')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-7')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 7')

    cy.get('[data-cy=collapse-expand-link]').should('contain.text', '- View 2 less')
    cy.get('[data-cy=collapse-expand-link]').click()

    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 6)
    cy.get('[data-cy=collapse-expand-link]').should('contain.text', '+ View 2 more')
  })

  it('Renders filler dataset identifier if attribute is null', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={[
            {
              datasetId: 1,
              name: 'Dataset 1',
            },
          ]}
          dacDatasetIds={[1]}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'DUOS-1')
    cy.get('[data-cy=dataset-list]').should('contain.text', '- -')
    cy.get('[data-cy=dataset-list]').should('contain.text', 'Dataset 1')
  })

  it('Renders filler dataset name if attribute is null', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={[
            {
              datasetId: 1,
              datasetIdentifier: 'DUOS-1',
            },
          ]}
          dacDatasetIds={[1]}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').should('contain.text', 'DUOS-1')
    cy.get('[data-cy=dataset-list]').should('not.contain.text', 'Dataset 1')
    cy.get('[data-cy=dataset-list]').should('contain.text', '- -')
  })

  it('Renders skeleton text when loading', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        isLoading={true}
        dacs={dacs}
      />,
    )

    cy.get('.text-placeholder').should('exist')
    cy.get('[data-cy=dataset-list]').should('not.exist')
  })

  it('shows all datasets if the viewing on the admin page', () => {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1]}
          isLoading={false}
          adminPage={true}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').find('tr').should('have.length', 6)
    cy.get('[data-cy=collapse-expand-link]').contains('View 2 more')
  })

  it('shows all DACs in bucket', function () {
    mount(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          isLoading={false}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.get('[data-cy=dataset-list]').should('exist')
    cy.get('[data-cy=collapse-expand-link]').click()
    dacs.forEach((dac) => {
      cy.get('[data-cy=dataset-list]').should('contain.text', dac.dacName)
    })
  })
})
