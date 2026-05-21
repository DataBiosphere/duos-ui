import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Spinner } from 'src/components/Spinner'

describe('Spinner', () => {
  it('Renders the spinner component', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('div img')).not.to.equal(null)
  })
})
