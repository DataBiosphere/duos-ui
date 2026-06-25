import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataUsePill, DataUsePills } from 'src/components/collection_voting_slab/DataUsePill'
import { TranslationEntry } from 'src/libs/dataUseTranslation'

const permissionEntry: TranslationEntry = {
  code: 'HMB',
  description: 'Health/Medical/Biomedical research',
  type: 'Permissions',
}

const modifierEntry: TranslationEntry = {
  code: 'MDS',
  description: 'Methods development study',
  type: 'Modifiers',
}

const permissionEntry2: TranslationEntry = {
  code: 'DS',
  description: 'Disease-specific research',
  type: 'Permissions',
}

describe('DataUsePill', () => {
  it('renders the code', () => {
    render(<DataUsePill dataUse={permissionEntry} index={0} />)
    expect(screen.getByText('HMB')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<DataUsePill dataUse={permissionEntry} index={0} />)
    expect(screen.getByText('Health/Medical/Biomedical research')).toBeInTheDocument()
  })
})

describe('DataUsePills', () => {
  it('renders permission entries', () => {
    render(<>{DataUsePills([permissionEntry])}</>)
    expect(screen.getByText('HMB')).toBeInTheDocument()
    expect(screen.getByText('Health/Medical/Biomedical research')).toBeInTheDocument()
  })

  it('renders modifier entries under a Modifiers heading', () => {
    render(<>{DataUsePills([permissionEntry, modifierEntry])}</>)
    expect(screen.getByText('Modifiers')).toBeInTheDocument()
    expect(screen.getByText('MDS')).toBeInTheDocument()
  })

  it('does not render the Modifiers heading when there are no modifier entries', () => {
    render(<>{DataUsePills([permissionEntry])}</>)
    expect(screen.queryByText('Modifiers')).not.toBeInTheDocument()
  })

  it('renders two-column layout with Permissions heading when twoColumn=true', () => {
    const { container } = render(<>{DataUsePills([permissionEntry], true)}</>)
    expect(screen.getByText('Permissions')).toBeInTheDocument()
    expect(container.querySelector('.permissions-uses')).toBeInTheDocument()
    expect(container.querySelector('.modifier-uses')).toBeInTheDocument()
  })

  it('renders modifier entries in twoColumn layout', () => {
    render(<>{DataUsePills([permissionEntry, modifierEntry], true)}</>)
    expect(screen.getByText('Modifiers')).toBeInTheDocument()
    expect(screen.getByText('MDS')).toBeInTheDocument()
  })

  it('does not render the Modifiers heading in twoColumn layout when there are no modifier entries', () => {
    render(<>{DataUsePills([permissionEntry], true)}</>)
    expect(screen.queryByText('Modifiers')).not.toBeInTheDocument()
  })

  it('renders multiple entries of the same type', () => {
    render(<>{DataUsePills([permissionEntry, permissionEntry2])}</>)
    expect(screen.getByText('HMB')).toBeInTheDocument()
    expect(screen.getByText('DS')).toBeInTheDocument()
  })
})
