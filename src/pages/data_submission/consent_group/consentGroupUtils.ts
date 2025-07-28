import { isNil, isString } from 'lodash/fp'

interface ConsentGroup {
  generalResearchUse?: boolean
  hmb?: boolean
  diseaseSpecificUse?: boolean
  poa?: boolean
  otherPrimary?: string
}

export const selectedPrimaryGroup = (consentGroup: ConsentGroup) => {
  if (!isNil(consentGroup.generalResearchUse) && consentGroup.generalResearchUse) {
    return 'generalResearchUse'
  }
  else if (!isNil(consentGroup.hmb) && consentGroup.hmb) {
    return 'hmb'
  }
  else if (!isNil(consentGroup.diseaseSpecificUse)) {
    return 'diseaseSpecificUse'
  }
  else if (!isNil(consentGroup.poa) && consentGroup.poa) {
    return 'poa'
  }
  else if (!isNil(consentGroup.otherPrimary) && isString(consentGroup.otherPrimary)) {
    return 'otherPrimary'
  }

  return undefined
}
