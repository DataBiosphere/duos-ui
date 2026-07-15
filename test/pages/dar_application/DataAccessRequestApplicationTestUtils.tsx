import { vi } from 'vitest'
import Modal from 'react-modal'
import { clickById } from '../../test-utils'

// Stubs the two jsdom/react-modal gaps that DataAccessRequestApplication's tree hits on every
// render: ScrollableTabs calls window.scrollTo (unimplemented in jsdom), and AsyncConfirmationDialog
// opens a react-modal Modal, which warns without an app element set for accessibility.
export const setupTestEnvironment = () => {
  window.scrollTo = vi.fn()
  let appRoot = document.getElementById('root')
  if (!appRoot) {
    appRoot = document.createElement('div')
    appRoot.setAttribute('id', 'root')
    document.body.appendChild(appRoot)
  }
  Modal.setAppElement(appRoot)
}

export interface MockSelectOption {
  key?: string
  value?: string
  displayText?: string
}

export interface MockSelectProps {
  id?: string
  className?: string
  onChange: (value: unknown) => void
  options?: MockSelectOption[]
  isDisabled?: boolean
  getOptionLabel?: (option: MockSelectOption) => string
  getOptionValue?: (option: MockSelectOption) => string
}

// Answers every boolean data-use question on the DataAccessRequestApplication form with
// its "no" (or "yes" for hmb) default, shared by test/pages/dar_application specs.
export const fillDarDataUseCheckboxes = async () => {
  await clickById('diseases_no')
  await clickById('hmb_yes')

  await clickById('aiLlmUse_no')
  await clickById('controls_no')
  await clickById('population_no')
  await clickById('oneGender_no')
  await clickById('forProfit_no')
  await clickById('pediatric_no')
  await clickById('vulnerablePopulation_no')
  await clickById('illegalBehavior_no')
  await clickById('sexualDiseases_no')
  await clickById('psychiatricTraits_no')
  await clickById('notHealth_no')
  await clickById('stigmatizedDiseases_no')
}
