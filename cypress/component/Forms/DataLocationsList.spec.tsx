import { mount } from 'cypress/react'
import React from 'react'
import { DataLocationList, DataLocationsProps } from 'src/components/forms/DataLocationList'
import { DataLocationInfo } from 'src/components/forms/DataLocation'
import { BrowserRouter } from 'react-router-dom'

const props = {
  locations: [] as DataLocationInfo[],
  onChange: () => {
  },
} as DataLocationsProps

describe('Data Locations List Component - Tests', () => {
  it('should render a Data Locations component with Add location button', () => {
    mount(<DataLocationList {...props} />)
    cy.get('button').contains('Add location')
  })
  it('Add location click should fire expected event', () => {
    props.onChange = cy.spy().as('onChange')
    mount(<DataLocationList locations={props.locations} onChange={props.onChange} />)
    cy.get('button').contains('Add location').click()
    cy.get('@onChange').should('be.calledWith', {
      key: 'locations',
      value: [{ cloudProvider: null, locationUrl: null, researchStage: null, dataLocation: null }],
    })
  })

  it('Button text should be updated when one or more locations is present', () => {
    const locations: DataLocationInfo[] = [{
      cloudProvider: null,
      locationUrl: null,
      researchStage: null,
      dataLocation: null,
    }]
    mount(<BrowserRouter><DataLocationList locations={locations} onChange={props.onChange} /></BrowserRouter>)
    cy.get('button').contains('Add another location')
  })
})
