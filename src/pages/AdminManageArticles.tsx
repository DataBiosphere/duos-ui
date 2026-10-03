import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { Blog } from 'src/libs/ajax/Blog'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import SearchBar from 'src/components/SearchBar'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { ManageBlogTable } from 'src/components/blog/ManageBlogTable'
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, BlogCategory, BlogDisplayStatus, BlogPostSummary } from 'src/types/blog'
import { ADMIN_ARTICLES_PATH, displayStatus, postToRequest } from 'src/utils/BlogUtils'
import { extractError } from 'src/utils/ErrorUtils'

const STATUS_FILTER_OPTIONS: Array<{ value: BlogDisplayStatus, label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const SELECT_SX = { 'minWidth': 200, '& .MuiInputBase-root': { fontSize: '1.4rem', height: '4rem' }, '& .MuiInputLabel-root': { fontSize: '1.4rem' } }
const MENU_ITEM_SX = { fontSize: '1.4rem' }

const matchesSearch = (post: BlogPostSummary, terms: string[]): boolean => {
  const haystack = [post.title, post.slug, post.excerpt ?? '', post.authorDisplayName ?? '', ...post.tags].join(' ').toLowerCase()
  return terms.every(term => haystack.includes(term))
}

export const AdminManageArticles = () => {
  usePageTitle('Manage Articles')
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [loadedAt, setLoadedAt] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<BlogCategory | ''>('')
  const [statusFilter, setStatusFilter] = useState<BlogDisplayStatus | ''>('')
  const [postToDelete, setPostToDelete] = useState<BlogPostSummary>()
  const [busyPostId, setBusyPostId] = useState<number>()

  const showPosts = (list: BlogPostSummary[]) => {
    setPosts(list)
    setLoadedAt(Date.now())
  }

  const showLoadError = (error: unknown) => Notifications.showError({ text: `Unable to load articles: ${extractError(error)}` })

  useEffect(() => {
    let active = true
    Blog.list()
      .then((list) => {
        if (active) {
          showPosts(list)
        }
      })
      .catch(showLoadError)
      .finally(() => setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Refreshes after a publish toggle or delete, without the grid's loading bar.
  const loadPosts = useCallback(async () => {
    try {
      showPosts(await Blog.list())
    }
    catch (error) {
      showLoadError(error)
    }
  }, [])

  const filteredPosts = useMemo(() => {
    const terms = searchText.toLowerCase().split(' ').filter(term => term.length > 0)
    return posts
      .filter(post => !categoryFilter || post.category === categoryFilter)
      .filter(post => !statusFilter || displayStatus(post, loadedAt) === statusFilter)
      .filter(post => matchesSearch(post, terms))
  }, [posts, loadedAt, searchText, categoryFilter, statusFilter])

  // The list omits content, so the toggle loads the full article and saves it with only the status changed.
  const togglePublish = useCallback(async (summary: BlogPostSummary) => {
    const publish = summary.status !== 'PUBLISHED'
    setBusyPostId(summary.blogPostId)
    try {
      const post = await Blog.getById(summary.blogPostId)
      await Blog.update(post.blogPostId, { ...postToRequest(post), status: publish ? 'PUBLISHED' : 'DRAFT' })
      Notifications.showSuccess({ text: `"${post.title}" ${publish ? 'published' : 'unpublished'}` })
      await loadPosts()
    }
    catch (error) {
      Notifications.showError({ text: `Unable to ${publish ? 'publish' : 'unpublish'} "${summary.title}": ${extractError(error)}` })
    }
    finally {
      setBusyPostId(undefined)
    }
  }, [loadPosts])

  const confirmDelete = async () => {
    if (!postToDelete) {
      return
    }
    const { blogPostId, title } = postToDelete
    setPostToDelete(undefined)
    setBusyPostId(blogPostId)
    try {
      await Blog.delete(blogPostId)
      Notifications.showSuccess({ text: `"${title}" deleted` })
      await loadPosts()
    }
    catch (error) {
      Notifications.showError({ text: `Unable to delete "${title}": ${extractError(error)}` })
    }
    finally {
      setBusyPostId(undefined)
    }
  }

  return (
    <div style={Styles.PAGE}>
      <TableHeaderSection
        title="Manage Articles"
        description="Create, publish and manage blog posts, user guides, feature announcements, news and policy briefs"
      />
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION, flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <SearchBar handleSearchChange={setSearchText} placeholder="Search title, slug or tag" />
        <FormControl size="small" sx={SELECT_SX}>
          <InputLabel id="article-category-filter-label">Category</InputLabel>
          <Select
            labelId="article-category-filter-label"
            label="Category"
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value as BlogCategory | '')}
          >
            <MenuItem value="" sx={MENU_ITEM_SX}>All categories</MenuItem>
            {BLOG_CATEGORIES.map(category => (
              <MenuItem key={category} value={category} sx={MENU_ITEM_SX}>{BLOG_CATEGORY_LABELS[category]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ ...SELECT_SX, minWidth: 160 }}>
          <InputLabel id="article-status-filter-label">Status</InputLabel>
          <Select
            labelId="article-status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as BlogDisplayStatus | '')}
          >
            <MenuItem value="" sx={MENU_ITEM_SX}>All statuses</MenuItem>
            {STATUS_FILTER_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value} sx={MENU_ITEM_SX}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <AddObjectButton
          id="btn_addArticle"
          label="ADD ARTICLE"
          onClick={() => navigate(`${ADMIN_ARTICLES_PATH}/new`)}
          icon={<AddCircleOutlineOutlinedIcon />}
          className="button button-blue"
        />
      </div>
      <ManageBlogTable
        posts={filteredPosts}
        isLoading={isLoading}
        now={loadedAt}
        busyPostId={busyPostId}
        onTogglePublish={post => void togglePublish(post)}
        onDelete={setPostToDelete}
      />
      <ConfirmationDialog
        title="Delete article?"
        description={postToDelete ? `"${postToDelete.title}" will be removed from DUOS and its URL will stop working.` : ''}
        openState={postToDelete !== undefined}
        close={() => setPostToDelete(undefined)}
        action={() => void confirmDelete()}
      />
    </div>
  )
}

export default AdminManageArticles
