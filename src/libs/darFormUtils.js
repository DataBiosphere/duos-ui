

// ********************** DUL LOGIC ********************** //

import { isEmpty, isNil, isEqual } from 'lodash';

const datasetsContainDataUseFlag = (datasets, flag) => {
  return datasets?.some((ds) => ds?.dataUse[flag] === true);
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

const requiredFieldMsg = (fieldName) => {
  return `Please specify ${fieldName}.`;
};

const emptyArrayMsg = (fieldNameSingular) => {
  return `Please specify at least one ${fieldNameSingular}.`;
};

const requiredUploadMsg = (fileName) => {
  return `Please upload ${fileName}`;
};

const mustAcceptMsg = (fieldName) => {
  return `Please accept ${fieldName}`;
};

// errors for the Researcher Info section
const calcResearcherInfoErrors = (formData) => {
  const errors = [];

  if (isEmpty(formData.researcher)) {
    errors.push(requiredFieldMsg('Researcher'));
  }

  if (formData.checkCollaborator !== true && formData.nihValid === false) {
    errors.push('Please provide your NIH eRA Commons ID.');
  }

  if (isEmpty(formData.piName)) {
    errors.push(requiredFieldMsg('the Principal Investigator'));
  }


  if (isEmpty(formData.signingOfficial)) {
    errors.push(requiredFieldMsg('your Institutional Signing Official'));
  }

  if (isEmpty(formData.itDirector)) {
    errors.push(requiredFieldMsg('your Information Technology (IT) Director'));
  }

  if(isNil(formData.anvilUse)) {
    errors.push(requiredFieldMsg('Cloud Use Statement'));
  } else {
    if(!formData.anvilUse && !formData.localUse && !formData.cloudUse) {
      errors.push('You must request data storage and analysis on cloud computing, local computing, or both.');
    }
    if(formData.cloudUse && (isEmpty(formData.cloudProvider) || isEmpty(formData.cloudProviderType) || isEmpty(formData.cloudProviderDescription))){
      errors.push('Please fill out more information about your cloud provider.');
    }

  }

  return errors;
};



// errors for the Data Access Request section
const calcDarErrors = (formData, datasets, dataUseTranslations, irbDocument, collaborationLetter) => {
  const errors = [];

  if (isEmpty(formData.datasetIds) || isEmpty(datasets)) {
    errors.push(emptyArrayMsg('dataset'));
  }

  if (isEmpty(formData.projectTitle)) {
    errors.push(requiredFieldMsg('Project Title'));
  }

  if (isEmpty(formData.rus)) {
    errors.push(requiredFieldMsg('Research Use Statement'));
  }

  if (isNil(formData.diseases)) {
    errors.push(requiredFieldMsg('if your research investigates a specific disease'));
  }

  if (formData.diseases === true && isEmpty(formData.ontologies)) {
    errors.push(requiredFieldMsg('the diseases studied'));
  }

  if (isEmpty(formData.nonTechRus)) {
    errors.push(requiredFieldMsg('Non-Technical Summary'));
  }

  if ((needsCollaborationLetter(datasets) && (isNil(collaborationLetter) && isEmpty(formData['collaborationLetterLocation'])))) {
    errors.push(requiredUploadMsg('Collaboration Letter'));
  }

  if ((needsIrbApprovalDocument(datasets) && (isNil(irbDocument) && isEmpty(formData['irbDocumentLocation'])))) {
    errors.push(requiredUploadMsg('IRB Approval Document'));
  }

  if ((needsGsoAcknowledgement(datasets) && !formData.gsoAcknowledgement)) {
    errors.push(mustAcceptMsg('GSO Acknowledgement'));
  }

  if ((needsPubAcknowledgement(datasets) && !formData.pubAcknowledgement)) {
    errors.push(mustAcceptMsg('PUB Acknowledgement'));
  }

  if ((needsDsAcknowledgement(dataUseTranslations) && !formData.dsAcknowledgement)) {
    errors.push(mustAcceptMsg('DS Acknowledgement'));
  }


  return errors;
};

const requiredRusFields = [
  'methods',
  'controls',
  'population',
  'forProfit',
  'oneGender',
  'pediatric',
  'illegalBehavior',
  'sexualDiseases',
  'psychiatricTraits',
  'notHealth',
  'stigmatizedDiseases',
];

// errors for the RUS section
const calcRusErrors = (formData) => {
  const errors = [];

  if (formData.oneGender === true) {
    if (['M', 'F'].includes(formData.gender) === false) {
      errors.push(requiredFieldMsg('Gender'));
    }
  }

  if (requiredRusFields.some((field) => isNil(formData[field]))) {
    errors.push('Please answer all research purpose questions.');
  }

  return errors;
};

/**
 * Takes in DAR Application FormData
 * Returns object:
 * {
 *  researcherInfoErrors: []string,
 *  darErrors: []string,
 *  rusErrors: []string,
 * }
 */
export const validateDARFormData = (formData, datasets, dataUseTranslations, irbDocument, collaborationLetter) => {
  return {
    researcherInfoErrors: calcResearcherInfoErrors(formData),
    darErrors: calcDarErrors(formData, datasets, dataUseTranslations, irbDocument, collaborationLetter),
    rusErrors: calcRusErrors(formData),
  };
};