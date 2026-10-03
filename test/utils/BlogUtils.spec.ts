import { describe, expect, it } from 'vitest'
import {
  adminArticleEditPath,
  articleCategoryPath,
  articlePath,
  categoryFromPath,
  displayStatus,
  errorStatus,
  isPubliclyVisible,
  parseDuosImageId,
  postToRequest,
  readingTimeMinutes,
  SLUG_PATTERN,
  slugify,
  toDuosImageUrl,
} from 'src/utils/BlogUtils'
import type { BlogPost } from 'src/types/blog'

const NOW = new Date('2026-04-30T12:00:00.000Z').getTime()
const DAY = 24 * 60 * 60 * 1000

const buildPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  blogPostId: 7,
  slug: 'a-post',
  title: 'A Post',
  excerpt: 'Summary',
  contentMd: 'Body',
  category: 'BLOG_POST',
  tags: ['news'],
  status: 'PUBLISHED',
  publishDate: NOW - DAY,
  featured: false,
  createDate: NOW - 2 * DAY,
  updateDate: NOW - DAY,
  ...overrides,
})

describe('BlogUtils', () => {
  describe('slugify', () => {
    it('lowercases, hyphenates and strips punctuation and accents', () => {
      expect(slugify('  Hello, World! Café & Data  ')).toBe('hello-world-cafe-data')
    })

    it('produces slugs that satisfy the slug pattern', () => {
      expect(SLUG_PATTERN.test(slugify('DUOS: Feature Announcement (2026)'))).toBe(true)
    })

    it('returns an empty string when nothing usable remains', () => {
      expect(slugify('!!!')).toBe('')
    })

    it('caps the length without leaving a trailing hyphen', () => {
      const slug = slugify(`${'a'.repeat(79)} b`)
      expect(slug.length).toBeLessThanOrEqual(80)
      expect(slug.endsWith('-')).toBe(false)
    })
  })

  describe('displayStatus and isPubliclyVisible', () => {
    it('treats a published post dated in the future as scheduled and hidden', () => {
      const post = buildPost({ publishDate: NOW + DAY })
      expect(displayStatus(post, NOW)).toBe('SCHEDULED')
      expect(isPubliclyVisible(post, NOW)).toBe(false)
    })

    it('treats a published post dated in the past as published and visible', () => {
      const post = buildPost()
      expect(displayStatus(post, NOW)).toBe('PUBLISHED')
      expect(isPubliclyVisible(post, NOW)).toBe(true)
    })

    it('keeps drafts and archived posts hidden whatever their date', () => {
      expect(isPubliclyVisible(buildPost({ status: 'DRAFT' }), NOW)).toBe(false)
      expect(displayStatus(buildPost({ status: 'ARCHIVED', publishDate: NOW + DAY }), NOW)).toBe('ARCHIVED')
    })
  })

  describe('duos-image URLs', () => {
    it('round-trips an image id', () => {
      expect(parseDuosImageId(toDuosImageUrl('abc-123'))).toBe('abc-123')
    })

    it('ignores other URLs and an empty id', () => {
      expect(parseDuosImageId('https://example.org/a.png')).toBeUndefined()
      expect(parseDuosImageId('duos-image:')).toBeUndefined()
    })
  })

  it('estimates reading time at 200 words per minute, at least one minute', () => {
    expect(readingTimeMinutes('')).toBe(1)
    expect(readingTimeMinutes('word '.repeat(600))).toBe(3)
  })

  it('puts the category in public article paths', () => {
    expect(articlePath('USER_GUIDE', 'getting-started')).toBe('/articles/user-guides/getting-started')
    expect(articleCategoryPath('IN_THE_NEWS')).toBe('/articles/in-the-news')
    expect(adminArticleEditPath(7)).toBe('/admin_manage_articles/7')
  })

  it('maps URL segments back to categories', () => {
    expect(categoryFromPath('policy-briefs')).toBe('POLICY_BRIEF')
    expect(categoryFromPath('POLICY_BRIEF')).toBeUndefined()
    expect(categoryFromPath(undefined)).toBeUndefined()
  })

  it('carries the loaded updateDate into a save request', () => {
    const request = postToRequest(buildPost())
    expect(request.updateDate).toBe(NOW - DAY)
    expect(request).not.toHaveProperty('blogPostId')
    expect(request).not.toHaveProperty('createDate')
  })

  it('reads the HTTP status from a fetchAdapter error', () => {
    const error = Object.assign(new Error('Conflict'), { response: { status: 409 } })
    expect(errorStatus(error)).toBe(409)
    expect(errorStatus(new Error('network'))).toBeUndefined()
  })
})
