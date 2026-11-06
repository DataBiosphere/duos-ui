import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'

const OPTIONS = ['Observational', 'Interventional', 'Cohort study']

const pressed = () => screen.getAllByRole('button', { pressed: true }).map(button => button.textContent?.replace('✓', '').trim())

describe('FormField BUTTONGROUP', () => {
  it('shows every option on load, with nothing to open', () => {
    render(<FormField id="studyType" title="Study Type" type={FormFieldTypes.BUTTONGROUP} options={OPTIONS} />)
    const group = screen.getByRole('group', { name: 'Study Type' })
    expect(group).toHaveClass('button-group')
    for (const option of OPTIONS) {
      expect(screen.getByRole('button', { name: option })).toBeVisible()
    }
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('marks the selected option pressed and selected', () => {
    render(<FormField id="studyType" title="Study Type" type={FormFieldTypes.BUTTONGROUP} options={OPTIONS} defaultValue="Interventional" />)
    const selected = screen.getByRole('button', { name: 'Interventional' })
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(selected).toHaveClass('is-selected')
    expect(screen.getByRole('button', { name: 'Observational' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects one option at a time, and clears an optional field when the selection is pressed again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormField id="studyType" title="Study Type" type={FormFieldTypes.BUTTONGROUP} options={OPTIONS} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Observational' }))
    await user.click(screen.getByRole('button', { name: 'Cohort study' }))
    expect(pressed()).toEqual(['Cohort study'])
    await user.click(screen.getByRole('button', { name: 'Cohort study' }))
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'studyType', value: '' }))
  })

  it('keeps the choice of a required single-select when it is pressed again', async () => {
    const user = userEvent.setup()
    render(<FormField id="t" title="T" type={FormFieldTypes.BUTTONGROUP} options={OPTIONS} validators={[FormValidators.REQUIRED]} defaultValue="Observational" />)
    await user.click(screen.getByRole('button', { name: 'Observational' }))
    expect(pressed()).toEqual(['Observational'])
  })

  it('toggles each option of a multi-select independently', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormField id="m" title="M" type={FormFieldTypes.BUTTONGROUP} isMulti={true} options={OPTIONS} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Observational' }))
    await user.click(screen.getByRole('button', { name: 'Cohort study' }))
    await user.click(screen.getByRole('button', { name: 'Observational' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: ['Cohort study'] }))
  })

  it('takes a typed value under Other… and shows it as a selected button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormField id="m" title="M" type={FormFieldTypes.BUTTONGROUP} isMulti={true} allowCustom={true} options={OPTIONS} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Other…' }))
    await user.type(screen.getByRole('textbox', { name: 'Other M' }), 'Case-control{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: ['Case-control'] }))
    expect(screen.getByRole('button', { name: 'Case-control' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reuses an existing option when Other… matches it apart from case', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormField id="s" title="S" type={FormFieldTypes.BUTTONGROUP} allowCustom={true} options={OPTIONS} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Other…' }))
    await user.type(screen.getByRole('textbox'), 'cohort STUDY{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'Cohort study' }))
  })

  it('shows a loaded value that is not an option, so it is not hidden', () => {
    render(<FormField id="s" title="S" type={FormFieldTypes.BUTTONGROUP} options={OPTIONS} defaultValue="Legacy type" />)
    expect(screen.getByRole('button', { name: 'Legacy type' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cannot be changed when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormField id="s" title="S" type={FormFieldTypes.BUTTONGROUP} allowCustom={true} options={OPTIONS} onChange={onChange} disabled={true} />)
    await user.click(screen.getByRole('button', { name: 'Observational' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Other…' })).toBeNull()
  })
})
