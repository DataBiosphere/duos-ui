import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VotesPieChart from 'src/components/common/VotesPieChart'
import { Vote } from 'src/types/model'

const makeVote = (voteId: number, vote?: boolean): Vote => ({
  voteId,
  userId: voteId,
  createDate: '',
  electionId: 1,
  displayName: `User ${voteId}`,
  type: 'DAC',
  vote,
})

const testVotes = [makeVote(1, true), makeVote(2, false), makeVote(3, undefined)]

describe('VotesPieChart', () => {
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

  it('renders an inline SVG chart with one slice per category', () => {
    const { container } = render(<VotesPieChart keyString="test" votes={testVotes} />)

    const svg = screen.getByRole('img', { name: 'Vote summary: 1 Yes, 1 No, 1 Not Yet Voted' })
    expect(svg).toBeInTheDocument()
    expect(container.querySelectorAll('path')).toHaveLength(3)
    expect(document.querySelector('.test-pie-chart-no-data')).not.toBeInTheDocument()
  })

  it('shows a legend entry for every voted category', () => {
    render(<VotesPieChart keyString="test" votes={testVotes} />)

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.getByText('Not Yet Voted')).toBeInTheDocument()
  })

  it('omits a zero-count category from the pie and the legend', () => {
    const votes = [makeVote(1, true), makeVote(2, true), makeVote(3, false)]
    const { container } = render(<VotesPieChart keyString="test" votes={votes} />)

    expect(container.querySelectorAll('path')).toHaveLength(2)
    expect(screen.queryByText('Not Yet Voted')).not.toBeInTheDocument()
  })

  it('labels each slice with its count and percentage', () => {
    const votes = [makeVote(1, true), makeVote(2, true), makeVote(3, false), makeVote(4, undefined)]
    const { container } = render(<VotesPieChart keyString="test" votes={votes} />)

    const titles = [...container.querySelectorAll('path > title')].map(t => t.textContent)
    expect(titles).toEqual(['Yes: 2 (50%)', 'No: 1 (25%)', 'Not Yet Voted: 1 (25%)'])
  })

  it('renders a full ring when only one category has votes', () => {
    const votes = [makeVote(1, true), makeVote(2, true)]
    const { container } = render(<VotesPieChart keyString="test" votes={votes} />)

    expect(container.querySelectorAll('path')).toHaveLength(0)
    const ring = container.querySelector('circle')
    expect(ring).toBeInTheDocument()
    expect(ring?.querySelector('title')).toHaveTextContent('Yes: 2 (100%)')
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
