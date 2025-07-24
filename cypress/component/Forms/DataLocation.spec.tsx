import { mount } from 'cypress/react'
import React from 'react'
import { DataLocation, DataLocationComponentProps, DataLocationInfo } from 'src/components/forms/DataLocation'
import { BrowserRouter } from 'react-router-dom'

const baseProps = {
  idx: 0,
  location: { cloudProvider: null, dataLocation: null, locationUrl: null, researchStage: null } as DataLocationInfo,
  onChange: () => {
  },
  onDelete: () => {
  },
} as DataLocationComponentProps
describe('Data Locations List Component - Tests', () => {
  it('should render a Data Location control', () => {
    mount(<BrowserRouter><DataLocation {...baseProps} /></BrowserRouter>)
    cy.get('.formField-researchStage')
    cy.get('.formField-dataLocation')
    cy.get('.formField-locationUrl')
    cy.get('.formField-cloudProvider')
  })

  it('should fire an onChange event when researchStage is selected', () => {
    const customProps = { ...baseProps }
    customProps.onChange = cy.spy().as('onChangeSpy')
    mount(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    cy.get('.formField-researchStage').type('Pre{enter}')
    cy.get('@onChangeSpy').should('be.calledWith', {
      idx: 0,
      location: {
        cloudProvider: null,
        dataLocation: null,
        locationUrl: null,
        researchStage: {
          displayText: 'Pre-analysis',
          key: 'PRA',
        },
      },
    })
  })

  it('should fire an onChange event when dataLocation is selected', () => {
    const customProps = { ...baseProps }
    customProps.onChange = cy.spy().as('onChangeSpy')
    mount(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    cy.get('.formField-dataLocation').type('Ter{enter}')
    cy.get('@onChangeSpy').should('be.calledWith', {
      idx: 0,
      location: {
        cloudProvider: null,
        dataLocation: {
          displayText: 'Terra',
          key: 'TERRA',
        },
        locationUrl: null,
        researchStage: null,
      },
    })
  })

  it('should fire an onChange event when cloudProvider is selected', () => {
    const customProps = { ...baseProps }
    customProps.onChange = cy.spy().as('onChangeSpy')
    mount(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    cy.get('.formField-cloudProvider').type('AW{enter}')
    cy.get('@onChangeSpy').should('be.calledWith', {
      idx: 0,
      location: {
        cloudProvider: {
          displayText: 'AWS',
          key: 'AWS',
        },
        dataLocation: null,
        locationUrl: null,
        researchStage: null,
      },
    })
  })

  it('should fire an onChange event when locationUrl is entered', () => {
    const customProps = { ...baseProps }
    customProps.onChange = cy.spy().as('onChangeSpy')
    mount(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    cy.get('.formField-locationUrl').type('https://www.duos.org{enter}')
    cy.get('@onChangeSpy').should('be.calledWith', {
      idx: 0,
      location: {
        cloudProvider: null,
        dataLocation: null,
        locationUrl: 'https://www.duos.org',
        researchStage: null,
      },
    })
  })

  it('clicking on delete triggers onDelete function', () => {
    const customProps = { ...baseProps }
    customProps.onDelete = cy.spy().as('onDeleteSpy')
    mount(<BrowserRouter><DataLocation {...customProps} /></BrowserRouter>)
    cy.get('a').click({ force: true })
    cy.get('@onDeleteSpy').should('be.calledWith', 0)
  })
})
