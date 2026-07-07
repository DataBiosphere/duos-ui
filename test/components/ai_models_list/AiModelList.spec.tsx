import React from 'react'
import { describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import AiModelList from 'src/components/ai_models_list/AiModelList'
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

const AiModelListHarness: React.FC<{ initial: AiModel[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<AiModel[]>(initial)
  return (
    <AiModelList
      aiModels={items}
      columnsToShow={['name', 'format', 'license']}
      onAiModelsChange={setItems}
      disabled={false}
    />
  )
}

beforeAll(() => Modal.setAppElement(document.body))

describe('AiModelList component', () => {
  it('renders existing models', () => {
    render(<AiModelListHarness initial={[sampleModel]} />)
    expect(screen.getByText(sampleModel.name)).toBeInTheDocument()
    expect(screen.getByText(sampleModel.format)).toBeInTheDocument()
  })

  it('opens model in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<AiModelListHarness initial={[sampleModel]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(sampleModel.name)).toBeInTheDocument()
    expect(container.querySelector('#name')).toBeDisabled()
    expect(container.querySelector('#format')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(container.querySelector('.collaborator-form-cancel-button')?.textContent).toContain('Close')
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<AiModelListHarness initial={[sampleModel]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#name')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })

  it('adds a new model', async () => {
    const user = userEvent.setup()
    const state: AiModel[] = []
    const { container } = render(
      <AiModelList
        aiModels={state}
        columnsToShow={['name', 'license']}
        onAiModelsChange={(m) => { state.splice(0, state.length, ...m) }}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('#add-ai-model-btn')!)
    await user.type(container.querySelector('#name')!, 'Added Model')
    await user.type(container.querySelector('#url')!, 'https://m.com')
    await user.type(container.querySelector('#format')!, 'TensorFlow')
    await user.type(container.querySelector('#license')!, 'BSD')
    await user.type(container.querySelector('#maintainerName')!, 'Carol')
    await user.type(container.querySelector('#maintainerEmail')!, 'carol@example.com')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(state).toHaveLength(1)
    expect(state[0].name).toBe('Added Model')
  })

  it('deletes a model via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<AiModelListHarness initial={[sampleModel]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeInTheDocument())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(sampleModel.name)).not.toBeInTheDocument())
  })

  it('shows all default columns when none are provided', () => {
    const state: AiModel[] = [sampleModel]
    const { container } = render(
      <AiModelList
        aiModels={state}
        onAiModelsChange={(m) => { state.splice(0, state.length, ...m) }}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleModel.name)).toBeInTheDocument()
    expect(screen.getByText(sampleModel.url)).toBeInTheDocument()
    expect(screen.getByText(sampleModel.format)).toBeInTheDocument()
    expect(screen.getByText(sampleModel.license)).toBeInTheDocument()
    expect(container.textContent).toContain(sampleModel.maintainer.name)
    expect(container.textContent).toContain(sampleModel.maintainer.email)
  })
})
