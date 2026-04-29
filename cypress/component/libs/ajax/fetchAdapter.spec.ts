import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchPatch,
  fetchDelete,
  fetchMultipart,
  type Params,
} from 'src/libs/ajax/fetchAdapter'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { Config } from 'src/libs/config'
import { Auth } from 'src/libs/auth/auth'
import eventList from 'src/libs/events'

interface StubOptions {
  method?: string
  headers?: Record<string, string>
  credentials?: string
  body?: string | FormData
}

describe('fetchAdapter - Fetch methods', () => {
  let fetchStub: ReturnType<typeof cy.stub>

  beforeEach(() => {
    cy.window().then((_win) => {
      fetchStub = cy.stub(_win, 'fetch')
    })
  })

  afterEach(() => {
    cy.window().then(() => {
      fetchStub.restore()
    })
  })

  it('fetchGet - should make GET request with JSON response', () => {
    const mockResponse = { id: 1, name: 'Test' }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet<typeof mockResponse>('/api/test').then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
      })
    })
  })

  it('fetchGet - should handle query parameters', () => {
    const mockResponse = { results: [] }
    const params: Params = { page: 1, limit: 10, active: true }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet<typeof mockResponse>('/api/items', { params }).then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
        const [url] = fetchStub.getCall(0).args
        expect(url).to.include('page=1')
        expect(url).to.include('limit=10')
        expect(url).to.include('active=true')
      })
    })
  })

  it('fetchGet - should return blob when responseType is blob', () => {
    cy.window().then((win) => {
      const mockBlob = new win.Blob(['test data'], { type: 'text/plain' })
      fetchStub.resolves(new win.Response(mockBlob, { status: 200 }))

      fetchGet<Blob>('/api/file', { responseType: 'blob' }).then((result) => {
        expect(result.data).to.be.instanceOf(win.Blob)
      })
    })
  })

  it('fetchGet - should return text when content-type is text/plain', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response('Plain text response', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      )

      fetchGet<string>('/api/text').then((result) => {
        expect(result.data).to.equal('Plain text response')
      })
    })
  })

  it('fetchGet - should include credentials when specified', () => {
    const mockResponse = { authenticated: true }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet<typeof mockResponse>('/api/secure', { credentials: 'include' }).then(() => {
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.credentials).to.equal('include')
      })
    })
  })

  it('fetchPost - should send data as JSON', () => {
    const requestData = { name: 'Item', value: 42 }
    const mockResponse = { id: 1, ...requestData }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchPost<typeof mockResponse>('/api/items', requestData).then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
        const [url, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(url).to.equal('/api/items')
        expect(options.method).to.equal('POST')
        expect(options.body).to.equal(JSON.stringify(requestData))
      })
    })
  })

  it('fetchPut - should update resource with data', () => {
    const requestData = { name: 'Updated' }
    const mockResponse = { id: 1, ...requestData }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchPut<typeof mockResponse>('/api/items/1', requestData).then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.method).to.equal('PUT')
      })
    })
  })

  it('fetchPatch - should partially update resource', () => {
    const requestData = { status: 'active' }
    const mockResponse = { id: 1, name: 'Item', ...requestData }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchPatch<typeof mockResponse>('/api/items/1', requestData).then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.method).to.equal('PATCH')
      })
    })
  })

  it('fetchDelete - should delete resource', () => {
    const mockResponse = { success: true }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchDelete('/api/items/1').then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.method).to.equal('DELETE')
      })
    })
  })

  it('fetchMultipart - should POST FormData without Content-Type header', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      formData.append('file', new win.Blob(['content']), 'test.txt')

      const mockResponse = { id: 1, filename: 'test.txt' }
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart<typeof mockResponse>('/api/upload', formData).then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
        const [url, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(url).to.equal('/api/upload')
        expect(options.method).to.equal('POST')
        expect(options.body).to.be.instanceOf(win.FormData)
        expect(options.headers?.['Content-Type']).to.equal(undefined)
      })
    })
  })

  it('fetchMultipart - should support PUT method', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      const mockResponse = { success: true }
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart<typeof mockResponse>('/api/upload/1', formData, {}, 'PUT').then(() => {
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.method).to.equal('PUT')
      })
    })
  })

  it('fetchMultipart - should include params in URL', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      const mockResponse = { success: true }
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart('/api/upload', formData, { params: { tag: 'important' } }).then(() => {
        const [url] = fetchStub.getCall(0).args
        expect(url).to.include('tag=important')
      })
    })
  })

  it('should merge custom headers with defaults', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchPost('/api/test', { key: 'value' }, {
        headers: { 'X-Custom': 'header' },
      }).then(() => {
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.headers?.['Content-Type']).to.equal('application/json')
        expect(options.headers?.['X-Custom']).to.equal('header')
      })
    })
  })

  it('should handle network errors', () => {
    cy.window().then((win) => {
      fetchStub.rejects(new win.TypeError('Network error'))

      fetchGet('/api/test').then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.include('failed with status 502')
        },
      )
    })
  })

  it('fetchMultipart - should report 502 on network-level failure', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.rejects(new win.TypeError('Network error'))

      fetchMultipart('/api/progress_report/123', formData).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.include('failed with status 502')
        },
      )
    })
  })

  it('fetchMultipart - should use backend error message when provided', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'File too large' }), {
          status: 413,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart('/api/upload', formData).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.equal('File too large')
        },
      )
    })
  })

  it('fetchMultipart - should fall back to help desk message when no message field in error body', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response(JSON.stringify({ error: 'Bad request' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart('/api/upload', formData).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.include('400')
          expect(error.message).to.include('duos@duos.org')
        },
      )
    })
  })

  it('fetchMultipart - should fall back to help desk message for non-JSON error responses', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response('Server error', {
          status: 500,
          headers: { 'content-type': 'text/html' },
        }),
      )

      fetchMultipart('/api/upload', formData).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.include('500')
          expect(error.message).to.include('duos@duos.org')
        },
      )
    })
  })

  it('fetchMultipart - should always throw errors regardless of method', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'Missing library card' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart('/api/progress_report/123', formData, {}, 'POST').then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.equal('Missing library card')
        },
      )
    })
  })

  it('should encode URL parameters correctly', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const params: Params = {
        search: 'test value',
        page: 1,
        limit: 50,
        active: true,
      }

      fetchGet('/api/items', { params }).then(() => {
        const [url] = fetchStub.getCall(0).args
        expect(url).to.include('search=test%20value')
        expect(url).to.include('page=1')
        expect(url).to.include('limit=50')
        expect(url).to.include('active=true')
      })
    })
  })

  it('should not append query string when params is empty', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet('/api/items', { params: {} }).then(() => {
        const [url] = fetchStub.getCall(0).args
        expect(url).to.equal('/api/items')
      })
    })
  })

  it('should serialize objects to JSON', () => {
    const data = { name: 'test', nested: { value: 123 } }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchPost('/api/test', data).then(() => {
        const [, options] = fetchStub.getCall(0).args as [string, StubOptions]
        expect(options.body).to.equal(JSON.stringify(data))
      })
    })
  })

  it('should handle responseType text', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response('Hello', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      )

      fetchGet<string>('/api/test', { responseType: 'text' }).then((result) => {
        expect(result.data).to.equal('Hello')
      })
    })
  })

  it('should handle responseType json explicitly', () => {
    const mockResponse = { data: 'test' }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet<typeof mockResponse>('/api/test', { responseType: 'json' }).then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
      })
    })
  })

  it('should default to json responseType', () => {
    const mockResponse = { data: 'test' }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet<typeof mockResponse>('/api/test').then((result) => {
        expect(result.data).to.deep.equal(mockResponse)
      })
    })
  })

  describe('Error handling with axios-like structure', () => {
    // Helper to verify common error structure
    const verifyErrorStructure = (error: Error & { response?: { status: number, data: unknown } }, expectedStatus: number, expectedMessage: string, expectedData?: unknown) => {
      expect(error).to.have.property('message', expectedMessage)
      expect(error).to.have.property('response')
      if (!error.response) {
        throw new Error('Expected error.response to be defined')
      }
      expect(error.response).to.have.property('status', expectedStatus)
      expect(error.response).to.have.property('data')
      if (expectedData !== undefined) {
        expect(error.response.data).to.deep.equal(expectedData)
      }
    }

    it('fetchPost - should throw error with response.data structure on 400', () => {
      const errorMessage = 'Validation failed: Email is required'
      const errorBody = {
        code: 400,
        message: errorMessage,
      }

      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(errorBody), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }),
        )
      })

      fetchPost('/api/dar/v2', { data: 'test' }).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          verifyErrorStructure(error, 400, errorMessage, errorBody)
        },
      )
    })

    it('fetchPost - should throw error with response.data structure on 500', () => {
      const errorMessage = 'Internal server error'
      const errorBody = {
        message: errorMessage,
        code: 500,
      }

      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(errorBody), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
        )
      })

      fetchGet('/api/data').then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          verifyErrorStructure(error, 500, errorMessage)
          if (!error.response) {
            throw new Error('Expected error.response to be defined')
          }
          expect(error.response.data).to.have.property('message', errorMessage)
        },
      )
    })

    it('should handle 400 error with non-JSON response', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response('Bad Request', {
            status: 400,
            headers: { 'content-type': 'text/html' },
          }),
        )
      })

      fetchPost('/api/test', { data: 'test' }).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          verifyErrorStructure(error, 400, 'Request failed with status 400', {})
        },
      )
    })

    it('should preserve error message from backend', () => {
      const backendMessage = 'All listed personnel must share the same institutional affiliation'
      const errorBody = {
        code: 400,
        message: backendMessage,
      }

      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(errorBody), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }),
        )
      })

      fetchPost('/api/dar/v2', {}).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          // The error message should be the backend message
          expect(error.message).to.equal(backendMessage)
          // And it should also be in response.data.message for error handlers
          if (!error.response) {
            throw new Error('Expected error.response to be defined')
          }
          expect(error.response.data.message).to.equal(backendMessage)
        },
      )
    })
  })
})

describe('fetchAdapter - 401 Bard metric logging', () => {
  let fetchStub: ReturnType<typeof cy.stub>
  let captureEventStub: Cypress.Agent<sinon.SinonStub> | sinon.SinonStub
  let signOutStub: Cypress.Agent<sinon.SinonStub> | sinon.SinonStub

  const mockExpTime = Math.floor(Date.now() / 1000) + 3600 // 1h from now

  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(Config, 'getApiUrl').resolves('https://consent.example.org')
    captureEventStub = cy.stub(Metrics, 'captureEvent').resolves()
    signOutStub = cy.stub(Auth, 'signOut').resolves()
    cy.stub(Storage, 'getOidcUser').returns({
      profile: { exp: mockExpTime, sub: '', iss: '', aud: '', iat: 0 },
    })

    // Suppress navigation errors from redirectOnLogout setting window.location.href
    cy.on('uncaught:exception', () => false)

    cy.window().then((win) => {
      fetchStub = cy.stub(win, 'fetch')
    })
  })

  afterEach(() => {
    cy.window().then(() => {
      if (fetchStub) fetchStub.restore()
    })
  })

  it('should fire Bard metric with session details on 401 from DUOS API', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet('https://consent.example.org/api/something').then(
        () => { throw new Error('Should have thrown') },
        () => {
          expect(captureEventStub.calledOnce).to.equal(true)
          const [event, details] = captureEventStub.firstCall.args
          expect(event).to.equal(eventList.userAutoLogout401)
          expect(details).to.have.property('expires_on', mockExpTime)
          expect(details).to.have.property('current_time').that.is.a('number')
          expect(details).to.have.property('time_until_expires').that.is.a('number')
          expect(details).to.have.property('endpoint_url', 'https://consent.example.org/api/something')
        },
      )
    })
  })

  it('should NOT fire Bard metric on 401 for GET /api/user/me', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet('https://consent.example.org/api/user/me').then(
        () => { throw new Error('Should have thrown') },
        () => {
          expect(captureEventStub.called).to.equal(false)
          expect(signOutStub.called).to.equal(false)
        },
      )
    })
  })

  it('should NOT fire Bard metric or redirect on non-401 errors', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'Server error' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet('https://consent.example.org/api/something').then(
        () => { throw new Error('Should have thrown') },
        () => {
          expect(captureEventStub.called).to.equal(false)
          expect(signOutStub.called).to.equal(false)
        },
      )
    })
  })

  it('should include null expires_on when OIDC user has no exp', () => {
    // Override the Storage stub for this test
    (Storage.getOidcUser as ReturnType<typeof cy.stub>).restore()
    cy.stub(Storage, 'getOidcUser').returns({
      profile: { sub: '', iss: '', aud: '', iat: 0 },
    })

    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet('https://consent.example.org/api/something').then(
        () => { throw new Error('Should have thrown') },
        () => {
          expect(captureEventStub.calledOnce).to.equal(true)
          const [, details] = captureEventStub.firstCall.args
          expect(details).to.have.property('expires_on', null)
          expect(details).to.have.property('time_until_expires', null)
        },
      )
    })
  })

  it('should NOT fire Bard metric on 401 from non-DUOS API', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchGet('https://other-api.example.org/api/resource').then(
        () => { throw new Error('Should have thrown') },
        () => {
          expect(captureEventStub.called).to.equal(false)
          expect(signOutStub.called).to.equal(false)
        },
      )
    })
  })
})
