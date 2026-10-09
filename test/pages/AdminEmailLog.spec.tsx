import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminEmailLog } from 'src/pages/AdminEmailLog'
import { Email, MailMessage } from 'src/libs/ajax/Email'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/Email', () => ({
  Email: { getEmailsByDateRange: vi.fn() },
  EMAIL_LOG_LIMIT: 10000,
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/components/email_log_table/EmailLogTable', () => ({
  EmailLogTable: ({ emails, isLoading, emailType }: { emails: MailMessage[], isLoading: boolean, emailType?: number }) => (
    <div data-testid="email-log-table" data-loading={isLoading} data-email-type={emailType ?? ''}>
      {emails.map(email => <span key={email.emailId}>{`email-${email.emailId}`}</span>)}
    </div>
  ),
}))

const emails: MailMessage[] = [
  { emailId: 1, emailType: 4, createDate: 1 },
  { emailId: 2, emailType: 19, createDate: 2 },
]

const mountPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <AdminEmailLog />
  </QueryClientProvider>,
)

const chooseType = async (label: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Type of Email Sent' }))
  fireEvent.click(await within(screen.getByRole('listbox')).findByRole('option', { name: label }))
}

describe('AdminEmailLog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 8, 12))
    vi.mocked(Email.getEmailsByDateRange).mockResolvedValue({ emails, truncated: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('loads the last 30 days, today included, into the table', async () => {
    mountPage()

    expect(await screen.findByText('email-2')).toBeInTheDocument()
    expect(screen.getByText('email-1')).toBeInTheDocument()
    expect(Email.getEmailsByDateRange).toHaveBeenCalledWith('2026-09-09', '2026-10-08')
    expect(screen.getByLabelText('From')).toHaveValue('2026-09-09')
    expect(screen.getByLabelText('To')).toHaveValue('2026-10-08')
  })

  it('keeps the last range and flags the dates while To is before From', async () => {
    mountPage()
    await screen.findByText('email-1')

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-01' } })

    expect(screen.getByText('Enter dates from 1900 on, with To on or after From')).toBeInTheDocument()
    expect(Email.getEmailsByDateRange).toHaveBeenCalledOnce()
    expect(screen.getByText('email-2')).toBeInTheDocument()
  })

  it('offers the types in the log and filters the table to the chosen one', async () => {
    mountPage()
    await screen.findByText('email-1')

    await chooseType('New DAR')

    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '4')
  })

  it('reloads a new range, dropping a type filter it no longer holds', async () => {
    mountPage()
    await screen.findByText('email-1')
    await chooseType('Dataset Approved')
    vi.mocked(Email.getEmailsByDateRange).mockResolvedValue({ emails: [emails[0]], truncated: false })

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })

    await waitFor(() => expect(screen.queryByText('email-2')).not.toBeInTheDocument())
    expect(Email.getEmailsByDateRange).toHaveBeenLastCalledWith('2026-01-01', '2026-10-08')
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '')

    // A range holding the type again must not bring back a filter the select no longer shows.
    vi.mocked(Email.getEmailsByDateRange).mockResolvedValue({ emails, truncated: false })
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-02-01' } })

    await screen.findByText('email-2')
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '')
  })

  it('says when the range held more emails than it lists', async () => {
    vi.mocked(Email.getEmailsByDateRange).mockResolvedValue({ emails, truncated: true })

    mountPage()

    expect(await screen.findByText('Showing the newest 10,000 emails. Narrow the dates to see the rest.')).toBeInTheDocument()
  })

  it('reports a failed load', async () => {
    vi.mocked(Email.getEmailsByDateRange).mockRejectedValue(new Error('boom'))

    mountPage()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to retrieve the email log from server',
    }))
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-loading', 'false')
  })
})
