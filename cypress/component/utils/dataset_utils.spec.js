import { firstNonEmptyPropertyValue } from 'src/utils/DatasetUtils'

describe('firstNonEmptyPropertyValue', () => {
  it('ensure no errors when no study properties', () => {
    const dataset = { id: 1, study: { id: 2 } }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when no dataset properties', () => {
    const dataset = { id: 1 }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when incorrect properties', () => {
    const dataset = { id: 1, study: { id: 2, properties: [{ key: 'hello', value: 'goodbye' }] } }
    const result = firstNonEmptyPropertyValue(dataset, ['test'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when empty study property values', () => {
    const dataset = { id: 1, study: { id: 2, properties: [{ key: 'hello' }] } }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('be.empty')
  })
  it('ensure no errors when empty dataset property values', () => {
    const dataset = { id: 1, properties: [{ propertyName: 'hello' }] }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('be.empty')
  })
  it('extract hello property from study', () => {
    const dataset = { id: 1, study: { id: 2, properties: [{ key: 'hello', value: 'goodbye' }] } }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('extract hello property from dataset', () => {
    const dataset = { id: 1, properties: [{ propertyName: 'hello', propertyValue: 'goodbye' }] }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('prioritize study property over dataset property', () => {
    const dataset = { id: 1, properties: [{ propertyName: 'hello', propertyValue: 'goodbye' }], study: { id: 2, properties: [{ key: 'hello', value: 'world' }] } }
    const result = firstNonEmptyPropertyValue(dataset, ['hello'])
    cy.wrap(result).should('equal', 'world')
  })
  it('extract first available property from study', () => {
    const dataset = { id: 1, study: { id: 2, properties: [{ key: 'hello', value: 'goodbye' }, { key: 'world', value: 'hello' }] } }
    const result = firstNonEmptyPropertyValue(dataset, ['hello', 'world'])
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('extract first available property from dataset', () => {
    const dataset = { id: 1, properties: [{ propertyName: 'hello', propertyValue: 'goodbye' }, { propertyName: 'world', propertyValue: 'hello' }] }
    const result = firstNonEmptyPropertyValue(dataset, ['hello', 'world'])
    cy.wrap(result).should('equal', 'goodbye')
  })
  it('extract mix of properties from study and dataset', () => {
    const dataset = { id: 1, properties: [{ propertyName: 'hello', propertyValue: 'goodbye' }], study: { id: 2, properties: [{ key: 'world', value: 'hello' }] } }
    const result = firstNonEmptyPropertyValue(dataset, ['world', 'hello'])
    cy.wrap(result).should('equal', 'hello')
  })
})
