import {isNil, isEmpty, filter, join, concat, clone, uniq, head} from 'lodash/fp';
import { OntologyService } from './ontologyService';
import { Notifications } from './utils';

export const ControlledAccessType = {
  permissions: 'Permissions',
  modifiers: 'Modifiers'
};

/**
 * Primary source of truth for Data Access Request (purpose) data use translations
 * This constant holds all potential DUO codes that a dar might contain.
 * It is intended to map codes and descriptions for easier viewing.
 */
export const srpTranslations = {
  hmb: {
    code: 'HMB',
    description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.',
    manualReview: false,
    type: ControlledAccessType.permissions
  },
  poa: {
    code: 'POA',
    description: 'The dataset will be used for the study of Population Origins/Migration patterns.',
    manualReview: true,
    type: ControlledAccessType.permissions
  },
  diseases: (diseases) => {
    let outputStruct = {
      code: 'DS',
      description: 'The dataset will be used for disease related studies',
      manualReview: false,
      type: ControlledAccessType.permissions
    };
    if(!isEmpty(diseases)) {
      const diseaseArray = diseases.sort().map((disease) => disease.label);
      const diseaseString = diseaseArray.length > 1 ? join('; ')(diseaseArray) : diseaseArray[0];
      outputStruct.description = outputStruct.description + ` (${diseaseString})`;
    }
    return outputStruct;
  },
  researchTypeDisease: {
    code: 'DS',
    description: 'The primary purpose of the research is to learn more about a particular disease or disorder, a trait, or a set of related conditions.',
    manualReview: false,
    type: ControlledAccessType.permissions
  },
  other: (otherText) => {
    return {
      code: 'OTHER',
      description: isEmpty(otherText) ? 'Other: Not provided' : otherText,
      manualReview: true,
      type: ControlledAccessType.permissions
    };
  },
  methods: {
    code: 'MDS',
    description: 'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data. Data will be used for developing and/or validating new methods.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  controls: {
    code: 'CTRL',
    description: 'The reason for this request is to increase the number of controls available for a comparison group.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  forProfit: {
    code: 'NCU',
    description: 'The dataset will be used in a study related to a commercial purpose.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  notForProfit: {
    code: 'NPU',
    description: 'This dataset will not be used in a study related to a commercial purpose.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  genderFemale: {
    code: 'POP-F',
    description: 'The dataset will be used for the study of females.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  genderMale: {
    code: 'POP-M',
    description: 'The dataset will be used for the study of males.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  pediatric: {
    code: 'POP-P',
    description: 'The dataset will be used for the study of children.',
    manualReview: false,
    type: ControlledAccessType.modifiers
  },
  illegalBehavior: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization).',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  addiction: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of alcohol or drug abuse, or abuse of other addictive products.',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  sexualDiseases: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of sexual preferences or sexually transmitted diseases.',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  stigmatizedDiseases: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of stigmatizing illnesses.',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  vulnerablePopulation: {
    code: 'OTHER',
    description: 'The dataset will be used for a study targeting a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or [SIGNIFICANTLY] economically or educationally disadvantaged persons).',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  population: {
    code: 'OTHER',
    description: 'The dataset will be used to study variations within the general population (e.g., general substructure of a population).',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  psychiatricTraits: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of psychological traits, including intelligence, attention, emotion.',
    manualReview: true,
    type: ControlledAccessType.modifiers
  },
  notHealth: {
    code: 'OTHER',
    description: 'The dataset will be used for the research that correlates ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways may not be easily related to Health.',
    manualReview: true,
    type: ControlledAccessType.modifiers
  }
};

/**
 * Primary source of truth for Dataset translations
 * This constant holds all potential DUO codes that a dataset might contain.
 * It is intended to map codes and descriptions for easier viewing.
 */
export const consentTranslations = {
  noRestrictions: {
    code: 'NRES',
    description: 'No restrictions on data use',
    type: ControlledAccessType.permissions,
  },
  generalUse: {
    code: 'GRU',
    description: 'Use is permitted for any research purpose',
    type: ControlledAccessType.permissions,
  },
  hmbResearch: {
    code: 'HMB',
    description: 'Use is permitted for a health, medical, or biomedical research purpose',
    type: ControlledAccessType.permissions,
  },
  diseaseRestrictions: (restrictions) => {
    if (isEmpty(restrictions)) {
      return 'Use is permitted for the specified disease(s): Not specified';
    }
    const restrictionList = restrictions.join(', ');
    return {
      code: 'DS',
      alternateLabel: `DS (${restrictions.join(', ')})`,
      description: `Use is permitted for the specified disease(s): ${restrictionList}`,
      type: ControlledAccessType.permissions,
    };
  },
  populationOriginsAncestry: {
    code: 'POA',
    description: 'Use is limited to population, origin, or ancestry research',
    type: ControlledAccessType.permissions,
  },
  methodsResearch: {
    code: 'NMDS',
    description: 'Use for methods development research (e.g., development of software or algorithms) only within the bounds of other use limitations',
    type: ControlledAccessType.modifiers,
  },
  controlSetOption: {
    code: 'NCTRL',
    description: 'Future use as a control set for diseases other than those specified is prohibited',
    type: ControlledAccessType.modifiers,
  },
  aggregateResearch: {
    code: 'NAGR',
    description: 'Future use of aggregate-level data for general research purposes is prohibited',
    type: ControlledAccessType.modifiers,
  },
  geneticStudiesOnly: {
    code: 'GSO',
    description: 'Use is limited to genetic studies only',
    type: ControlledAccessType.modifiers,
  },
  commercialUse: {
    code: 'NPU',
    description: 'Use is limited to non-profit and non-commercial research',
    type: ControlledAccessType.modifiers,
  },
  publicationResults: {
    code: 'PUB',
    description: 'Use requires users to make results of studies using the data available to the larger scientific community',
    type: ControlledAccessType.modifiers,
  },
  collaboratorRequired: {
    code: 'COL',
    description: 'Use requires users to collaborate with the primary study investigators',
    type: ControlledAccessType.modifiers,
  },
  ethicsApprovalRequired: {
    code: 'IRB',
    description: 'Use requires users to provide documentation of local IRB/ERB approval',
    type: ControlledAccessType.modifiers,
  },
  geographicalRestrictions: {
    code: 'GS',
    description: 'Use is limited to within a certain geographic area',
    type: ControlledAccessType.modifiers,
  },
  gender: {
    code: 'RS-G',
    description: 'Use is limited to research involving a particular gender',
    type: ControlledAccessType.modifiers,
  },
  pediatric: {
    code: 'RS-PD',
    description: 'Use is limited to pediatric research',
    type: ControlledAccessType.modifiers,
  },
};

const getOntologyName = async(urls) => {
  const doidArr = OntologyService.extractDOIDFromUrl(urls);
  const params = doidArr.join(',');
  const ontology = await OntologyService.searchOntology(params);
  return ontology.map(data => data.label);
};

export const processRestrictionStatements = async (key, dataUse) => {
  let resp;
  let value = dataUse[key];
  /*
    Due to language used with Data Use Limitations, the description for 'commercialUse' describes non-profit status
    whereas the actual value represent for-profit status. As such, commercialUse value must be inverted when processing statement
    in order to accurately reflect description
  */
  if (key === 'commercialUse' && !isNil(value)) {
    value = !value;
  }
  if (!isNil(value) && value) {
    if (key === 'diseaseRestrictions') {
      //condition for datasets that have ontology labels contained within the dataUse object
      if (!isNil(head(value)) && !isNil(value[0].label)) {
        const labels = value.map((ont) => ont.label);
        resp = consentTranslations.diseaseRestrictions(labels);
      } else {
        //condition for datasets with dataUses that do not have ontology labels saved on the dataUse object
        try {
          const ontologyUrls = uniq(value);
          if (!isEmpty(ontologyUrls)) {
            const ontologyLabels = await getOntologyName(ontologyUrls);
            resp = consentTranslations.diseaseRestrictions(ontologyLabels);
          }
        } catch (error) {
          Notifications.showError({ text: 'Ontology API Request Error' });
        }
      }
    } else {
      resp = processDefinedLimitations(key, dataUse, consentTranslations);
    }
  }
  return resp;
};

export const processDefinedLimitations = (
  key,
  dataUse,
  consentTranslations
) => {
  const targetKeys = ['hmbResearch', 'populationOriginsAncestry', 'generalUse'];
  const isHMBActive =
    !!dataUse.hmbResearch && isEmpty(dataUse.diseaseRestrictions);
  const isPOAActive = !!dataUse.populationOriginsAncestry;
  const isGeneralUseActive = !!dataUse.generalUse && !isHMBActive && !isPOAActive && isEmpty(dataUse.diseaseRestrictions);
  let statement;
  if (
    !targetKeys.includes(key) ||
    (key === 'hmbResearch' && isHMBActive) ||
    (key === 'populationOriginsAncestry' && isPOAActive) ||
    (key === 'generalUse' && isGeneralUseActive)
  ) {
    statement = consentTranslations[key];
  }
  return statement;
};

//Helper function to handle OTHER attribute translations in dataUse
const processOtherInDataUse = (dataUse, restrictionStatements) => {
  //Wrapping the statements in a Promise.resolve before adding it to the array allows the restrictionStatements to be compatible with future Promise.all calls
  if (dataUse.otherRestrictions === true || !isNil(dataUse.other)) {
    restrictionStatements.push(
      Promise.resolve({
        code: 'OTH1',
        description: `Primary Other: ${isEmpty(dataUse.other) ? 'Not provided' : dataUse.other}`,
        type: ControlledAccessType.modifiers,
      })
    );
  }
  if (!isNil(dataUse.secondaryOther)) {
    restrictionStatements.push(
      Promise.resolve({
        code: 'OTH2',
        description: `Secondary Other: ${isEmpty(dataUse.secondaryOther) ? 'Not provided' : dataUse.secondaryOther}`,
        type: ControlledAccessType.modifiers,
      })
    );
  }
  return restrictionStatements;
};

//Function to translate restrictions from a single dataUse
const translateDataUseRestrictions = async (dataUse) => {
  if(!dataUse) {return [];}
  let restrictionStatements = [];
  const targetKeys = Object.keys(consentTranslations);
  restrictionStatements = targetKeys.map(async(key) =>
    await processRestrictionStatements(key, dataUse));
  restrictionStatements = filter((statement) => !isNil(statement))(restrictionStatements);
  restrictionStatements = processOtherInDataUse(dataUse, restrictionStatements);
  return (await Promise.all(restrictionStatements)).filter((value) => !isEmpty(value));
};

//Function to translate restrictions in an array of dataUses
export const translateDataUseRestrictionsFromDataUseArray = async (dataUses) => {
  const targetKeys = Object.keys(consentTranslations);
  try {
    const translationPromises = dataUses.map((dataUse) => {
      const restrictionStatementPromises = targetKeys.map(key => processRestrictionStatements(key, dataUse));
      processOtherInDataUse(dataUse, restrictionStatementPromises);
      return Promise.all(restrictionStatementPromises);
    });
    return filter(
      (restriction) => !isEmpty(restriction)
    ) (await Promise.all(translationPromises));
  } catch(error) {
    throw new Error('Failed to translate Data Use Restrictions from list');
  }
};


export const DataUseTranslation = {

  /**
   * Translates a raw data access request into an ontology service compatible
   * DataUseSummary object that reflects a Data Access Request instead of a Consent.
   * See https://consent-ontology.dsde-prod.broadinstitute.org/#/Data%20Use/post_translate_summary
   *
   * @param darInfo
   * @returns {{primary: [{code: '', description: ''}], secondary: [{code: '', description: ''}]}}
   */

  translateDarInfo: (darInfo) => {
    let dataUseSummary = {
      primary: [],
      secondary: [],
    };

    // Primary Codes
    if (darInfo.hmb) {
      dataUseSummary.primary = concat(dataUseSummary.primary,
        srpTranslations.hmb);
    }
    /**
     * TODO: Resolve confusion on consent/ontology/orsp sides
     *
     * population refers to question 2.3.2
     *      The outcome of this study is expected to provide new knowledge about the origins of a certain population or its ancestry.
     *      Code is clearly POA
     * populationMigration refers to question 3.1.9
     *      Does the research aim involve the study of Population Origins/Migration patterns?
     *
     * Tracing this through to Ontology, both refer to http://purl.obolibrary.org/obo/DUO_0000011 which is POA
     */

    //NOTE: additional check on hmb, diseases, and other are needed for older DARs where populationMigration - poa link was not established
    if ((darInfo.poa || darInfo.populationMigration) && (!darInfo.hmb && !darInfo.diseases && !darInfo.other)) {
      dataUseSummary.primary = concat(dataUseSummary.primary)(srpTranslations.poa);
    }

    if (darInfo.diseases) {
      const diseaseTranslation = srpTranslations.diseases(clone(darInfo.ontologies));
      dataUseSummary.primary = uniq(concat(dataUseSummary.primary)(diseaseTranslation));
    }
    if (darInfo.other) {
      dataUseSummary.primary = concat(dataUseSummary.primary)(srpTranslations.other(darInfo.otherText));
    }

    // Secondary Codes
    if (darInfo.methods) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.methods);
    }
    if (darInfo.controls) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.controls);
    }
    if (darInfo.forProfit) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.forProfit);
    } else {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.notForProfit);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.genderFemale);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.genderFemale);
    }
    if (darInfo.pediatric) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.pediatric);
    }
    if (darInfo.illegalBehavior) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.illegalBehavior);
    }
    if (darInfo.addiction) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.addiction);
    }
    if (darInfo.sexualDiseases) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.sexualDiseases);
    }
    if (darInfo.stigmatizedDiseases) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.stigmatizedDiseases);
    }
    if (darInfo.vulnerablePopulation) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.vulnerablePopulation);
    }
    if(darInfo.population) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.population);
    }
    if (darInfo.psychiatricTraits) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.psychiatricTraits);
    }
    if (darInfo.notHealth) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.notHealth);
    }

    return dataUseSummary;
  },
  translateDataUseRestrictions
};
