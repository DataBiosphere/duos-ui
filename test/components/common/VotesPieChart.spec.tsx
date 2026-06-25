import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import VotesPieChart from 'src/components/common/VotesPieChart'

vi.mock('react-google-charts', () => ({
  Chart: () => <div data-testid="pie-chart" />,
}))

const testVotes = [
  { voteId: 1, userId: 1, createDate: '', electionId: 1, displayName: 'A', type: 'DAC', vote: true },
  { voteId: 2, userId: 2, createDate: '', electionId: 1, displayName: 'B', type: 'DAC', vote: false },
  { voteId: 3, userId: 3, createDate: '', electionId: 1, displayName: 'C', type: 'DAC', vote: undefined },
]

describe('VotesPieChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the no-data div when votes is empty', () => {
    render(<VotesPieChart keyString="test" />)

    const noData = document.querySelector('.test-pie-chart-no-data')
    expect(noData).toBeInTheDocument()
    expect(noData).toHaveTextContent('No data for test')
  })

  it('renders the no-data div when votes is an empty array', () => {
    render(<VotesPieChart keyString="test" votes={[]} />)

    expect(document.querySelector('.test-pie-chart-no-data')).toBeInTheDocument()
  })

  it('renders the chart when votes are provided', () => {
    render(<VotesPieChart keyString="test" votes={testVotes} />)

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(document.querySelector('.test-pie-chart-no-data')).not.toBeInTheDocument()
  })

  it('applies styleOverride to the chart wrapper', () => {
    const { container } = render(
      <VotesPieChart
        keyString="test"
        votes={testVotes}
        style={{ width: '50%' }}
        styleOverride={{ backgroundColor: 'rgb(255, 0, 0)' }}
      />,
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ width: '50%', backgroundColor: 'rgb(255, 0, 0)' })
  })

  it('uses the keyString in the no-data class name', () => {
    render(<VotesPieChart keyString="my-bucket" />)

    expect(document.querySelector('.my-bucket-pie-chart-no-data')).toBeInTheDocument()
  })
})
