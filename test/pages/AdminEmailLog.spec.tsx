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
  EmailLogTable: ({ sends, isLoading, emailType }: { sends: MailSend[], isLoading: boolean, emailType?: number }) => (
    <div data-testid="email-log-table" data-loading={isLoading} data-email-type={emailType ?? ''}>
      {sends.map(send => <span key={send.sendId}>{`email-${send.sendId}`}</span>)}
    </div>
  ),
}))

const send = (sendId: number, emailType: number, createDate: number): MailSend => ({
  sendId, emailType, createDate, lastCreateDate: createDate, recipientCount: 1, recipients: [], darCode: null, datasetIdentifiers: [],
})

const sends: MailSend[] = [send(1, 4, 1), send(2, 19, 2)]

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
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends, truncated: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('loads the last 30 days, today included, into the table', async () => {
    mountPage()

    expect(await screen.findByText('email-2')).toBeInTheDocument()
    expect(screen.getByText('email-1')).toBeInTheDocument()
    expect(Email.getSendsByDateRange).toHaveBeenCalledWith('2026-09-09', '2026-10-08', '', [], expect.any(AbortSignal))
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

  it('asks consent to search, along with the types whose label matches', async () => {
    mountPage()
    await screen.findByText('email-1')

    fireEvent.change(screen.getByRole('textbox', { name: 'search' }), { target: { value: 'digest' } })

    await waitFor(() => expect(Email.getSendsByDateRange).toHaveBeenLastCalledWith('2026-09-09', '2026-10-08', 'digest', [34, 36], expect.any(AbortSignal)))
  })

  it('reloads a new range, dropping a type filter it no longer holds', async () => {
    mountPage()
    await screen.findByText('email-1')
    await chooseType('Dataset Approved')
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends: [sends[0]], truncated: false })

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })

    await waitFor(() => expect(screen.queryByText('email-2')).not.toBeInTheDocument())
    expect(Email.getSendsByDateRange).toHaveBeenLastCalledWith('2026-01-01', '2026-10-08', '', [], expect.any(AbortSignal))
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '')

    // A range holding the type again must not bring back a filter the select no longer shows.
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends, truncated: false })
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-02-01' } })

    await screen.findByText('email-2')
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '')
  })

  it('keeps the chosen type while a search narrows the results', async () => {
    mountPage()
    await screen.findByText('email-1')
    await chooseType('New DAR')
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends: [sends[1]], truncated: false })

    fireEvent.change(screen.getByRole('textbox', { name: 'search' }), { target: { value: 'Ada' } })

    await waitFor(() => expect(screen.queryByText('email-1')).not.toBeInTheDocument())
    expect(screen.getByTestId('email-log-table')).toHaveAttribute('data-email-type', '4')
  })

  it('lists nothing when a search fails, rather than the last result', async () => {
    mountPage()
    await screen.findByText('email-1')
    vi.mocked(Email.getSendsByDateRange).mockRejectedValue(new Error('boom'))

    fireEvent.change(screen.getByRole('textbox', { name: 'search' }), { target: { value: 'Ada' } })

    await waitFor(() => expect(screen.queryByText('email-1')).not.toBeInTheDocument())
    expect(Notifications.showError).toHaveBeenCalled()
  })

  it('says when the range held more sends than it lists', async () => {
    vi.mocked(Email.getSendsByDateRange).mockResolvedValue({ sends, truncated: true })

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
