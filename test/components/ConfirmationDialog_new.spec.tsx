import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmationDialog, ConfirmationDialogNewProps } from 'src/components/ConfirmationDialog_new'

vi.mock('react-modal', () => ({
  default: ({
    isOpen,
    children,
    contentLabel,
  }: {
    isOpen: boolean
    children: React.ReactNode
    contentLabel: string
  }) => isOpen ? <div role="dialog" aria-label={contentLabel}>{children}</div> : null,
}))

vi.mock('src/components/AsyncSpinnerButton', () => ({
  AsyncSpinnerButton: ({
    children,
    onClick,
    disabled,
    id,
  }: {
    children: React.ReactNode
    onClick: () => Promise<void>
    disabled?: boolean
    id?: string
  }) => (
    <button type="button" id={id} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}))

const makeAction = () => {
  const noHandler = vi.fn().mockResolvedValue(undefined)
  const yesHandler = vi.fn().mockResolvedValue(undefined)
  const handler = vi.fn((confirmed: boolean) => confirmed ? yesHandler : noHandler)
  return { handler, noHandler, yesHandler, action: { handler, label: 'Yes' } }
}

const baseProps = (overrides: Partial<ConfirmationDialogNewProps> = {}): ConfirmationDialogNewProps => ({
  showModal: true,
  title: 'Confirm Action',
  action: makeAction().action,
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ConfirmationDialog_new', () => {
  it('renders the dialog when showModal is true', () => {
    render(<ConfirmationDialog {...baseProps()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render the dialog when showModal is false', () => {
    render(<ConfirmationDialog {...baseProps({ showModal: false })} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the title', () => {
    render(<ConfirmationDialog {...baseProps()} />)
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
  })

  it('renders children inside the dialog', () => {
    render(<ConfirmationDialog {...baseProps()}><p>Dialog body</p></ConfirmationDialog>)
    expect(screen.getByText('Dialog body')).toBeInTheDocument()
  })

  it('renders the action label on the submit button', () => {
    render(<ConfirmationDialog {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
  })

  it('invokes the No handler when the No button is clicked', async () => {
    const { noHandler, action } = makeAction()
    render(<ConfirmationDialog {...baseProps({ action })} />)
    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(noHandler).toHaveBeenCalledTimes(1)
  })

  it('invokes the Yes handler when the submit button is clicked', async () => {
    const { yesHandler, action } = makeAction()
    render(<ConfirmationDialog {...baseProps({ action })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(yesHandler).toHaveBeenCalledTimes(1)
  })

  it('invokes the No handler when the close icon is clicked', async () => {
    const { noHandler, action } = makeAction()
    const { container } = render(<ConfirmationDialog {...baseProps({ action })} />)
    await userEvent.click(container.querySelector('.modal-close-btn') as HTMLElement)
    expect(noHandler).toHaveBeenCalledTimes(1)
  })

  it('shows the alert when alertTitle is provided', () => {
    render(<ConfirmationDialog {...baseProps({ alertTitle: 'Warning', alertMessage: 'Something went wrong' })} />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not show the alert when alertTitle is not provided', () => {
    render(<ConfirmationDialog {...baseProps()} />)
    expect(screen.queryByText('Warning')).not.toBeInTheDocument()
  })

  it('disables the submit button when disableOkBtn is true', () => {
    render(<ConfirmationDialog {...baseProps({ disableOkBtn: true })} />)
    expect(screen.getByRole('button', { name: 'Yes' })).toBeDisabled()
  })

  it('disables the No button when disableNoBtn is true', () => {
    render(<ConfirmationDialog {...baseProps({ disableNoBtn: true })} />)
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled()
  })
})
