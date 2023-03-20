

// ********************** DUL LOGIC ********************** //

import { isEmpty, isNil, isEqual, isString, isArray } from 'lodash';
import { FormValidators } from '../components/forms/forms';

const datasetsContainDataUseFlag = (datasets, flag) => {
  return datasets?.some((ds) => {
    const dataUse = ds?.dataUse;
    if (!isEmpty(dataUse)) {
      return dataUse[flag] === true;
    }
    return false;
  });
};

export const needsIrbApprovalDocument = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'ethicsApprovalRequired');
};

export const needsCollaborationLetter = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'collaboratorRequired');
};

export const needsGsoAcknowledgement = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'geneticStudiesOnly');
};

export const needsPubAcknowledgement = (datasets) => {
  return datasetsContainDataUseFlag(datasets, 'publicationResults');
};

export const needsDsAcknowledgement = (dataUseTranslations) => {
  // if any data use translations are different, then this must be displayed.
  return dataUseTranslations.length > 1 && !dataUseTranslations.every((translation) => isEqual(dataUseTranslations[0], translation));
};

export const newIrbDocumentExpirationDate = () => {
  const today = new Date();
  return `${today.getFullYear().toString().padStart(4, '0')}-${today.getMonth().toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};


// ********************** DAR FORM VALIDATION ********************** //

const validationError = (failed) => {
  if (isArray(failed)) {
    return { valid: false, failed: failed };
  }

  return { valid: false, failed: [failed] };
};

const requiredError = {
  valid: false,
  failed: ['required']
};

const isStringEmpty = (str) => {
  return isNil(str) || (isString(str) && str.trim() === '');
};

export const computeCollaboratorErrors = ({collaborator, needsApproverStatus=true}) => {
  const errors = {};

  if (isStringEmpty(collaborator.name)) {
    errors.name = requiredError;
  }

  if (isStringEmpty(collaborator.eraCommonsId)) {
    errors.eraCommonsId = requiredError;
  }

  if (isStringEmpty(collaborator.title)) {
    errors.title = requiredError;
  }

  if (isStringEmpty(collaborator.email)) {
    errors.email = requiredError;
  } else if (!FormValidators.EMAIL.isValid(collaborator.email)) {
    errors.email = validationError('email');
  }

  if (needsApproverStatus) {
    if (isEmpty(collaborator.approverStatus)) {
      errors.approverStatus = requiredError;
    }
  }


  return errors;
};

// errors for the Researcher Info section
const calcResearcherInfoErrors = (formData, labCollaboratorsCompleted, internalCollaboratorsCompleted, externalCollaboratorsCompleted) => {
  const errors = {};

  if (isStringEmpty(formData.researcher)) {
    errors.researcher = requiredError;
  }

  if (formData.checkCollaborator !== true && formData.nihValid === false) {
    errors.nihEraId = requiredError;
  }

  if (isStringEmpty(formData.piName)) {
    errors.piName = requiredError;
  }

  if (isStringEmpty(formData.signingOfficial)) {
    errors.signingOfficial = requiredError;
  }

  if (isStringEmpty(formData.itDirector)) {
    errors.itDirector = requiredError;
  }

  if (!labCollaboratorsCompleted) {
    errors.labCollaboratorsCompleted = requiredError;
  }

  if (!internalCollaboratorsCompleted) {
    errors.internalCollaborators = requiredError;
  }

  if (!externalCollaboratorsCompleted) {
    errors.externalCollaborators = requiredError;
  }




  if(isNil(formData.anvilUse)) {
    errors.anvilUse = requiredError;
  } else {
    if(!formData.anvilUse && !formData.localUse && !formData.cloudUse) {
      errors.dataStorageAndAnalysis = requiredError; // one of them must be selected, this makes the whole section red until selected.
    }

    if(formData.cloudUse && (isStringEmpty(formData.cloudProvider))){
      errors.cloudProvider = requiredError;
    }
    if(formData.cloudUse && (isStringEmpty(formData.cloudProviderType))){
      errors.cloudProviderType = requiredError;
    }
    if(formData.cloudUse && (isStringEmpty(formData.cloudProviderDescription))){
      errors.cloudProviderDescription = requiredError;
    }
  }

  return errors;
};



// errors for the Data Access Request section
const calcDarErrors = (formData, datasets, dataUseTranslations, irbDocument, collaborationLetter) => {
  const errors = {};

  if (isEmpty(formData.datasetIds) || isEmpty(datasets)) {
    errors.datasetIds = requiredError;
  }

  if (isStringEmpty(formData.projectTitle)) {
    errors.projectTitle = requiredError;
  }

  if (isStringEmpty(formData.rus)) {
    errors.rus = requiredError;
  }

  if (isNil(formData.diseases)) {
    errors.diseases = requiredError;
  }

  if (formData.diseases === true && isEmpty(formData.ontologies)) {
    errors.ontologies = requiredError;
  }

  if (isStringEmpty(formData.nonTechRus)) {
    errors.nonTechRus = requiredError;
  }

  if ((needsCollaborationLetter(datasets) && (isNil(collaborationLetter) && isEmpty(formData['collaborationLetterLocation'])))) {
    errors.collaborationLetterLocation = requiredError;
  }

  if ((needsIrbApprovalDocument(datasets) && (isNil(irbDocument) && isEmpty(formData['irbDocumentLocation'])))) {
    errors.irbDocumentLocation = requiredError;
  }

  if ((needsGsoAcknowledgement(datasets) && !formData.gsoAcknowledgement)) {
    errors.gsoAcknowledgement = requiredError;
  }

  if ((needsPubAcknowledgement(datasets) && !formData.pubAcknowledgement)) {
    errors.pubAcknowledgement = requiredError;
  }

  if ((needsDsAcknowledgement(dataUseTranslations) && !formData.dsAcknowledgement)) {
    errors.dsAcknowledgement = requiredError;
  }


  return errors;
};

const requiredRusFields = [
  'controls',
  'population',
  'forProfit',
  'oneGender',
  'pediatric',
  'vulnerablePopulation',
  'illegalBehavior',
  'sexualDiseases',
  'psychiatricTraits',
  'notHealth',
  'stigmatizedDiseases',
];

// errors for the RUS section
const calcRusErrors = (formData) => {
  const errors = {};

  if (formData.oneGender === true) {
    if (['M', 'F'].includes(formData.gender) === false) {
      errors.gender = requiredError;
    }
  }

  requiredRusFields.forEach((field) => {
    if (isNil(formData[field])) {
      errors[field] = requiredError;
    }
  });

  return errors;
};

/**
 * Takes in DAR Application FormData
 * Returns object:
 * {
 *  researcherInfoErrors: { field: validation{} },
 *  darErrors: { field: validation{} },
 *  rusErrors: { field: validation{} },
 * }
 */
export const validateDARFormData = ({
  formData,
  datasets,
  dataUseTranslations,
  irbDocument,
  collaborationLetter,
  researcher,
  labCollaboratorsCompleted,
  internalCollaboratorsCompleted,
  externalCollaboratorsCompleted
}) => {
  return {
    researcherInfoErrors: calcResearcherInfoErrors(formData, labCollaboratorsCompleted, internalCollaboratorsCompleted, externalCollaboratorsCompleted),
    darErrors: calcDarErrors(formData, datasets, dataUseTranslations, irbDocument, collaborationLetter),
    rusErrors: calcRusErrors(formData),
    nihValid: isNil(researcher.eraCommonsId) || formData.checkCollaborator === true,
  };
};