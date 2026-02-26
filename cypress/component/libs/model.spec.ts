import { getAccessManagementSummary } from 'src/types/model'

describe('getAccessManagementSummary', () => {
  it('returns External summary for "external"', () => {
    const result = getAccessManagementSummary('external')
    expect(result.name).to.equal('External')
    expect(result.description).to.equal('External access request required')
    expect(result.icon).to.be.a('string').and.not.equal('')
  })

  it('returns Open summary for "open"', () => {
    const result = getAccessManagementSummary('open')
    expect(result.name).to.equal('Open')
    expect(result.description).to.equal('Open access')
    expect(result.icon).to.be.a('string').and.not.equal('')
  })

  it('returns Controlled summary for "controlled"', () => {
    const result = getAccessManagementSummary('controlled')
    expect(result.name).to.equal('Controlled')
    expect(result.description).to.equal('Controlled access')
    expect(result.icon).to.be.a('string').and.not.equal('')
  })

  it('returns Unknown summary with name "Unknown" for unrecognised values', () => {
    const result = getAccessManagementSummary('something-unknown')
    expect(result.name).to.equal('Unknown')
    expect(result.description).to.equal('Unknown access management')
  })

  it('returns Unknown summary for empty string', () => {
    const result = getAccessManagementSummary('')
    expect(result.name).to.equal('Unknown')
    expect(result.description).to.equal('Unknown access management')
  })
})
