import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Blog } from 'src/libs/ajax/Blog'
import { Notifications } from 'src/libs/utils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { Spinner } from 'src/components/Spinner'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { MarkdownEditor } from 'src/components/blog/MarkdownEditor'
import { CoverImageField } from 'src/components/blog/CoverImageField'
import { StatusChip } from 'src/components/blog/BlogChips'
import {
  BlogForm,
  emptyForm,
  formFromPost,
  FormErrors,
  normalizeTag,
  toRequest,
  validateBlogForm,
} from 'src/components/blog/blogForm'
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, BlogCategory, BlogPost, BlogStatus } from 'src/types/blog'
import {
  ADMIN_ARTICLES_PATH,
  adminArticleEditPath,
  articlePath,
  displayStatus,
  errorStatus,
  formatBlogDate,
  MAX_EXCERPT_LENGTH,
  MAX_TITLE_LENGTH,
  slugify,
} from 'src/utils/BlogUtils'
import { extractError } from 'src/utils/ErrorUtils'

const SECTION_LABEL_SX = { fontWeight: 600, fontSize: '1.6rem', marginBottom: '0.5rem' }

export const AdminEditArticle = () => {
  const { postId } = useParams()
  const isNew = postId === undefined
  const navigate = useNavigate()
  usePageTitle(isNew ? 'New Article' : 'Edit Article')

  const [loadedPost, setLoadedPost] = useState<BlogPost>()
  const [initialForm, setInitialForm] = useState<BlogForm>(emptyForm)
  const [form, setForm] = useState<BlogForm>(initialForm)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [loadFailed, setLoadFailed] = useState(false)
  const [savingAs, setSavingAs] = useState<BlogStatus>()
  const [errors, setErrors] = useState<FormErrors>({})
  const [staleConflict, setStaleConflict] = useState(false)
  const [knownTags, setKnownTags] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<string>()
  // Read in handlers rather than during render; decides whether a post is (or would be) scheduled.
  const [clock, setClock] = useState(0)

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm])
  const saving = savingAs !== undefined

  const resetTo = useCallback((post: BlogPost) => {
    const next = formFromPost(post)
    setLoadedPost(post)
    setInitialForm(next)
    setForm(next)
    setSlugTouched(true)
    setErrors({})
    setStaleConflict(false)
    setClock(Date.now())
  }, [])

  useEffect(() => {
    if (isNew) {
      return
    }
    let active = true
    Blog.getById(Number(postId))
      .then((post) => {
        if (active) {
          resetTo(post)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadFailed(true)
          Notifications.showError({ text: `Unable to load article: ${extractError(error)}` })
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [isNew, postId, resetTo])

  // Tag suggestions come from every existing post; failing to load them only loses the suggestions.
  useEffect(() => {
    Blog.list()
      .then(posts => setKnownTags([...new Set(posts.flatMap(post => post.tags))].sort()))
      .catch(() => undefined)
  }, [])

  // Closing or reloading the tab with unsaved edits gets the browser's own confirmation.
  useEffect(() => {
    if (!isDirty) {
      return
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    globalThis.addEventListener('beforeunload', warn)
    return () => globalThis.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const update = <K extends keyof BlogForm>(field: K, value: BlogForm[K]) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field in errors) {
      setErrors(current => ({ ...current, [field]: undefined }))
    }
  }

  const handleTitleChange = (title: string) => {
    setForm(current => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title) }))
    setErrors(current => ({ ...current, title: undefined, slug: slugTouched ? current.slug : undefined }))
  }

  const leaveTo = (path: string) => {
    if (isDirty) {
      setPendingLeave(path)
    }
    else {
      navigate(path)
    }
  }

  // consent answers 409 both for a taken slug and for a stale edit; the post's current updateDate
  // tells them apart.
  const explainConflict = async (): Promise<void> => {
    if (loadedPost) {
      try {
        const latest = await Blog.getById(loadedPost.blogPostId)
        if (latest.updateDate !== loadedPost.updateDate) {
          setStaleConflict(true)
          return
        }
      }
      catch {
        // Fall back to the slug explanation below.
      }
    }
    setErrors(current => ({ ...current, slug: `Another ${BLOG_CATEGORY_LABELS[form.category]} already uses this slug` }))
  }

  const save = async (status: BlogStatus) => {
    const validation = validateBlogForm(form, status)
    setErrors(validation)
    if (Object.values(validation).some(Boolean)) {
      Notifications.showError({ text: 'Please fix the highlighted fields' })
      return
    }
    setSavingAs(status)
    try {
      const request = toRequest(form, status, loadedPost?.updateDate)
      const saved = loadedPost
        ? await Blog.update(loadedPost.blogPostId, request)
        : await Blog.create(request)
      resetTo(saved)
      Notifications.showSuccess({ text: successMessage(saved, loadedPost?.status, Date.now()) })
      if (!loadedPost) {
        navigate(adminArticleEditPath(saved.blogPostId), { replace: true })
      }
    }
    catch (error) {
      if (errorStatus(error) === 409) {
        await explainConflict()
      }
      else {
        Notifications.showError({ text: `Unable to save: ${extractError(error)}` })
      }
    }
    finally {
      setSavingAs(undefined)
    }
  }

  const reloadLatest = async () => {
    if (!loadedPost) {
      return
    }
    try {
      resetTo(await Blog.getById(loadedPost.blogPostId))
    }
    catch (error) {
      Notifications.showError({ text: `Unable to reload: ${extractError(error)}` })
    }
  }

  const deletePost = async () => {
    setShowDeleteDialog(false)
    if (!loadedPost) {
      return
    }
    try {
      await Blog.delete(loadedPost.blogPostId)
      Notifications.showSuccess({ text: `"${loadedPost.title}" deleted` })
      // Nothing is left to save, so skip the unsaved-changes prompt.
      navigate(ADMIN_ARTICLES_PATH)
    }
    catch (error) {
      Notifications.showError({ text: `Unable to delete: ${extractError(error)}` })
    }
  }

  const uploadError = (error: unknown) => Notifications.showError({ text: `Image upload failed: ${extractError(error)}` })

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', padding: 6 }}><Spinner /></Box>
  }

  if (loadFailed) {
    return (
      <Box sx={{ padding: 4 }}>
        <Alert severity="error" sx={{ fontSize: '1.4rem' }}>
          This article could not be loaded. It may have been deleted.
          {' '}
          <Link to={ADMIN_ARTICLES_PATH}>Back to articles</Link>
        </Alert>
      </Box>
    )
  }

  const currentStatus = loadedPost ? displayStatus(loadedPost, clock) : 'DRAFT'
  const isPublished = loadedPost?.status === 'PUBLISHED'
  const isScheduling = form.publishDate !== undefined && form.publishDate > clock
  let publishLabel = 'Publish'
  if (isPublished) {
    publishLabel = 'Update'
  }
  else if (isScheduling) {
    publishLabel = 'Schedule'
  }
  const draftLabel = isPublished ? 'Unpublish to draft' : 'Save draft'
  const url = articlePath(form.category, form.slug || '…')
  const liveUrl = loadedPost?.status === 'PUBLISHED' ? articlePath(loadedPost.category, loadedPost.slug) : undefined
  let urlHint = `Will be published at ${url}`
  if (liveUrl !== undefined) {
    urlHint = liveUrl === url ? `Live at ${url}` : `Saving moves this article from ${liveUrl} to ${url}. Existing links will break.`
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', paddingX: '40px', paddingBottom: '40px' }}>
        <Box sx={{ paddingTop: '0.67rem', marginRight: 2 }}>
          <Link
            id="link_articles"
            to={ADMIN_ARTICLES_PATH}
            onClick={(event) => {
              event.preventDefault()
              leaveTo(ADMIN_ARTICLES_PATH)
            }}
            aria-label="Back to articles"
          >
            <img src={backArrowIcon} alt="" style={{ height: 28, width: 28 }} />
          </Link>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', marginBottom: 3 }}>
            <Typography component="h1" sx={{ fontSize: '2.8rem', fontWeight: 600 }}>
              {isNew ? 'New article' : 'Edit article'}
            </Typography>
            <StatusChip status={currentStatus} />
            {isDirty && <Chip label="Unsaved changes" size="small" variant="outlined" color="warning" sx={{ fontSize: '1.2rem' }} />}
          </Box>

          {staleConflict && (
            <Alert
              severity="warning"
              sx={{ fontSize: '1.4rem', marginBottom: 3 }}
              action={<Button color="inherit" size="small" onClick={() => void reloadLatest()}>Reload latest</Button>}
            >
              Someone else saved this article after you opened it. Copy anything you want to keep, then reload the latest version.
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, gap: 4, alignItems: 'start' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <TextField
                label="Title"
                required
                value={form.title}
                onChange={event => handleTitleChange(event.target.value)}
                error={Boolean(errors.title)}
                helperText={errors.title ?? `${form.title.length}/${MAX_TITLE_LENGTH}`}
                slotProps={{ htmlInput: { maxLength: MAX_TITLE_LENGTH } }}
              />
              <TextField
                label="Slug"
                required
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  update('slug', event.target.value.toLowerCase())
                }}
                error={Boolean(errors.slug)}
                helperText={errors.slug ?? urlHint}
              />
              <TextField
                label="Excerpt"
                multiline
                minRows={2}
                value={form.excerpt}
                onChange={event => update('excerpt', event.target.value)}
                error={Boolean(errors.excerpt)}
                helperText={errors.excerpt ?? `Shown on cards and in search results. ${form.excerpt.length}/${MAX_EXCERPT_LENGTH}`}
              />
              <MarkdownEditor
                id="article-content"
                label="Content"
                value={form.contentMd}
                onChange={value => update('contentMd', value)}
                onUploadImage={Blog.uploadImage}
                onUploadError={uploadError}
                error={errors.contentMd}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Paper variant="outlined" sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography sx={SECTION_LABEL_SX}>Publishing</Typography>
                {loadedPost && (
                  <Typography sx={{ fontSize: '1.3rem', color: '#555' }}>
                    {loadedPost.publishDate ? `Publish date: ${formatBlogDate(loadedPost.publishDate)}` : 'Not yet published'}
                    <br />
                    {`Last saved: ${formatBlogDate(loadedPost.updateDate ?? loadedPost.createDate)}`}
                  </Typography>
                )}
                <Button variant="contained" disabled={saving} onClick={() => void save('PUBLISHED')} sx={{ fontSize: '1.4rem' }}>
                  {savingAs === 'PUBLISHED' ? 'Saving…' : publishLabel}
                </Button>
                {loadedPost?.status === 'ARCHIVED'
                  ? (
                      <Button variant="outlined" disabled={saving} onClick={() => void save('ARCHIVED')} sx={{ fontSize: '1.4rem' }}>
                        {savingAs === 'ARCHIVED' ? 'Saving…' : 'Save (keep archived)'}
                      </Button>
                    )
                  : (
                      <Button variant="outlined" disabled={saving} onClick={() => void save('DRAFT')} sx={{ fontSize: '1.4rem' }}>
                        {savingAs === 'DRAFT' ? 'Saving…' : draftLabel}
                      </Button>
                    )}
                {loadedPost && loadedPost.status !== 'ARCHIVED' && (
                  <Button variant="text" disabled={saving} onClick={() => void save('ARCHIVED')} sx={{ fontSize: '1.3rem' }}>
                    Archive
                  </Button>
                )}
                {loadedPost && currentStatus === 'PUBLISHED' && (
                  <Button variant="text" component="a" href={articlePath(loadedPost.category, loadedPost.slug)} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '1.3rem' }}>
                    View live
                  </Button>
                )}
                {loadedPost && (
                  <Button variant="text" color="error" disabled={saving} onClick={() => setShowDeleteDialog(true)} sx={{ fontSize: '1.3rem' }}>
                    Delete
                  </Button>
                )}
              </Paper>

              <FormControl fullWidth>
                <InputLabel id="article-category-label">Category</InputLabel>
                <Select
                  labelId="article-category-label"
                  label="Category"
                  value={form.category}
                  onChange={(event) => {
                    update('category', event.target.value as BlogCategory)
                    // Slugs are unique per category, so a taken-slug error no longer applies.
                    setErrors(current => ({ ...current, slug: undefined }))
                  }}
                >
                  {BLOG_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{BLOG_CATEGORY_LABELS[category]}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>The category is part of the article's URL.</FormHelperText>
              </FormControl>

              <Autocomplete
                multiple
                freeSolo
                options={knownTags}
                value={form.tags}
                onChange={(_event, tags) => update('tags', [...new Set(tags.map(normalizeTag).filter(Boolean))])}
                renderInput={params => <TextField {...params} label="Tags" helperText="Press Enter to add a tag" />}
              />

              <DateTimePicker
                label="Publish date"
                value={form.publishDate === undefined ? null : dayjs(form.publishDate)}
                onChange={(value) => {
                  setClock(Date.now())
                  update('publishDate', value?.isValid() ? value.valueOf() : undefined)
                }}
                slotProps={{
                  textField: { helperText: 'Leave empty to publish immediately. A future date schedules the post.' },
                  field: { clearable: true },
                }}
              />

              <TextField
                label="Author byline"
                value={form.authorDisplayName}
                onChange={event => update('authorDisplayName', event.target.value)}
              />

              <TextField
                label="Parent group"
                value={form.parentSlug}
                onChange={event => update('parentSlug', event.target.value.toLowerCase())}
                error={Boolean(errors.parentSlug)}
                helperText={errors.parentSlug ?? 'Optional, e.g. "help". Used for breadcrumbs.'}
              />

              <FormControlLabel
                control={<Checkbox checked={form.featured} onChange={event => update('featured', event.target.checked)} />}
                label="Feature at the top of Articles"
                slotProps={{ typography: { sx: { fontSize: '1.4rem' } } }}
              />

              <CoverImageField
                imageId={form.coverImageId}
                alt={form.coverImageAlt}
                onImageChange={imageId => update('coverImageId', imageId)}
                onAltChange={alt => update('coverImageAlt', alt)}
                onUploadImage={Blog.uploadImage}
                onUploadError={uploadError}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <ConfirmationDialog
        title="Delete article?"
        description={`"${loadedPost?.title ?? ''}" will be removed from DUOS and its URL will stop working.`}
        openState={showDeleteDialog}
        close={() => setShowDeleteDialog(false)}
        action={() => void deletePost()}
      />
      <ConfirmationDialog
        title="Discard unsaved changes?"
        description="You have changes that haven't been saved. Leaving this page will discard them."
        openState={pendingLeave !== undefined}
        close={() => setPendingLeave(undefined)}
        action={() => {
          const path = pendingLeave ?? ADMIN_ARTICLES_PATH
          setPendingLeave(undefined)
          navigate(path)
        }}
      />
    </LocalizationProvider>
  )
}

const successMessage = (saved: BlogPost, previousStatus: BlogStatus | undefined, now: number): string => {
  if (saved.status === 'PUBLISHED') {
    if (displayStatus(saved, now) === 'SCHEDULED') {
      return `"${saved.title}" scheduled for ${formatBlogDate(saved.publishDate)}`
    }
    return previousStatus === 'PUBLISHED' ? `"${saved.title}" updated` : `"${saved.title}" published`
  }
  if (saved.status === 'ARCHIVED') {
    return `"${saved.title}" archived`
  }
  return previousStatus === 'PUBLISHED' ? `"${saved.title}" unpublished and saved as a draft` : 'Draft saved'
}

/** Keyed by article id, so moving between articles (or to a new one) starts from a fresh form. */
export const AdminEditArticleRoute = () => {
  const { postId } = useParams()
  return <AdminEditArticle key={postId ?? 'new'} />
}

export default AdminEditArticleRoute
