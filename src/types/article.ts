export const ARTICLE_CATEGORIES = [
  'BLOG_POST',
  'USER_GUIDE',
  'FEATURE_ANNOUNCEMENT',
  'IN_THE_NEWS',
  'POLICY_BRIEF',
  'PAGE',
] as const

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number]

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  BLOG_POST: 'Blog Post',
  USER_GUIDE: 'User Guide',
  FEATURE_ANNOUNCEMENT: 'Feature Announcement',
  IN_THE_NEWS: 'In the News',
  POLICY_BRIEF: 'Policy Brief',
  PAGE: 'Page',
}

/** Plural labels for the category tabs on /articles. */
export const ARTICLE_CATEGORY_PLURAL_LABELS: Record<ArticleCategory, string> = {
  BLOG_POST: 'Blog Posts',
  USER_GUIDE: 'User Guides',
  FEATURE_ANNOUNCEMENT: 'Feature Announcements',
  IN_THE_NEWS: 'In the News',
  POLICY_BRIEF: 'Policy Briefs',
  PAGE: 'Pages',
}

/** Each category's URL segment and content folder: /articles/<segment>/<slug>. */
export const ARTICLE_CATEGORY_PATHS: Record<ArticleCategory, string> = {
  BLOG_POST: 'blog-posts',
  USER_GUIDE: 'user-guides',
  FEATURE_ANNOUNCEMENT: 'feature-announcements',
  IN_THE_NEWS: 'in-the-news',
  POLICY_BRIEF: 'policy-briefs',
  PAGE: 'pages',
}

export interface Article {
  category: ArticleCategory
  /** Lowercase words joined by hyphens; unique within the category. */
  slug: string
  title: string
  /** Card text and page description. */
  excerpt: string
  /** YYYY-MM-DD. The article stays hidden until this date. */
  publishDate: string
  tags?: string[]
  featured?: boolean
  author?: string
  /** Slug of the page this one sits under, for breadcrumbs, e.g. 'help'. */
  parent?: string
  /** The duos.blog URL this article replaces. */
  legacyUrl?: string
  draft?: boolean
}
