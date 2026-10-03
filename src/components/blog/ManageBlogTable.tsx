import React, { useMemo } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Link } from 'react-router'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PublishIcon from '@mui/icons-material/Publish'
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { DATA_GRID_CONTAINER_SX, DATA_GRID_SX } from 'src/components/dataGridDefaults'
import { CategoryChip, StatusChip } from 'src/components/blog/BlogChips'
import { BlogCategory, BlogDisplayStatus, BlogPostSummary } from 'src/types/blog'
import { adminArticleEditPath, articlePath, displayStatus, formatBlogDate } from 'src/utils/BlogUtils'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

interface BlogRow {
  id: number
  title: string
  slug: string
  category: BlogCategory
  status: BlogDisplayStatus
  author: string
  publishDate?: number
  updateDate: number
  post: BlogPostSummary
}

interface ManageBlogTableProps {
  readonly posts: BlogPostSummary[]
  readonly isLoading: boolean
  /** When the posts were loaded; a published post dated after it shows as scheduled. */
  readonly now: number
  readonly busyPostId?: number
  readonly onTogglePublish: (post: BlogPostSummary) => void
  readonly onDelete: (post: BlogPostSummary) => void
}

const toRow = (post: BlogPostSummary, now: number): BlogRow => ({
  id: post.blogPostId,
  title: post.title,
  slug: post.slug,
  category: post.category,
  status: displayStatus(post, now),
  author: post.authorDisplayName ?? '',
  publishDate: post.publishDate,
  updateDate: post.updateDate ?? post.createDate,
  post,
})

const ACTION_SX = { '& .MuiSvgIcon-root': { fontSize: '2rem' } }

export const ManageBlogTable = ({ posts, isLoading, now, busyPostId, onTogglePublish, onDelete }: ManageBlogTableProps) => {
  const rows = useMemo(() => posts.map(post => toRow(post, now)), [posts, now])

  const columns = useMemo<GridColDef<BlogRow>[]>(() => [
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      minWidth: 240,
      // The cell's tabIndex keeps the link inside the grid's roving focus rather than in the page order.
      renderCell: ({ row, tabIndex }: GridRenderCellParams<BlogRow>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.4 }}>
          <Link to={adminArticleEditPath(row.id)} title={`Edit ${row.title}`} tabIndex={tabIndex}>{row.title}</Link>
          <Box component="span" sx={{ color: '#777', fontSize: '1.2rem' }}>{articlePath(row.category, row.slug)}</Box>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 170,
      renderCell: ({ row }: GridRenderCellParams<BlogRow>) => <CategoryChip category={row.category} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.75,
      minWidth: 120,
      renderCell: ({ row }: GridRenderCellParams<BlogRow>) => <StatusChip status={row.status} />,
    },
    { field: 'author', headerName: 'Author', flex: 1, minWidth: 140 },
    {
      field: 'publishDate',
      headerName: 'Publish Date',
      flex: 0.9,
      minWidth: 150,
      valueFormatter: (value?: number) => formatBlogDate(value),
    },
    {
      field: 'updateDate',
      headerName: 'Last Updated',
      flex: 0.9,
      minWidth: 150,
      valueFormatter: (value: number) => formatBlogDate(value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: 190,
      renderCell: ({ row, tabIndex }: GridRenderCellParams<BlogRow>) => {
        const isPublished = row.post.status === 'PUBLISHED'
        const busy = busyPostId === row.id
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', ...ACTION_SX }}>
            <Tooltip title="Edit">
              <IconButton component={Link} to={adminArticleEditPath(row.id)} aria-label={`Edit ${row.title}`} tabIndex={tabIndex} size="small">
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.status === 'PUBLISHED' ? 'View live' : 'Only published articles are live'}>
              <span>
                <IconButton
                  component="a"
                  href={articlePath(row.category, row.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${row.title}`}
                  tabIndex={tabIndex}
                  size="small"
                  disabled={row.status !== 'PUBLISHED'}
                >
                  <OpenInNewIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isPublished ? 'Unpublish' : 'Publish'}>
              <span>
                <IconButton
                  aria-label={`${isPublished ? 'Unpublish' : 'Publish'} ${row.title}`}
                  tabIndex={tabIndex}
                  size="small"
                  disabled={busy}
                  onClick={() => onTogglePublish(row.post)}
                >
                  {isPublished ? <UnpublishedOutlinedIcon /> : <PublishIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton aria-label={`Delete ${row.title}`} tabIndex={tabIndex} size="small" color="error" disabled={busy} onClick={() => onDelete(row.post)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )
      },
    },
  ], [busyPostId, onTogglePublish, onDelete])

  return (
    <Box sx={DATA_GRID_CONTAINER_SX}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        // A progress bar rather than the default skeleton, so loading is announced to screen readers.
        slotProps={{ loadingOverlay: { variant: 'linear-progress', noRowsVariant: 'linear-progress' } }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: PAGE_SIZE_OPTIONS[1] } },
          // Most recently edited first, so the post an admin just saved is at the top.
          sorting: { sortModel: [{ field: 'updateDate', sort: 'desc' }] },
        }}
        disableRowSelectionOnClick
        autoHeight
        rowHeight={64}
        sx={{ ...DATA_GRID_SX, '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } }}
      />
    </Box>
  )
}

export default ManageBlogTable
