import React, { useState } from 'react'
import useAsyncCacheFetch from 'src/utils/useAsyncCacheFetch'
import PropTypes from 'prop-types'

const TestAsyncCacheFetch = ({ fetchFn }) => {
  const fetch = useAsyncCacheFetch()
  const [result, setResult] = useState(null)

  const handleFetch = async () => {
    const data = await fetch('test', fetchFn)
    setResult(data)
  }

  return (
    <div>
      <button onClick={handleFetch}>Fetch</button>
      <div data-cy="result">{result}</div>
    </div>
  )
}

TestAsyncCacheFetch.propTypes = {
  fetchFn: PropTypes.func.isRequired,
}

describe('useAsyncCacheFetch', () => {
  it('fetches and caches data', () => {
    const fetchFn = cy.stub().resolves('fetched-data')
    cy.mount(<TestAsyncCacheFetch fetchFn={fetchFn} />)

    cy.get('button').click()
    cy.get('[data-cy="result"]').should('have.text', 'fetched-data')
    cy.get('button').click()
    cy.get('[data-cy="result"]').should('have.text', 'fetched-data')
    cy.then(() => {
      expect(fetchFn.callCount).to.equal(1)
    })
  })
})
