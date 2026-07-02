import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ResearchPurposeStatement, { ResearchPurposeStatementProps } from 'src/pages/dar_application/ResearchPurposeStatement'

const getDefaultProps = (): ResearchPurposeStatementProps => ({
  darCode: null,
  formFieldChange: vi.fn(),
  formData: {
    aiLlmUse: undefined,
    controls: false,
    population: false,
    forProfit: false,
    oneGender: false,
    gender: '',
    pediatric: false,
    vulnerablePopulation: false,
    illegalBehavior: false,
    sexualDiseases: false,
    psychiatricTraits: false,
    notHealth: false,
    stigmatizedDiseases: false,
  },
  validation: {
    aiLlmUse: undefined,
    controls: undefined,
    population: undefined,
    forProfit: undefined,
    oneGender: undefined,
    gender: undefined,
    pediatric: undefined,
    vulnerablePopulation: undefined,
    illegalBehavior: undefined,
    sexualDiseases: undefined,
    psychiatricTraits: undefined,
    notHealth: undefined,
    stigmatizedDiseases: undefined,
  },
  readOnlyMode: false,
  formValidationChange: vi.fn(),
})

describe('ResearchPurposeStatement - AI/LLM Use Tests', () => {
  let props: ResearchPurposeStatementProps

  beforeEach(() => {
    props = getDefaultProps()
  })

  it('should render AI/LLM use question', () => {
    render(<ResearchPurposeStatement {...props} />)

    expect(document.getElementById('aiLlmUse')).not.toBeNull()
    expect(screen.getByText(/Do research involving AI or Large Language Models \(LLMs\)/)).toBeInTheDocument()
    expect(screen.getByText(/If yes, please explain in your Research Use Statement/)).toBeInTheDocument()
  })

  it('should have both Yes and No radio buttons', () => {
    render(<ResearchPurposeStatement {...props} />)

    expect(document.getElementById('aiLlmUse_yes')).not.toBeDisabled()
    expect(document.getElementById('aiLlmUse_no')).not.toBeDisabled()
  })

  it('should allow selecting "Yes" for AI/LLM use', () => {
    render(<ResearchPurposeStatement {...props} />)

    fireEvent.click(document.getElementById('aiLlmUse_yes')!)

    expect(document.getElementById('aiLlmUse_yes')).toBeChecked()
  })

  it('should allow selecting "No" for AI/LLM use', () => {
    render(<ResearchPurposeStatement {...props} />)

    fireEvent.click(document.getElementById('aiLlmUse_no')!)

    expect(document.getElementById('aiLlmUse_no')).toBeChecked()
  })

  it('should call formFieldChange when AI/LLM use changes', () => {
    render(<ResearchPurposeStatement {...props} />)

    fireEvent.click(document.getElementById('aiLlmUse_yes')!)
    expect(props.formFieldChange).toHaveBeenCalledWith({ key: 'aiLlmUse', value: true })

    fireEvent.click(document.getElementById('aiLlmUse_no')!)
    expect(props.formFieldChange).toHaveBeenCalledWith({ key: 'aiLlmUse', value: false })
  })

  it('should be disabled in read-only mode', () => {
    render(<ResearchPurposeStatement {...props} readOnlyMode={true} />)

    expect(document.getElementById('aiLlmUse_yes')).toBeDisabled()
    expect(document.getElementById('aiLlmUse_no')).toBeDisabled()
  })

  it('should show validation error when required and not filled', () => {
    render(
      <ResearchPurposeStatement
        {...props}
        validation={{ ...props.validation, aiLlmUse: { valid: false } }}
      />,
    )

    expect(document.getElementById('aiLlmUse')).toHaveClass('errored')
  })

  it('should show correct default value when aiLlmUse is true', () => {
    render(
      <ResearchPurposeStatement
        {...props}
        formData={{ ...props.formData, aiLlmUse: true }}
      />,
    )

    expect(document.getElementById('aiLlmUse_yes')).toBeChecked()
  })

  it('should show correct default value when aiLlmUse is false', () => {
    render(
      <ResearchPurposeStatement
        {...props}
        formData={{ ...props.formData, aiLlmUse: false }}
      />,
    )

    expect(document.getElementById('aiLlmUse_no')).toBeChecked()
  })
})
