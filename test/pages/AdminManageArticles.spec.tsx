import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { AdminManageArticles } from 'src/pages/AdminManageArticles'
import { Blog } from 'src/libs/ajax/Blog'
import { Notifications } from 'src/libs/utils'
import type { BlogPost, BlogPostSummary } from 'src/types/blog'
import { renderWithRouter } from '../test-utils'

vi.mock('src/libs/ajax/Blog', () => ({
  Blog: { list: vi.fn(), getById: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) => (
    <input aria-label="search" onChange={e => handleSearchChange(e.target.value)} />
  ),
}))

// The DataGrid itself is covered by its own spec; here it only needs to expose rows and actions.
vi.mock('src/components/blog/ManageBlogTable', () => ({
  ManageBlogTable: ({ posts, onDelete, onTogglePublish }: {
    posts: BlogPostSummary[]
    onDelete: (post: BlogPostSummary) => void
    onTogglePublish: (post: BlogPostSummary) => void
  }) => (
    <ul data-testid="blog-table">
      {posts.map(post => (
        <li key={post.blogPostId}>
          {post.title}
          <button onClick={() => onDelete(post)}>{`Delete ${post.title}`}</button>
          <button onClick={() => onTogglePublish(post)}>{`Toggle ${post.title}`}</button>
        </li>
      ))}
    </ul>
  ),
}))

const CREATED = new Date('2026-04-30T12:00:00.000Z').getTime()

const buildSummary = (blogPostId: number, overrides: Partial<BlogPostSummary> = {}): BlogPostSummary => ({
  blogPostId,
  slug: `post-${blogPostId}`,
  title: `Post ${blogPostId}`,
  category: 'BLOG_POST',
  tags: [],
  status: 'DRAFT',
  featured: false,
  createDate: CREATED,
  updateDate: CREATED,
  ...overrides,
})

const guide = buildSummary(1, { title: 'Researcher Guide', category: 'USER_GUIDE', tags: ['researchers'], status: 'PUBLISHED', publishDate: CREATED })
const draft = buildSummary(2, { title: 'Policy Draft', category: 'POLICY_BRIEF' })

const rowTitles = () => Array.from(screen.getByTestId('blog-table').querySelectorAll('li')).map(li => li.firstChild?.textContent)

describe('AdminManageArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Blog.list).mockResolvedValue([guide, draft])
  })

  it('lists every post', async () => {
    renderWithRouter(<AdminManageArticles />)

    await waitFor(() => expect(rowTitles()).toEqual(['Researcher Guide', 'Policy Draft']))
  })

  it('filters by search text across titles and tags', async () => {
    renderWithRouter(<AdminManageArticles />)
    await waitFor(() => expect(rowTitles()).toHaveLength(2))

    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'researchers' } })

    expect(rowTitles()).toEqual(['Researcher Guide'])
  })

  it('shows an error when posts cannot be loaded', async () => {
    vi.mocked(Blog.list).mockRejectedValue(new Error('boom'))
    renderWithRouter(<AdminManageArticles />)

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Unable to load articles: boom' }))
  })

  it('deletes a post only after confirmation, then refreshes the list', async () => {
    vi.mocked(Blog.delete).mockResolvedValue()
    renderWithRouter(<AdminManageArticles />)
    await waitFor(() => expect(rowTitles()).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Delete Policy Draft' }))
    expect(Blog.delete).not.toHaveBeenCalled()
    vi.mocked(Blog.list).mockResolvedValue([guide])
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(rowTitles()).toEqual(['Researcher Guide']))
    expect(Blog.delete).toHaveBeenCalledWith(2)
    expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: '"Policy Draft" deleted' })
  })

  it('publishes a draft by saving the full post with a published status', async () => {
    const fullDraft: BlogPost = { ...draft, contentMd: 'Body' }
    vi.mocked(Blog.getById).mockResolvedValue(fullDraft)
    vi.mocked(Blog.update).mockResolvedValue({ ...fullDraft, status: 'PUBLISHED' })
    renderWithRouter(<AdminManageArticles />)
    await waitFor(() => expect(rowTitles()).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Policy Draft' }))

    await waitFor(() => expect(Blog.update).toHaveBeenCalledWith(2, expect.objectContaining({ status: 'PUBLISHED', contentMd: 'Body', updateDate: CREATED })))
    expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: '"Policy Draft" published' })
  })
})
