import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RadioButton } from 'src/components/RadioButton'

describe('RadioButton', () => {
  it('renders correctly and does not mutate shared styles', () => {
    const { container } = render(
      <div>
        <RadioButton
          id="radio-1"
          name="test-group"
          value="val-1"
          defaultChecked={true}
          label="Label 1"
        />
        <RadioButton
          id="radio-2"
          name="test-group"
          value="val-2"
          defaultChecked={false}
          label="Label 2"
        />
      </div>,
    )

    // The checked radio button should have the blue background
    // In RadioButton.jsx: backgroundColor: '#2196F3'
    const radio1 = container.querySelector('#radio-1')
    const checkedSpan = radio1?.nextElementSibling as HTMLElement | null
    expect(checkedSpan?.style.backgroundColor).toBe('rgb(33, 150, 243)')

    // The unchecked radio button should have white background
    // In RadioButton.jsx basicUnchecked: backgroundColor: 'white'
    const radio2 = container.querySelector('#radio-2')
    const uncheckedSpan = radio2?.nextElementSibling as HTMLElement | null
    expect(uncheckedSpan?.style.backgroundColor).toBe('white')
  })

  it('maintains independent styles for multiple instances', () => {
    const { container } = render(
      <div>
        <RadioButton
          id="radio-a"
          name="group-a"
          value="a"
          defaultChecked={true}
          label="A"
        />
        <RadioButton
          id="radio-b"
          name="group-b"
          value="b"
          defaultChecked={false}
          label="B"
        />
        <RadioButton
          id="radio-c"
          name="group-c"
          value="c"
          defaultChecked={false}
          label="C"
        />
      </div>,
    )

    // Verify checked one is blue
    const radioA = container.querySelector('#radio-a')
    const checkedSpan = radioA?.nextElementSibling as HTMLElement | null
    expect(checkedSpan?.style.backgroundColor).toBe('rgb(33, 150, 243)')

    // Verify others are white (not mutated by the first one)
    const radioB = container.querySelector('#radio-b')
    const uncheckedSpanB = radioB?.nextElementSibling as HTMLElement | null
    expect(uncheckedSpanB?.style.backgroundColor).toBe('white')

    const radioC = container.querySelector('#radio-c')
    const uncheckedSpanC = radioC?.nextElementSibling as HTMLElement | null
    expect(uncheckedSpanC?.style.backgroundColor).toBe('white')
  })
})
