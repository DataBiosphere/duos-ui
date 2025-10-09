import { extractError } from 'src/utils/ErrorUtils'

describe('extractError', () => {
  it('should extract message from Error instance', () => {
    const error = new Error('Fetch failed')
    expect(extractError(error)).to.equal('Fetch failed')
  })

  it('should extract message from ConsentError shape', () => {
    const error = { message: 'Consent error occurred' }
    expect(extractError(error)).to.equal('Consent error occurred')
  })

  it('should return "Unknown error" if message is missing', () => {
    const error = {}
    expect(extractError(error)).to.equal('Unknown error')
  })

  it('should handle non-object error', () => {
    expect(extractError('some string')).to.match(/^Unknown error/)
  })
})
