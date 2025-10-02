import * as ERACommonsUtils from 'src/components/era_commons/ERACommonsUtils'
import { DuosUser } from 'src/types/model'

describe('ERACommonsUtils Tests', () => {
  describe('Verify RAS is enabled', () => {
    it('nihAccountLabel', () => {
      const result = ERACommonsUtils.nihAccountLabel()
      expect(result).to.eq('RAS')
    })
    it('nihAccountInstructions', () => {
      const result = ERACommonsUtils.nihAccountInstructions()
      expect(result).to.eq('https://datascience.nih.gov/researcher-auth-service-initiative')
    })
  })

  describe('extractEraAuthenticationState', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const futureEpoch = futureDate.getTime().toString()

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 30)
    const pastEpoch = pastDate.getTime().toString()

    it('returns authorized state with valid expiration', () => {
      const user = {
        eraCommonsId: 'test123',
        properties: [
          { propertyKey: 'eraAuthorized', propertyValue: 'true' },
          { propertyKey: 'eraExpiration', propertyValue: futureEpoch },
        ],
      } as DuosUser

      const result = ERACommonsUtils.extractEraAuthenticationState(user)

      cy.wrap(result).should('deep.equal', {
        isAuthorized: true,
        expirationCount: 30,
        nihValid: true,
        eraCommonsId: 'test123',
      })
    })

    it('returns unauthorized state when not authorized', () => {
      const user = {
        eraCommonsId: 'test123',
        properties: [
          { propertyKey: 'eraAuthorized', propertyValue: 'false' },
          { propertyKey: 'eraExpiration', propertyValue: futureEpoch },
        ],
      } as DuosUser

      const result = ERACommonsUtils.extractEraAuthenticationState(user)

      expect(result.isAuthorized).to.eq(false)
      expect(result.nihValid).to.eq(false)
    })

    it('returns invalid state when authorization is expired', () => {
      const user = {
        eraCommonsId: 'test123',
        properties: [
          { propertyKey: 'eraAuthorized', propertyValue: 'true' },
          { propertyKey: 'eraExpiration', propertyValue: pastEpoch },
        ],
      } as DuosUser

      const result = ERACommonsUtils.extractEraAuthenticationState(user)

      expect(result.isAuthorized).to.eq(true)
      expect(result.expirationCount).to.eq(-1)
      expect(result.nihValid).to.eq(false)
    })

    it('handles missing properties gracefully', () => {
      const user = {
        eraCommonsId: 'test123',
        properties: [
          { propertyKey: 'randomProp', propertyValue: 'randomValue' },
        ],
      } as DuosUser

      const result = ERACommonsUtils.extractEraAuthenticationState(user)

      cy.wrap(result).should('deep.equal', {
        isAuthorized: false,
        expirationCount: 0,
        nihValid: false,
        eraCommonsId: 'test123',
      })
    })

    it('handles null properties', () => {
      const user = {
        eraCommonsId: 'test123',
        properties: [
          { propertyKey: 'randomProp', propertyValue: 'randomValue' },
        ],
      } as DuosUser

      const result = ERACommonsUtils.extractEraAuthenticationState(user)

      cy.wrap(result).should('deep.equal', {
        isAuthorized: false,
        expirationCount: 0,
        nihValid: false,
        eraCommonsId: 'test123',
      })
    })

    it('handles missing expiration property', () => {
      const user = {
        eraCommonsId: 'test123',
        properties: [
          { propertyKey: 'eraAuthorized', propertyValue: 'true' },
        ],
      } as DuosUser

      const result = ERACommonsUtils.extractEraAuthenticationState(user)

      cy.wrap(result).should('deep.equal', {
        isAuthorized: true,
        expirationCount: 0,
        nihValid: false,
        eraCommonsId: 'test123',
      })
    })
  })
})
