import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmailLogTable, EmailLogTableProps } from 'src/components/email_log_table/EmailLogTable'
import { MailSend } from 'src/libs/ajax/Email'

const at = (day: number, hour = 9): number => new Date(2026, 9, day, hour, 0, 0).getTime()

const send = (sendId: number, emailType: number, createDate: number, overrides: Partial<MailSend> = {}): MailSend => ({
  sendId,
  emailType,
  createDate,
  lastCreateDate: createDate,
  recipientCount: 1,
  recipients: [{ userId: sendId, displayName: `User ${sendId}`, sent: true }],
  darCode: null,
  datasetIdentifiers: [],
  ...overrides,
})

const testSends = [
  send(1, 4, at(2), { darCode: 'DAR-12', datasetIdentifiers: ['DUOS-000001', 'DUOS-000002'] }),
  send(2, 19, at(5), { datasetIdentifiers: ['DUOS-000003'] }),
  send(3, 3, at(1)),
]

const renderTable = (props: Partial<EmailLogTableProps> = {}) =>
  render(<EmailLogTable isLoading={false} sends={testSends} {...props} />)

const columnText = (column: number): string[] =>
  screen.getAllByRole('row')
    .map(row => within(row).queryAllByRole('gridcell')[column]?.textContent ?? '')
    .filter(text => text !== '')

const columnHeader = (label: string): HTMLElement =>
  screen.getByRole('columnheader', { name: new RegExp(`^${label}`) })

const numberedSends = (count: number): MailSend[] =>
  Array.from({ length: count }, (_, index) => send(index + 10, index < 30 ? 4 : 19, at(1) + index))

describe('EmailLogTable', () => {
  it('lists the newest send first, with its type labelled and time formatted', () => {
    renderTable()

    expect(columnText(0)).toEqual(['Dataset Approved', 'New DAR', 'Vote Reminder'])
    expect(columnText(1)).toEqual(['2026-10-05 09:00:00', '2026-10-02 09:00:00', '2026-10-01 09:00:00'])
  })

  it('shows the DAR-ID, one DUOS-ID, or Multiple when a send concerns several datasets', () => {
    renderTable()

    expect(columnText(3)).toEqual(['DAR-12'])
    expect(columnText(4)).toEqual(['DUOS-000003', 'Multiple'])
  })

  it('lists the datasets behind Multiple on hover', async () => {
    renderTable()

    fireEvent.mouseOver(screen.getByText('Multiple'))

    const tooltip = await screen.findByRole('tooltip')
    expect(within(tooltip).getByText('DUOS-000001')).toBeInTheDocument()
    expect(within(tooltip).getByText('DUOS-000002')).toBeInTheDocument()
  })

  it('counts recipients and lists them on hover, marking unsent ones and the unlisted rest', async () => {
    renderTable({
      sends: [send(1, 34, at(1), {
        recipientCount: 102,
        recipients: [
          { userId: 1, displayName: 'Ada', sent: true },
          { userId: 2, displayName: 'Bo', sent: false },
        ],
      })],
    })

    fireEvent.mouseOver(screen.getByText('102 recipients'))

    const tooltip = await screen.findByRole('tooltip')
    expect(within(tooltip).getByText('Ada')).toBeInTheDocument()
    expect(within(tooltip).getByText('Bo (not sent)')).toBeInTheDocument()
    expect(within(tooltip).getByText('and 100 more')).toBeInTheDocument()
  })

  it('sorts by timestamp ascending when the header is clicked', () => {
    renderTable()

    fireEvent.click(columnHeader('Timestamp'))

    expect(columnText(1)).toEqual(['2026-10-01 09:00:00', '2026-10-02 09:00:00', '2026-10-05 09:00:00'])
  })

  it('shows only sends of the chosen type', () => {
    renderTable({ emailType: 4 })

    expect(columnText(0)).toEqual(['New DAR'])
  })

  it('restarts at the first page when the type filter changes', async () => {
    const sends = numberedSends(60)
    const { rerender } = renderTable({ sends })
    fireEvent.click(await screen.findByRole('button', { name: /go to next page/i }))
    expect(screen.getByText(/26–50 of 60/)).toBeInTheDocument()

    rerender(<EmailLogTable isLoading={false} sends={sends} emailType={4} />)

    expect(screen.getByText(/1–25 of 30/)).toBeInTheDocument()
  })

  it('sorts DAR-IDs by number', () => {
    renderTable({
      sends: [
        send(1, 4, at(1), { darCode: 'DAR-1000' }),
        send(2, 4, at(2), { darCode: 'DAR-99' }),
        send(3, 4, at(3), { darCode: 'DAR-200' }),
      ],
    })

    fireEvent.click(columnHeader('DAR-ID'))

    expect(columnText(3)).toEqual(['DAR-99', 'DAR-200', 'DAR-1000'])
  })

  it('sorts sends without a DAR-ID after every DAR-ID, in either direction', () => {
    renderTable({ sends: [send(1, 4, at(1)), send(2, 4, at(2), { darCode: 'DAR-5' })] })

    fireEvent.click(columnHeader('DAR-ID'))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('DAR-5')

    fireEvent.click(columnHeader('DAR-ID'))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('DAR-5')
  })

  it('restarts at the first page when a new range loads', async () => {
    const { rerender } = renderTable({ sends: numberedSends(60) })
    fireEvent.click(await screen.findByRole('button', { name: /go to next page/i }))

    rerender(<EmailLogTable isLoading={false} sends={numberedSends(60)} />)

    expect(screen.getByText(/1–25 of 60/)).toBeInTheDocument()
  })

  it('keeps the chosen sort when the type filter changes', () => {
    const { rerender } = renderTable()
    fireEvent.click(columnHeader('Timestamp'))

    rerender(<EmailLogTable isLoading={false} sends={[...testSends, send(4, 4, at(9))]} emailType={4} />)

    expect(columnText(1)).toEqual(['2026-10-02 09:00:00', '2026-10-09 09:00:00'])
  })
})
