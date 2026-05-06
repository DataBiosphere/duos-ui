import { React } from 'react'
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets.jsx'
import { DAR } from 'src/libs/ajax/DAR'
import { DAA } from 'src/libs/ajax/DAA'

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    dacId: 1,
  },
  {
    datasetId: 234567,
    datasetIdentifier: `DUOS-234567`,
    datasetName: 'Some Dataset 2',
    dacId: 2,
  },
  {
    datasetId: 345678,
    datasetIdentifier: `DUOS-345678`,
    datasetName: 'Some Dataset 3',
    dacId: 3,
  },
  {
    datasetId: 456789,
    datasetIdentifier: `DUOS-456789`,
    datasetName: 'Some Dataset 4',
    dacId: 4,
  },
]

const props = {
  datasets: datasets,
  setSelectedDatasets: () => {},
  disabled: false,
  referenceId: 'ref-1',
}

const propsDisabled = {
  datasets: datasets,
  setSelectedDatasets: () => {},
  disabled: true,
  referenceId: 'ref-1',
}

describe('Selectable Datasets - Not Read Only', () => {
  describe('With 4 Datasets', () => {
    beforeEach(() => {
      cy.stub(DAA, 'getDaas').resolves([])
      cy.mount(<SelectableDatasets {...props} />)
    })

    it('Shows DAA file name link for rows with matching DAC and hides it otherwise', () => {
      DAA.getDaas.restore()
      cy.stub(DAA, 'getDaas').resolves([
        {
          daaId: 101,
          file: { fileName: 'daa-101.pdf' },
          dacs: [{ dacId: 1 }],
        },
        {
          daaId: 303,
          file: { fileName: 'daa-303.pdf' },
          dacs: [{ dacId: 3 }],
        },
      ])

      cy.mount(<SelectableDatasets {...props} />)

      cy.get('#DUOS-123456_summary').contains('daa-101.pdf').should('exist')
      cy.get('#DUOS-345678_summary').contains('daa-303.pdf').should('exist')
      cy.get('#DUOS-234567_summary').should('not.contain', 'daa')
      cy.get('#DUOS-456789_summary').should('not.contain', 'daa')
    })

    it('Marks 2 datasets for removal', () => {
      cy.get('#DUOS-123456_summary').click()
      cy.get('#DUOS-345678_summary').click()
      cy.get('#restore_dataset_123456').should('exist')
      cy.get('#restore_dataset_345678').should('exist')
    })

    it('Unmark 1 of the previously marked for removal datasets', () => {
      cy.get('#DUOS-123456_summary').click()
      cy.get('#DUOS-345678_summary').click()
      cy.get('#restore_dataset_123456').should('exist')
      cy.get('#restore_dataset_345678').should('exist')
      cy.get('#restore_dataset_345678').click()
      cy.get('#remove_dataset_345678').should('exist')
    })

    it('Marks 2 more datasets for removal, leaving 1 dataset left not removed', () => {
      cy.get('#DUOS-123456_summary').click()
      cy.get('#DUOS-345678_summary').click()
      cy.get('#restore_dataset_123456').should('exist')
      cy.get('#restore_dataset_345678').should('exist')
      cy.get('#restore_dataset_345678').click()
      cy.get('#remove_dataset_345678').should('exist')
      cy.get('#remove_dataset_345678').click()
      cy.get('#DUOS-234567_summary').click()
      cy.get('#restore_dataset_123456').should('exist')
      cy.get('#restore_dataset_345678').should('exist')
      cy.get('#restore_dataset_234567').should('exist')
      cy.get('#remove_dataset_456789').should('exist')
    })

    it('Cannot delete last dataset', () => {
      cy.get('#DUOS-123456_summary').click()
      cy.get('#DUOS-345678_summary').click()
      cy.get('#restore_dataset_123456').should('exist')
      cy.get('#restore_dataset_345678').should('exist')
      cy.get('#restore_dataset_345678').click()
      cy.get('#remove_dataset_345678').should('exist')
      cy.get('#remove_dataset_345678').click()
      cy.get('#DUOS-234567_summary').click()
      cy.get('#restore_dataset_123456').should('exist')
      cy.get('#restore_dataset_345678').should('exist')
      cy.get('#restore_dataset_234567').should('exist')
      cy.get('#remove_dataset_456789').should('exist')
      cy.get('#DUOS-456789_summary [data-testid="DeleteIcon"]').should('have.css', 'opacity', '0.5')
    })
  })

  describe('Selectable Datasets - Read Only', () => {
    beforeEach(() => {
      cy.stub(DAA, 'getDaas').resolves([
        {
          daaId: 101,
          file: { fileName: 'mapped-daa-101.pdf' },
          dacs: [{ dacId: 1 }],
        },
      ])
      cy.stub(DAR, 'getDatasetDaaSnapshots').resolves([])
      cy.mount(<SelectableDatasets {...propsDisabled} />)
    })

    it('Uses historical snapshot mapping for DAA links', () => {
      DAR.getDatasetDaaSnapshots.restore()
      cy.stub(DAR, 'getDatasetDaaSnapshots').resolves([
        {
          datasetId: 123456,
          daaId: 101,
          daaFileName: 'historical-daa-101.pdf',
        },
      ])

      cy.mount(<SelectableDatasets {...propsDisabled} />)

      cy.get('#DUOS-123456_summary').contains('mapped-daa-101.pdf').should('exist')
      cy.get('#DUOS-234567_summary').should('not.contain', 'historical-daa-101.pdf')
    })

    it('Uses historical snapshot mapping by datasetIdentifier when datasetId is absent', () => {
      DAR.getDatasetDaaSnapshots.restore()
      cy.stub(DAR, 'getDatasetDaaSnapshots').resolves([
        {
          datasetIdentifier: 'DUOS-123456',
          daaId: 101,
          daaFileName: 'identifier-mapped-daa.pdf',
        },
      ])

      cy.mount(<SelectableDatasets {...propsDisabled} />)

      cy.get('#DUOS-123456_summary').contains('mapped-daa-101.pdf').should('exist')
    })

    it('Uses historical snapshot mapping when snapshots are returned as datasetId-keyed object map', () => {
      DAR.getDatasetDaaSnapshots.restore()
      cy.stub(DAR, 'getDatasetDaaSnapshots').resolves({
        123456: {
          daaId: 101,
          capturedAt: 1778006370183,
        },
      })

      cy.mount(<SelectableDatasets {...propsDisabled} />)

      cy.get('#DUOS-123456_summary').contains('mapped-daa-101.pdf').should('exist')
    })

    it('Shows fallback text when snapshot lookup returns 404', () => {
      DAR.getDatasetDaaSnapshots.restore()
      cy.stub(DAR, 'getDatasetDaaSnapshots').rejects({ response: { status: 404 } })

      cy.mount(<SelectableDatasets {...propsDisabled} />)

      cy.get('#DUOS-123456_summary').contains('The DUOS Library Card Agreements in effect at the time this request was made govern the use of this data.').should('be.visible')
      cy.get('#DUOS-234567_summary').contains('The DUOS Library Card Agreements in effect at the time this request was made govern the use of this data.').should('be.visible')
    })

    it('Can not click on any dataset', () => {
      cy.get('#DUOS-123456_summary').should('have.css', 'cursor', 'auto')
      cy.get('#DUOS-234567_summary').should('have.css', 'cursor', 'auto')
      cy.get('#DUOS-345678_summary').should('have.css', 'cursor', 'auto')
      cy.get('#DUOS-456789_summary').should('have.css', 'cursor', 'auto')

      cy.get('#DUOS-123456_summary').click()
      cy.get('#DUOS-234567_summary').click()
      cy.get('#DUOS-345678_summary').click()
      cy.get('#DUOS-456789_summary').click()

      cy.get('#restore_dataset_123456').should('not.exist')
      cy.get('#restore_dataset_234567').should('not.exist')
      cy.get('#restore_dataset_345678').should('not.exist')
      cy.get('#restore_dataset_456789').should('not.exist')

      cy.get('#DUOS-123456_summary').find('[data-testid="DeleteIcon"]').should('not.exist')
      cy.get('#DUOS-234567_summary').find('[data-testid="DeleteIcon"]').should('not.exist')
      cy.get('#DUOS-345678_summary').find('[data-testid="DeleteIcon"]').should('not.exist')
      cy.get('#DUOS-456789_summary').find('[data-testid="DeleteIcon"]').should('not.exist')
    })
  })
})
