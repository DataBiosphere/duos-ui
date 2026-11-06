/**
 * MUI `sx` styles for a dataset shelf section (DT-4355, S3.3), kept out of the component file so
 * fast refresh works. Colors are the showcase template's custom properties. Provisional (D1, D11,
 * D12): spacing, the skeleton card height and the failed-state layout.
 */
import type { SxProps, Theme } from '@mui/material/styles'

export const datasetShelfSx = {
  root: { maxWidth: '1400px', mx: 'auto', px: '16px', py: '32px' },
  skeleton: { gap: 'var(--showcase-shelf-gap, 16px)', overflow: 'hidden' },
  // Static under reduced motion.
  skeletonCard: {
    'flex': '0 0 min(var(--showcase-shelf-card-width, 356px), 100%)',
    'height': '260px',
    'bgcolor': 'var(--showcase-accent-tint)',
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
  },
  failed: { flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' },
  message: { m: 0 },
  retry: {
    'minHeight': '44px',
    'px': '16px',
    'borderColor': 'var(--showcase-border-strong)',
    'bgcolor': 'var(--showcase-surface)',
    'color': 'var(--showcase-primary)',
    'fontFamily': 'inherit',
    'fontSize': 'var(--showcase-font-size-body)',
    'fontWeight': 600,
    'textTransform': 'none',
    '&:hover': { borderColor: 'var(--showcase-primary)', bgcolor: 'var(--showcase-accent-tint)' },
  },
} satisfies Record<string, SxProps<Theme>>
