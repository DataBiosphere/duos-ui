/**
 * Types for admin-managed blog and documentation content served by consent's
 * `/api/blog` (admin) and `/blog` (public) endpoints.
 */

export const BLOG_CATEGORIES = [
  'BLOG_POST',
  'USER_GUIDE',
  'FEATURE_ANNOUNCEMENT',
  'IN_THE_NEWS',
  'POLICY_BRIEF',
  'PAGE',
] as const

export type BlogCategory = typeof BLOG_CATEGORIES[number]

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  BLOG_POST: 'Blog Post',
  USER_GUIDE: 'User Guide',
  FEATURE_ANNOUNCEMENT: 'Feature Announcement',
  IN_THE_NEWS: 'In the News',
  POLICY_BRIEF: 'Policy Brief',
  PAGE: 'Page',
}

/** Plural labels for public navigation, e.g. the category tabs on /articles. */
export const BLOG_CATEGORY_PLURAL_LABELS: Record<BlogCategory, string> = {
  BLOG_POST: 'Blog Posts',
  USER_GUIDE: 'User Guides',
  FEATURE_ANNOUNCEMENT: 'Feature Announcements',
  IN_THE_NEWS: 'In the News',
  POLICY_BRIEF: 'Policy Briefs',
  PAGE: 'Pages',
}

/**
 * Each category's URL segment: an article lives at /articles/<segment>/<slug>, so slugs only need
 * to be unique within a category.
 */
export const BLOG_CATEGORY_PATHS: Record<BlogCategory, string> = {
  BLOG_POST: 'blog-posts',
  USER_GUIDE: 'user-guides',
  FEATURE_ANNOUNCEMENT: 'feature-announcements',
  IN_THE_NEWS: 'in-the-news',
  POLICY_BRIEF: 'policy-briefs',
  PAGE: 'pages',
}

export const BLOG_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

export type BlogStatus = typeof BLOG_STATUSES[number]

/** Status as an admin reads it: a published post whose publish date is still ahead is scheduled. */
export type BlogDisplayStatus = BlogStatus | 'SCHEDULED'

/** List-shaped post: everything except the body. Dates are epoch milliseconds. */
export interface BlogPostSummary {
  blogPostId: number
  slug: string
  title: string
  excerpt?: string
  category: BlogCategory
  tags: string[]
  status: BlogStatus
  publishDate?: number
  featured: boolean
  authorDisplayName?: string
  coverImageId?: string
  coverImageAlt?: string
  parentSlug?: string
  createDate: number
  updateDate?: number
}

export interface BlogPost extends BlogPostSummary {
  contentMd: string
  legacyUrl?: string
}

/**
 * Body of POST/PUT `/api/blog`. `updateDate` echoes the value the editor loaded, so consent can
 * reject a save that would overwrite someone else's newer edit (409).
 */
export interface BlogPostRequest {
  slug: string
  title: string
  excerpt?: string
  contentMd: string
  category: BlogCategory
  tags: string[]
  status: BlogStatus
  publishDate?: number
  featured: boolean
  authorDisplayName?: string
  coverImageId?: string
  coverImageAlt?: string
  parentSlug?: string
  updateDate?: number
}

export interface BlogImage {
  imageId: string
  contentType: string
  fileName: string
  sizeBytes: number
}

export interface BlogListPage {
  items: BlogPostSummary[]
  total: number
}

export interface PublicBlogQuery {
  category?: BlogCategory
  tag?: string
  page?: number
  pageSize?: number
}
