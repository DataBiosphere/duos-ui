import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
import { AiModel } from 'src/types/model'

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    findOntologyTerms: vi.fn().mockResolvedValue([]),
    searchOntologyTerm: vi.fn().mockResolvedValue([]),
  }
})

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

describe('AiModelAddEdit data use and access management', () => {
  const renderForm = (aiModel?: AiModel) => {
    const saved: AiModel[][] = []
    const view = render(
      <AiModelAddEdit
        id={aiModel ? 0 : -1}
        aiModel={aiModel}
        aiModels={aiModel ? [aiModel] : []}
        closeAction={vi.fn()}
        onAiModelsChange={models => saved.push(models)}
      />,
    )
    return { ...view, saved }
  }

  const fillRequired = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
    await user.type(container.querySelector('#name')!, 'My Model')
    await user.type(container.querySelector('#url')!, 'https://x.com')
    await user.type(container.querySelector('#format')!, 'ONNX')
    await user.type(container.querySelector('#license')!, 'MIT')
    await user.type(container.querySelector('#maintainerName')!, 'Bob')
    await user.type(container.querySelector('#maintainerEmail')!, 'bob@example.com')
  }

  const save = (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) =>
    user.click(container.querySelector('.collaborator-form-add-save-button')!)

  it('asks for the terms of the model, without requiring them', () => {
    const { container } = renderForm()
    expect(container).toHaveTextContent('data use permissions for your model')
    expect(container).not.toHaveTextContent('Data Access Management*')
  })

  it('saves a model without data use or access management', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0][0].accessManagement).toBeUndefined()
    expect(saved[0][0].dataUse).toBeUndefined()
  })

  it('saves the access management and data use that are set', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.click(container.querySelector('#model_accessManagement_controlled')!)
    await user.click(container.querySelector('#model_primaryConsent_hmb')!)
    await user.click(container.querySelector('#model_npu')!)
    await save(user, container)

    expect(saved[0][0]).toMatchObject({
      accessManagement: 'controlled',
      dataUse: { hmbResearch: true, nonProfitUse: true },
    })
  })

  it('does not save a secondary term without a primary term', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.click(container.querySelector('#model_npu')!)
    await save(user, container)

    expect(saved).toHaveLength(0)
  })

  it('needs a primary term when the kept data use fields would be sent under controlled access', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({ ...sampleModel, accessManagement: 'open', dataUse: { aiLlmUse: true } })
    await user.click(container.querySelector('#model_accessManagement_controlled')!)
    await save(user, container)

    expect(saved).toHaveLength(0)
  })

  it('leaves a saved model\'s data use as stored when only other fields change', async () => {
    const user = userEvent.setup()
    const dataUse = { generalUse: true, methodsResearch: true }
    const { container, saved } = renderForm({ ...sampleModel, accessManagement: null, dataUse })
    await user.type(container.querySelector('#name')!, ' v2')
    await save(user, container)

    expect(saved[0][0].dataUse).toEqual(dataUse)
  })

  it('saves a stored data use without a primary term when access management is unset', async () => {
    const user = userEvent.setup()
    const dataUse = { methodsResearch: true }
    const { container, saved } = renderForm({ ...sampleModel, accessManagement: null, dataUse })
    await user.type(container.querySelector('#name')!, ' v2')
    await save(user, container)

    expect(saved[0][0].dataUse).toEqual(dataUse)
  })

  it('clears access management and data use', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({
      ...sampleModel,
      accessManagement: 'controlled',
      dataUse: { hmbResearch: true, aiLlmUse: true },
    })
    await user.click(container.querySelector('#model_clearDataUseTerms')!)
    await save(user, container)

    expect(saved[0][0].accessManagement).toBeUndefined()
    expect(saved[0][0].dataUse).toBeUndefined()
  })

  it('loads a saved model\'s terms and clears them when access becomes open', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({
      ...sampleModel,
      accessManagement: 'controlled',
      dataUse: { generalUse: true, publicationResults: true, aiLlmUse: true },
    })
    expect(container.querySelector<HTMLInputElement>('#model_pub')!.checked).toBe(true)

    await user.click(container.querySelector('#model_accessManagement_open')!)
    await save(user, container)

    expect(saved[0][0].accessManagement).toBe('open')
    expect(saved[0][0].dataUse).toEqual({ aiLlmUse: true })
  })
})
