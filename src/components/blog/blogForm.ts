import { Storage } from 'src/libs/storage'
import { BlogCategory, BlogPost, BlogPostRequest, BlogStatus } from 'src/types/blog'
import { MAX_EXCERPT_LENGTH, MAX_TITLE_LENGTH, SLUG_PATTERN } from 'src/utils/BlogUtils'

/** Editor form state for a blog post; text fields are strings so inputs stay controlled. */
export interface BlogForm {
  title: string
  slug: string
  excerpt: string
  contentMd: string
  category: BlogCategory
  tags: string[]
  publishDate?: number
  featured: boolean
  authorDisplayName: string
  coverImageId?: string
  coverImageAlt: string
  parentSlug: string
}

export type FormErrors = Partial<Record<'title' | 'slug' | 'excerpt' | 'contentMd' | 'parentSlug', string>>

export const emptyForm = (): BlogForm => ({
  title: '',
  slug: '',
  excerpt: '',
  contentMd: '',
  category: 'BLOG_POST',
  tags: [],
  featured: false,
  authorDisplayName: Storage.getCurrentUser().displayName ?? '',
  coverImageAlt: '',
  parentSlug: '',
})

export const formFromPost = (post: BlogPost): BlogForm => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt ?? '',
  contentMd: post.contentMd,
  category: post.category,
  tags: post.tags,
  publishDate: post.publishDate,
  featured: post.featured,
  authorDisplayName: post.authorDisplayName ?? '',
  coverImageId: post.coverImageId,
  coverImageAlt: post.coverImageAlt ?? '',
  parentSlug: post.parentSlug ?? '',
})

const blankToUndefined = (value: string): string | undefined => value.trim() || undefined

export const toRequest = (form: BlogForm, status: BlogStatus, updateDate?: number): BlogPostRequest => ({
  title: form.title.trim(),
  slug: form.slug.trim(),
  excerpt: blankToUndefined(form.excerpt),
  contentMd: form.contentMd,
  category: form.category,
  tags: form.tags,
  status,
  publishDate: form.publishDate,
  featured: form.featured,
  authorDisplayName: blankToUndefined(form.authorDisplayName),
  coverImageId: form.coverImageId,
  coverImageAlt: form.coverImageId ? blankToUndefined(form.coverImageAlt) : undefined,
  parentSlug: blankToUndefined(form.parentSlug),
  updateDate,
})

export const validateBlogForm = (form: BlogForm, status: BlogStatus): FormErrors => {
  const errors: FormErrors = {}
  const title = form.title.trim()
  if (title.length === 0) {
    errors.title = 'Title is required'
  }
  else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer`
  }
  if (form.slug.trim().length === 0) {
    errors.slug = 'Slug is required'
  }
  else if (!SLUG_PATTERN.test(form.slug.trim())) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens'
  }
  if (form.excerpt.length > MAX_EXCERPT_LENGTH) {
    errors.excerpt = `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or fewer`
  }
  if (form.parentSlug.trim() && !SLUG_PATTERN.test(form.parentSlug.trim())) {
    errors.parentSlug = 'Use lowercase letters, numbers and single hyphens'
  }
  if (status === 'PUBLISHED' && form.contentMd.trim().length === 0) {
    errors.contentMd = 'Content is required to publish'
  }
  return errors
}

export const normalizeTag = (tag: string): string => tag.trim().toLowerCase().replaceAll(/\s+/g, '-')
