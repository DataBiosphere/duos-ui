import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import 'src/index.css'
import 'src/styles/bootstrap_replacement.css'
import 'src/pages/data_submission/v2/DataSubmissionFormV2.css'
import { NihAnvilUseRelated } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { NihAnvilUse, Study } from 'src/pages/data_submission/v2/v2-models'

const middle = (rect: DOMRect) => (rect.top + rect.bottom) / 2

const textRect = (element: Element) => {
  const range = document.createRange()
  range.selectNodeContents(element)
  return range.getBoundingClientRect()
}

describe('NIH registration question', () => {
  // Layout only exists in a real browser: jsdom has no geometry, so this guards the inline CSS here.
  it('sits on one line with its Yes and No answers, all centered on each other', () => {
    render(
      <div className="data-submission-form" style={{ width: 900 }}>
        <NihAnvilUseRelated study={{ properties: [new NihAnvilUse(NihAnvilUse.NO_NHGRI_NO_ANVIL)] } as Study} setStudy={vi.fn()} />
      </div>,
    )
    const question = document.querySelector('.dsf-inline-question')!
    const questionMiddle = middle(textRect(question.querySelector('.control-label')!))

    for (const answer of ['Yes', 'No']) {
      const input = question.querySelector(`#nihAnvilUse_pre_selector_${answer}`)!
      const dot = input.parentElement!.getBoundingClientRect()
      const text = Array.from(question.querySelectorAll('span')).find(span => span.textContent === answer)!
      expect(Math.abs(middle(dot) - questionMiddle), `${answer} circle`).toBeLessThanOrEqual(1.5)
      expect(Math.abs(middle(textRect(text)) - questionMiddle), `${answer} text`).toBeLessThanOrEqual(1.5)
      expect(dot.left).toBeGreaterThan(textRect(question.querySelector('.control-label')!).right)
    }
  })
})
