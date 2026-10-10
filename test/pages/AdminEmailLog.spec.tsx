import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminEmailLog } from 'src/pages/AdminEmailLog'
import { Email, MailSend } from 'src/libs/ajax/Email'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/Email', () => ({
  Email: { getSendsByDateRange: vi.fn() },
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
  EmailLogTable: ({ sends, isLoading, emailType, search }: { sends: MailSend[], isLoading: boolean, emailType?: number, search?: string }) => (
    <div data-testid="email-log-table" data-loading={isLoading} data-email-type={emailType ?? ''} data-search={search}>
      {sends.map(send => <span key={send.sendId}>{`email-${send.sendId}`}</span>)}
    </div>
  ),
}))

const send = (sendId: number, emailType: number, createDate: number): MailSend => ({
  sendId, emailType, entityReferenceId: null, createDate, recipientCount: 1, recipients: [], darCode: null, datasetIdentifiers: [],
})

const emails: MailSend[] = [send(1, 4, 1), send(2, 19, 2)]

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
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends: emails, truncated: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('loads the last 30 days, today included, into the table', async () => {
    mountPage()

    expect(await screen.findByText('email-2')).toBeInTheDocument()
    expect(screen.getByText('email-1')).toBeInTheDocument()
    expect(Email.getSendsByDateRange).toHaveBeenCalledWith('2026-09-09', '2026-10-08')
    expect(screen.getByLabelText('From')).toHaveValue('2026-09-09')
    expect(screen.getByLabelText('To')).toHaveValue('2026-10-08')
  })

  it('keeps the last range and flags the dates while To is before From', async () => {
    mountPage()
    await screen.findByText('email-1')

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-01' } })

    expect(screen.getByText('Enter dates from 1900 on, with To on or after From')).toBeInTheDocument()
    expect(Email.getSendsByDateRange).toHaveBeenCalledOnce()
    expect(screen.getByText('email-2')).toBeInTheDocument()
  })

  it('offers the types in the log and filters the table to the chosen one', async () => {
    mountPage()
    await screen.findByText('email-1')

    await chooseType('New DAR')

    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '4')
  })

  it('passes the search text to the table', async () => {
    mountPage()
    await screen.findByText('email-1')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'DAR-12' } })

    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-search', 'DAR-12')
  })

  it('reloads a new range, dropping a type filter it no longer holds', async () => {
    mountPage()
    await screen.findByText('email-1')
    await chooseType('Dataset Approved')
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends: [emails[0]], truncated: false })

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })

    await waitFor(() => expect(screen.queryByText('email-2')).not.toBeInTheDocument())
    expect(Email.getSendsByDateRange).toHaveBeenLastCalledWith('2026-01-01', '2026-10-08')
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '')

    // A range holding the type again must not bring back a filter the select no longer shows.
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends: emails, truncated: false })
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-02-01' } })

    await screen.findByText('email-2')
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '')
  })

  it('says when the range held more sends than it lists', async () => {
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends: emails, truncated: true })

    mountPage()

    expect(await screen.findByText('Showing the newest 10,000 sends. Narrow the dates to see the rest.')).toBeInTheDocument()
  })

  it('reports a failed load', async () => {
    vi.mocked(Email.getSendsByDateRange).mockRejectedValue(new Error('boom'))

    mountPage()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to retrieve the email log from server',
    }))
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-loading', 'false')
  })
})
