

// ********************** DUL LOGIC ********************** //

import {isEmpty, isNil, isEqual, isString, isArray} from 'lodash';
import { FormValidators } from '../components/forms/forms';
import {extractEraAuthenticationState} from 'src/utils/ERACommonsUtils.js';

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
  return `${(today.getFullYear() + 1).toString().padStart(4, '0')}-${today.getMonth().toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};


// ********************** DAR FORM VALIDATION ********************** //

export const validationFailed = (validation) => {
  return Object.keys(validation).some((key) => !isEmpty(validation[key]));
};

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
  // if collaborator is undefined or a required field is empty, include an error
  if (isStringEmpty(collaborator?.name)) {
    errors.name = requiredError;
  }

  if (isStringEmpty(collaborator?.eraCommonsId)) {
    errors.eraCommonsId = requiredError;
  }

  if (isStringEmpty(collaborator?.title)) {
    errors.title = requiredError;
  }

  if (isStringEmpty(collaborator?.email)) {
    errors.email = requiredError;
  } else if (!FormValidators.EMAIL.isValid(collaborator.email)) {
    errors.email = validationError('email');
  }

  if (needsApproverStatus) {
    if (isEmpty(collaborator?.approverStatus)) {
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

  if (formData.nihValid === false) {
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


  if (isNil(formData.anvilUse)) {
    errors.anvilUse = requiredError;
  } else {
    if (!formData.anvilUse && !formData.localUse && !formData.cloudUse) {
      errors.dataStorageAndAnalysis = requiredError; // one of them must be selected, this makes the whole section red until selected.
    }
    // Cloud use sub-conditions only apply when Cloud Use Statement (section 1.8) selection is "No"
    if (!formData.anvilUse) {
      if (formData.cloudUse && (isStringEmpty(formData.cloudProvider))) {
        errors.cloudProvider = requiredError;
      }
      if (formData.cloudUse && (isStringEmpty(formData.cloudProviderType))) {
        errors.cloudProviderType = requiredError;
      }
      if (formData.cloudUse && (isStringEmpty(formData.cloudProviderDescription))) {
        errors.cloudProviderDescription = requiredError;
      }
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
    errors.collaborationLetter = requiredError;
  }

  if ((needsIrbApprovalDocument(datasets) && (isNil(irbDocument) && isEmpty(formData['irbDocumentLocation'])))) {
    errors.irbDocument = requiredError;
  }

  calcDUAErrors(formData, datasets, dataUseTranslations, errors);

  return errors;
};

const calcSummaryErrors = (nihValid, errors, formData) => {
  if (nihValid === false) {
    errors.nihEraId = requiredError;
  }
  if (isEmpty(formData.progressReportSummary)) {
    errors.progressReportSummary = requiredError;
  }
  if (isNil(formData.intellectualPropertyYesNo)) {
    errors.intellectualPropertyYesNo = requiredError;
  }
  if (formData.intellectualPropertyYesNo && isEmpty(formData.intellectualPropertySummary)) {
    errors.intellectualPropertySummary = requiredError;
  }
  if (isNil(formData.publicationsYesNo)) {
    errors.publicationsYesNo = requiredError;
  }
  if (formData.publicationsYesNo && isEmpty(formData.publications)) {
    errors.publications = requiredError;
  }
  if (isNil(formData.presentationsYesNo)) {
    errors.presentationsYesNo = requiredError;
  }
  if (formData.presentationsYesNo && isEmpty(formData.presentations)) {
    errors.presentations = requiredError;
  }
}

const calcDmiErrors = (formData, errors) =>{
  if (isNil(formData.dmiYesNo)) {
    errors.dmiYesNo = requiredError;
  }
  const dmiFields = [formData.dmiAcknowledgement, formData.dmiCombination, formData.dmiFalsification,
    formData.dmiIdentification, formData.dmiOther, formData.dmiPublication, formData.dmiSecurity, formData.dmiSharing]
  if (formData.dmiYesNo && !dmiFields.some((field) => field)) {
    errors.dmiAcknowledgement = requiredError;
    errors.dmiCombination = requiredError;
    errors.dmiFalsification = requiredError;
    errors.dmiIdentification = requiredError;
    errors.dmiOther = requiredError;
    errors.dmiPublication = requiredError;
    errors.dmiSecurity = requiredError;
    errors.dmiSharing = requiredError;
  }
  if (formData.dmiYesNo && isEmpty(formData.dmiDescription)) {
    errors.dmiDescription = requiredError;
  }
}

const calcCloseoutErrors= (formData, errors) => {
  const closeoutFields = [formData.closeoutOther, formData.closeoutProjectSuperseded, formData.closeoutProjectTransferred, formData.closeoutRequestorMovedInstitution, formData.closeoutProjectCompleted];
  if (isNil(formData.closeoutYesNo)) {
    errors.closeoutYesNo = requiredError;
  }
  if (formData.closeoutOther && isEmpty(formData.closeoutOtherText)) {
    errors.closeoutOtherText = requiredError
  }
  if (formData.closeoutYesNo) {
    if (formData.closeoutSigningOfficial?.userId === undefined) {
      errors.closeoutSigningOfficial = requiredError;
    }
    if (!closeoutFields.some((field) => field)) {
      errors.closeoutProjectCompleted = requiredError;
      errors.closeoutRequestorMovedInstitution = requiredError;
      errors.closeoutProjectTransferred = requiredError;
      errors.closeoutProjectSuperseded = requiredError;
      errors.closeoutOther = requiredError;
    }
  }
}

const calcPRErrors = (nihValid, formData, datasets, dataUseTranslations) => {
  const errors = {};
  calcSummaryErrors(nihValid, errors, formData);
  calcDUAErrors(formData, datasets, dataUseTranslations, errors);
  calcDmiErrors(formData, errors);
  calcCloseoutErrors(formData, errors);
  return errors;
};

const calcDUAErrors = (formData, datasets, dataUseTranslations, errors) => {
  if ((needsGsoAcknowledgement(datasets) && !formData.gsoAcknowledgement)) {
    errors.gsoAcknowledgement = requiredError;
  }

  if ((needsPubAcknowledgement(datasets) && !formData.pubAcknowledgement)) {
    errors.pubAcknowledgement = requiredError;
  }

  if ((needsDsAcknowledgement(dataUseTranslations) && !formData.dsAcknowledgement)) {
    errors.dsAcknowledgement = requiredError;
  }
}

export const calcPublicationOrPresentationErrors = (newPublication, publicationText) => {
  const validation = {};
  if (isEmpty(newPublication?.title)) {
    validation.title = requiredError;
  }
  if (isEmpty(newPublication?.date)) {
    validation.date = requiredError;
  } else if (!FormValidators.DATE.isValid(newPublication?.date)) {
    validation.date = validationError('date');
  }
  if (isEmpty(newPublication?.authors)) {
    validation.authors = requiredError;
  }
  if (isPublication(publicationText)) {
    if (isEmpty(newPublication?.pubmed_id)) {
      validation.pubmed_id = requiredError;
    }
    if (isEmpty(newPublication?.bibliographic_citation)) {
      validation.bibliographic_citation = requiredError;
    }
  } else if (isEmpty(newPublication?.link)) {
      validation.link = requiredError;
  }
  return validation;
}

export const isPublication = (publicationText) => {
    return publicationText === 'Publication';
}

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
    nihValid: extractEraAuthenticationState(researcher).nihValid,
  };
};

export const validatePRFormData = (
    nihValid,
    formData,
    datasets,
    dataUseTranslations,
    ) => {
    return {
        darErrors: calcPRErrors(nihValid, formData, datasets, dataUseTranslations)
    };
}