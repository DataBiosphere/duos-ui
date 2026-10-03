/**
 * TEMPORARY (DT-4234): a browser-local stand-in for consent's blog endpoints, so the blog UI can be
 * reviewed before the backend ships. Enabled only by `"blogMock": true` in a non-prod
 * `public/config.json` (see Blog.ts). Data lives in this browser's localStorage. Delete this file
 * and the switch in Blog.ts once consent serves /api/blog and /blog.
 *
 * It follows the consent design (docs/plans/duos-blog-migration-and-broadcast-email-plan.md):
 * slugs unique within a category among non-deleted posts, 409 on a stale `updateDate`, publish date set on first
 * publish, scheduled posts hidden, soft delete, and the image type/size limits.
 */
import type { BlogClient } from 'src/libs/ajax/Blog'
import { Storage } from 'src/libs/storage'
import { BLOG_CATEGORY_LABELS, BlogImage, BlogPost, BlogPostRequest, BlogPostSummary } from 'src/types/blog'
import { isPubliclyVisible, SLUG_PATTERN } from 'src/utils/BlogUtils'

const POSTS_KEY = 'duosBlogMock.posts'
const IMAGES_KEY = 'duosBlogMock.images'
const LATENCY_MS = 250
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

interface StoredPost extends BlogPost {
  deleted: boolean
}

interface StoredImage extends BlogImage {
  dataUrl: string
}

const DAY = 24 * 60 * 60 * 1000

const SEED_TIME = Date.UTC(2026, 8, 1, 15)

const seedPost = (blogPostId: number, fields: Partial<StoredPost> & Pick<StoredPost, 'slug' | 'title' | 'category' | 'status'>): StoredPost => ({
  blogPostId,
  excerpt: '',
  tags: [],
  featured: false,
  contentMd: '',
  createDate: SEED_TIME,
  updateDate: SEED_TIME,
  deleted: false,
  ...fields,
})

const SAMPLE_BODY = `DUOS now supports **sample content** for local review of the articles feature.

## What's new

- Tables, task lists and ~~strikethrough~~ via GitHub-flavored Markdown
- Inline images uploaded through the editor
- [Links to other DUOS pages](/articles/user-guides/getting-started-for-researchers)

| Feature | Status |
| --- | --- |
| Drafts | Done |
| Scheduling | Done |

> Mock data: stored only in this browser.
`

const seedPosts = (): StoredPost[] => [
  seedPost(1, {
    slug: 'welcome-to-the-duos-blog',
    title: 'Welcome to the DUOS Blog',
    excerpt: 'News, guides and announcements now live inside DUOS.',
    category: 'BLOG_POST',
    status: 'PUBLISHED',
    featured: true,
    tags: ['announcements'],
    authorDisplayName: 'DUOS Team',
    publishDate: SEED_TIME,
    contentMd: SAMPLE_BODY,
  }),
  seedPost(2, {
    slug: 'getting-started-for-researchers',
    title: 'Getting Started for Researchers',
    excerpt: 'How to request a library card and submit your first data access request.',
    category: 'USER_GUIDE',
    status: 'PUBLISHED',
    parentSlug: 'help',
    tags: ['researchers', 'library-cards'],
    authorDisplayName: 'DUOS Team',
    publishDate: SEED_TIME - 30 * DAY,
    contentMd: '## Before you start\n\n1. Sign in to DUOS.\n2. Ask your Signing Official for a library card.\n3. Search the Data Library.\n',
  }),
  seedPost(3, {
    slug: 'progress-reports-are-here',
    title: 'Progress Reports Are Here',
    excerpt: 'Researchers can now submit progress reports from the Researcher Console.',
    category: 'FEATURE_ANNOUNCEMENT',
    status: 'PUBLISHED',
    tags: ['researchers'],
    publishDate: SEED_TIME - 10 * DAY,
    contentMd: 'Progress reports can be submitted from the **Researcher Console**.\n',
  }),
  seedPost(4, {
    slug: 'draft-policy-brief',
    title: 'Draft: Data Use Policy Brief',
    excerpt: 'An unpublished policy brief, visible only to admins.',
    category: 'POLICY_BRIEF',
    status: 'DRAFT',
    tags: ['policy'],
    contentMd: 'Work in progress.\n',
  }),
  seedPost(5, {
    slug: 'duos-in-the-news-next-month',
    title: 'DUOS in the News (Scheduled)',
    excerpt: 'A post scheduled to appear in the future.',
    category: 'IN_THE_NEWS',
    status: 'PUBLISHED',
    publishDate: Date.now() + 30 * DAY,
    contentMd: 'This post is scheduled.\n',
  }),
]

const read = <T>(key: string, fallback: () => T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      return JSON.parse(raw) as T
    }
  }
  catch {
    // Fall through to the seed — a corrupt mock store just starts over.
  }
  const seeded = fallback()
  write(key, seeded)
  return seeded
}

const write = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

const readPosts = (): StoredPost[] => read(POSTS_KEY, seedPosts)
const readImages = (): Record<string, StoredImage> => read(IMAGES_KEY, () => ({}))

/** Rejects the way fetchAdapter does, so callers' status handling is exercised for real. */
const httpError = (status: number, message: string): Error => {
  const error = new Error(message) as Error & { response: { status: number, data: { message: string, code: number } } }
  error.response = { status, data: { message, code: status } }
  return error
}

const respond = <T>(produce: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(produce())
      }
      catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }, LATENCY_MS)
  })

const toSummary = ({ contentMd: _contentMd, legacyUrl: _legacyUrl, deleted: _deleted, ...summary }: StoredPost): BlogPostSummary => summary

const toPost = ({ deleted: _deleted, ...post }: StoredPost): BlogPost => post

const findActive = (posts: StoredPost[], id: number): StoredPost => {
  const post = posts.find(p => p.blogPostId === id && !p.deleted)
  if (!post) {
    throw httpError(404, `Blog post ${id} not found`)
  }
  return post
}

const validate = (request: BlogPostRequest, posts: StoredPost[], id?: number): void => {
  if (request.title.trim().length === 0) {
    throw httpError(400, 'Title is required')
  }
  if (!SLUG_PATTERN.test(request.slug)) {
    throw httpError(400, 'Slug must be lowercase letters, numbers and single hyphens')
  }
  if (posts.some(p => !p.deleted && p.category === request.category && p.slug === request.slug && p.blogPostId !== id)) {
    throw httpError(409, `The slug "${request.slug}" is already used by another ${BLOG_CATEGORY_LABELS[request.category]}`)
  }
}

const currentAuthor = (): string | undefined => {
  try {
    return Storage.getCurrentUser().displayName || undefined
  }
  catch {
    return undefined
  }
}

const fromRequest = (request: BlogPostRequest, existing?: StoredPost): Omit<StoredPost, 'blogPostId' | 'createDate'> => {
  const now = Date.now()
  const { updateDate: _clientUpdateDate, ...fields } = request
  return {
    ...fields,
    authorDisplayName: request.authorDisplayName || existing?.authorDisplayName || currentAuthor(),
    // consent stamps the publish date on first publish when the admin left it empty.
    publishDate: request.publishDate ?? (request.status === 'PUBLISHED' ? now : undefined),
    legacyUrl: existing?.legacyUrl,
    updateDate: now,
    deleted: false,
  }
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image'))
    reader.readAsDataURL(file)
  })

export const BlogMock: BlogClient = {
  list: filters => respond(() =>
    readPosts()
      .filter(p => !p.deleted)
      .filter(p => !filters?.category || p.category === filters.category)
      .filter(p => !filters?.status || p.status === filters.status)
      .map(toSummary)),

  getById: id => respond(() => toPost(findActive(readPosts(), id))),

  create: request => respond(() => {
    const posts = readPosts()
    validate(request, posts)
    const created: StoredPost = {
      ...fromRequest(request),
      blogPostId: Math.max(0, ...posts.map(p => p.blogPostId)) + 1,
      createDate: Date.now(),
    }
    write(POSTS_KEY, [...posts, created])
    return toPost(created)
  }),

  update: (id, request) => respond(() => {
    const posts = readPosts()
    const existing = findActive(posts, id)
    if (request.updateDate !== undefined && existing.updateDate !== undefined && request.updateDate !== existing.updateDate) {
      throw httpError(409, 'This post was changed by someone else after you opened it')
    }
    validate(request, posts, id)
    const updated: StoredPost = { ...existing, ...fromRequest(request, existing) }
    write(POSTS_KEY, posts.map(p => (p.blogPostId === id ? updated : p)))
    return toPost(updated)
  }),

  delete: id => respond(() => {
    const posts = readPosts()
    findActive(posts, id)
    write(POSTS_KEY, posts.map(p => (p.blogPostId === id ? { ...p, deleted: true } : p)))
  }),

  uploadImage: async (file) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw httpError(400, 'Images must be PNG, JPEG, GIF or WebP')
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw httpError(400, 'Images must be 5 MB or smaller')
    }
    const dataUrl = await readFileAsDataUrl(file)
    return respond(() => {
      const image: StoredImage = {
        imageId: crypto.randomUUID(),
        contentType: file.type,
        fileName: file.name,
        sizeBytes: file.size,
        dataUrl,
      }
      try {
        write(IMAGES_KEY, { ...readImages(), [image.imageId]: image })
      }
      catch {
        throw httpError(507, 'The mock image store is full — clear duosBlogMock.images from localStorage')
      }
      const { dataUrl: _dataUrl, ...metadata } = image
      return metadata
    })
  },

  listPublished: (query = {}) => respond(() => {
    const now = Date.now()
    const visible = readPosts()
      .filter(p => !p.deleted && isPubliclyVisible(p, now))
      .filter(p => !query.category || p.category === query.category)
      .filter(p => !query.tag || p.tags.includes(query.tag))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.publishDate ?? 0) - (a.publishDate ?? 0))
    const page = query.page ?? 0
    const pageSize = query.pageSize ?? 12
    return {
      items: visible.slice(page * pageSize, (page + 1) * pageSize).map(toSummary),
      total: visible.length,
    }
  }),

  getPublished: (category, slug) => respond(() => {
    const post = readPosts().find(p => !p.deleted && p.category === category && p.slug === slug && isPubliclyVisible(p))
    if (!post) {
      throw httpError(404, 'Blog post not found')
    }
    return toPost(post)
  }),

  // Reads per call rather than snapshotting, so an image uploaded mid-edit resolves straight away.
  getImageUrlResolver: () => Promise.resolve((imageId: string) => readImages()[imageId]?.dataUrl),
}
