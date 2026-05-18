import { ToS, ToSStatus } from 'src/libs/ajax/ToS'
import { UserStatusInfo } from 'src/types/model'

describe('ToS ajax module', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('getDUOSText fetches the DUOS ToS text', () => {
    const expectedText = 'DUOS Terms of Service text.'
    cy.stub(window, 'fetch').callsFake((url) => {
      expect(url).to.include('/tos/text/duos')
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(expectedText),
        json: () => Promise.resolve(expectedText),
        headers: { get: () => 'text/plain' },
      })
    })
    ToS.getDUOSText().then((text) => {
      expect(text).to.equal(expectedText)
    })
  })

  it('acceptToS posts and returns UserStatusInfo', () => {
    const expected = {
      enabled: false,
      userEmail: 'test@duos.org',
      userSubjectId: '123',
      tosAccepted: true,
    } as UserStatusInfo
    cy.stub(window, 'fetch').callsFake((url, opts) => {
      expect(url).to.include('/api/sam/register/self/tos')
      expect(opts?.method).to.equal('POST')
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(expected),
        headers: { get: () => 'application/json' },
      })
    })
    ToS.acceptToS().then((data) => {
      expect(data).to.deep.equal(expected)
    })
  })

  it('rejectToS deletes and returns ToSStatus', () => {
    const expected = {
      acceptedOn: '2026-04-30T12:00:00.000Z',
      isCurrentVersion: false,
      latestAcceptedVersion: 'v2',
      permitsSystemUsage: false,
    } as ToSStatus
    cy.stub(window, 'fetch').callsFake((url, opts) => {
      expect(url).to.include('/api/sam/register/self/tos')
      expect(opts?.method).to.equal('DELETE')
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(expected),
        headers: { get: () => 'application/json' },
      })
    })
    ToS.rejectToS().then((data) => {
      expect(data).to.deep.equal(expected)
    })
  })
})
