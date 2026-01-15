import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchPatch,
  fetchDelete,
  fetchMultipart,
  type Params,
} from 'src/libs/ajax/fetchAdapter'

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

  it('should handle error response with message field', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response(JSON.stringify({ message: 'File too large' }), {
          status: 413,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart('/api/upload', formData, {}, 'POST', true).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.equal('File too large')
        },
      )
    })
  })

  it('should handle error response without message field', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response(JSON.stringify({ error: 'Bad request' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      )

      fetchMultipart('/api/upload', formData, {}, 'POST', true).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.include('Request failed with status 400')
        },
      )
    })
  })

  it('should handle non-JSON error responses', () => {
    cy.window().then((win) => {
      const formData = new win.FormData()
      fetchStub.resolves(
        new win.Response('Server error', {
          status: 500,
          headers: { 'content-type': 'text/html' },
        }),
      )

      fetchMultipart('/api/upload', formData, {}, 'POST', true).then(
        () => {
          throw new Error('Should have thrown')
        },
        (error) => {
          expect(error.message).to.include('Request failed with status 500')
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
    it('fetchPost - should throw error with response.data structure on 400', () => {
      cy.window().then((win) => {
        const errorMessage = 'Validation failed: Email is required'
        const errorBody = {
          code: 400,
          message: errorMessage,
        }

        fetchStub.resolves(
          new win.Response(JSON.stringify(errorBody), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }),
        )

        fetchPost('/api/dar/v2', { data: 'test' }).then(
          () => {
            throw new Error('Should have thrown')
          },
          (error) => {
            // Verify error structure matches what handleResponse creates
            expect(error).to.have.property('message', errorMessage)
            expect(error).to.have.property('response')
            expect(error.response).to.have.property('status', 400)
            expect(error.response).to.have.property('data')
            expect(error.response.data).to.deep.equal(errorBody)
          },
        )
      })
    })

    it('fetchPost - should throw error with response.data structure on 500', () => {
      cy.window().then((win) => {
        const errorMessage = 'Internal server error'
        const errorBody = {
          message: errorMessage,
          code: 500,
        }

        fetchStub.resolves(
          new win.Response(JSON.stringify(errorBody), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
        )

        fetchGet('/api/data').then(
          () => {
            throw new Error('Should have thrown')
          },
          (error) => {
            expect(error).to.have.property('message', errorMessage)
            expect(error).to.have.property('response')
            expect(error.response).to.have.property('status', 500)
            expect(error.response.data).to.have.property('message', errorMessage)
          },
        )
      })
    })

    it('should handle 400 error with non-JSON response', () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response('Bad Request', {
            status: 400,
            headers: { 'content-type': 'text/html' },
          }),
        )

        fetchPost('/api/test', { data: 'test' }).then(
          () => {
            throw new Error('Should have thrown')
          },
          (error) => {
            expect(error).to.have.property('message', 'Request failed with status 400')
            expect(error).to.have.property('response')
            expect(error.response).to.have.property('status', 400)
            expect(error.response).to.have.property('data')
            expect(error.response.data).to.deep.equal({})
          },
        )
      })
    })

    it('should preserve error message from backend', () => {
      cy.window().then((win) => {
        const backendMessage = 'All listed personnel must share the same institutional affiliation'
        const errorBody = {
          code: 400,
          message: backendMessage,
        }

        fetchStub.resolves(
          new win.Response(JSON.stringify(errorBody), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }),
        )

        fetchPost('/api/dar/v2', {}).then(
          () => {
            throw new Error('Should have thrown')
          },
          (error) => {
            // The error message should be the backend message
            expect(error.message).to.equal(backendMessage)
            // And it should also be in response.data.message for error handlers
            expect(error.response.data.message).to.equal(backendMessage)
          },
        )
      })
    })
  })
})
