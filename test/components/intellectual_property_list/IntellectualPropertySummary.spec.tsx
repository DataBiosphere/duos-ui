import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertySummary from 'src/components/intellectual_property_list/IntellectualPropertySummary'

const sampleIp: IntellectualProperty = {
  ipId: 'ip-1',
  studyId: 'study-1',
  type: 'Patent',
  title: 'Test Patent',
  assignee: 'Inventor A',
  patentNumber: 'App123',
  filingDate: '2023-01-01',
  status: 'Filed',
  url: 'https://example.com/ip',
  contact: 'contact@example.com',
  tags: ['tag1', 'tag2'],
}

describe('IntellectualPropertySummary', () => {
  it('renders columns including arrays and url', () => {
    const { container } = render(
      <IntellectualPropertySummary
        intellectualProperty={sampleIp}
        columnsToShow={['title', 'type', 'patentNumber', 'status', 'url', 'tags']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleIp.title)).toBeInTheDocument()
    expect(screen.getByText(sampleIp.type)).toBeInTheDocument()
    expect(screen.getByText(sampleIp.patentNumber)).toBeInTheDocument()
    expect(screen.getByText(sampleIp.status)).toBeInTheDocument()
    expect(screen.getByText('tag1, tag2')).toBeInTheDocument()
    expect(container.querySelector('a[href="https://example.com/ip"]')).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <IntellectualPropertySummary
        intellectualProperty={sampleIp}
        columnsToShow={['title', 'type', 'patentNumber', 'status', 'url', 'tags']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={viewFn}
        disabled={false}
      />,
    )
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
