

// ********************** DUL LOGIC ********************** //

import { isEmpty, isNil } from "lodash";

const datasetsContainDataUseFlag = (datasets, flag) => {
  return datasets.some((ds) => ds?.dataUse[flag] === true);
};

const needsIrbApprovalDocument = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'ethicsApprovalRequired');
};

const needsCollaborationLetter = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'collaboratorRequired');
};

const needsGsoAcknowledgement = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'geneticStudiesOnly');
};

const needsPubAcknowledgement = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'publicationResults');
};

const needsDsAcknowledgement = (dataUseTranslations) => {
  // if any data use translations are different, then this must be displayed.
  return dataUseTranslations.length > 1 && !dataUseTranslations.every((translation) => isEqual(dataUseTranslations[0], translation));
};

const newIrbDocumentExpirationDate = () => {
  const today = new Date();
  return `${today.getFullYear().toString().padStart(4, '0')}-${today.getMonth().toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
}


// ********************** DAR FORM VALIDATION ********************** //

const requiredFieldMsg = (fieldName) => {
  return `Please specify ${fieldName}.`;
};

const emptyArrayMsg = (fieldNameSingular) => {
  return `Please specify at least one ${fieldNameSingular}.`;
};

// errors for the Researcher Info section
const calcResearcherInfoErrors = (formData) => {
  const errors = [];

  if (!isValid(formData.researcher)) {
    errors.push(requiredFieldMsg("the Researcher"))
  }

  if (formData.checkCollaborator !== true && nihValid === false) {
    errors.push("Please provide your NIH eRA Commons ID.");
  }

  if (isNil(formData.signingOfficial)) {
    errors.push(requiredFieldMsg("your Institutional Signing Official"));
  }

  if (isNil(formData.itDirector)) {
    errors.push(requiredFieldMsg("your Information Technology (IT) Director"));
  }

  if(isNil(anvilUse)) {
    errors.push(requiredFieldMsg("Cloud Use Statement"));
  } else {
    if(!anvilUse && !localUse && !cloudUse) {
      errors.push("You must request data storage and analysis on cloud computing, local computing, or both.");
    } else {
      if(cloudUse && (isNil(cloudProvider) || isNil(cloudProviderType) || isNil(cloudProviderDescription))){
        errors.push("Please fill out more information about your cloud provider.")
      }
    }
  }

  return errors;
};

// errors for the Data Access Request section
const calcDarErrors = (formData, datasets, dataUseTranslations) => {
  const errors = [];
  
  if (isEmpty(formData.datasetIds) || isEmpty(datasets)) {
    errors.push(emptyArrayMsg("dataset"));
  }

  return errors;
};

// errors for the RUS section
const calcRusErrors = (formData) => {
  const errors = [];

  return errors;
}

/**
 * Takes in DAR Application FormData
 * Returns object:
 * {
 *  researcherInfoErrors: []string,
 *  darErrors: []string,
 *  rusErrors: []string,
 * }
 */
export const validateDARFormData = (formData, datasets, dataUseTranslations) => {
  return {
    researcherInfoErrors: calcResearcherInfoErrors(formData),
    darErrors: calcDarErrors(formData, datasets, dataUseTranslations),
    rusErrors: calcRusErrors(formData),
  }
};