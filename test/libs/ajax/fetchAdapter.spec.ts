import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchPatch,
  fetchDelete,
  fetchMultipart,
  retryFetchPost,
  type Params,
} from 'src/libs/ajax/fetchAdapter'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { Config } from 'src/libs/config'
import { redirectOnLogout } from 'src/libs/auth/auth'
import type { OidcUser } from 'src/libs/auth/oidcBroker'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import eventList from 'src/libs/events'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    getBardApiUrl: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Metrics', () => ({
  Metrics: {
    captureEvent: vi.fn(),
  },
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    getOidcUser: vi.fn(),
  },
}))

vi.mock('src/libs/auth/auth', () => ({
  redirectOnLogout: vi.fn(),
}))

vi.mock('src/libs/ErrorReporter', () => ({
  ErrorReporter: {
    report: vi.fn(),
  },
}))

interface StubOptions {
  method?: string
  headers?: Record<string, string>
  credentials?: string
  body?: string | FormData
}

describe('fetchAdapter - Fetch methods', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(Config.getBardApiUrl).mockResolvedValue('https://bard.example.org')
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://consent.example.org')
    vi.mocked(ErrorReporter.report).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetchGet - should make GET request with JSON response', async () => {
    const mockResponse = { id: 1, name: 'Test' }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchGet<typeof mockResponse>('/api/test')
    expect(result.data).toEqual(mockResponse)
  })

  it('fetchGet - should handle query parameters', async () => {
    const mockResponse = { results: [] }
    const params: Params = { page: 1, limit: 10, active: true }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchGet<typeof mockResponse>('/api/items', { params })
    expect(result.data).toEqual(mockResponse)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('page=1')
    expect(url).toContain('limit=10')
    expect(url).toContain('active=true')
  })

  it('fetchGet - should return blob when responseType is blob', async () => {
    const mockBlob = new Blob(['test data'], { type: 'text/plain' })
    fetchMock.mockResolvedValue(new Response(mockBlob, { status: 200 }))

    const result = await fetchGet<Blob>('/api/file', { responseType: 'blob' })
    expect(result.data?.constructor?.name).toBe('Blob')
    expect(result.data.type).toContain('text/plain')
  })

  it('fetchGet - should return text when content-type is text/plain', async () => {
    fetchMock.mockResolvedValue(
      new Response('Plain text response', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    )

    const result = await fetchGet<string>('/api/text')
    expect(result.data).toBe('Plain text response')
  })

  it('fetchGet - should include credentials when specified', async () => {
    const mockResponse = { authenticated: true }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet<typeof mockResponse>('/api/secure', { credentials: 'include' })
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.credentials).toBe('include')
  })

  it('fetchPost - should send data as JSON', async () => {
    const requestData = { name: 'Item', value: 42 }
    const mockResponse = { id: 1, ...requestData }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchPost<typeof mockResponse>('/api/items', requestData)
    expect(result.data).toEqual(mockResponse)
    const [url, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(url).toBe('/api/items')
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify(requestData))
  })

  it('fetchPut - should update resource with data', async () => {
    const requestData = { name: 'Updated' }
    const mockResponse = { id: 1, ...requestData }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchPut<typeof mockResponse>('/api/items/1', requestData)
    expect(result.data).toEqual(mockResponse)
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.method).toBe('PUT')
  })

  it('fetchPatch - should partially update resource', async () => {
    const requestData = { status: 'active' }
    const mockResponse = { id: 1, name: 'Item', ...requestData }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchPatch<typeof mockResponse>('/api/items/1', requestData)
    expect(result.data).toEqual(mockResponse)
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.method).toBe('PATCH')
  })

  it('fetchDelete - should delete resource', async () => {
    const mockResponse = { success: true }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchDelete('/api/items/1')
    expect(result.data).toEqual(mockResponse)
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.method).toBe('DELETE')
  })

  it('fetchMultipart - should POST FormData without Content-Type header', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['content']), 'test.txt')

    const mockResponse = { id: 1, filename: 'test.txt' }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchMultipart<typeof mockResponse>('/api/upload', formData)
    expect(result.data).toEqual(mockResponse)
    const [url, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(url).toBe('/api/upload')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.headers?.['Content-Type']).toBeUndefined()
  })

  it('fetchMultipart - should support PUT method', async () => {
    const formData = new FormData()
    const mockResponse = { success: true }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchMultipart<typeof mockResponse>('/api/upload/1', formData, {}, 'PUT')
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.method).toBe('PUT')
  })

  it('fetchMultipart - should include params in URL', async () => {
    const formData = new FormData()
    const mockResponse = { success: true }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchMultipart('/api/upload', formData, { params: { tag: 'important' } })
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('tag=important')
  })

  it('should merge custom headers with defaults', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchPost('/api/test', { key: 'value' }, { headers: { 'X-Custom': 'header' } })
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.headers?.['Content-Type']).toBe('application/json')
    expect(options.headers?.['X-Custom']).toBe('header')
  })

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network error'))

    const error = await fetchGet('/api/test').catch(e => e)
    expect(error.message).toContain('Network error on request to')
    expect(error.message).toContain('TypeError: Network error')
    expect(error.message).toContain('duos@duos.org')
  })

  it('should handle AbortError as a DOMException network error', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError')
    fetchMock.mockRejectedValue(abortError)

    const error = await fetchGet('/api/test').catch(e => e)
    expect(error.message).toContain('Network error on request to')
    expect(error.message).toContain('AbortError: The user aborted a request.')
    expect(error.message).toContain('duos@duos.org')
  })

  it('should handle DOMException (e.g. NotAllowedError) as a network error', async () => {
    const notAllowedError = new DOMException('The operation is not allowed.', 'NotAllowedError')
    fetchMock.mockRejectedValue(notAllowedError)

    const error = await fetchGet('/api/test').catch(e => e)
    expect(error.message).toContain('Network error on request to')
    expect(error.message).toContain('NotAllowedError: The operation is not allowed.')
    expect(error.message).toContain('duos@duos.org')
  })

  it('should include help desk message for unknown thrown errors', async () => {
    fetchMock.mockRejectedValue({ message: 'Something unexpected', toString: () => 'Something unexpected' })

    const error = await fetchGet('/api/test').catch(e => e)
    expect(error.message).toContain('duos@duos.org')
  })

  it('fetchMultipart - should report network error (not 502) on network-level failure', async () => {
    const formData = new FormData()
    fetchMock.mockRejectedValue(new TypeError('Network error'))

    const error = await fetchMultipart('/api/progress_report/123', formData).catch(e => e)
    expect(error.message).toContain('Network error on request to')
    expect(error.message).toContain('TypeError: Network error')
    expect(error.message).toContain('duos@duos.org')
  })

  it('fetchMultipart - should use backend error message when provided', async () => {
    const formData = new FormData()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'File too large' }), {
        status: 413,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const error = await fetchMultipart('/api/upload', formData).catch(e => e)
    expect(error.message).toBe('File too large')
  })

  it('fetchMultipart - should fall back to help desk message when no message field in error body', async () => {
    const formData = new FormData()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const error = await fetchMultipart('/api/upload', formData).catch(e => e)
    expect(error.message).toContain('400')
    expect(error.message).toContain('duos@duos.org')
  })

  it('fetchMultipart - should fall back to help desk message for non-JSON error responses', async () => {
    const formData = new FormData()
    fetchMock.mockResolvedValue(
      new Response('Server error', {
        status: 500,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const error = await fetchMultipart('/api/upload', formData).catch(e => e)
    expect(error.message).toContain('500')
    expect(error.message).toContain('duos@duos.org')
  })

  it('fetchMultipart - should always throw errors regardless of method', async () => {
    const formData = new FormData()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Missing library card' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const error = await fetchMultipart('/api/progress_report/123', formData, {}, 'POST').catch(e => e)
    expect(error.message).toBe('Missing library card')
  })

  it('should encode URL parameters correctly', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const params: Params = { search: 'test value', page: 1, limit: 50, active: true }

    await fetchGet('/api/items', { params })
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('search=test+value')
    expect(url).toContain('page=1')
    expect(url).toContain('limit=50')
    expect(url).toContain('active=true')
  })

  it('should not append query string when params is empty', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet('/api/items', { params: {} })
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/items')
  })

  it('should serialize objects to JSON', async () => {
    const data = { name: 'test', nested: { value: 123 } }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchPost('/api/test', data)
    const [, options] = fetchMock.mock.calls[0] as [string, StubOptions]
    expect(options.body).toBe(JSON.stringify(data))
  })

  it('should handle responseType text', async () => {
    fetchMock.mockResolvedValue(
      new Response('Hello', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    )

    const result = await fetchGet<string>('/api/test', { responseType: 'text' })
    expect(result.data).toBe('Hello')
  })

  it('should handle responseType json explicitly', async () => {
    const mockResponse = { data: 'test' }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchGet<typeof mockResponse>('/api/test', { responseType: 'json' })
    expect(result.data).toEqual(mockResponse)
  })

  it('should default to json responseType', async () => {
    const mockResponse = { data: 'test' }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchGet<typeof mockResponse>('/api/test')
    expect(result.data).toEqual(mockResponse)
  })

  describe('Error handling with axios-like structure', () => {
    const verifyErrorStructure = (
      error: Error & { response?: { status: number, data: unknown } },
      expectedStatus: number,
      expectedMessage: string,
      expectedData?: unknown,
    ) => {
      expect(error.message).toBe(expectedMessage)
      expect(error).toHaveProperty('response')
      if (!error.response) {
        throw new Error('Expected error.response to be defined')
      }
      expect(error.response.status).toBe(expectedStatus)
      expect(error.response).toHaveProperty('data')
      if (expectedData !== undefined) {
        expect(error.response.data).toEqual(expectedData)
      }
    }

    it('fetchPost - should throw error with response.data structure on 400', async () => {
      const errorMessage = 'Validation failed: Email is required'
      const errorBody = { code: 400, message: errorMessage }

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(errorBody), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const error = await fetchPost('/api/dar/v2', { data: 'test' }).catch(e => e)
      verifyErrorStructure(error, 400, errorMessage, errorBody)
    })

    it('fetchPost - should throw error with response.data structure on 500', async () => {
      const errorMessage = 'Internal server error'
      const errorBody = { message: errorMessage, code: 500 }

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(errorBody), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const error = await fetchGet('/api/data').catch(e => e)
      verifyErrorStructure(error, 500, errorMessage)
      if (!error.response) {
        throw new Error('Expected error.response to be defined')
      }
      expect(error.response.data).toHaveProperty('message', errorMessage)
    })

    it('should handle 400 error with non-JSON response', async () => {
      fetchMock.mockResolvedValue(
        new Response('Bad Request', {
          status: 400,
          headers: { 'content-type': 'text/html' },
        }),
      )

      const error = await fetchPost('/api/test', { data: 'test' }).catch(e => e)
      verifyErrorStructure(error, 400, 'Request failed with status 400', {})
    })

    it('should preserve error message from backend', async () => {
      const backendMessage = 'All listed personnel must share the same institutional affiliation'
      const errorBody = { code: 400, message: backendMessage }

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(errorBody), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const error = await fetchPost('/api/dar/v2', {}).catch(e => e)
      expect(error.message).toBe(backendMessage)
      if (!error.response) {
        throw new Error('Expected error.response to be defined')
      }
      expect(error.response.data.message).toBe(backendMessage)
    })
  })

  describe('reportError recursion guard', () => {
    it('does not report failures of the Bard metrics API', async () => {
      fetchMock.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          headers: { 'content-type': 'text/html' },
        }),
      )

      await fetchPost('https://bard.example.org/api/event', { event: 'test' }).catch(() => {})
      // Give the fire-and-forget reportError chain time to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(ErrorReporter.report).not.toHaveBeenCalled()
    })

    it('reports failures of other endpoints', async () => {
      fetchMock.mockResolvedValue(
        new Response('Not Found', {
          status: 404,
          headers: { 'content-type': 'text/html' },
        }),
      )

      await fetchPost('/api/dar/v2', { data: 'test' }).catch(() => {})
      await vi.waitFor(() => expect(ErrorReporter.report).toHaveBeenCalledOnce())
    })
  })
})

describe('retryFetchPost', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(Config.getBardApiUrl).mockResolvedValue('https://bard.example.org')
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://consent.example.org')
    vi.mocked(ErrorReporter.report).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('succeeds on the first attempt without retrying', async () => {
    const mockResponse = { id: 1 }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await retryFetchPost<typeof mockResponse>('/api/test', { data: 'value' })
    expect(result.data).toEqual(mockResponse)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on 5xx and succeeds on the next attempt', async () => {
    const mockResponse = { id: 1 }
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const promise = retryFetchPost<typeof mockResponse>('/api/test', { data: 'value' })
    await vi.advanceTimersByTimeAsync(800) // past 500ms + max 200ms jitter

    const result = await promise
    expect(result.data).toEqual(mockResponse)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry on 4xx errors', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Bad Request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const error = await retryFetchPost('/api/test', { data: 'value' }).catch(e => e)
    expect(error.message).toBe('Bad Request')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on network errors', async () => {
    const mockResponse = { id: 1 }
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const promise = retryFetchPost<typeof mockResponse>('/api/test', { data: 'value' })
    await vi.advanceTimersByTimeAsync(800)

    const result = await promise
    expect(result.data).toEqual(mockResponse)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('exhausts all retries and throws after 4 total attempts', async () => {
    // mockImplementation creates a fresh Response per call — bodies can't be re-read
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Service Unavailable' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const promise = retryFetchPost('/api/test', { data: 'value' })
    const settled = promise.catch(e => e) // prevent unhandled rejection during timer advancement

    // Max total delay: 500+200 + 1000+200 + 2000+200 = 4100ms
    await vi.advanceTimersByTimeAsync(5000)

    const error = await settled
    expect(error.message).toBe('Service Unavailable')
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('uses increasing delays between retries', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // eliminate jitter: delays are exactly 500, 1000, 2000ms
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Service Unavailable' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const promise = retryFetchPost('/api/test', { data: 'value' })
    const settled = promise.catch(() => {}) // prevent unhandled rejection during timer advancement

    // First delay is 500ms — advancing 499ms must not trigger a retry yet
    await vi.advanceTimersByTimeAsync(499)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Crossing 500ms triggers the second attempt
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Second delay is 1000ms — advancing 999ms must not trigger a third attempt
    await vi.advanceTimersByTimeAsync(999)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Crossing 1000ms triggers the third attempt
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(3)

    // Third delay is 2000ms — advance past it and the final attempt
    await vi.advanceTimersByTimeAsync(2001)
    await settled
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('stops retrying when abort signal fires during sleep', async () => {
    const controller = new AbortController()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Service Unavailable' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const promise = retryFetchPost('/api/test', { data: 'value' }, { signal: controller.signal })
    // Pre-attach catch to prevent an unhandled rejection when the abort fires asynchronously
    const settled = promise.catch(() => {})

    // Abort at t=250ms, inside the 500ms first-retry sleep window
    setTimeout(() => controller.abort(), 250)
    await vi.advanceTimersByTimeAsync(300)

    await settled
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('fetchAdapter - 401 Bard metric logging', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  const mockExpTime = Math.floor(Date.now() / 1000) + 3600 // 1h from now

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://consent.example.org')
    vi.mocked(Config.getBardApiUrl).mockResolvedValue('https://bard.example.org')
    vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined)
    vi.mocked(redirectOnLogout).mockReturnValue(undefined)
    vi.mocked(Storage.getOidcUser).mockReturnValue({
      profile: { exp: mockExpTime, sub: '', iss: '', aud: '', iat: 0 },
    } as unknown as OidcUser)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fire Bard metric with session details on 401 from DUOS API', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet('https://consent.example.org/api/something').catch(() => {})

    expect(Metrics.captureEvent).toHaveBeenCalledOnce()
    const [event, details] = vi.mocked(Metrics.captureEvent).mock.calls[0]
    expect(event).toBe(eventList.userAutoLogout401)
    expect(details).toHaveProperty('expires_on', mockExpTime)
    expect(details).toHaveProperty('current_time')
    expect(typeof (details as Record<string, unknown>).current_time).toBe('number')
    expect(details).toHaveProperty('time_until_expires')
    expect(typeof (details as Record<string, unknown>).time_until_expires).toBe('number')
    expect(details).toHaveProperty('endpoint_url', 'https://consent.example.org/api/something')
  })

  it('should NOT fire Bard metric on 401 for GET /api/user/me', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet('https://consent.example.org/api/user/me').catch(() => {})

    expect(Metrics.captureEvent).not.toHaveBeenCalled()
    expect(redirectOnLogout).not.toHaveBeenCalled()
  })

  it('should NOT fire Bard metric or redirect on non-401 errors', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet('https://consent.example.org/api/something').catch(() => {})

    expect(Metrics.captureEvent).not.toHaveBeenCalled()
    expect(redirectOnLogout).not.toHaveBeenCalled()
  })

  it('should include null expires_on when OIDC user has no exp', async () => {
    vi.mocked(Storage.getOidcUser).mockReturnValue({
      profile: { sub: '', iss: '', aud: '', iat: 0 },
    } as unknown as OidcUser)

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet('https://consent.example.org/api/something').catch(() => {})

    expect(Metrics.captureEvent).toHaveBeenCalledOnce()
    const [, details] = vi.mocked(Metrics.captureEvent).mock.calls[0]
    expect(details).toHaveProperty('expires_on', null)
    expect(details).toHaveProperty('time_until_expires', null)
  })

  it('should NOT fire Bard metric on 401 from non-DUOS API', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await fetchGet('https://other-api.example.org/api/resource').catch(() => {})

    expect(Metrics.captureEvent).not.toHaveBeenCalled()
    expect(redirectOnLogout).not.toHaveBeenCalled()
  })
})
