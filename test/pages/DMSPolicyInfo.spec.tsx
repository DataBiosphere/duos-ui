import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NIHDMSPolicyInfo, AnVILDMSPolicyInfo } from 'src/pages/DMSPolicyInfo'

vi.mock('src/libs/theme', () => ({
  Theme: { palette: { primary: '#1f3b50' } },
  Styles: {
    TITLE: { fontSize: '24px', fontWeight: 700 },
    SUB_HEADER: { fontSize: '16px' },
  },
}))

vi.mock('src/images/home_header_background.png', () => ({ default: 'home_header_background.png' }))
vi.mock('src/images/anvil_background.jpg', () => ({ default: 'anvil_background.jpg' }))
vi.mock('src/images/duos_laptops.png', () => ({ default: 'duos_laptops.png' }))
vi.mock('src/images/anvil_laptops.png', () => ({ default: 'anvil_laptops.png' }))
vi.mock('src/images/duos_chart.png', () => ({ default: 'duos_chart.png' }))
vi.mock('src/images/anvil_data_store.png', () => ({ default: 'anvil_data_store.png' }))
vi.mock('src/images/share_data.png', () => ({ default: 'share_data.png' }))
vi.mock('src/images/duos_manages_access.png', () => ({ default: 'duos_manages_access.png' }))

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>()
  return {
    ...actual,
    Grid: ({ children, container: _c, size: _s, spacing: _sp, className }: {
      children?: React.ReactNode
      container?: boolean
      size?: unknown
      spacing?: number
      className?: string
    }) => React.createElement('div', { className }, children),
  }
})

vi.mock('@mui/icons-material/CheckCircle', () => ({
  default: () => React.createElement('span', { 'data-testid': 'check-circle-icon' }),
}))

describe('NIHDMSPolicyInfo', () => {
  it('renders the DMS policy title', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText(/Meet NIH.*2023 Data Management/i)).toBeInTheDocument()
  })

  it('renders the NIH subtitle text', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText(/your institutions.*scientific data/)).toBeInTheDocument()
  })

  it('renders Store Data Anywhere title', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText('Store Data Anywhere')).toBeInTheDocument()
  })

  it('renders Advantages of using DUOS section', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText('Advantages of using DUOS')).toBeInTheDocument()
  })

  it('renders NIH institution bullet points', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText(/Avoid your investigators placing institutional data/)).toBeInTheDocument()
    expect(screen.getByText(/View data compliance by investigators/)).toBeInTheDocument()
  })

  it('renders NIH researcher bullet points', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText(/Easily store, share, access and analyze/)).toBeInTheDocument()
  })

  it('renders DUOS internal DAC copy in manage access section', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByText(/leverage DUOS.*internal DAC for a fee/)).toBeInTheDocument()
  })

  it('renders section images', () => {
    render(<NIHDMSPolicyInfo />)
    expect(screen.getByAltText('subtitle section')).toBeInTheDocument()
    expect(screen.getByAltText('data store section image')).toBeInTheDocument()
    expect(screen.getByAltText('data sharing section image')).toBeInTheDocument()
    expect(screen.getByAltText('data management section image')).toBeInTheDocument()
  })
})

describe('AnVILDMSPolicyInfo', () => {
  it('renders the AnVIL title variant', () => {
    render(<AnVILDMSPolicyInfo />)
    expect(screen.getByText(/with AnViL/)).toBeInTheDocument()
  })

  it('renders AnVIL subtitle text', () => {
    render(<AnVILDMSPolicyInfo />)
    expect(screen.getByText('AnVIL ecosystem')).toBeInTheDocument()
  })

  it('renders Store Data title', () => {
    render(<AnVILDMSPolicyInfo />)
    expect(screen.getByText('Store Data')).toBeInTheDocument()
  })

  it('renders Advantages of the AnVIL ecosystem section', () => {
    render(<AnVILDMSPolicyInfo />)
    expect(screen.getByText('Advantages of the AnVIL ecosystem')).toBeInTheDocument()
  })

  it('renders AnVIL institution bullet points', () => {
    render(<AnVILDMSPolicyInfo />)
    expect(screen.getByText(/Maintain ownership of the data storage location/)).toBeInTheDocument()
    expect(screen.getByText(/Control long-term storage costs/)).toBeInTheDocument()
  })

  it('renders DUOS open-access copy in manage access section', () => {
    render(<AnVILDMSPolicyInfo />)
    expect(screen.getByText(/register open-access and controlled-access datasets/)).toBeInTheDocument()
  })
})
