import React from 'react'
import { DacPicker } from 'src/components/forms/DacPicker'

const dacs = [
  { name: 'Awesome DAC', dacId: 1, dataCustodianEmail: ['Some Data Custodian Email 1'] },
  { name: 'Extra DAC', dacId: 2, dataCustodianEmail: ['Some Data Custodian Email 2'] },
]

describe('Data Library Filters', () => {
  // Intercept configuration calls
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.intercept('GET', '/api/dac', (req) => {
      req.reply({
        body: dacs,
      })
    })
  })

  it('Renders the DAC picker', () => {
    const props = { onChange: () => { } }
    const id = 'DacPicker'
    const title = 'Data Access Committee'
    props.onChange = cy.spy().as('onChange')
    cy.mount(
      <DacPicker
        fieldTitle={title}
        fieldId={id}
        isRequired={false}
        onChange={props.onChange}
      />,
    )
    cy.get('div').should('contain', title)
    cy.get(`#${id}`).type('Awes{enter}')
    cy.get(`#${id}`).then(() => {
      expect(props.onChange).to.be.calledWith({
        key: 'DacPicker',
        value: 1,
        isValid: true,
      })
    })
    cy.get(`#${id}`).type('{esc}Ext{enter}')
    cy.get(`#${id}`).then(() => {
      expect(props.onChange).to.be.calledWith({
        key: 'DacPicker',
        value: 2,
        isValid: true,
      })
    })
  })
})
