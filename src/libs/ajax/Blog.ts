import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart, fetchPost, fetchPut, Params } from 'src/libs/ajax/fetchAdapter'
import { BlogMock } from 'src/libs/ajax/blogMock'
import {
  BlogCategory,
  BlogImage,
  BlogListPage,
  BlogPost,
  BlogPostRequest,
  BlogPostSummary,
  BlogStatus,
  PublicBlogQuery,
} from 'src/types/blog'

export interface AdminBlogFilters {
  category?: BlogCategory
  status?: BlogStatus
}

export interface BlogClient {
  list: (filters?: AdminBlogFilters) => Promise<BlogPostSummary[]>
  getById: (id: number) => Promise<BlogPost>
  create: (post: BlogPostRequest) => Promise<BlogPost>
  update: (id: number, post: BlogPostRequest) => Promise<BlogPost>
  delete: (id: number) => Promise<void>
  uploadImage: (file: File) => Promise<BlogImage>
  listPublished: (query?: PublicBlogQuery) => Promise<BlogListPage>
  getPublished: (category: BlogCategory, slug: string) => Promise<BlogPost>
  getImageUrlResolver: () => Promise<(imageId: string) => string | undefined>
}

const toParams = (values: Record<string, string | number | undefined>): Params =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Params

// BFF NOTE: the public reads and the image URL stay on the absolute Consent URL, like /feature
// (see FeatureFlag.ts) — they are unauthenticated, and the session-guarded BFF proxy returns 401
// for sessionless requests. Hence getUpstreamApiUrl for those, getApiUrl for admin calls.
const BlogApi: BlogClient = {
  /**
   * Retrieve every non-deleted post, including drafts and scheduled posts. Admin only.
   * @param filters Optional category and status filters
   * @returns Promise resolving to the matching posts, without their content
   */
  list: async (filters = {}) => {
    const url = `${await Config.getApiUrl()}/api/blog`
    const res = await fetchGet<BlogPostSummary[]>(url, { ...Config.authOpts(), params: toParams({ ...filters }) })
    return res.data
  },

  /**
   * Retrieve one post by id, whatever its status. Admin only.
   * @param id The numeric blog post id
   * @returns Promise resolving to the full post
   */
  getById: async (id) => {
    const url = `${await Config.getApiUrl()}/api/blog/${id}`
    const res = await fetchGet<BlogPost>(url, Config.authOpts())
    return res.data
  },

  /**
   * Create a post. Admin only.
   * @param post The post to create
   * @returns Promise resolving to the created post; rejects with 409 if the slug is taken
   */
  create: async (post) => {
    const url = `${await Config.getApiUrl()}/api/blog`
    const res = await fetchPost<BlogPost, BlogPostRequest>(url, post, Config.authOpts())
    return res.data
  },

  /**
   * Replace a post. Admin only.
   * @param id The numeric blog post id
   * @param post The replacement post, carrying the `updateDate` the editor loaded
   * @returns Promise resolving to the updated post; rejects with 409 if the slug is taken or the
   * post changed since it was loaded
   */
  update: async (id, post) => {
    const url = `${await Config.getApiUrl()}/api/blog/${id}`
    const res = await fetchPut<BlogPost, BlogPostRequest>(url, post, Config.authOpts())
    return res.data
  },

  /**
   * Soft-delete a post. Admin only.
   * @param id The numeric blog post id
   */
  delete: async (id) => {
    const url = `${await Config.getApiUrl()}/api/blog/${id}`
    await fetchDelete<void>(url, Config.authOpts())
  },

  /**
   * Upload a cover or inline image (PNG, JPEG, GIF or WebP, up to 5 MB). Admin only.
   * @param file The image file
   * @returns Promise resolving to the stored image's metadata
   */
  uploadImage: async (file) => {
    const url = `${await Config.getApiUrl()}/api/blog/images`
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetchMultipart<BlogImage>(url, formData, Config.authOpts())
    return res.data
  },

  /**
   * Retrieve a page of publicly visible posts, featured first then newest. No sign-in required.
   * @param query Optional category, tag and paging
   * @returns Promise resolving to the page of posts and the total match count
   */
  listPublished: async (query = {}) => {
    const url = `${await Config.getUpstreamApiUrl()}/blog`
    const res = await fetchGet<BlogListPage>(url, { ...Config.authOpts(), params: toParams({ ...query }) })
    return res.data
  },

  /**
   * Retrieve one publicly visible post. Slugs are unique within a category, so both identify it.
   * No sign-in required.
   * @param category The post's category
   * @param slug The post's slug
   * @returns Promise resolving to the post; rejects with 404 for drafts, archived and scheduled posts
   */
  getPublished: async (category, slug) => {
    const url = `${await Config.getUpstreamApiUrl()}/blog/posts/${category}/${encodeURIComponent(slug)}`
    const res = await fetchGet<BlogPost>(url, Config.authOpts())
    return res.data
  },

  /**
   * Build a synchronous image-id-to-URL resolver, for renderers that cannot await.
   * @returns Promise resolving to the resolver
   */
  getImageUrlResolver: async () => {
    const base = await Config.getUpstreamApiUrl()
    return (imageId: string) => `${base}/blog/images/${encodeURIComponent(imageId)}`
  },
}

// TEMPORARY (DT-4234): remove with blogMock.ts once consent ships the blog endpoints.
const isMockEnabled = async (): Promise<boolean> => {
  const config = await Config.getConfig()
  return config.blogMock === true && config.env !== 'prod'
}

const client = async (): Promise<BlogClient> => (await isMockEnabled()) ? BlogMock : BlogApi

export const Blog: BlogClient = {
  list: async filters => (await client()).list(filters),
  getById: async id => (await client()).getById(id),
  create: async post => (await client()).create(post),
  update: async (id, post) => (await client()).update(id, post),
  delete: async id => (await client()).delete(id),
  uploadImage: async file => (await client()).uploadImage(file),
  listPublished: async query => (await client()).listPublished(query),
  getPublished: async (category, slug) => (await client()).getPublished(category, slug),
  getImageUrlResolver: async () => (await client()).getImageUrlResolver(),
}
