import { extractError } from 'src/utils/ErrorUtils'

describe('extractError', () => {
  it('should extract message from ConsentError in AxiosError', () => {
    const error = {
      response: {
        data: {
          message: 'Consent error occurred',
        },
      },
    }
    expect(extractError(error)).to.equal('Consent error occurred')
  })

  it('should return "Unknown error" if message is missing', () => {
    const error = {
      response: {
        data: {},
      },
    }
    expect(extractError(error)).to.equal('Unknown error')
  })

  it('should handle completely invalid error object', () => {
    expect(extractError({})).to.equal('Unknown error')
  })

  it('should handle non-object error', () => {
    expect(extractError('some string')).to.match(/^Unknown error/)
  })
})
