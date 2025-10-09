function buildUrlWithParams(url, params = {}) {
  const query = new URLSearchParams(params).toString()
  return query ? `${url}?${query}` : url
}

async function handleResponse(res, url, responseType) {
  if (!res.ok) {
    if (res.status >= 500) { // Alternative for interceptor's reportError
      reportError(url, res.status)
    }
    throw new Error(`Request to ${url} failed with status ${res.status}`)
  }
  if (responseType === 'blob') {
    return { data: await res.blob() }
  }
  // Try to parse JSON, fallback to text if not JSON
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return { data: await res.json() }
  }
  return { data: await res.text() }
}

export async function fetchGet(url, config = {}) {
  const { params = {}, headers = {}, credentials, responseType } = config
  const fullUrl = buildUrlWithParams(url, params)
  const res = await fetch(fullUrl, {
    method: 'GET',
    headers,
    credentials,
  })
  return handleResponse(res, fullUrl, responseType)
}

export async function fetchPost(url, data, config = {}) {
  const { headers = {}, credentials } = config
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
    credentials,
  })
  return handleResponse(res, url)
}

export async function fetchPut(url, data, config = {}) {
  const { headers = {}, credentials } = config
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
    credentials,
  })
  return handleResponse(res, url)
}

export async function fetchPatch(url, data, config = {}) {
  const { headers = {}, credentials } = config
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
    credentials,
  })
  return handleResponse(res, url)
}

export async function fetchDelete(url, config = {}) {
  const { data, headers = {}, credentials } = config
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: data ? JSON.stringify(data) : undefined,
    credentials,
  })
  return handleResponse(res, url)
}

export async function fetchMultipart(url, formData, config = {}, method = 'POST') {
  const { headers = {}, credentials } = config
  const res = await fetch(url, {
    method,
    headers, // Do not set Content-Type for FormData
    body: formData,
    credentials,
  })
  return handleResponse(res, url)
}
