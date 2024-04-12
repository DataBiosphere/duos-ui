import {styles} from "./AtAGlance";


export function dataUseCellData({dataUse = '- -', label = 'Data Use'}) {
  return {
    data: dataUse,
    id: 1,
    style: {
      color: styles.color.dataUse,
      fontSize: styles.fontSize.dataUse
    },
    label
  };
}

export function dacFinalDecisionCellData({dacFinalDecision = '- -', label = 'DAC Final Decision'}) {
  return {
    data: dacFinalDecision,
    id: 2,
    style: {
      color: styles.color.dacFinalDecision,
      fontSize: styles.fontSize.dacFinalDecision
    },
    label
  };
}

export function structuredResearchPurposeCellData({structuredResearchPurpose = '- -', label = 'Structured Research Purpose'}) {
  return {
    data: structuredResearchPurpose,
    id: 3,
    style: {
      color: styles.color.structuredResearchPurpose,
      fontSize: styles.fontSize.structuredResearchPurpose
    },
    label
  };
}

export function dacResearchPurposeAgreementCellData({dacResearchPurposeAgreement = '- -', label = 'DAC Research Purpose Agreement'}) {
  return {
    data: dacResearchPurposeAgreement,
    id: 4,
    style: {
      color: styles.color.dacResearchPurposeAgreement,
      fontSize: styles.fontSize.dacResearchPurposeAgreement
    },
    label
  };
}

export function duosAlgorithmDecisionCellData({duosAlgorithmDecision = '- -', label = 'DUOS Algorithm Decision'}) {
  return {
    data: duosAlgorithmDecision,
    id: 4,
    style: {
      color: styles.color.duosAlgorithmDecision,
      fontSize: styles.fontSize.duosAlgorithmDecision
    },
    label
  };
}

export function dacVsDuosAlgorithmCellData({dacVsDuosAlgorithm = '- -', label = 'DAC vs DUOS Algorithm'}) {
  return {
    data: dacVsDuosAlgorithm,
    id: 6,
    style: {
      color: styles.color.dacVsDuosAlgorithm,
      fontSize: styles.fontSize.dacVsDuosAlgorithm
    },
    label
  };
}

export default {
  dataUseCellData,
  dacFinalDecisionCellData,
  structuredResearchPurposeCellData,
  dacResearchPurposeAgreementCellData,
  duosAlgorithmDecisionCellData,
  dacVsDuosAlgorithmCellData
};