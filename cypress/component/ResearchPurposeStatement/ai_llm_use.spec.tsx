import React from 'react'
import ResearchPurposeStatement from 'src/pages/dar_application/ResearchPurposeStatement'
import { RusErrors } from 'src/pages/dar_application/FormValidationState'

interface FormData {
  aiLlmUse: boolean | null
  controls: boolean
  population: boolean
  forProfit: boolean
  oneGender: boolean
  gender: string
  pediatric: boolean
  vulnerablePopulation: boolean
  illegalBehavior: boolean
  sexualDiseases: boolean
  psychiatricTraits: boolean
  notHealth: boolean
  stigmatizedDiseases: boolean
}

interface ResearchPurposeStatementProps {
  darCode: string | null
  formFieldChange: (change: { key: string, value: unknown }) => void
  formData: FormData
  validation: RusErrors
  readOnlyMode: boolean
  formValidationChange: (validation: RusErrors) => void
}

describe('ResearchPurposeStatement - AI/LLM Use Tests', () => {
  let formFieldChangeSpy: ReturnType<typeof cy.stub>
  let formValidationChangeSpy: ReturnType<typeof cy.stub>

  const getDefaultProps = (): ResearchPurposeStatementProps => ({
    darCode: null,
    formFieldChange: formFieldChangeSpy,
    formData: {
      aiLlmUse: null,
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
    formValidationChange: formValidationChangeSpy,
  })

  beforeEach(() => {
    formFieldChangeSpy = cy.stub()
    formValidationChangeSpy = cy.stub()
    cy.mount(<ResearchPurposeStatement {...getDefaultProps()} />)
  })

  it('should render AI/LLM use question', () => {
    cy.get('#aiLlmUse').should('exist')
    cy.contains('Do research involving AI or Large Language Models (LLMs)')
      .should('be.visible')
    cy.contains('If yes, please explain in your Research Use Statement')
      .should('be.visible')
  })

  it('should have both Yes and No radio buttons', () => {
    cy.get('#aiLlmUse_yes').should('exist').and('not.be.disabled')
    cy.get('#aiLlmUse_no').should('exist').and('not.be.disabled')
  })

  it('should allow selecting "Yes" for AI/LLM use', () => {
    cy.get('#aiLlmUse_yes').click()
    cy.get('#aiLlmUse_yes').should('be.checked')
  })

  it('should allow selecting "No" for AI/LLM use', () => {
    cy.get('#aiLlmUse_no').click()
    cy.get('#aiLlmUse_no').should('be.checked')
  })

  it('should call formFieldChange when AI/LLM use changes', () => {
    cy.get('#aiLlmUse_yes').click()
    cy.then(() => {
      expect(formFieldChangeSpy).to.have.been.calledWith({ key: 'aiLlmUse', value: true })
    })

    cy.get('#aiLlmUse_no').click()
    cy.then(() => {
      expect(formFieldChangeSpy).to.have.been.calledWith({ key: 'aiLlmUse', value: false })
    })
  })

  it('should be disabled in read-only mode', () => {
    const readOnlyProps = { ...getDefaultProps(), readOnlyMode: true }
    cy.mount(<ResearchPurposeStatement {...readOnlyProps} />)

    cy.get('#aiLlmUse_yes').should('be.disabled')
    cy.get('#aiLlmUse_no').should('be.disabled')
  })

  it('should show validation error when required and not filled', () => {
    const defaultProps = getDefaultProps()
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        aiLlmUse: {
          message: 'This field is required',
          valid: false,
        },
      },
    }
    cy.mount(<ResearchPurposeStatement {...props} />)

    cy.get('#aiLlmUse').should('have.class', 'errored')
  })

  it('should show correct default value when aiLlmUse is true', () => {
    const defaultProps = getDefaultProps()
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        aiLlmUse: true,
      },
    }
    cy.mount(<ResearchPurposeStatement {...props} />)

    cy.get('#aiLlmUse_yes').should('be.checked')
  })

  it('should show correct default value when aiLlmUse is false', () => {
    const defaultProps = getDefaultProps()
    const props = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        aiLlmUse: false,
      },
    }
    cy.mount(<ResearchPurposeStatement {...props} />)

    cy.get('#aiLlmUse_no').should('be.checked')
  })
})
