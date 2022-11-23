

// ********************** DUL LOGIC ********************** //

import { isEmpty, isNil, isEqual } from 'lodash';
import { FormValidators } from '../components/forms/forms';

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

export const computeCollaboratorErrors = ({collaborator, needsApproval=true}) => {
  const errors = [];

  if (isNil(collaborator.name) || collaborator.name === '') {
    errors.push('Must specify the name of the collaborator');
  }

  if (isNil(collaborator.eraCommonsId) || collaborator.eraCommonsId === '') {
    errors.push('Must specify the eRA Commons ID of the collaborator');
  }

  if (isNil(collaborator.title) || collaborator.title === '') {
    errors.push('Must specify the title of the collaborator');
  }

  if (isNil(collaborator.email) || collaborator.email === '') {
    errors.push('Must specify the email of the collaborator.');
  } else {
    var testEmail = FormValidators.EMAIL.isValid(collaborator.email);
    if(testEmail === false) errors.push(FormValidators.EMAIL.msg);
  }

  if (needsApproval) {
    if (isEmpty(collaborator.approverStatus)) {
      errors.push('Must specify the Designated Download/Approval status.');
    }
  }


  return errors;
};

// errors for the Researcher Info section
const calcResearcherInfoErrors = (formData, labCollaboratorsCompleted, internalCollaboratorsCompleted, externalCollaboratorsCompleted) => {
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

  if (!labCollaboratorsCompleted) {
    errors.push('Please fill out and save Step 1.4: Lab Collaborators.');
  }

  if (!internalCollaboratorsCompleted) {
    errors.push('Please fill out and save Step 1.5: Internal Collaborators.');
  }

  if (!externalCollaboratorsCompleted) {
    errors.push('Please fill out and save Step 1.9: External Collaborators.');
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
export const validateDARFormData = ({
  formData,
  datasets,
  dataUseTranslations,
  irbDocument,
  collaborationLetter,
  labCollaboratorsCompleted,
  internalCollaboratorsCompleted,
  externalCollaboratorsCompleted
}) => {
  return {
    researcherInfoErrors: calcResearcherInfoErrors(formData, labCollaboratorsCompleted, internalCollaboratorsCompleted, externalCollaboratorsCompleted),
    darErrors: calcDarErrors(formData, datasets, dataUseTranslations, irbDocument, collaborationLetter),
    rusErrors: calcRusErrors(formData),
  };
};