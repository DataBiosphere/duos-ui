import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart, fetchPost, fetchPut } from 'src/libs/ajax/fetchAdapter'
import { Blog } from 'src/libs/ajax/Blog'
import { BlogMock } from 'src/libs/ajax/blogMock'
import type { BlogPost, BlogPostRequest } from 'src/types/blog'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    getUpstreamApiUrl: vi.fn(),
    getConfig: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchPut: vi.fn(),
  fetchDelete: vi.fn(),
  fetchMultipart: vi.fn(),
}))

vi.mock('src/libs/ajax/blogMock', () => ({
  BlogMock: { list: vi.fn() },
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const buildPost = (): BlogPost => ({
  blogPostId: 3,
  slug: 'hello',
  title: 'Hello',
  contentMd: 'Body',
  category: 'BLOG_POST',
  tags: [],
  status: 'DRAFT',
  featured: false,
  createDate: new Date('2026-04-30T12:00:00.000Z').getTime(),
})

const request: BlogPostRequest = {
  slug: 'hello',
  title: 'Hello',
  contentMd: 'Body',
  category: 'BLOG_POST',
  tags: [],
  status: 'DRAFT',
  featured: false,
}

describe('Blog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('/duos-api')
    vi.mocked(Config.getUpstreamApiUrl).mockResolvedValue('https://consent.example.org')
    vi.mocked(Config.getConfig).mockResolvedValue({ env: 'dev' } as Awaited<ReturnType<typeof Config.getConfig>>)
    vi.mocked(Config.authOpts).mockReturnValue(headers)
  })

  it('lists admin posts through the proxied API with only the filters given', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: [] })

    await Blog.list({ status: 'DRAFT' })

    expect(fetchGet).toHaveBeenCalledWith('/duos-api/api/blog', { ...headers, params: { status: 'DRAFT' } })
  })

  it('creates, updates and deletes through the admin endpoints', async () => {
    vi.mocked(fetchPost).mockResolvedValue({ data: buildPost() })
    vi.mocked(fetchPut).mockResolvedValue({ data: buildPost() })
    vi.mocked(fetchDelete).mockResolvedValue({ data: undefined })

    await Blog.create(request)
    await Blog.update(3, { ...request, updateDate: 42 })
    await Blog.delete(3)

    expect(fetchPost).toHaveBeenCalledWith('/duos-api/api/blog', request, headers)
    expect(fetchPut).toHaveBeenCalledWith('/duos-api/api/blog/3', { ...request, updateDate: 42 }, headers)
    expect(fetchDelete).toHaveBeenCalledWith('/duos-api/api/blog/3', headers)
  })

  it('uploads images as multipart form data', async () => {
    vi.mocked(fetchMultipart).mockResolvedValue({ data: { imageId: 'img-1', contentType: 'image/png', fileName: 'a.png', sizeBytes: 3 } })
    const file = new File(['abc'], 'a.png', { type: 'image/png' })

    const image = await Blog.uploadImage(file)

    expect(image.imageId).toBe('img-1')
    const [url, formData] = vi.mocked(fetchMultipart).mock.calls[0]
    expect(url).toBe('/duos-api/api/blog/images')
    expect(formData.get('file')).toBe(file)
  })

  it('reads published posts from the upstream Consent URL, bypassing the BFF proxy', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: { items: [], total: 0 } })

    await Blog.listPublished({ category: 'USER_GUIDE', page: 1, pageSize: 12 })
    await Blog.getPublished('USER_GUIDE', 'a slug')

    expect(fetchGet).toHaveBeenNthCalledWith(1, 'https://consent.example.org/blog', { ...headers, params: { category: 'USER_GUIDE', page: 1, pageSize: 12 } })
    expect(fetchGet).toHaveBeenNthCalledWith(2, 'https://consent.example.org/blog/posts/USER_GUIDE/a%20slug', headers)
  })

  it('resolves image ids to the public image endpoint', async () => {
    const resolve = await Blog.getImageUrlResolver()
    expect(resolve('img-1')).toBe('https://consent.example.org/blog/images/img-1')
  })

  describe('temporary mock switch', () => {
    it('uses the mock when blogMock is set outside prod', async () => {
      vi.mocked(Config.getConfig).mockResolvedValue({ env: 'dev', blogMock: true } as Awaited<ReturnType<typeof Config.getConfig>>)
      vi.mocked(BlogMock.list).mockResolvedValue([])

      await Blog.list()

      expect(BlogMock.list).toHaveBeenCalled()
      expect(fetchGet).not.toHaveBeenCalled()
    })

    it('never uses the mock in prod', async () => {
      vi.mocked(Config.getConfig).mockResolvedValue({ env: 'prod', blogMock: true } as Awaited<ReturnType<typeof Config.getConfig>>)
      vi.mocked(fetchGet).mockResolvedValue({ data: [] })

      await Blog.list()

      expect(BlogMock.list).not.toHaveBeenCalled()
      expect(fetchGet).toHaveBeenCalled()
    })
  })
})
