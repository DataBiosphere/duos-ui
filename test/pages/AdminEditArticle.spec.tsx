import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import AdminEditArticleRoute from 'src/pages/AdminEditArticle'
import { Blog } from 'src/libs/ajax/Blog'
import { Notifications } from 'src/libs/utils'
import type { BlogPost } from 'src/types/blog'

vi.mock('src/libs/ajax/Blog', () => ({
  Blog: { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), uploadImage: vi.fn(), getImageUrlResolver: vi.fn() },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn(), showInformation: vi.fn() },
  }
})

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: () => ({ displayName: 'Ada Admin' }) },
}))

// The editor has its own spec; a plain textarea keeps these tests on the page's behavior.
vi.mock('src/components/blog/MarkdownEditor', () => ({
  MarkdownEditor: ({ label, value, onChange, error }: { label: string, value: string, onChange: (v: string) => void, error?: string }) => (
    <label>
      {label}
      <textarea value={value} onChange={e => onChange(e.target.value)} />
      {error && <span>{error}</span>}
    </label>
  ),
}))

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/admin_manage_articles/new" element={<AdminEditArticleRoute />} />
      <Route path="/admin_manage_articles/:postId" element={<AdminEditArticleRoute />} />
      <Route path="/admin_manage_articles" element={<div>Article list</div>} />
    </Routes>
    <LocationProbe />
  </MemoryRouter>,
)

const LOADED_UPDATE = new Date('2026-04-30T12:00:00.000Z').getTime()

const buildPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  blogPostId: 5,
  slug: 'existing-post',
  title: 'Existing Post',
  contentMd: 'Body',
  category: 'BLOG_POST',
  tags: [],
  status: 'DRAFT',
  featured: false,
  createDate: LOADED_UPDATE,
  updateDate: LOADED_UPDATE,
  ...overrides,
})

const conflict = () => Object.assign(new Error('Conflict'), { response: { status: 409, data: {} } })

const titleInput = () => screen.getByRole('textbox', { name: /^Title/ })
const slugInput = () => screen.getByRole('textbox', { name: /^Slug/ })

describe('AdminEditArticle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Blog.list).mockResolvedValue([])
    vi.mocked(Blog.getImageUrlResolver).mockResolvedValue(() => undefined)
  })

  it('derives the slug from the title, creates the draft and moves to its edit page', async () => {
    vi.mocked(Blog.create).mockResolvedValue(buildPost({ blogPostId: 9, title: 'My New Post', slug: 'my-new-post' }))
    vi.mocked(Blog.getById).mockResolvedValue(buildPost({ blogPostId: 9, title: 'My New Post', slug: 'my-new-post' }))
    renderAt('/admin_manage_articles/new')

    fireEvent.change(titleInput(), { target: { value: 'My New Post!' } })
    expect(slugInput()).toHaveValue('my-new-post')
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin_manage_articles/9'))
    expect(Blog.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'My New Post!',
      slug: 'my-new-post',
      status: 'DRAFT',
      authorDisplayName: 'Ada Admin',
      updateDate: undefined,
    }))
    expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Draft saved' })
  })

  it('stops following the title once the slug is edited by hand', () => {
    renderAt('/admin_manage_articles/new')

    fireEvent.change(slugInput(), { target: { value: 'custom-slug' } })
    fireEvent.change(titleInput(), { target: { value: 'Different Title' } })

    expect(slugInput()).toHaveValue('custom-slug')
  })

  it('requires content before publishing', async () => {
    renderAt('/admin_manage_articles/new')

    fireEvent.change(titleInput(), { target: { value: 'Empty' } })
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByText('Content is required to publish')).toBeInTheDocument()
    expect(Blog.create).not.toHaveBeenCalled()
  })

  it('shows a slug taken within the category on the slug field', async () => {
    vi.mocked(Blog.create).mockRejectedValue(conflict())
    renderAt('/admin_manage_articles/new')

    fireEvent.change(titleInput(), { target: { value: 'Duplicate' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(await screen.findByText('Another Blog Post already uses this slug')).toBeInTheDocument()
  })

  it('shows the category in the article URL', () => {
    renderAt('/admin_manage_articles/new')

    fireEvent.change(titleInput(), { target: { value: 'Getting Started' } })

    expect(screen.getByText('Will be published at /articles/blog-posts/getting-started')).toBeInTheDocument()
  })

  it('warns that changing a published article\'s slug moves its URL', async () => {
    vi.mocked(Blog.getById).mockResolvedValue(buildPost({ status: 'PUBLISHED', publishDate: LOADED_UPDATE }))
    renderAt('/admin_manage_articles/5')
    await waitFor(() => expect(titleInput()).toHaveValue('Existing Post'))
    expect(screen.getByText('Live at /articles/blog-posts/existing-post')).toBeInTheDocument()

    fireEvent.change(slugInput(), { target: { value: 'renamed' } })

    expect(screen.getByText('Saving moves this article from /articles/blog-posts/existing-post to /articles/blog-posts/renamed. Existing links will break.')).toBeInTheDocument()
  })

  it('warns instead of overwriting when someone else saved the article first', async () => {
    vi.mocked(Blog.getById)
      .mockResolvedValueOnce(buildPost())
      .mockResolvedValueOnce(buildPost({ updateDate: LOADED_UPDATE + 1000 }))
    vi.mocked(Blog.update).mockRejectedValue(conflict())
    renderAt('/admin_manage_articles/5')
    await waitFor(() => expect(titleInput()).toHaveValue('Existing Post'))

    fireEvent.change(titleInput(), { target: { value: 'My edit' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(await screen.findByText(/Someone else saved this article after you opened it/)).toBeInTheDocument()
    expect(Blog.update).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'My edit', updateDate: LOADED_UPDATE }))
  })

  it('deletes from the edit page after confirmation and returns to the list', async () => {
    vi.mocked(Blog.getById).mockResolvedValue(buildPost())
    vi.mocked(Blog.delete).mockResolvedValue()
    renderAt('/admin_manage_articles/5')
    await waitFor(() => expect(titleInput()).toHaveValue('Existing Post'))

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin_manage_articles'))
    expect(Blog.delete).toHaveBeenCalledWith(5)
  })

  it('asks before discarding unsaved changes via the back link', async () => {
    vi.mocked(Blog.getById).mockResolvedValue(buildPost())
    renderAt('/admin_manage_articles/5')
    await waitFor(() => expect(titleInput()).toHaveValue('Existing Post'))

    fireEvent.change(titleInput(), { target: { value: 'Unsaved' } })
    fireEvent.click(screen.getByRole('link', { name: 'Back to articles' }))

    expect(await screen.findByText('Discard unsaved changes?')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/admin_manage_articles/5')
  })
})
