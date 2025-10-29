import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { Workspace } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

interface WorkspaceAddEditProps {
  readonly id: number
  readonly workspace?: Workspace
  readonly workspaces: Workspace[]
  readonly closeAction: () => void
  readonly onWorkspaceChange: (items: Workspace[]) => void
}

interface Validation {
  name?: ValidationError
  platform?: ValidationError
  url?: ValidationError
  description?: ValidationError
  access?: ValidationError
}

const defaultWorkspace: Workspace = {
  workspaceId: '',
  studyId: '',
  name: '',
  platform: '',
  url: '',
  description: '',
  tools: [],
  access: '',
  tags: [],
}

const makeError = (message: string): ValidationError => ({ valid: true, failed: [message] })

const calcErrors = (w: Workspace): Validation => {
  const v: Validation = {}
  if (!w.name?.trim()) v.name = makeError('Required')
  if (!w.platform?.trim()) v.platform = makeError('Required')
  if (!w.url?.trim()) {
    v.url = makeError('Required')
  }
  else if (!FormValidators.URL.isValid(w.url)) {
    v.url = makeError('Invalid URL format')
  }
  if (!w.description?.trim()) v.description = makeError('Required')
  if (!w.access?.trim()) v.access = makeError('Required')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

type WorkspaceFieldValue = string | string[]

interface FormFieldChange {
  key: string
  value: WorkspaceFieldValue
}

export const WorkspaceAddEdit: React.FC<WorkspaceAddEditProps> = ({
  id,
  workspace,
  workspaces,
  closeAction,
  onWorkspaceChange,
}) => {
  const [current, setCurrent] = useState<Workspace>(workspace || defaultWorkspace)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = { ...current, [key]: value } as Workspace
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    if (validationFailed(calcErrors(current))) return
    const toSave: Workspace = {
      ...current,
      workspaceId: current.workspaceId || crypto.randomUUID?.() || Date.now().toString(),
    }
    if (id < 0) {
      onWorkspaceChange([...workspaces, toSave])
    }
    else {
      const copy = [...workspaces]
      copy[id] = toSave
      onWorkspaceChange(copy)
    }
    setCurrent(defaultWorkspace)
    closeAction()
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{workspace === undefined ? 'New Workspace' : `Edit ${workspace.name || 'Workspace'}`}</h2>
          <FormField
            id="name"
            title="Workspace Name"
            defaultValue={workspace?.name}
            placeholder="Workspace Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.name}
          />
          <FormField
            id="platform"
            title="Platform"
            defaultValue={workspace?.platform}
            placeholder="Platform"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.platform}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={workspace?.url}
            placeholder="https://..."
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
          />
          <FormField
            id="description"
            title="Description"
            defaultValue={workspace?.description}
            placeholder="Description"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.description}
          />
          <FormField
            id="tools"
            title="Tools (comma separated)"
            defaultValue={workspace?.tools?.join(', ')}
            placeholder="tool1, tool2"
            onChange={({ value }: { value: string }) =>
              onChange({
                key: 'tools',
                value: value
                  .split(',')
                  .map(t => t.trim())
                  .filter(Boolean),
              })}
          />
          <FormField
            id="access"
            title="Access"
            defaultValue={workspace?.access}
            placeholder="Access Type"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.access}
          />
          <FormField
            id="tags"
            title="Tags (comma separated)"
            defaultValue={workspace?.tags?.join(', ')}
            placeholder="tag1, tag2"
            onChange={({ value }: { value: string }) =>
              onChange({
                key: 'tags',
                value: value
                  .split(',')
                  .map(t => t.trim())
                  .filter(Boolean),
              })}
          />
          <FormField
            id="citation"
            type={FormFieldTypes.TEXT}
            style={{ display: 'none' }}
            title=""
            onChange={() => {}}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button
            className="collaborator-form-add-save-button f-left btn"
            type="button"
            onClick={save}
            disabled={validationFailed(calcErrors(current))}
          >
            {workspace === undefined ? 'Add' : 'Save'}
          </button>
          <button
            className="collaborator-form-cancel-button f-left btn"
            type="button"
            onClick={closeAction}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
