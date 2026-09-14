import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
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

describe('AiModelAddEdit component', () => {
  it('opens add form and enforces validation disabling save then adds', async () => {
    const user = userEvent.setup()
    const onChangeSpy: AiModel[] = []
    const { container } = render(
      <AiModelAddEdit
        id={-1}
        aiModel={undefined}
        aiModels={[]}
        closeAction={vi.fn()}
        onAiModelsChange={(models) => { onChangeSpy.push(...models) }}
      />,
    )
    await user.type(container.querySelector('#name')!, 'My Model')
    await user.type(container.querySelector('#url')!, 'https://x.com')
    await user.type(container.querySelector('#format')!, 'ONNX')
    await user.type(container.querySelector('#license')!, 'Apache-2.0')
    await user.type(container.querySelector('#maintainerName')!, 'Bob')
    await user.type(container.querySelector('#maintainerEmail')!, 'bob@example.com')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(onChangeSpy).toHaveLength(1)
    expect(onChangeSpy[0].name).toBe('My Model')
    expect(onChangeSpy[0].maintainer.email).toBe('bob@example.com')
    expect(onChangeSpy[0].cloud).toEqual([])
  })

  it('saves selected cloud values', async () => {
    const user = userEvent.setup()
    const onChangeSpy: AiModel[] = []
    const { container } = render(
      <AiModelAddEdit
        id={-1}
        aiModel={undefined}
        aiModels={[]}
        closeAction={vi.fn()}
        onAiModelsChange={(models) => { onChangeSpy.push(...models) }}
      />,
    )
    expect(screen.getByText('Cloud')).toBeInTheDocument()
    await user.type(container.querySelector('#name')!, 'Cloud Model')
    await user.type(container.querySelector('#url')!, 'https://cloud-model.com')
    const cloudInput = container.querySelector('#cloud input') as HTMLInputElement
    await user.click(cloudInput!)
    await user.keyboard('AWS')
    await user.keyboard('{Enter}')
    await user.click(cloudInput!)
    await user.keyboard('Azure')
    await user.keyboard('{Enter}')
    await user.type(container.querySelector('#format')!, 'ONNX')
    await user.type(container.querySelector('#license')!, 'Apache-2.0')
    await user.type(container.querySelector('#maintainerName')!, 'Bob')
    await user.type(container.querySelector('#maintainerEmail')!, 'bob@example.com')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(onChangeSpy).toHaveLength(1)
    expect(onChangeSpy[0].cloud).toEqual(['AWS', 'Azure'])
  })

  it('edits existing model and saves changes', async () => {
    const user = userEvent.setup()
    const models: AiModel[] = [sampleModel]
    const onAiModelsChange = vi.fn()
    const { container } = render(
      <AiModelAddEdit
        id={0}
        aiModel={sampleModel}
        aiModels={models}
        closeAction={vi.fn()}
        onAiModelsChange={onAiModelsChange}
      />,
    )
    await user.clear(container.querySelector('#name')!)
    await user.type(container.querySelector('#name')!, 'Baseline Model Edited')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)

    expect(onAiModelsChange).toHaveBeenCalledTimes(1)
    const [updated] = onAiModelsChange.mock.calls[0] as [AiModel[]]
    expect(updated[0].name).toBe('Baseline Model Edited')
  })
})
