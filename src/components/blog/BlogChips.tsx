import React from 'react'
import { Chip, ChipProps } from '@mui/material'
import { BLOG_CATEGORY_LABELS, BlogCategory, BlogDisplayStatus } from 'src/types/blog'

const CHIP_SX = { fontSize: '1.2rem', fontWeight: 600 }

const STATUS_DISPLAY: Record<BlogDisplayStatus, { label: string, color: ChipProps['color'] }> = {
  DRAFT: { label: 'Draft', color: 'default' },
  SCHEDULED: { label: 'Scheduled', color: 'info' },
  PUBLISHED: { label: 'Published', color: 'success' },
  ARCHIVED: { label: 'Archived', color: 'warning' },
}

export const StatusChip = ({ status }: { readonly status: BlogDisplayStatus }) => {
  const { label, color } = STATUS_DISPLAY[status]
  return <Chip label={label} color={color} size="small" sx={CHIP_SX} />
}

export const CategoryChip = ({ category }: { readonly category: BlogCategory }) =>
  <Chip label={BLOG_CATEGORY_LABELS[category]} size="small" variant="outlined" sx={CHIP_SX} />
