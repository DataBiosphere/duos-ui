import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmailLogTable, EmailLogTableProps } from 'src/components/email_log_table/EmailLogTable'
import { MailMessage } from 'src/libs/ajax/Email'

const at = (day: number, hour = 9): number => new Date(2026, 9, day, hour, 0, 0).getTime()

const email = (emailId: number, emailType: number, createDate: number): MailMessage => ({ emailId, emailType, createDate })

const testEmails = [
  email(1, 4, at(2)),
  email(2, 19, at(5)),
  email(3, 3, at(1)),
]

const renderTable = (props: Partial<EmailLogTableProps> = {}) =>
  render(<EmailLogTable isLoading={false} emails={testEmails} {...props} />)

const columnText = (column: number): string[] =>
  screen.getAllByRole('row')
    .map(row => within(row).queryAllByRole('gridcell')[column]?.textContent ?? '')
    .filter(text => text !== '')

const columnHeader = (label: string): HTMLElement =>
  screen.getByRole('columnheader', { name: new RegExp(`^${label}`) })

const numberedEmails = (count: number): MailMessage[] =>
  Array.from({ length: count }, (_, index) => email(index + 10, index < 30 ? 4 : 19, at(1) + index))

describe('EmailLogTable', () => {
  it('lists the newest email first, with its type labelled and time formatted', () => {
    renderTable()

    expect(columnText(0)).toEqual(['Dataset Approved', 'New DAR', 'Vote Reminder'])
    expect(columnText(1)).toEqual(['2026-10-05 09:00:00', '2026-10-02 09:00:00', '2026-10-01 09:00:00'])
  })

  it('sorts by timestamp ascending when the header is clicked', () => {
    renderTable()

    fireEvent.click(columnHeader('Timestamp'))

    expect(columnText(1)).toEqual(['2026-10-01 09:00:00', '2026-10-02 09:00:00', '2026-10-05 09:00:00'])
  })

  it('shows only emails of the chosen type', () => {
    renderTable({ emailType: 4 })

    expect(columnText(0)).toEqual(['New DAR'])
  })

  it('restarts at the first page when the type filter changes', async () => {
    const emails = numberedEmails(60)
    const { rerender } = renderTable({ emails })
    fireEvent.click(await screen.findByRole('button', { name: /go to next page/i }))
    expect(screen.getByText(/26–50 of 60/)).toBeInTheDocument()

    rerender(<EmailLogTable isLoading={false} emails={emails} emailType={4} />)

    expect(screen.getByText(/1–25 of 30/)).toBeInTheDocument()
  })

  it('restarts at the first page when a new range loads', async () => {
    const { rerender } = renderTable({ emails: numberedEmails(60) })
    fireEvent.click(await screen.findByRole('button', { name: /go to next page/i }))

    rerender(<EmailLogTable isLoading={false} emails={numberedEmails(60)} />)

    expect(screen.getByText(/1–25 of 60/)).toBeInTheDocument()
  })

  it('keeps the chosen sort when the type filter changes', () => {
    const { rerender } = renderTable()
    fireEvent.click(columnHeader('Timestamp'))

    rerender(<EmailLogTable isLoading={false} emails={[...testEmails, email(4, 4, at(9))]} emailType={4} />)

    expect(columnText(1)).toEqual(['2026-10-02 09:00:00', '2026-10-09 09:00:00'])
  })
})
