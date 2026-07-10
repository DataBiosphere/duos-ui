import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AiModelSummary from 'src/components/ai_models_list/AiModelSummary'
import { AiModel } from 'src/types/model'

const sampleModel: AiModel = {
  modelId: 'm1',
  studyId: 's1',
  name: 'Baseline Model',
  description: 'Desc',
  url: 'https://example.com',
  format: 'PyTorch',
  license: 'MIT',
  trainedOnDatasets: ['ds1', 'ds2'],
  maintainer: { name: 'Alice', email: 'alice@example.com' },
  tags: ['vision', 'baseline'],
}

describe('AiModelSummary', () => {
  it('renders arrays and maintainer formatting', () => {
    render(
      <AiModelSummary
        aiModel={sampleModel}
        columnsToShow={['name', 'maintainer', 'trainedOnDatasets', 'tags', 'license']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleModel.name)).toBeInTheDocument()
    expect(screen.getByText('Alice (alice@example.com)')).toBeInTheDocument()
    expect(screen.getByText('ds1, ds2')).toBeInTheDocument()
    expect(screen.getByText('vision, baseline')).toBeInTheDocument()
    expect(screen.getByText(sampleModel.license)).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <AiModelSummary
        aiModel={sampleModel}
        columnsToShow={['name']}
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
