import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AiModelRow from 'src/components/ai_models_list/AiModelRow'
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

describe('AiModelRow', () => {
  it('shows summary when not in edit mode', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <AiModelRow
        id={0}
        editMode={false}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name', 'format']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onAiModelsChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleModel.name)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <AiModelRow
        id={0}
        editMode={true}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onAiModelsChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#name')).toHaveValue(sampleModel.name)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <AiModelRow
        id={0}
        editMode={false}
        viewMode={true}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onAiModelsChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#name')).toHaveValue(sampleModel.name)
    expect(container.querySelector('#name')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <AiModelRow
        id={0}
        editMode={false}
        viewMode={false}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name', 'format']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onAiModelsChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
