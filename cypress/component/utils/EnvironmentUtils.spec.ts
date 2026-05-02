import { Storage } from 'src/libs/storage'
import { checkEnv, envGroups, isDevEnv } from 'src/utils/EnvironmentUtils'

describe('EnvironmentUtils', () => {
  it('exposes expected environment groups', () => {
    expect(envGroups.PROD_STAGING).to.deep.equal(['prod', 'staging'])
    expect(envGroups.NON_PROD).to.deep.equal(['local', 'dev', 'staging'])
    expect(envGroups.NON_STAGING).to.deep.equal(['local', 'dev'])
    expect(envGroups.DEV).to.deep.equal(['local', 'dev'])
  })

  it('checkEnv returns true when current env is in the group', () => {
    const getEnvStub = Cypress.sinon.stub(Storage, 'getEnv').returns('dev')

    expect(checkEnv(envGroups.NON_STAGING)).to.equal(true)

    getEnvStub.restore()
  })

  it('checkEnv returns false when current env is not in the group', () => {
    const getEnvStub = Cypress.sinon.stub(Storage, 'getEnv').returns('prod')

    expect(checkEnv(envGroups.NON_STAGING)).to.equal(false)

    getEnvStub.restore()
  })

  it('checkEnv returns false when current env is null', () => {
    const getEnvStub = Cypress.sinon.stub(Storage, 'getEnv').returns(null)

    expect(checkEnv(envGroups.NON_PROD)).to.equal(false)

    getEnvStub.restore()
  })

  it('isDevEnv returns true for local/dev and false for prod', () => {
    const getEnvStub = Cypress.sinon.stub(Storage, 'getEnv').returns('local')
    expect(isDevEnv()).to.equal(true)

    getEnvStub.returns('prod')
    expect(isDevEnv()).to.equal(false)

    getEnvStub.restore()
  })
})
