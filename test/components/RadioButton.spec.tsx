import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render } from '@testing-library/react'
import { RadioButton } from 'src/components/RadioButton'

describe('RadioButton', () => {
  it('draws its circle from the input state, with no per-instance inline styles to share', () => {
    const { container } = render(
      <div>
        <RadioButton id="radio-1" name="test-group" value="val-1" defaultChecked={true} label="Label 1" />
        <RadioButton id="radio-2" name="test-group" value="val-2" defaultChecked={false} label="Label 2" />
      </div>,
    )

    const radio1 = container.querySelector('#radio-1') as HTMLInputElement
    const radio2 = container.querySelector('#radio-2') as HTMLInputElement
    expect(radio1).toBeChecked()
    expect(radio2).not.toBeChecked()
    for (const radio of [radio1, radio2]) {
      const dot = radio.nextElementSibling as HTMLElement
      expect(dot).toHaveClass('radio-button-dot')
      expect(dot.getAttribute('style')).toBeNull()
      expect(radio.parentElement).toHaveClass('radio-button-input')
    }
  })

  it('keeps each instance independent', () => {
    const { container } = render(
      <div>
        <RadioButton id="radio-a" name="group-a" value="a" defaultChecked={true} label="A" />
        <RadioButton id="radio-b" name="group-b" value="b" defaultChecked={false} label="B" />
        <RadioButton id="radio-c" name="group-c" value="c" defaultChecked={false} label="C" />
      </div>,
    )
    expect(container.querySelector('#radio-a')).toBeChecked()
    expect(container.querySelector('#radio-b')).not.toBeChecked()
    expect(container.querySelector('#radio-c')).not.toBeChecked()
  })

  it('stays clickable and reports disabled through the native input', () => {
    const onClick = vi.fn()
    const { container } = render(
      <div>
        <RadioButton id="radio-on" name="g" value="on" onClick={onClick} label="On" />
        <RadioButton id="radio-off" name="g2" value="off" disabled label="Off" />
      </div>,
    )
    fireEvent.click(container.querySelector('#radio-on')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(container.querySelector('#radio-off')).toBeDisabled()
  })
})
